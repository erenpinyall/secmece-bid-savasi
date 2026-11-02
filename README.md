# ⚔️ SEÇMECE — Takım Savaşı

Kart **açık artırması (bid)** tabanlı, iki takımın bütçelerini yöneterek kart topladığı bir tarayıcı oyunu. Her tur 10 kart açılır; takımlar sırayla teklif verir, üstüne artırır veya pas der. Kim pas derse kart son teklifi veren takımın olur — ama o parayı öder. Maç sonunda kazanan/kaybeden ilan edilmez; **takımların topladığı kartların vitrini** sergilenir.

Tek cihazda sırayla (hot-seat) ya da **2 ayrı cihazda online** oynanabilir. Hesap, kurulum veya backend gerekmez.

🔗 **Canlı demo:** <https://secmece-bid-savasi.vercel.app>

---

## 📖 Nasıl oynanır?

1. **Takımları hazırla:** takım adı, avatar ve oyuncuları gir (online modda herkes kendi adını kendi cihazında yazar).
2. **Maç ayarları:** tur sayısı (1–5), tur başı bütçe (5–100) ve oyun modu (Klasik / Kör Bid).
3. **Evren paketlerini seç:** 26 hazır paket veya kendi yarattığın paketler.
4. **Oyna:** her turda o paketten rastgele 10 kart gelir. Kart açılır, takımlar sırayla teklif verir.

### Temel kurallar

- 🎴 **Açılış sırası döner:** her kartta sırayla bir takım açar (sol → sağ → sol…), yeni turda diğer takım başlar. Açılışta **pas yoktur** — teklif zorunludur.
- 👀 Rakip teklifi **görür**; ya üstüne artırır ya da pas der. Teklifler en az **+1** artar.
- 💰 **Her tur kasalar yenilenir.** Parayı bitiren teklif veremez; sırası gelince otomatik pas geçer.
- 🎁 **Kart asla çöpe gitmez:** iki taraf da ödeyemezse kart bedavaya, kadrosu eksik olan takıma gider.
- 🎁 **Bağış pası:** rakip parasızken açılış sende ise **PAS** basabilirsin — kart bedavaya rakibe gider, senden para çıkmaz. Teklif verirsen parayı ödeyip kartı sen kaparsın.
- 🎴 **Tur başına en fazla 5 kart:** bir takım 5'e ulaşırsa turun kalan kartları teklifsiz, sırayla diğer takıma gider. Yeni turda sayaç sıfırlanır.
- 🎭 **Kör Bid modu:** kartlar gizli gelir, sadece "nereden geldiği" ipucu görünür (örn. *"Konoha'dan biri 👀"*). Kazanana kadar kimse kartın kimliğini göremez.
- 🎉 Maç sonunda takımların topladığı kartlar sergilenir.

---

## 📦 Evren paketleri

Toplam **26 paket / 1.308 kart**. Her kartın gerçek fotoğrafı vardır.

| Paket | Kart | Paket | Kart |
|---|---:|---|---:|
| 🦁 Hayvanlar | 61 | 🦖 Dinozorlar | 37 |
| 🍥 Naruto | 50 | 🗡️ Bleach | 50 |
| 🏴‍☠️ One Piece | 50 | 🐉 Dragon Ball | 35 |
| ⚔️ Attack on Titan | 27 | 🌀 Jujutsu Kaisen | 36 |
| 👺 Demon Slayer | 40 | 🎣 Hunter x Hunter | 48 |
| 🎓 My Hero Academia | 50 | 🪚 Chainsaw Man | 17 |
| 🦸 Süper Kahramanlar | 51 | 🎮 Oyun Dünyası | 46 |
| ⚽ Futbol Efsaneleri | 49 | 🍔 Yemekler | 40 |
| 😂 İnternet Memeleri | 28 | 🏛️ Mitoloji | 49 |
| 🎬 Film Efsaneleri | 42 | ⚔️ League of Legends | 173 |
| ⚽ Futbol — Güncel Oyuncular | 134 | 🍀 Black Clover | 44 |
| 🧚 Fairy Tail | 51 | 👊 One-Punch Man | 35 |
| 🩸 Tokyo Ghoul | 31 | 🕶️ Sword Art Online | 34 |

**Ağırlıklı seçim:** her kartın bir ağırlığı vardır; ana kadro karakterleri daha sık, arka plan karakterleri daha seyrek çıkar (Efraimidis–Spirakis ağırlıklı rastgele seçim). Dev kadrolu paketlerde her tur o paketten **rastgele 10 kart** seçilir ve aynı maçta kartlar mümkün olduğunca tekrar etmez.

---

## 🌐 2 cihazda online

- Bir cihaz **ODA KUR**'a basar → 4 haneli oda kodu çıkar.
- Diğer cihaz **ODAYA KATIL**'a basıp kodu, adını ve takım adını girer.
- Herkes kendi cihazından oynar; teklifler canlı senkronize olur.

**Nasıl çalışıyor?**

