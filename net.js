/* ============================================================
   net.js — MQTT tabanlı oda senkronizasyonu (hesap gerekmez)
   Public broker'lar üzerinden: wss + pub/sub

   NEDEN ÇOKLU BROKER (odada takılma düzeltmesi):
   Eskiden oda kodu hash'lenip TEK bir broker seçiliyordu. O broker o an
   sağlıklı değilse (public broker'lar sık sık düşer / limitle) iki cihaz
   birbirini bulamıyor ve misafir "odaya giriliyor…" ekranında takılı
   kalıyordu. Artık host da misafir de TÜM broker'lara AYNI ANDA bağlanır;
   hangisi çalışıyorsa mesaj oradan geçer. Aynı mesaj birden fazla broker
   üzerinden gelebildiği için mesajlar `id` ile tekilleştirilir (dedupe).
   ============================================================ */
(function () {
  const BROKERS = [
    'wss://broker.emqx.io:8084/mqtt',
    'wss://broker.hivemq.com:8884/mqtt',
    'wss://test.mosquitto.org:8081/mqtt',
    'wss://mqtt-dashboard.com:8884/mqtt',
  ];
  const PREFIX = 'secmece/v2/';
  const DEDUP_CAP = 400;      // tekilleştirme listesi bu uzunluğu geçince
  const DEDUP_KEEP = 200;     // en eski kayıtlar bu kadar silinir

  function makeCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let c = '';
    for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
    return c;
  }

  class Room {
    constructor(role, code) {
      this.role = role;              // 'host' | 'guest'
      this.code = code;
      this.topic = PREFIX + code;
      this.onMessage = null;
      this.onStatus = null;
      this.connected = false;        // en az bir broker bağlı mı?
      this.stopped = false;
      this.everConnected = false;
      this.lastUrl = '';             // en son bağlanan broker (bilgi amaçlı)
      this.brokerIdx = 0;
      this._st = null;               // son bildirilen durum
      this.msgSeq = 0;
      this.seen = new Set();         // gördüğümüz/kendi yolladığımız mesaj id'leri
      this.seenOrder = [];
      this.stat = { sent: 0, sentFail: 0, recv: 0, dup: 0, badMsg: 0, closes: 0, connects: 0, err: 0 };
      /* TÜM broker'lara paralel bağlan — biri düşse bile oda ayakta kalır.
         (Eskiden koddan tek broker seçiliyordu; o broker ölüyse oda kurulamıyordu.) */
      this.clients = BROKERS.map((url, idx) => ({ idx, url, client: null, connected: false, attempts: 0 }));
    }

    start() {
      this._emit();
      this.clients.forEach(c => this._connect(c));
    }

    _connect(c) {
      if (this.stopped) return;
      if (!window.mqtt) { this._status('error', 'MQTT kütüphanesi yüklenmedi (internet yok mu?)'); return; }
      c.attempts++;
      const client = window.mqtt.connect(c.url, {
        clientId: 'scm-' + Math.random().toString(16).slice(2, 12),
        clean: true,
        reconnectPeriod: 0,
        connectTimeout: 7000,
        keepalive: 30,
        timerVariant: 'native',
      });
      c.client = client;
      let settled = false, dead = false;
      const timer = setTimeout(() => {
        if (!settled) { settled = true; dead = true; try { client.end(true); } catch (e) {} this._retry(c, 900); }
      }, 8000);
      client.on('connect', () => {
        clearTimeout(timer);
        if (settled || this.stopped) return;
        settled = true;
        client.subscribe(this.topic, { qos: 1 }, err => {
          if (this.stopped || c.client !== client) return;
          if (err) { c.connected = false; this._emit(); this._retry(c, 1200); return; }
          c.connected = true;
          c.attempts = 0;
          this.everConnected = true;
          this.lastUrl = c.url;
          this.brokerIdx = c.idx;
          this.stat.connects++;
          this._emit();
        });
      });
      client.on('message', (t, payload) => {
        if (t !== this.topic) return;
        this._onMsg(payload);
      });
      client.on('error', () => { this.stat.err++; });
      client.on('close', () => {
        if (this.stopped || c.client !== client) return;
        this.stat.closes++;
        if (c.connected) { c.connected = false; this._emit(); }
        if (!dead && !settled) {          // bağlantı hiç kurulamadan düştü
          settled = true; dead = true;
          clearTimeout(timer);
          try { client.end(true); } catch (e) {}
          this._retry(c, 900);
          return;
        }
        if (dead) return;
        this._retry(c, 1200);             // bağlantı kopmuştu → aynı brokera geri dön
      });
    }

    _retry(c, delay) {
      if (this.stopped) return;
      const back = Math.min(30000, Math.round(delay * Math.pow(1.7, Math.min(c.attempts, 6))));
      setTimeout(() => { if (!this.stopped) this._connect(c); }, back);
    }

    _seen(id) {
      if (this.seen.has(id)) return true;
      this.seen.add(id);
      this.seenOrder.push(id);
      if (this.seenOrder.length > DEDUP_CAP) this.seenOrder.splice(0, DEDUP_KEEP).forEach(x => this.seen.delete(x));
      return false;
    }

    _onMsg(payload) {
      this.stat.recv++;
      this.stat.lastRecvAt = Date.now();
      let m;
      try { m = JSON.parse(payload.toString()); } catch (e) { this.stat.badMsg++; return; }
      /* Aynı mesaj birden çok broker'dan gelebilir → id ile tekilleştir.
         (Kendi yolladığımız id'ler de kayıtlı olduğu için kendi yankımızı işlemeyiz.) */
      if (m && m.id && this._seen(m.id)) { this.stat.dup++; return; }
      if (this.onMessage) {
        try { this.onMessage(m); } catch (e) { console.error('[net] mesaj işleme hatası:', e); }
      }
    }

    send(obj) {
      const id = this.role.charAt(0) + (++this.msgSeq) + '-' + Math.random().toString(36).slice(2, 8);
      const payload = JSON.stringify({ ...obj, from: this.role, id });
      this._seen(id);   // kendi yankımızı tekrar işlemeyelim
      let any = false;
      for (const c of this.clients) {
        if (!c.connected || !c.client) continue;
        try { const ok = c.client.publish(this.topic, payload, { qos: 1 }); if (ok) any = true; }
        catch (e) {}
      }
      if (any) { this.stat.sent++; this.stat.lastSentAt = Date.now(); }
      else this.stat.sentFail++;
      return any;
    }

    stop() {
      this.stopped = true;
      this.connected = false;
      for (const c of this.clients) {
        c.connected = false;
        try { if (c.client) c.client.end(true); } catch (e) {}
      }
    }

    _emit() {
      const anyConn = this.clients.some(c => c.connected);
      this.connected = anyConn;
      let st;
      if (anyConn) st = 'ready';
      else if (this.everConnected) st = 'lost';
      else if (this.clients.every(c => c.attempts >= 3)) st = 'error';
      else st = 'connecting';
      if (st !== this._st) { this._st = st; this._status(st, this.lastUrl); }
    }

    _status(st, info) { if (this.onStatus) this.onStatus(st, info); }
  }

  window.Net = { Room, makeCode, available: () => !!window.mqtt };
})();