- **Hesap yok, backend yok.** Oda senkronizasyonu, tarayıcıdaki [MQTT.js](https://github.com/mqttjs/MQTT.js) ile public MQTT broker'ları üzerinden yapılır (`wss`).
- Host otoritedir: oyun durumunu hesaplar ve yayınlar. Misafir sadece **aksiyon** (teklif/pas) gönderir; her aksiyon sıra numarası (`seq`) ve onay (`ack`) ile doğrulanır.
- **Çoklu broker + tekilleştirme:** host ve misafir aynı anda birden fazla broker'a bağlanır (emqx, hivemq, mosquitto, mqtt-dashboard). Biri erişilemezse diğerleri üzerinden haberleşme sürer; aynı mesaj birden çok broker'dan gelse bile `id` ile tekilleştirilir.
- Bağlantı koparsa otomatik yeniden bağlanılır.

> Not: Public broker'lar ücretsiz ve ortaktır; gizli bilgi göndermeyin. Oyun verisi dışında bir şey iletilmez.

---

## ✨ Özellikler

- 🎴 Klasik ve **Kör Bid** modu
- 🌐 2 cihazda online oda (kod ile, hesapsız)
- 📱 Tek cihazda sırayla oynama (hot-seat)
- 📦 26 evren paketi, 1.308 fotoğraflı kart, ağırlıklı rastgele seçim
- 🛠️ **Kendi paketini yarat** (uygulama içinden, foto URL'si ile)
- 💾 Takım/ayar/paket seçimi `localStorage`'da saklanır (`secmece-v3`)
- 🎭 Kör Bid ipuçları (pakete göre "nereden geldiği")
- 🎵 Web Audio API ile ses efektleri, konfeti ve animasyonlar
- 📱 Responsive tasarım (mobil + masaüstü)
- 🔁 Maç içinde sayfa yenilenmez; tüm ekranlar tek sayfada anlık güncellenir
- 🚀 Statik site — build adımı yok

---

## 🧰 Teknolojiler

- **HTML5 + CSS3** (framework yok)
- **Vanilla JavaScript** (ES6+)
- **MQTT.js** — online oda için WSS üzerinden MQTT
- **Web Audio API** — ses efektleri
- **localStorage** — ayar/kayıt
- **Vercel** — yayın

---

## 📁 Proje yapısı

```text
.
├── index.html      # Tüm ekranlar (kurulum, oyun, lobi, sonuç) + kurallar
├── styles.css      # Tema, animasyonlar, responsive düzen
├── app.js          # Oyun motoru (bid akışı, turlar, render, online senkron)
├── packs.js        # PACK_DEFS: 26 paket ve 1.308 kart verisi
├── net.js          # MQTT tabanlı oda katmanı (çoklu broker + dedupe)
├── mqtt.min.js     # MQTT.js tarayıcı sürümü (vendor, sadece online odada yüklenir)
├── vercel.json     # Statik dosya cache başlıkları
└── img/            # Paket kart fotoğrafları (img/<paket>/<kart>.jpg)
```

---

## ▶️ Yerel çalıştırma

Build adımı yok; statik dosyaları bir HTTP sunucusuyla açman yeterli.

```bash
# Node.js varsa
npx serve .

# veya Python ile
python -m http.server 8080
```

Sonra tarayıcıda `http://localhost:8080` adresini aç.

> `index.html`'i doğrudan `file://` ile açmak çoğu tarayıcıda çalışır ama bazı özellikler (pano, ses, online) kısıtlanabilir. Küçük bir HTTP sunucusu önerilir. Online mod için internet bağlantısı gerekir.

---

## 🚀 Yayına alma (Vercel)

Proje statik olduğu için Vercel'de ek ayar gerekmez:

```bash
npm i -g vercel
vercel --prod
```

Veya GitHub reposunu Vercel'e bağlayıp **Framework Preset: Other**, **Build Command: boş**, **Output Directory: `.`** ile deploy edebilirsin.

---

## 🛠️ Kendi kartlarını ekleme

İki yol var:

1. **Uygulama içinden:** Kurulum ekranında **➕ Yeni Paket Yarat** → kart adı, emoji ve istersen foto URL'si ekle. Bu paketler tarayıcıda (`localStorage`) saklanır.
2. **Kalıcı olarak `packs.js` içinde:** `PACK_DEFS` dizisine yeni bir paket ekle. Kart formatı:

```js
{ id: "benim-paketim", emoji: "🎯", name: "Benim Paketim", cards: [
  ["🎯", "Kahraman", null, "img/benim-paketim/kahraman.jpg", 2.5],
  //  emoji   isim       (eski alan)  görsel yolu                    ağırlık
]}
```

- Görselleri `img/<paket-id>/` altına koy.
- **Ağırlık** büyüdükçe kart daha sık çıkar (ana kadro = yüksek ağırlık).
- Paket başına en az 10 kart olması önerilir (dev kadrolarda her tur 10 tanesi seçilir).

---

## 📝 Notlar

- Oyun tamamen istemci tarafında çalışır; sunucuda tutulan bir veri yoktur.
- Online mod public MQTT broker'larına bağlanır. Kurumsal/filtreli ağlarda bu bağlantılar engellenebilir; oyun bunu otomatik olarak yedek broker'larla aşmaya çalışır.
- `img/` klasörü ~70 MB'dır; ilk yüklemede kart fotoğrafları tembel (`loading="lazy"`) yüklenir. Tekrar ziyaretlerde hızlı açılması için `vercel.json` görsellere 30 günlük cache verir.
- **İlk açılış hızı:** Google Fonts artık render-blocking değil (font gecikirse/engellenirse sayfa sistem fontuyla hemen açılır) ve `mqtt.min.js` (~340 KB) yalnızca online oda kurulurken/katılırken yüklenir.

---

<p align="center">🎴 <b>SEÇMECE</b> — kartları kap, takımını kur, vitrinini sergile.</p>
