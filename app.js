/* ============================================================
   SEÇMECE ⚔️ Takım Savaşı v3 — açık artırma + online + paket yaratıcı
   ============================================================ */
'use strict';

/* ---------- kısayollar ---------- */
const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const wait = ms => new Promise(r => setTimeout(r, ms));
const rand = n => Math.floor(Math.random() * n);
const pick = a => a[rand(a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- ses ---------- */
let audioCtx = null, muted = false;
function tone(freq, dur, type = 'sine', vol = .05, delay = 0) {
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  o.connect(g); g.connect(audioCtx.destination);
  const t = audioCtx.currentTime + delay;
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + .012);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.start(t); o.stop(t + dur + .06);
}
function sfx(kind) {
  if (muted) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    switch (kind) {
      case 'click': tone(520, .06, 'square', .03); break;
      case 'lock':  tone(380, .09, 'triangle', .05); tone(580, .12, 'triangle', .05, .09); break;
      case 'reveal': tone(300, .1, 'sawtooth', .04); tone(460, .1, 'sawtooth', .04, .07); tone(660, .18, 'sawtooth', .045, .14); break;
      case 'win':   [523, 659, 784, 1047].forEach((f, i) => tone(f, .16, 'triangle', .055, i * .1)); break;
      case 'lose':  tone(220, .22, 'sawtooth', .05); tone(160, .3, 'sawtooth', .05, .16); break;
      case 'broke': tone(180, .35, 'sawtooth', .055); tone(120, .45, 'sawtooth', .055, .2); break;
      case 'cash':  tone(880, .07, 'sine', .05); tone(1180, .13, 'sine', .05, .08); break;
      case 'round': [392, 523, 659, 784].forEach((f, i) => tone(f, .14, 'triangle', .05, i * .12)); break;
    }
  } catch (e) {}
}

/* ============================================================
   EVREN PAKETLERİ
   ============================================================ */
/* PAKETLER + DEV KADROLAR: packs.js dosyasinda tanimlidir (index.html once onu yukler) */

/* 🎭 KÖR BİD modu: her paket için ipuçları + ünlü gruplar (grup eşleşmesi ada göre, Türkçe harfler sadeleştirilir) */
const BLIND_DEFS = {
  hayvan: {
    hints: ['🌍 Vahşi doğadan biri', '🏔️ Doğanın içinden biri', '🌊 Okyanusun derinliklerinden biri', '🌪️ Savanadan biri', '❄️ Kuzeyin soğuğundan biri'],
    groups: [
      { hint: '🐆 Büyük kedilerden biri', needles: ['aslan', 'kaplan', 'leopar', 'çita', 'jaguar', 'puma', 'vaşak', 'lion', 'tiger', 'leopard', 'cheetah', 'lynx', 'cougar'] },
      { hint: '🐋 Dev bir deniz canlısı', needles: ['balina', 'orka', 'yunus', 'köpek balığı', 'shark', 'whale', 'seahorse', 'deniz atı'] },
      { hint: '🐘 Devasa bir kara hayvanı', needles: ['fil', 'gergedan', 'su aygırı', 'bizon', 'zürafa', 'elephant', 'rhino', 'hippo', 'giraffe'] },
    ],
  },
  dino: {
    hints: ['🦴 Fosil katmanından biri', '🌋 Volkanik vadiden biri', '🏝️ Kayıp kıtadan biri', '🕰️ Milyonlarca yıl öncesinden biri'],
    groups: [
      { hint: '🦖 Etçil bir dev', needles: ['rex', 'raptor', 'allosaurus', 'carnotaurus', 'giganoto', 'spinoz', 'carcharo', 'baryonyx', 'dilopho', 'megalodon', 'smilodon', 'dunkleo'] },
      { hint: '🌿 Otçul bir dev', needles: ['triceratops', 'brachio', 'diplodocus', 'stego', 'ankylo', 'parasaur', 'argentino', 'iguanodon', 'protoceratops', 'pachycephalo'] },
      { hint: '☁️ Gökyüzünün/denizin hükümdarı', needles: ['pteranodon', 'quetzalcoatlus', 'ichthyo', 'plesio', 'mosasaurus'] },
    ],
  },
  naruto: {
    hints: ['🍥 Konoha\'dan biri', '🥷 Ninja dünyasından biri', '🌫️ Gizli köylerden biri'],
    groups: [
      { hint: '🔴 Akatsuki\'den biri', needles: ['itachi', 'kisame', 'pain', 'nagato', 'deidara', 'sasori', 'hidan', 'kakuzu', 'zetsu', 'tobi', 'obito', 'konan', 'akatsuki'] },
      { hint: '🍥 Konoha efsanelerinden biri', needles: ['naruto', 'sasuke', 'kakashi', 'minato', 'jiraiya', 'tsunade', 'hiruzen', 'orochimaru', 'sakura', 'rock lee', 'gaara', 'hinata', 'shikamaru', 'neji', 'might guy', 'kiba', 'choji', 'ino yamanaka', 'tenten', 'sai', 'yamato', 'shino', 'kurenai', 'konohamaru', 'iruka'] },
      { hint: '🗡️ Kılıç ustalarından biri', needles: ['zabuza', 'suigetsu', 'mangetsu', 'killer bee'] },
    ],
  },
  bleach: {
    hints: ['🗡️ Soul Society\'den biri', '👻 Ruh dünyasından biri', '🌙 Gölgelerden biri'],
    groups: [
      { hint: '⚔️ Bir Shinigami kaptanı', needles: ['byakuya', 'kenpachi', 'hitsugaya', 'yoruichi', 'urahara', 'kyoraku', 'unohana', 'soi fon', 'mayuri', 'yamamoto', 'renji', 'rukia'] },
      { hint: '🦇 Bir Espada', needles: ['ulquiorra', 'grimmjow', 'stark', 'baraggan', 'harribel', 'nnoitra', 'szayel', 'yammy', 'aaroniero', 'zommari'] },
      { hint: '😈 Aizen\'in tarafından biri', needles: ['aizen', 'gin', 'tosen', 'kaname'] },
    ],
  },
  onepiece: {
    hints: ['🏴‍☠️ Grand Line\'dan biri', '🌊 Denizlerden biri', '👑 Efsane korsanlardan biri'],
    groups: [
      { hint: '🍖 Hasır Şapka tayfasından biri', needles: ['luffy', 'zoro', 'nami', 'sanji', 'chopper', 'robin', 'franky', 'brook', 'jinbe', 'usopp'] },
      { hint: '👑 Bir Yonko', needles: ['shanks', 'kaido', 'teach', 'whitebeard', 'big mom', 'luffy'] },
      { hint: '🃏 Bir Shichibukai', needles: ['mihawk', 'crocodile', 'doflamingo', 'boa', 'law', 'moria', 'jinbe', 'kuma', 'buggy'] },
    ],
  },
  dragonball: {
    hints: ['🐉 Ejder Topu diyarından biri', '🥋 Dövüş turnuvasından biri', '🌌 Uzayın derinliklerinden biri'],
    groups: [
      { hint: '🟠 Bir Saiyan', needles: ['goku', 'vegeta', 'gohan', 'trunks', 'broly', 'bardock', 'raditz', 'nappa', 'goten', 'kale', 'caulifla', 'cabba'] },
      { hint: '🧊 Bir kötü uzaylı', needles: ['frieza', 'cell', 'buu', 'cooler', 'ginyu', 'zarbon', 'dodoria', 'king cold'] },
      { hint: '🐉 Bir tanrı', needles: ['beerus', 'whis', 'zeno', 'supreme kai', 'dende'] },
    ],
  },
  titan: {
    hints: ['⚔️ Surların ardından biri', '🦴 Titan dünyasından biri', '🔥 Özgürlük savaşçılarından biri'],
    groups: [
      { hint: '🧟 Titan gücü olan biri', needles: ['eren', 'reiner', 'bertholdt', 'annie', 'zeke', 'colossal', 'kolosal', 'yeager'] },
      { hint: '🗡️ Keşif Birliği\'nden biri', needles: ['levi', 'mikasa', 'armin', 'erwin', 'hange', 'jean', 'sasha', 'connie', 'floch', 'hitch', 'ackerman'] },
      { hint: '🛡️ Marley savaşçısı', needles: ['gabi', 'falco', 'porco', 'pieck', 'magath', 'theo'] },
    ],
  },
  jujutsu: {
    hints: ['🌀 Lanet dünyasından biri', '🏫 Büyücülük okulundan biri', '👹 Karanlık taraftan biri'],
    groups: [
      { hint: '🔺 Özel seviye bir güç', needles: ['gojo', 'sukuna', 'mahito', 'jogo', 'hanami', 'dagon', 'kenjaku', 'geto', 'toji', 'yuta', 'maki', 'yuki'] },
      { hint: '🏫 Tokyo Büyücülük Lisesi\'nden biri', needles: ['yuji', 'megumi', 'nobara', 'nanami', 'panda', 'inumaki', 'kusakabe', 'miwa', 'mekamaru'] },
    ],
  },
  demonslayer: {
    hints: ['👺 Şeytan avı dünyasından biri', '🌊 Kılıç ustalarından biri', '🌙 Sonsuz kaleden biri'],
    groups: [
      { hint: '🔥 Bir Hashira', needles: ['giyu', 'rengoku', 'shinobu', 'muichiro', 'mitsuri', 'tengen', 'obanai', 'sanemi', 'gyomei'] },
      { hint: '🌙 Üst Kademe bir şeytan', needles: ['akaza', 'doma', 'kokushibo', 'gyutaro', 'daki', 'gyokko', 'hantengu', 'nakime', 'muzan'] },
      { hint: '⚔️ Bir şeytan avcısı', needles: ['tanjiro', 'zenitsu', 'inosuke', 'nezuko', 'kanao', 'genya', 'sakonji'] },
    ],
  },
  hxh: {
    hints: ['🎣 Avcı dünyasından biri', '🗺️ Karanlık Kıta\'dan biri', '🏙️ Şehirden biri'],
    groups: [
      { hint: '🕷️ Phantom Troupe üyesi', needles: ['chrollo', 'feitan', 'shalnark', 'machi', 'phinks', 'nobunaga', 'uvogin', 'pakunoda', 'shizuku', 'franklin', 'bonolenov', 'kortopi', 'illumi', 'kaluto'] },
      { hint: '🐜 Karınca kolonisinden biri', needles: ['meruem', 'neferpitou', 'menthuthuyoupi', 'shaiapouf', 'youpi', 'welfin', 'meleoron', 'ikalgo', 'peggie', 'bloster'] },
      { hint: '🎣 Ana kadrodan biri', needles: ['gon', 'killua', 'kurapika', 'leorio', 'hisoka', 'ging', 'netero', 'biscuit', 'kite', 'hanzo', 'zushi'] },
    ],
  },
  mha: {
    hints: ['🎓 UA Lisesi\'nden biri', '💥 Kahraman dünyasından biri', '😈 Kötüler birliğinden biri'],
    groups: [
      { hint: '🎓 1-A sınıfından biri', needles: ['deku', 'izuku', 'bakugo', 'katsuki', 'todoroki', 'shoto', 'uraraka', 'ochaco', 'iida', 'tenya', 'asui', 'tsuyu', 'kirishima', 'kaminari', 'jirou', 'yaoyorozu', 'sero', 'mina', 'ashido', 'mashirao', 'tokoyami', 'shoji', 'sato', 'koda', 'aoyama', 'hagakure'] },
      { hint: '😈 Kötüler Birliği\'nden biri', needles: ['shigaraki', 'dabi', 'toga', 'twice', 'spinner', 'magne', 'compress', 'kurogiri', 'all for one'] },
      { hint: '🦸 Profesyonel bir kahraman', needles: ['all might', 'endeavor', 'hawks', 'aizawa', 'present mic', 'midnight', 'best jeanist', 'mt lady', 'kamui', 'edge shot', 'gunhead'] },
    ],
  },
  csm: {
    hints: ['🪚 Şeytan avcısı dünyasından biri', '🚬 Kamu Güvenliğinden biri', '👁️ Karanlık sözleşmeden biri'],
    groups: [
      { hint: '🗡️ Kamu Güvenliği avcısı', needles: ['denji', 'power', 'aki', 'makima', 'himeno', 'kishibe', 'kobeni', 'angel', 'beam', 'prinz', 'quanxi'] },
      { hint: '😈 Bir şeytan', needles: ['pochita', 'reze', 'katana', 'bomb', 'future', 'cosmo', 'violence', 'curse', 'eternity', 'typhoon', 'darkness', 'gun devil', 'control'] },
    ],
  },
  kahraman: {
    hints: ['🌆 Modern şehirden bir kahraman', '🦸 Gizli kahraman merkezinden biri', '🦹 Karanlık taraftan biri'],
    groups: [
      { hint: '🦹 Bir süper kötü', needles: ['thanos', 'joker', 'lex luthor', 'venom', 'green goblin', 'doctor octopus', 'bane', 'riddler', 'magneto', 'galactus', 'doctor doom', 'kingpin', 'homelander', 'harley'] },
      { hint: '🦸 Dünyanın en güçlü kahramanlarından biri', needles: ['süpermen', 'superman', 'thor', 'hulk', 'captain marvel', 'manhattan', 'silver surfer', 'wonder woman', 'flash'] },
      { hint: '🕸️ Örümcek ağlı dünyadan biri', needles: ['örümcek', 'spider', 'batman', 'wolverine', 'deadpool', 'nightwing', 'groot', 'rocket', 'star-lord', 'gamora'] },
    ],
  },
  oyun: {
    hints: ['🎮 Nostaljik bir oyundan biri', '🏰 Efsanevi oyun dünyasından biri', '⚔️ Savaş alanından biri'],
    groups: [
      { hint: '🕹️ Nintendo dünyasından biri', needles: ['mario', 'bowser', 'luigi', 'peach', 'yoshi', 'donkey kong', 'wario', 'toad', 'kirby', 'zelda', 'ganon', 'link', 'pikachu', 'pokemon'] },
      { hint: '🔥 Aksiyon oyunlarından biri', needles: ['kratos', 'geralt', 'ezio', 'arthur morgan', 'trevor', 'marcus fenix', 'ryu', 'sub-zero', 'scorpion', 'doomguy', 'duke nukem', 'master chief', 'big daddy'] },
      { hint: '🗺️ Macera oyunlarından biri', needles: ['lara croft', 'nathan drake', 'aloy', 'solid snake', 'samus', 'crash', 'spyro', 'rayman', 'cuphead', 'sans'] },
    ],
  },
  futbol: {
    hints: ['⚽ Efsane bir ayaktan biri', '🏆 Kupalar kaldıran bir yıldız', '🌍 Dünya yıldızlarından biri'],
    groups: [
      { hint: '🐐 Tüm zamanların en iyilerinden biri', needles: ['messi', 'ronaldo', 'maradona', 'pelé', 'pele', 'cruyff', 'beckenbauer', 'di stefano', 'puskas'] },
      { hint: '🧤 Bir kaleci efsanesi', needles: ['buffon', 'casillas', 'neuer', 'rüştü'] },
      { hint: '🇹🇷 Bir Türk efsanesi', needles: ['şükür', 'hakan', 'arda', 'rüştü', 'emre', 'tugay'] },
    ],
  },
  yemek: {
    hints: ['🍽️ Dünya mutfağından biri', '🔥 Fırından sıcak sıcak', '🌶️ Nefis bir lezzet'],
    groups: [
      { hint: '🇹🇷 Türk mutfağından biri', needles: ['lahmacun', 'baklava', 'adana', 'iskender', 'döner', 'mantı', 'karnıyarık', 'menemen', 'sarma', 'dolma', 'pide', 'simit', 'börek', 'künefe', 'lokum', 'çiğ', 'kuru fasulye', 'kokoreç'] },
      { hint: '🍰 Tatlı bir şey', needles: ['baklava', 'künefe', 'lokum', 'profiterol', 'cheesecake', 'tiramisu', 'waffle', 'macaron', 'gelato', 'pancake'] },
      { hint: '🍕 Fast food dünyasından', needles: ['pizza', 'hamburger', 'döner', 'lahmacun', 'taco', 'burrito', 'fish', 'sushi', 'ramen'] },
    ],
  },
  meme: {
    hints: ['😂 İnternetin derinliklerinden biri', '🌐 Viral olmuş bir isim', '📱 Paylaşıla paylaşıla efsane olanlardan biri'],
    groups: [
      { hint: '😹 Kedi memelerinden biri', needles: ['cat', 'kedi', 'cheems', 'grumpy', 'keyboard', 'nyan', 'lolcat', 'cheez', 'crying'] },
      { hint: '😎 Kült bir meme karakteri', needles: ['doge', 'gigachad', 'trollface', 'pepe', 'wojak', 'chad', 'shrek', 'chuck', 'stonks'] },
      { hint: '📺 Ekrandan fırlayan bir meme', needles: ['spongebob', 'among', 'skibidi', 'salt bae', 'harold', 'keanu', 'distracted', 'yelling'] },
    ],
  },
  mitoloji: {
    hints: ['🏛️ Antik panteondan biri', '⚡ Tanrıların dünyasından biri', '🐉 Efsanevi yaratıklardan biri'],
    groups: [
      { hint: '🏛️ Olympos tanrısı', needles: ['zeus', 'poseidon', 'hades', 'athena', 'apollo', 'artemis', 'ares', 'aphrodite', 'hermes', 'hephaestus', 'dionysus', 'demeter', 'hera'] },
      { hint: '🐉 Efsanevi bir yaratık', needles: ['medusa', 'kraken', 'leviathan', 'fenrir', 'jormungandr', 'jörmungandr', 'chimera', 'griffin', 'sphinx', 'sfenks', 'cyclops', 'pegasus', 'minotauros', 'kitsune', 'phoenix', 'anka', 'unicorn', 'dragon', 'ejder'] },
      { hint: '⚡ Kuzey tanrılarından biri', needles: ['odin', 'thor', 'loki', 'freyja', 'tyr', 'baldr', 'heimdall', 'valkyrie'] },
      { hint: '🏜️ Mısır tanrılarından biri', needles: ['ra', 'osiris', 'isis', 'horus', 'set', 'bastet', 'thoth', 'anubis'] },
    ],
  },
  film: {
    hints: ['🎬 Beyaz perdeden biri', '🏆 Unutulmaz bir karakter', '🌟 Efsane bir filmden biri'],
    groups: [
      { hint: '⚔️ Bir aksiyon efsanesi', needles: ['darth vader', 'terminatör', 'terminator', 'john wick', 'neo', 'rocky', 'james bond', 'indiana jones', 'ripley', 'anakin', 'kylo', 'darth maul', 'palpatine', 'luke', 'han solo', 'chewbacca', 'yoda', 'obi-wan', 'leia'] },
      { hint: '🧙 Fantastik bir dünyadan', needles: ['harry potter', 'gandalf', 'frodo', 'gollum', 'aragorn', 'legolas', 'sauron', 'wonka'] },
      { hint: '🕴️ Bir sinema kültü', needles: ['corleone', 'gump', 'tyler durden', 'hannibal', 'jack torrance', 'norman bates', 'tony montana', 'mia wallace', 'jules', 'katniss'] },
    ],
  },
  blackclover: {
    hints: ['🍀 Clover Krallığı\'ndan biri', '📖 Bir büyü kitabı sahibi', '⚔️ Büyü şövalyelerinden biri'],
    groups: [
      { hint: '🐂 Kara Boğa Birliği\'nden biri', needles: ['asta', 'yami', 'noelle', 'luck', 'vanessa', 'charmy', 'finral', 'gordon', 'gauche', 'grey', 'zora', 'nacht', 'magna', 'henry', 'nero', 'liebe'] },
      { hint: '🦅 Altın Şafak\'tan bir yetenek', needles: ['yuno', 'william', 'langris', 'klaus', 'mimosa'] },
      { hint: '🦁 Kraliyet Şövalyeleri\'nden biri', needles: ['mereoleona', 'fuegoleon', 'nozel', 'charlotte', 'jack', 'dorothy', 'rill', 'leopold', 'sol'] },
    ],
  },
  fairytail: {
    hints: ['🧚 Büyücüler loncasından biri', '✨ Bir büyü kullanıcısı', '🐉 Ejder dolu bir dünyadan biri'],
    groups: [
      { hint: '🔥 Bir Ejder Avcısı', needles: ['natsu', 'gajeel', 'wendy', 'laxus', 'sting', 'rogue', 'acnologia', 'igneel', 'grandine'] },
      { hint: '🧚 Fairy Tail\'in çekirdek kadrosu', needles: ['erza', 'natsu', 'lucy', 'gray', 'juvia', 'happy', 'gajeel', 'mirajane', 'wendy', 'laxus', 'makarov', 'cana', 'levy', 'elfman', 'lisanna', 'freed', 'bickslow', 'evergreen', 'loke', 'plue', 'pantherlily', 'carla', 'romeo'] },
      { hint: '🌑 Karanlık bir loncadan biri', needles: ['jellal', 'zeref', 'mystogan', 'ultear', 'mard', 'cobra', 'angel', 'midnight', 'raker', 'hoteye'] },
    ],
  },
  opm: {
    hints: ['👊 Kahraman Birliği\'nden biri', '👹 Bir canavardan biri', '💥 Süper güçlü bir savaşçı'],
    groups: [
      { hint: '🦸 S-Sınıfı bir kahraman', needles: ['tatsumaki', 'genos', 'bang', 'king', 'metal bat', 'watchdog', 'zombieman', 'flashy', 'atomic', 'darkshine', 'drive knight', 'pig god', 'child emperor', 'puri-puri', 'tanktop', 'metal knight'] },
      { hint: '👹 Bir canavar', needles: ['boros', 'deep sea', 'crablante', 'mosquito', 'black sperm', 'do-s', 'vaccine', 'carnage', 'asura', 'geryuganshoop', 'beefcake', 'kombu', 'ground dragon', 'armored gorilla'] },
      { hint: '⚡ Kahraman dünyasından bir dövüşçü', needles: ['saitama', 'garou', 'sonic', 'mumen', 'suiryu', 'charanko', 'bomb', 'stinger', 'max', 'sneck', 'golden ball', 'iaian', 'amai', 'lily'] },
    ],
  },
  tokyoghoul: {
    hints: ['🩸 Tokyo\'nun karanlık sokaklarından biri', '👁️ Ghoul dünyasından biri', '🔪 Avcı ya da avlanan biri'],
    groups: [
      { hint: '👁️ Bir ghoul', needles: ['kaneki', 'touka', 'rize', 'ayato', 'hinami', 'tsukiyama', 'eto', 'yoshimura', 'nishiki', 'yomo', 'yamori', 'noro', 'tatara', 'naki', 'kurona', 'nashiro', 'itori'] },
      { hint: '🚔 Bir CCG avcısı', needles: ['juuzou', 'arima', 'amon', 'mado', 'shinohara', 'takizawa', 'urie', 'mutsuki', 'shirazu', 'saiko', 'sasaki', 'houji', 'aogiri'] },
    ],
  },
  sao: {
    hints: ['🕶️ Sanal bir dünyadan biri', '⚔️ Ölüm oyunundan bir oyuncu', '🎮 Bir oyuncu'],
    groups: [
      { hint: '🏰 Aincrad\'ın kılıç ustalarından biri', needles: ['kirito', 'asuna', 'klein', 'agil', 'lisbeth', 'silica', 'sachi', 'diavel', 'yui', 'yolko', 'keita'] },
      { hint: '🔫 Gun Gale\'den bir keskin nişancı', needles: ['sinon', 'death gun', 'sterben', 'kirito'] },
      { hint: '💫 Alicization dünyasından biri', needles: ['alice', 'eugeo', 'administrator', 'bercouli', 'fanatio', 'sortiliena', 'ronye', 'tiese', 'cardinal', 'kayaba'] },
    ],
  },
};

const AVATARS = ['🦊','🐻','🐯','🐼','🦁','🐸','🦄','🐙','🐺','🦅','🐉','👽','🤖','🐧','🦖','🔥','⚡','💎','🧠','🎩'];
const EMOJI_OPTIONS = [
  '🦁','🐯','🐘','🦏','🐻','🐼','🐊','🦈','🐺','🦊','🦅','🦉','🐂','🐆','🐎','🐫','🦍','🐍','🦂','🐝',
  '🐙','🦑','🐖','🐐','🦌','🐇','🐓','🦃','🐧','🦭','🦥','🐢','🦎','🐸','🐒','🦜','🦩','🦇','🐉','🦣',
  '💰','🃏','🧪','🛡️','⚡','🗡️','🔥','☄️','💎','🎯','🏆','👑','🍥','👁️','🧙','🦸','⚽','🍔','🎮','🎬',
  '🖤','😎','👽','🤖','🚀','🍕','🌯','🥊','🎤','😜','🚽','😿','🏴‍☠️','⚔️','🏛️','🔱','💀','🧣','🪖','🛸',
];

/* ============================================================
   DURUM (localStorage)
   ============================================================ */
const LS_KEY = 'secmece-v3';
const S = {
  teamNames: ['Kırmızı Takım', 'Mavi Takım'],
  teamAvatars: ['🦊', '🐻'],
  teamMembers: ['', ''],
  rounds: 3,
  roundMoney: 20,
  mode: 'classic',
  selected: PACK_DEFS.map(p => p.id),
  customs: [],
  overrides: {},
};
function saveSetup() { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) {} }
function loadSetup() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const o = JSON.parse(raw);
    if (Array.isArray(o.teamNames) && o.teamNames.length === 2) S.teamNames = o.teamNames.map(n => String(n).slice(0, 16));
    if (Array.isArray(o.teamAvatars) && o.teamAvatars.length === 2) S.teamAvatars = o.teamAvatars;
    if (Array.isArray(o.teamMembers) && o.teamMembers.length === 2) S.teamMembers = o.teamMembers.map(n => String(n).slice(0, 70));
    if ([1, 2, 3, 4, 5].includes(o.rounds)) S.rounds = o.rounds;
    if (typeof o.roundMoney === 'number') S.roundMoney = clamp(o.roundMoney, 5, 100);
    if (o.mode === 'blind' || o.mode === 'classic') S.mode = o.mode;
    if (Array.isArray(o.customs)) S.customs = o.customs.filter(p => p && p.id && Array.isArray(p.cards) && p.cards.length >= 5);
    if (o.overrides && typeof o.overrides === 'object') S.overrides = o.overrides;
    const ids = allPacks().map(p => p.id);
    if (Array.isArray(o.selected)) S.selected = o.selected.filter(id => ids.includes(id));
    /* eski (bu sürüm öncesi) kayıtlarda yeni eklenen paketler otomatik seçili gelsin */
    if (Array.isArray(o.selected) && !o.knownIds) {
      ['jujutsu', 'demonslayer', 'hxh', 'mha', 'csm', 'blackclover', 'fairytail', 'opm', 'tokyoghoul', 'sao'].forEach(id => { if (ids.includes(id) && !S.selected.includes(id)) S.selected.push(id); });
    }
  } catch (e) {}
}

const normCard = c => Array.isArray(c)
  ? { emoji: c[0], name: c[1], img: c[3] || null, w: +c[4] || 1 }
  : { emoji: c.emoji, name: c.name, img: c.img || null, w: +c.w || 1 };
const allPacks = () => [
  ...PACK_DEFS.map(p => {
    const ov = S.overrides[p.id];
    /* Paket düzenlendiğinde eski (kısa) override'lar havuzun geri kalanını gizlemesin:
       override'ı başa koy, kalan kartları koru (isim bazlı dedupe). */
    let src = p.cards;
    if (ov) {
      const seen = new Set();
      src = [...ov, ...p.cards.slice(ov.length)].filter(c => {
        const k = String(Array.isArray(c) ? c[1] : c.name).toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k); return true;
      });
    }
    return { id: p.id, emoji: p.emoji, name: p.name, builtin: true, cards: src.map(normCard) };
  }),
  ...S.customs.map(p => ({ id: p.id, emoji: p.emoji, name: p.name, builtin: false, cards: p.cards.map(normCard) })),
];
const packDef = id => allPacks().find(p => p.id === id);
const CARD_CAP = 5;   // takım başına HER TURDA en fazla kart (tur bitince sayaç sıfırlanır)

/* ============================================================
   KURULUM EKRANI
   ============================================================ */
function renderPackGrid() {
  const grid = $('#packGrid');
  grid.innerHTML = allPacks().map(p => `
    <div class="pack-chip ${S.selected.includes(p.id) ? 'selected' : ''}" data-id="${p.id}">
      <span class="pc-emoji">${p.emoji}</span>
      <span><span class="pc-name">${esc(p.name)}</span><br><span class="pc-count">${p.cards.length} kart${p.builtin ? '' : ' · senin'}</span></span>
      <span class="pc-tools">
        <button class="pc-mini" data-act="edit" title="Düzenle">✏️</button>
        ${p.builtin ? '' : '<button class="pc-mini" data-act="del" title="Sil">🗑️</button>'}
      </span>
    </div>`).join('');
  $$('.pack-chip', grid).forEach(ch => {
    const id = ch.dataset.id;
    ch.onclick = e => {
      const btn = e.target.closest('.pc-mini');
      if (btn) {
        sfx('click');
        if (btn.dataset.act === 'edit') openPackEditor(id);
        if (btn.dataset.act === 'del') deletePack(id);
        return;
      }
      sfx('click');
      S.selected = S.selected.includes(id) ? S.selected.filter(x => x !== id) : [...S.selected, id];
      saveSetup();
      renderPackGrid();
    };
  });
  updatePackSummary();
}
function updatePackSummary() {
  const parts = [`Seçili: ${S.selected.length} paket`];
  if (!S.selected.length) parts.push('⚠️ en az 1 paket seç!');
  else {
    parts.push(`Maç: ${S.rounds} tur · Tur başı $${S.roundMoney}`);
    parts.push(S.mode === 'blind' ? '🎭 Kör Bid modu' : '🎴 Klasik mod');
    if (S.rounds > S.selected.length) parts.push('(turlar için paketler tekrar karışır)');
  }
  $('#packSummary').textContent = parts.join(' · ');
}
function deletePack(id) {
  S.customs = S.customs.filter(p => p.id !== id);
  S.selected = S.selected.filter(x => x !== id);
  saveSetup();
  renderPackGrid();
  toast('🗑️ Paket silindi.');
}

/* ---------- paket editörü ---------- */
let PE = null;
function openPackEditor(id) {
  if (id === null) {
    PE = { mode: 'new', id: 'c' + Date.now().toString(36), builtin: false, emoji: '✏️', name: '', cards: [...Array(5)].map(() => ({ emoji: '🦁', name: '' })) };
  } else {
    const p = packDef(id);
    PE = {
      mode: 'edit', id, builtin: !!p.builtin,
      emoji: p.emoji, name: p.name,
      cards: p.cards.map(c => ({ ...c })),
      orig: { emoji: p.emoji, name: p.name, cards: p.cards.map(c => ({ ...c })) },
    };
  }
  renderPE();
  $('#packEditor').classList.remove('hidden');
}
function renderPE() {
  $('#peTitle').textContent = PE.mode === 'new' ? '➕ Yeni Paket Yarat' : (PE.builtin ? '✏️ Paketi Düzenle' : '✏️ Paketini Düzenle');
  $('#peEmoji').innerHTML = EMOJI_OPTIONS.map(e => `<option ${e === PE.emoji ? 'selected' : ''}>${e}</option>`).join('');
  $('#peName').value = PE.name;
  const rows = $('#peRows');
  rows.innerHTML = '';
  PE.cards.forEach((c, i) => {
    const row = document.createElement('div');
    row.className = 'pe-row';
    row.innerHTML = `
      <select class="pe-emoji-sel">${EMOJI_OPTIONS.map(e => `<option ${e === c.emoji ? 'selected' : ''}>${e}</option>`).join('')}</select>
      <input class="pe-name" maxlength="18" placeholder="Karakter adı" value="${esc(c.name || '')}" />
      <input class="pe-img" maxlength="300" placeholder="🖼️ Foto URL (ops.)" value="${esc(c.img || '')}" />
      <span class="pe-thumb">${c.img ? `<img src="${esc(c.img)}" alt="" data-fb="${c.emoji}" data-fb-cls="pe-fb" />` : c.emoji}</span>
      <button class="pe-del" title="Kartı sil">🗑️</button>`;
    $('.pe-emoji-sel', row).onchange = e => { PE.cards[i].emoji = e.target.value; };
    $('.pe-name', row).oninput = e => { PE.cards[i].name = e.target.value; };
    $('.pe-img', row).oninput = e => {
      PE.cards[i].img = e.target.value.trim() || null;
      const th = $('.pe-thumb', row);
      th.innerHTML = PE.cards[i].img ? `<img src="${esc(PE.cards[i].img)}" alt="" data-fb="${PE.cards[i].emoji}" data-fb-cls="pe-fb" />` : PE.cards[i].emoji;
    };
    $('.pe-del', row).onclick = () => { PE.cards.splice(i, 1); renderPE(); };
    rows.appendChild(row);
  });
  $('#peReset').classList.toggle('hidden', !(PE.mode === 'edit' && PE.builtin && S.overrides[PE.id]));
  $('#peEmoji').onchange = e => { PE.emoji = e.target.value; };
  $('#peName').oninput = e => { PE.name = e.target.value; };
}
function savePE() {
  PE.emoji = $('#peEmoji').value;
  PE.name = ($('#peName').value || '').trim().slice(0, 22);
  const cards = PE.cards
    .filter(c => (c.name || '').trim())
    .map(c => ({ emoji: c.emoji, name: c.name.trim().slice(0, 18), img: (c.img || '').trim() || null, type: 'army' }));
  if (cards.length < 5) { toast('✍️ En az 5 isimli kart lazım!', 'bad'); return; }
  if (!PE.name) { toast('✍️ Pakete bir isim ver!', 'bad'); return; }
  if (PE.mode === 'new') {
    S.customs.push({ id: PE.id, emoji: PE.emoji, name: PE.name, cards });
    S.selected.push(PE.id);
  } else if (PE.builtin) {
    S.overrides = S.overrides || {};
    S.overrides[PE.id] = cards;
  } else {
    const p = S.customs.find(x => x.id === PE.id);
    if (p) { p.emoji = PE.emoji; p.name = PE.name; p.cards = cards; }
  }
  saveSetup();
  renderPackGrid();
  $('#packEditor').classList.add('hidden');
  toast(`💾 "${esc(PE.name)}" kaydedildi! (${cards.length} kart)`);
}
function resetPE() {
  if (!PE || !PE.orig) return;
  if (S.overrides) delete S.overrides[PE.id];
  PE.emoji = PE.orig.emoji;
  PE.name = PE.orig.name;
  PE.cards = PE.orig.cards.map(c => ({ ...c }));
  saveSetup();
  renderPE();
  renderPackGrid();
  toast('↺ Paket varsayılana döndü.');
}

/* ---------- kurulum bağlantıları ---------- */
function initSetupUI() {
  [0, 1].forEach(i => {
    const av = $(`#team${i}avatar`);
    av.innerHTML = AVATARS.map(a => `<option ${a === S.teamAvatars[i] ? 'selected' : ''}>${a}</option>`).join('');
    $(`#team${i}name`).value = S.teamNames[i];
    $(`#team${i}members`).value = S.teamMembers[i];
    $(`#team${i}name`).addEventListener('input', e => { S.teamNames[i] = e.target.value; saveSetup(); });
    av.addEventListener('input', e => { S.teamAvatars[i] = e.target.value; saveSetup(); });
    $(`#team${i}members`).addEventListener('input', e => { S.teamMembers[i] = e.target.value; saveSetup(); });
  });
  $('#roundsSel').value = String(S.rounds);
  $('#roundMoney').value = S.roundMoney;
  $('#roundsSel').addEventListener('input', e => { S.rounds = clamp(+e.target.value || 3, 1, 5); saveSetup(); updatePackSummary(); });
  $('#roundMoney').addEventListener('input', e => { S.roundMoney = clamp(parseInt(e.target.value) || 20, 5, 100); saveSetup(); updatePackSummary(); });
  const modeBtns = $$('.mode-btn');
  const syncMode = () => modeBtns.forEach(b => b.classList.toggle('on', b.dataset.mode === S.mode));
  modeBtns.forEach(b => b.addEventListener('click', () => { sfx('click'); S.mode = b.dataset.mode === 'blind' ? 'blind' : 'classic'; saveSetup(); syncMode(); updatePackSummary(); }));
  syncMode();

  $('#btnAllPacks').onclick = () => { sfx('click'); S.selected = allPacks().map(p => p.id); saveSetup(); renderPackGrid(); };
  $('#btnNoPacks').onclick = () => { sfx('click'); S.selected = []; saveSetup(); renderPackGrid(); };
  $('#btnNewPack').onclick = () => { sfx('click'); openPackEditor(null); };
  $('#peAddRow').onclick = () => {
    if (!PE) return;
    if (PE.cards.length >= 20) { toast('En fazla 20 kart kanka!', 'bad'); return; }
    PE.cards.push({ emoji: '🦁', name: '' });
    renderPE();
  };
  $('#peCancel').onclick = () => { sfx('click'); $('#packEditor').classList.add('hidden'); };
  $('#peSave').onclick = () => { sfx('click'); savePE(); };
  $('#peReset').onclick = () => { sfx('click'); resetPE(); };
  renderPackGrid();
}

/* ============================================================
   MAÇ MOTORU — açık artırma (teklifi gör, karşı artır)
   ============================================================ */
let G = null;                 // maç durumu (yetkili taraf: local ya da host)
let MODE = 'local';           // 'local' | 'host' | 'guest'
let MY_TEAM = null;           // online modda kendi takım index'ı
let HOST_TEAM = 0;            // host'un seçtiği takım
let NET = null;               // Net.Room
let ROOM_CODE = '';
let GUEST = null;             // host tarafı: { name, avatar, teamName }
let guestIdentity = { name: 'Oyuncu', avatar: '🐻', teamName: '' };
let LOBBY_TIMER = null, JOIN_TIMER = null, GAME_HB = null, LINK_TIMER = null;
let lastHostMsgAt = 0, seenGame = false, gameStateSeen = false, hostSeen = false;
let ACT_PENDING = null, ACT_SEQ = 0, RETRY_TIMER = null, LAST_S = null;
let curScreen = 'setup';
let lastEventId = 0, endedShown = false, confettiDone = false;
let uiCardKey = null, uiPanelSig = null, uiPhase = null, uiTopSig = null, uiLogSig = null;
let uiEndSig = null, uiScoreSig = null;
let bidDraft = null;   // {key, team, min, val} — panel yeniden çizilince eldeki tutar sıfırlanmasın

/* ---------- küçük yardımcılar ---------- */
function showScreen(name) {
  if (curScreen === name) return;
  curScreen = name;
  ['setup', 'game', 'end'].forEach(x => {
    const el = document.getElementById('screen-' + x);
    if (el) el.classList.toggle('active', x === name);
  });
  try { window.scrollTo(0, 0); } catch (e) {}
}
function setStatus(t) { const el = $('#stageStatus'); if (el) el.textContent = t || ''; }
function ev(msg, type) {
  if (!G) return;
  G.events.push({ id: ++G.eventSeq, msg: msg, type: type || '' });
  if (G.events.length > 20) G.events = G.events.slice(-20);
}
function memberList(s) { return String(s || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 6); }
function canActTeam(team) { return MODE === 'local' ? true : team === MY_TEAM; }

function toast(msg, type) {
  const t = document.getElementById('toasts');
  if (!t || !msg) return;
  const box = document.createElement('div');
  box.className = 'toast ' + (type || '');
  box.innerHTML = msg;
  t.appendChild(box);
  setTimeout(() => {
    box.classList.add('out');
    setTimeout(() => box.remove(), 450);
  }, 3200);
}
function confetti() {
  const layer = document.getElementById('confetti-layer');
  if (!layer) return;
  const colors = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];
  for (let i = 0; i < 110; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    const size = 6 + rand(8);
    p.style.cssText = 'left:' + rand(100) + 'vw;width:' + size + 'px;height:' + (size * (0.6 + Math.random())) + 'px;background:' + pick(colors) + ';animation-duration:' + (2.6 + Math.random() * 2.6) + 's;animation-delay:' + (Math.random() * 0.9) + 's;opacity:' + (0.7 + Math.random() * 0.3);
    layer.appendChild(p);
    setTimeout(() => p.remove(), 6500);
  }
}

/* ---------- snapshot (senkron edilen tek gerçek) ---------- */
function snap() {
  const cfg = G.cfg;
  const cardSnap = c => ({ emoji: c.emoji, name: c.name, img: c.img || null });
  const teams = G.teams.map(t => ({
    name: t.name, avatar: t.avatar, members: t.members,
    money: t.money,
    roundCount: t.roundCards.length,
    count: t.cards.length,
    cards: t.cards.map(cardSnap),
    roundCards: t.roundCards.map(cardSnap),
  }));
  return {
    v: 1,
    phase: G.phase,
    round: G.round, rounds: cfg.rounds, roundMoney: cfg.roundMoney,
    cardInRound: G.cardInRound, perRound: G.perRound, cardsDone: G.cardsDone,
    pack: G.pack ? { emoji: G.pack.emoji, name: G.pack.name } : null,
    tease: G.tease || [],
    current: G.current ? (G.current.hidden
      ? { key: G.current.key, emoji: '❓', name: '', img: null, hidden: true, hint: G.current.hint || '❓ Gizemli bir kart' }
      : { key: G.current.key, emoji: G.current.emoji, name: G.current.name, img: G.current.img || null }
    ) : null,
    blind: !!cfg.blind,
    teams: teams,
    turn: G.turn, stage: G.bidStage, topBid: G.topBid, trail: G.trail, passed: [G.passed[0], G.passed[1]],
    openNext: G.openNext,
    reveal: G.revealInfo,
    log: G.log.slice(-24),
    events: G.events.slice(-8),
    status: G.status || '',
    hostTeam: MODE === 'host' ? MY_TEAM : (MODE === 'local' ? -1 : 1 - MY_TEAM),
    lastGuestSeq: G.lastGuestSeq || 0,
    ack: G.lastAck || null,
    over: G.over, endInfo: G.endInfo || null,
  };
}
function lobbySnap() {
  return {
    v: 1, phase: 'lobby',
    lobby: {
      code: ROOM_CODE, hostTeam: HOST_TEAM,
      hostName: S.teamNames[HOST_TEAM] || 'Host',
      hostAvatar: S.teamAvatars[HOST_TEAM] || '🦊',
      hostTeamName: S.teamNames[HOST_TEAM] || 'Takım',
      teams: [S.teamNames[0] || '1. Takım', S.teamNames[1] || '2. Takım'],
      guestJoined: !!GUEST,
      guestName: GUEST ? GUEST.name : '',
      guestAvatar: GUEST ? GUEST.avatar : '',
      guestTeamName: GUEST ? GUEST.teamName : '',
      rounds: S.rounds, roundMoney: S.roundMoney,
    },
  };
}
function push() {
  const s = snap();
  renderState(s);
  if (MODE === 'host' && NET) NET.send({ t: 'state', s: s });
}

/* ---------- aksiyon yönlendirme ---------- */
function act(action) {
  if (MODE === 'guest') {
    if (!NET || !LAST_S) return;
    if (ACT_PENDING) { toast('⏳ Önceki hamlen onaylanıyor — bir saniye…', 'gold'); return; }
    const seq = ++ACT_SEQ;
    ACT_PENDING = { seq: seq, a: action, sentAt: Date.now(), tries: 0 };
    NET.send({ t: 'action', action: Object.assign({}, action, { seq: seq }) });
    startRetry();
    return;
  }
  if (!G) return;
  applyAction(action, action.team);
}
/* guest hamlesi host tarafında geçerli mi? — geçersizse sessizce yutmak yerine 'ack.ok=false' yollanır */
function canApplyAction(a, team) {
  if (!G || G.over || G.phase !== 'bidding' || !a) return false;
  if (team !== G.turn || G.passed[team]) return false;
  if (a.a === 'pass') {
    if (G.topBid) return true;
    /* açılışta "bağış pası" serbest — sadece rakip parasızken ve kadrosu dolmamışken */
    const opp = G.teams[1 - team];
    return opp.money <= 0 && opp.roundCards.length < CARD_CAP;
  }
  if (a.a === 'bid') {
    const t = G.teams[team];
    if (t.money <= 0 || t.roundCards.length >= CARD_CAP) return false;
    const min = G.topBid ? G.topBid.amount + 1 : 1;
    const amt = Math.round(+a.amount || 0);
    return amt >= min && amt <= t.money;
  }
  return false;
}
function startRetry() {
  if (RETRY_TIMER) return;
  RETRY_TIMER = setInterval(() => {
    if (MODE !== 'guest' || !NET || !ACT_PENDING) return;
    if (Date.now() - ACT_PENDING.sentAt < 1200) return;
    if (ACT_PENDING.tries >= 8) {
      ACT_PENDING = null;
      toast('⚠️ Sunucudan onay gelmedi — butonlar yeniden açıldı', 'bad');
      if (LAST_S) { uiPanelSig = null; renderState(LAST_S); }
      return;
    }
    ACT_PENDING.tries++; ACT_PENDING.sentAt = Date.now();
    NET.send({ t: 'action', action: Object.assign({}, ACT_PENDING.a, { seq: ACT_PENDING.seq }) });
  }, 600);
}
function applyAction(a, team) {
  if (!G || G.over || !a) return;
  if (a.a === 'bid') placeBid(team, a.amount);
  else if (a.a === 'pass') passBid(team);
}

/* ============================================================
   MAÇ AKIŞI
   ============================================================ */
function beginMatch(cfg) {
  if (!cfg || !cfg.teams || cfg.teams.length !== 2) return;
  G = {
    cfg: cfg,
    teams: cfg.teams.map(t => ({
      name: t.name || 'Takım', avatar: t.avatar || '🐻', members: t.members || [],
      money: 0, prevMoney: 0, cards: [], roundCards: [],
    })),
    queue: [], lastPack: null,
    round: 0, perRound: 10, cardInRound: 0, cardsDone: 0,
    deck: [], current: null, keySeq: 0,
    phase: 'intro', turn: null, bidStage: null, topBid: null, trail: [], passed: [false, false],
    revealInfo: null,
    log: [], events: [], eventSeq: 0,
    status: '', over: false, endInfo: null, tease: [],
    openNext: 0,
    usedKeys: new Set(),
    lastGuestSeq: 0, lastAck: null,
  };
  endedShown = false; confettiDone = false; lastEventId = 0;
  uiCardKey = null; uiPanelSig = null; uiPhase = null; uiTopSig = null; uiLogSig = null;
  uiEndSig = null; uiScoreSig = null;
  bidDraft = null; ACT_PENDING = null;
  ['#cardSlot', '#bidArea', '#revealArea', '#logList'].forEach(id => { const el = $(id); if (el) el.innerHTML = ''; });
  ['#roundIntro', '#roundSummary', '#lobby', '#joinRoom'].forEach(id => { const el = $(id); if (el) el.classList.add('hidden'); });
  if (LOBBY_TIMER) { clearInterval(LOBBY_TIMER); LOBBY_TIMER = null; }
  if (GAME_HB) { clearInterval(GAME_HB); GAME_HB = null; }
  if (MODE === 'host' && NET) {
    GAME_HB = setInterval(() => {
      if (MODE === 'host' && NET && G) NET.send({ t: 'state', s: snap() });
    }, 2500);
  }
  showScreen('game');
  startRound();
}

function nextPack() {
  if (!G.queue.length) G.queue = shuffle([...G.cfg.packIds]);
  let id = G.queue.shift();
  if (id === G.lastPack && G.queue.length) { G.queue.push(id); id = G.queue.shift(); }
  G.lastPack = id;
  return packDef(id) || allPacks()[0];
}

function normTr(s) {
  return String(s || '').toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '');
}
/* kör bid: kartın kimliğini gizleyen ipucu (önce ünlü grup eşleşmesi, sonra genel ipuçları) */
function blindHintFor(pack, name) {
  const bd = BLIND_DEFS[pack.id];
  const nn = normTr(name);
  if (bd) {
    const hits = (bd.groups || []).filter(g => (g.needles || []).some(nd => {
      const x = normTr(nd);
      return x && (nn.includes(x) || x.includes(nn));
    }));
    if (hits.length && Math.random() < 0.8) return hits[Math.floor(Math.random() * hits.length)].hint;
    if (bd.hints && bd.hints.length) return bd.hints[Math.floor(Math.random() * bd.hints.length)];
  }
  return '❓ Gizemli bir kart geliyor';
}
function weightedTen(pool, k) {
  /* Ağırlıklı rastgele seçim (Efraimidis–Spirakis): key = random^(1/w), en büyük k tanesi.
     w büyükse daha sık çıkar — efsane/önemli karakterler öne çıkar, arka plan karakterleri seyrekleşir. */
  return pool.map(c => ({ c: c, key: Math.pow(Math.random(), 1 / Math.max(0.05, +c.w || 1)) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, k)
    .map(x => x.c);
}
function buildDeck(pack) {
  let src = pack.cards;
  /* DEV KADRO: 10'dan fazla kartı olan paketlerde her tur rastgele 10 kart seçilir
     (tercihen bu maçta henüz çıkmamışlardan); ağırlık varsa önemli karakterler öne çıkar. */
  if (pack.cards.length > 10) {
    if (!G.usedKeys) G.usedKeys = new Set();
    const fresh = pack.cards.filter(c => !G.usedKeys.has(pack.id + '|' + c.name));
    const from = fresh.length >= 10 ? fresh : pack.cards;
    src = from.length <= 10 ? shuffle([...from]) : weightedTen(from, 10);
    if (src.length < 10) src = shuffle([...pack.cards]).slice(0, 10);
    src.forEach(c => G.usedKeys.add(pack.id + '|' + c.name));
  }
  const cards = src.map(c => ({ emoji: c.emoji, name: c.name, img: c.img || null, type: 'army', packEmoji: pack.emoji, packName: pack.name, round: G.round }));
  if (G.cfg.blind) cards.forEach(c => { c.hidden = true; c.hint = blindHintFor(pack, c.name); });
  shuffle(cards);
  return cards;
}

function startRound() {
  if (!G || G.over) return;
  G.round++;
  G.openNext = G.round % 2 === 1 ? 0 : 1;   // tur başı: 1. tur sol (0), 2. tur sağ (1), 3. tur yine sol…
  G.cardInRound = 0;
  const pack = nextPack();
  G.pack = pack;
  G.deck = buildDeck(pack);
  G.perRound = G.deck.length;
  G.teams.forEach(t => { t.money = G.cfg.roundMoney; t.prevMoney = t.money; t.roundCards = []; });
  G.phase = 'intro';
  G.current = null; G.topBid = null; G.trail = []; G.passed = [false, false];
  G.status = 'Tur ' + G.round + ' · ' + pack.emoji + ' ' + pack.name;
  sfx('round');
  push();
}

function goRound() {
  if (!G || G.over || G.phase !== 'intro' || MODE === 'guest') return;
  sfx('click');
  $('#roundIntro').classList.add('hidden');
  dealNext();
}

async function dealNext() {
  if (!G || G.over) return;
  if (!G.deck.length) return endRound();
  G.keySeq++;
  const card = G.deck.shift();
  G.current = { ...card, key: 'c' + G.keySeq };
  G.cardInRound++;
  G.topBid = null; G.trail = []; G.passed = [false, false]; G.bidStage = null; G.revealInfo = null;
  /* açılış HER KARTTA döner: sol → sağ → sol… (tur aralarında da kaldığı yerden devam eder) */
  G.turn = G.openNext;
  G.openNext = 1 - G.openNext;
  G.cardsDone++;
  G.phase = 'dealing';
  G.status = (G.cfg.blind && card.hidden)
    ? '🃏 ❓ ' + (card.hint || 'Gizemli bir kart') + ' · kart ' + G.cardInRound + '/' + G.perRound
    : '🃏 ' + card.emoji + ' ' + card.name + ' · kart ' + G.cardInRound + '/' + G.perRound;
  sfx('reveal');
  push();
  await wait(1000);
  if (!G || G.over) return;
  /* bir takım bu tur kadrosunu doldurduysa: TEKLİF YOK — kalan kartlar sırayla eksik takıma gider
     (teklif paneli hiç açılmaz) */
  const f0 = G.teams[0].roundCards.length >= CARD_CAP, f1 = G.teams[1].roundCards.length >= CARD_CAP;
  if (f0 && f1) {
    ev('🎉 İki takım da bu turda ' + CARD_CAP + '/' + CARD_CAP + ' doldurdu — tur kapanıyor!', 'gold');
    push();
    return endRound();
  }
  if (f0 !== f1) {
    const recv = f0 ? 1 : 0, full = G.teams[f0 ? 0 : 1];
    G.status = '🎴 ' + full.name + ' bu tur kadrosunu doldurdu (' + CARD_CAP + '/' + CARD_CAP + ') — kart teklifsiz ' + G.teams[recv].name + "'e gidiyor";
    ev('🎴 ' + full.name + ' kadrosu doldu — kalan kartlar sırayla teklifsiz ' + G.teams[recv].name + "'e gidiyor", 'gold');
    push();
    await wait(620);
    if (!G || G.over) return;
    return freeCard(recv);
  }
  G.phase = 'bidding';
  G.bidStage = 'open';
  G.status = '🎯 ' + G.teams[G.turn].name + ': açılış teklifi vermek zorunda!';
  push();
  if (skipBrokeOpener()) return;   // parasız/dolu takım açamaz: açılış anında rakibe geçer
  scheduleAutoCheck();
}

/* açılış sırası parası biten ya da kadrosu dolan takıma gelirse: açılış ANINDA rakibe geçer.
   İki taraf da açamıyorsa kart bedavaya, kadrosu eksik olan takıma gider (asla çöpe gitmez). */
function skipBrokeOpener() {
  const cur = G.teams[G.turn], oIdx = 1 - G.turn, other = G.teams[oIdx];
  const can = t => t.money > 0 && t.roundCards.length < CARD_CAP;
  if (can(cur)) return false;
  if (can(other)) {
    const broke = cur.money <= 0;
    G.turn = oIdx;
    G.bidStage = 'open';
    G.status = (broke ? '💸 ' : '🎴 ') + cur.name + (broke ? ' parasız' : ' bu tur kadrosunu doldurdu') + ' — açılış ' + other.name + "'e geçti! 🎯 " + other.name + ': açılış teklifi vermek zorunda!';
    ev((broke ? '💸 ' : '🎴 ') + cur.name + (broke ? ' parasız — açılış ' : ' kadrosu doldu — açılış ') + other.name + "'e geçti", 'bad');
    push();
    return true;
  }
  freeCard();   // ikisi de açamıyor: kart bedavaya, çöpe gitmiyor
  return true;
}

function placeBid(team, amount) {
  if (!G || G.over || G.phase !== 'bidding' || team !== G.turn || G.passed[team]) return;
  const t = G.teams[team];
  if (t.money <= 0 || t.roundCards.length >= CARD_CAP) return;
  const min = G.topBid ? G.topBid.amount + 1 : 1;
  amount = clamp(Math.round(+amount || 0), min, t.money);
  if (amount < min) return;
  G.topBid = { team: team, amount: amount };
  G.trail.push({ team: team, amount: amount, pass: false });
  G.turn = 1 - team;
  G.bidStage = 'raise';
  sfx('lock');
  const nt = G.teams[G.turn];
  G.status = !canTeamBid(nt)
    ? autoPassReason(nt).cls + ' ' + nt.name + ' — otomatik pas geçiyor…'
    : '👀 ' + nt.name + ': rakip $' + amount + ' dedi — karşı artır ya da pas!';
  push();
  scheduleAutoCheck();
}

function passBid(team) {
  if (!G || G.over || G.phase !== 'bidding' || team !== G.turn || G.passed[team]) return;
  if (!G.topBid) {
    /* açılışta normalde pas yok — AMA rakip parasızsa "bağış pası":
       pas geçersen kart bedavaya rakibe gider, para sahibi hiçbir şey ödemez */
    const opp = G.teams[1 - team];
    if (opp.money > 0 || opp.roundCards.length >= CARD_CAP) return;
    G.trail.push({ team: team, amount: null, pass: true });
    G.passed[team] = true;
    sfx('click');
    G.status = '🎁 ' + G.teams[team].name + ' pas geçti — kart bedavaya ' + opp.name + "'e gidiyor…";
    push();
    setTimeout(() => { if (G && !G.over && G.phase === 'bidding') freeCard(1 - team, G.teams[team]); }, 550);
    return;
  }
  G.trail.push({ team: team, amount: null, pass: true });
  G.passed[team] = true;
  sfx('click');
  G.status = '⏸️ ' + G.teams[team].name + ' pas geçti…';
  push();
  setTimeout(resolveAfterPass, 550);
}

function canTeamBid(t) {
  if (!t || t.roundCards.length >= CARD_CAP) return false;
  const min = G.topBid ? G.topBid.amount + 1 : 1;
  return t.money >= min;
}
function autoPassReason(t) {
  if (t.roundCards.length >= CARD_CAP) return { cls: '🎴', sfx: 'lose', msg: ' bu turda kadrosunu doldurdu (5/5) — otomatik pas!' };
  if (t.money <= 0) return { cls: '💸', sfx: 'broke', msg: ' parasız — otomatik pas!' };
  return { cls: '🪙', sfx: 'broke', msg: ' parası teklifi karşılamıyor ($' + t.money + ' kaldı) — otomatik pas!' };
}
function scheduleAutoCheck() {
  if (!G || G.over || G.phase !== 'bidding') return;
  if (canTeamBid(G.teams[G.turn])) return;
  setTimeout(() => {
    if (!G || G.over || G.phase !== 'bidding') return;
    const tt = G.teams[G.turn];
    if (canTeamBid(tt)) return;
    const r = autoPassReason(tt);
    ev(r.cls + ' ' + tt.name + r.msg, 'bad');
    sfx(r.sfx);
    G.trail.push({ team: G.turn, amount: null, pass: true });
    G.passed[G.turn] = true;
    G.status = r.cls + ' ' + tt.name + ' otomatik pas geçti';
    push();
    setTimeout(resolveAfterPass, 380);
  }, 380);
}

function resolveAfterPass() {
  if (!G || G.over || G.phase !== 'bidding') return;
  const passer = G.turn;
  if (G.topBid) return resolveAuction(G.topBid.team, G.topBid.amount);
  if (G.passed[0] && G.passed[1]) return freeCard();   // kart çöpe gitmez — bedavaya gider
  G.turn = 1 - passer;
  G.bidStage = 'open';
  const nt2 = G.teams[G.turn];
  if (nt2.money <= 0 || nt2.roundCards.length >= CARD_CAP) return freeCard();   // o da açamıyor — kart bedavaya, çöpe gitmez
  G.status = '🎯 ' + nt2.name + ': açılış teklifi vermek zorunda!';
  push();
  scheduleAutoCheck();
}

async function resolveAuction(w, amount) {
  if (!G || G.over || G.phase === 'reveal') return;
  const t = G.teams[w];
  const card = G.current;
  if (card && card.hidden) card.hidden = false;   // kör bid: kart kazanılınca açılır
  G.phase = 'reveal';
  t.money -= amount;
  t.cards.push(card);
  t.roundCards.push(card);
  G.revealInfo = {
    team: w, amount: amount, discarded: false,
    card: { emoji: card.emoji, name: card.name, img: card.img || null },
  };
  const trailTxt = G.trail.map(x => (x.team ? '🔵' : '🔴') + ' ' + (x.pass ? 'PAS' : '$' + x.amount)).join(' → ');
  const wonTxt = '🏆 <b>' + esc(card.emoji + ' ' + card.name) + '</b> → ' + esc(t.name) + ' · <b>$' + amount + '</b>';
  G.log.push({ html: wonTxt + '<br><small>' + trailTxt + '</small>', cls: w ? 'win1' : '', gold: false });
  ev('🏆 ' + card.emoji + ' ' + card.name + " → " + t.name + ' ($' + amount + ')', w ? 'blue' : 'red');
  if (t.roundCards.length >= CARD_CAP) ev('🎴 ' + t.name + ' bu tur kadrosunu doldurdu! (' + CARD_CAP + '/' + CARD_CAP + ')', t ? 'gold' : '');
  if (t.money <= 0 && t.prevMoney > 0) ev('💸 ' + t.name + "'in kasası bitti!", 'bad');
  t.prevMoney = t.money;
  sfx('win');
  push();
  await wait(1900);
  if (!G || G.over) return;
  if (G.teams[0].roundCards.length >= CARD_CAP && G.teams[1].roundCards.length >= CARD_CAP) {
    ev('🎉 İki takım da bu turda 5/5 doldurdu — tur kapanıyor!', 'gold');
    push();
    await wait(1100);
    if (!G || G.over) return;
    return endRound();
  }
  dealNext();
}

/* iki taraf da ödeyemiyorsa kart ASLA çöpe gitmez: kadrosu eksik olan takıma bedavaya gider */
async function freeCard(preferTeam, giftFrom) {
  if (!G || G.over) return;
  const card = G.current;
  if (card && card.hidden) card.hidden = false;   // kör bid: kart açılır
  const full0 = G.teams[0].roundCards.length >= CARD_CAP, full1 = G.teams[1].roundCards.length >= CARD_CAP;
  let recv;
  if ((preferTeam === 0 || preferTeam === 1) && !(preferTeam === 0 ? full0 : full1)) recv = preferTeam;
  else if (full0 && !full1) recv = 1;
  else if (full1 && !full0) recv = 0;
  else recv = G.teams[0].roundCards.length <= G.teams[1].roundCards.length ? 0 : 1;
  const t = G.teams[recv];
  G.phase = 'reveal';
  t.cards.push(card);
  t.roundCards.push(card);
  G.revealInfo = { team: recv, amount: 0, free: true, gift: !!giftFrom, discarded: false, card: { emoji: card.emoji, name: card.name, img: card.img || null } };
  const fullName = full0 ? G.teams[0].name : (full1 ? G.teams[1].name : null);
  G.log.push({ html: giftFrom
    ? '🎁 <b>' + esc(card.emoji + ' ' + card.name) + '</b> — ' + esc(giftFrom.name) + ' pas geçti, bedavaya ' + esc(t.name) + "'e gitti"
    : fullName
      ? '🎴 <b>' + esc(card.emoji + ' ' + card.name) + '</b> — ' + esc(fullName) + ' kadrosu doldu, teklifsiz ' + esc(t.name) + "'e gitti"
      : '🎁 <b>' + esc(card.emoji + ' ' + card.name) + '</b> — kimse ödeyemedi, bedavaya ' + esc(t.name) + "'e gitti", cls: recv ? 'win1' : '', gold: true });
  ev(giftFrom
    ? '🎁 ' + card.emoji + ' ' + card.name + ' — ' + giftFrom.name + ' pası sayesinde bedavaya ' + t.name + "'e gitti!"
    : '🎁 ' + card.emoji + ' ' + card.name + ' bedavaya → ' + t.name, 'gold');
  sfx('cash');
  push();
  await wait(1900);
  if (!G || G.over) return;
  if (G.teams[0].roundCards.length >= CARD_CAP && G.teams[1].roundCards.length >= CARD_CAP) {
    ev('🎉 İki takım da bu turda 5/5 doldurdu — tur kapanıyor!', 'gold');
    push();
    await wait(1100);
    if (!G || G.over) return;
    return endRound();
  }
  dealNext();
}

function endRound() {
  if (!G || G.over) return;
  G.phase = 'roundEnd';
  G.status = 'Tur ' + G.round + ' bitti!';
  sfx('round');
  push();
}

function nextRound() {
  if (!G || G.over || G.phase !== 'roundEnd' || MODE === 'guest') return;
  sfx('click');
  $('#roundSummary').classList.add('hidden');
  if (G.round >= G.cfg.rounds) return endGame();
  startRound();
}

function groupCards(t) {
  const out = [];
  for (let r = 1; r <= G.cfg.rounds; r++) {
    const cards = t.cards.filter(c => c.round === r);
    if (!cards.length) continue;
    out.push({
      round: r, emoji: cards[0].packEmoji || '🎴', name: cards[0].packName || '',
      cards: cards.map(c => ({ emoji: c.emoji, name: c.name, img: c.img || null })),
    });
  }
  return out;
}

function endGame() {
  if (!G || G.over) return;
  G.over = true;
  G.phase = 'end';
  const counts = G.teams.map(t => t.cards.length);
  G.endInfo = { winner: -1, counts: counts, groups: G.teams.map(groupCards) };
  G.status = 'Maç bitti!';
  sfx('win');
  push();
}

/* ============================================================
   ÇİZİM — her şey snapshot'tan
   ============================================================ */
function renderState(s) {
  if (!s) return;
  if (s.phase === 'end') {
    showScreen('end');
    if (!endedShown) {
      endedShown = true;
      if (!confettiDone) { confettiDone = true; confetti(); setTimeout(confetti, 700); }
    }
    renderEnd(s);
  } else {
    showScreen('game');
    renderTopbar(s);
    renderScorebar(s);
    renderCard(s);
    renderPanels(s);
    renderLog(s);
    renderOverlays(s);
    setStatus(s.status);
  }
  renderEvents(s);
  uiPhase = s.phase;
}

function topSig(s) {
  return s.phase + '|' + s.turn + '|' + s.round + '|' + s.rounds + '|' + s.cardInRound + '/' + s.perRound + '|' + (s.blind ? 'b' : '-') + '|' +
    s.teams.map(t => [t.name, t.avatar, t.money, t.count, t.roundCount, (t.cards || []).map(c => c.name).join(',')].join('~')).join('||');
}
function renderTopbar(s) {
  const sig = topSig(s);
  if (sig !== uiTopSig) {
    uiTopSig = sig;
    for (let i = 0; i < 2; i++) {
      const t = s.teams[i];
      const el = $('#pbar' + i);
      if (!el) continue;
      const active = s.phase === 'bidding' && s.turn === i;
      const full = t.roundCount >= CARD_CAP;
      el.className = 'pbar p' + i + (active ? ' active' : '') + (t.money <= 0 ? ' broke' : '') + (full ? ' full' : '');
      const chips = (t.cards || []).map(c =>
        '<div class="pcard">' +
        '<span class="pc-thumb">' + (c.img
          ? '<img src="' + esc(c.img) + '" alt="" loading="lazy" data-fb="' + c.emoji + '" data-fb-cls="pc-fb" />'
          : c.emoji) + '</span>' +
        '<span class="pc-nm">' + esc(c.name) + '</span></div>').join('');
      const badges = [];
      if (full) badges.push('<span class="badge full">🎴 bu tur doldu</span>');
      if (t.money <= 0) badges.push('<span class="badge broke">💸 parasız</span>');
      el.innerHTML =
        '<div class="pbar-top"><span class="pav">' + t.avatar + '</span><span class="pname">' + esc(t.name) + '</span>' + (active ? '<span class="pdot" style="margin-left:auto"></span>' : '') + '</div>' +
        '<div class="pmoney"><small>💰 kalan para</small><span>$' + t.money + '</span></div>' +
        '<div class="pstat">Bu tur: <b>' + t.roundCount + '/' + CARD_CAP + '</b> · Toplam: <b>' + t.count + ' kart</b></div>' +
        (badges.length ? '<div class="badges">' + badges.join('') + '</div>' : '') +
        '<div class="pmini-head">🎴 Alınanlar <b>' + t.count + ' kart</b></div>' +
        (chips ? '<div class="pmini">' + chips + '</div>' : '<div class="pmini empty">henüz kart yok 😅</div>');
    }
  }
  const pill = $('#roundPill');
  if (pill) pill.textContent = (s.blind ? '🎭 KÖR BİD · ' : '') + 'TUR ' + s.round + '/' + s.rounds + ' · KART ' + s.cardInRound + '/' + s.perRound;
}

function renderScorebar(s) {
  const a = s.teams[0].count, b = s.teams[1].count;
  const sig = a + '|' + b;
  if (sig === uiScoreSig) return;
  uiScoreSig = sig;
  const total = a + b || 1;
  const rp = Math.round(a / total * 100);
  const r = $('#pbRed'), bl = $('#pbBlue'), rb = $('#pbRedBar'), bb = $('#pbBlueBar');
  if (r) r.textContent = a + ' 🎴';
  if (bl) bl.textContent = b + ' 🎴';
  if (rb) rb.style.width = rp + '%';
  if (bb) bb.style.width = (100 - rp) + '%';
}

function cardHTML(card, s) {
  const tag = (s && s.pack && s.pack.name) ? s.pack.name : 'KART';
  if (card.hidden) {
    return '<div class="auction-card"><div class="inner">' +
      '<div class="face back"><div class="b-emoji">🎴</div><div class="b-text">SEÇMECE<br>SAVAŞI</div></div>' +
      '<div class="face front army blind-face">' +
      '<div class="bf-ribbon">🎭 KÖR BİD</div>' +
      '<div class="bf-q">❓</div>' +
      '<div class="bf-hint">' + esc(card.hint || 'Gizemli bir kart geliyor') + '</div>' +
      '<div class="f-tag">' + esc(tag) + '</div>' +
      '</div></div></div>';
  }
  const front = card.img
    ? '<img class="f-photo" src="' + esc(card.img) + '" alt="" data-fb="' + card.emoji + '" data-fb-cls="f-emoji" />'
    : '<div class="f-emoji">' + card.emoji + '</div>';
  return '<div class="auction-card"><div class="inner">' +
    '<div class="face back"><div class="b-emoji">🎴</div><div class="b-text">SEÇMECE<br>SAVAŞI</div></div>' +
    '<div class="face front army' + (card.img ? ' photo' : '') + '">' +
    front +
    '<div class="f-name">' + esc(card.name) + '</div>' +
    '<div class="f-tag">' + esc(tag) + '</div>' +
    '</div></div></div>';
}
function renderCard(s) {
  const slot = $('#cardSlot');
  if (!slot) return;
  const card = s.current;
  const inCard = card && (s.phase === 'dealing' || s.phase === 'bidding' || s.phase === 'reveal');
  if (!inCard) {
    if (uiCardKey !== null) { slot.innerHTML = ''; uiCardKey = null; }
    return;
  }
  const ck = String(card.key) + (card.hidden ? ':h' : ':r');
  if (uiCardKey !== ck) {
    uiCardKey = ck;
    slot.innerHTML = cardHTML(card, s);
    const el0 = $('.auction-card', slot);
    if (el0) { void el0.offsetWidth; if (s.phase !== 'dealing') el0.classList.add('flipped'); }
  }
  const el = $('.auction-card', slot);
  if (!el) return;
  el.classList.toggle('flipped', s.phase !== 'dealing');
}

function panelSig(s) {
  const tt = s.teams && s.teams[s.turn] ? s.teams[s.turn] : null;
  const t = tt ? tt.money : 0;
  const c = tt ? tt.roundCount : 0;
  return [s.phase, s.turn,
    s.topBid ? s.topBid.team + ':' + s.topBid.amount : '-', s.trail.length,
    s.passed ? s.passed.join('') : '',
    s.current ? s.current.key : '-',
    s.reveal ? (s.reveal.discarded ? 'd' : (s.reveal.free ? 'f' : '') + s.reveal.team + ':' + s.reveal.amount) : '-',
    t, c].join('|');
}
function renderPanels(s) {
  const sig = panelSig(s);
  if (sig === uiPanelSig) return;
  uiPanelSig = sig;
  const ba = $('#bidArea'), ra = $('#revealArea');
  if (ba) ba.innerHTML = '';
  if (ra) ra.innerHTML = '';
  if (s.phase === 'bidding') renderBidPanel(s, ba);
  else if (s.phase === 'reveal' && s.reveal) renderReveal(s, ra);
}

function trailHTML(s) {
  if (!s.trail.length) return '';
  return '<div class="trail">' + s.trail.map(x => '<span class="tt ' + (x.team ? 'blue' : 'red') + (x.pass ? ' pass' : '') + '">' + (x.team ? '🔵' : '🔴') + ' ' + (x.pass ? 'PAS' : '$' + x.amount) + '</span>').join('') + '</div>';
}
function topBidHTML(s) {
  if (!s.topBid) return '<div class="top-bid"><span class="tb-none">Henüz teklif yok — açılış zorunlu! ✊</span></div>';
  const t = s.teams[s.topBid.team];
  return '<div class="top-bid"><span>En yüksek teklif:</span> <b style="color:' + (s.topBid.team ? 'var(--blue)' : 'var(--red)') + '">' + esc(t ? t.name : '?') + '</b> <span class="tb-amt">$' + s.topBid.amount + '</span></div>';
}
function quickChips(min, max) {
  const vals = [...new Set([min, min + 1, min + 2, min + 5].filter(v => v <= max))].slice(0, 4);
  return vals.map(v => '<button class="qc pc-mini" data-v="' + v + '">$' + v + '</button>').join(' ');
}
function renderBidPanel(s, ba) {
  if (!ba) return;
  const team = s.turn;
  const t = s.teams[team];
  const can = canActTeam(team);
  const opening = !s.topBid;
  const oppT = s.teams[1 - team];
  /* açılışta rakip parasız + kadrosu dolmamışsa "bağış pası" hakkı doğar */
  const giftOpp = !!(opening && oppT && oppT.money <= 0 && oppT.roundCount < CARD_CAP);
  const head = '<div class="bid-head">' + (can ? (opening ? '✊ Açılış sende (zorunlu):' : '🎯 Sıra sende:') : '👀 Sıra:') + ' <span class="who">' + esc(t.name) + '</span></div>';
  const common = head + topBidHTML(s) + trailHTML(s);
  if (s.passed && s.passed[team]) {
    ba.innerHTML = '<div class="bid-panel p' + team + '">' + common + '<div class="wait-panel">⏸️ pas geçti — rakip kararını veriyor…</div></div>';
    return;
  }
  if (t.roundCount >= CARD_CAP) {
    ba.innerHTML = '<div class="bid-panel p' + team + '">' + common + '<div class="wait-panel">🎴 bu tur kadrosu doldu (' + CARD_CAP + '/' + CARD_CAP + ') — otomatik pas geçiyor…</div></div>';
    return;
  }
  if (t.money <= 0) {
    ba.innerHTML = '<div class="bid-panel p' + team + '">' + common + '<div class="wait-panel">💸 parası yok — ' + (opening ? 'açılış rakibe geçiyor…' : 'otomatik pas geçiyor…') + '</div></div>';
    return;
  }
  const top = s.topBid;
  const min = top ? top.amount + 1 : 1;
  const max = t.money;
  if (!can) {
    ba.innerHTML = '<div class="bid-panel p' + team + '">' + common + '<div class="wait-panel">' + (top ? esc(t.name) + ' düşünüyor: karşı artırır mı, pas mı?' : (giftOpp ? esc(t.name) + ' karar veriyor: teklif mi versin, kartı bedavaya rakibe mi bıraksın?' : esc(t.name) + ' açılış teklifini veriyor (zorunlu)…')) + '</div></div>';
    return;
  }
  if (min > max) {
    ba.innerHTML = '<div class="bid-panel p' + team + '">' + common +
      '<div class="bid-note">⚠️ En yüksek teklif <b>$' + top.amount + '</b>, senin bütçen <b>$' + max + '</b> — artıramıyorsun.</div>' +
      '<div class="bid-actions"><button class="btn ghost" id="bPass">✋ PAS</button></div></div>';
    const p0 = $('#bPass', ba);
    if (p0) p0.onclick = () => { sfx('click'); act({ a: 'pass', team: team }); };
    return;
  }
  /* aynı kart & aynı sıra & aynı min: kullanıcının seçtiği tutarı koru (panel yeniden çizilse bile) */
  const draftOk = bidDraft && s.current && bidDraft.key === s.current.key && bidDraft.team === team && bidDraft.min === min;
  const startVal = draftOk ? clamp(bidDraft.val, min, max) : min;
  ba.innerHTML = '<div class="bid-panel p' + team + '">' + common +
    '<div class="bid-main"><button class="step" id="bMinus">−</button><div class="bid-num" id="bVal">$' + startVal + '</div><button class="step" id="bPlus">+</button></div>' +
    '<input type="range" class="bid-slider" id="bRange" min="' + min + '" max="' + max + '" value="' + startVal + '" />' +
    '<div class="bid-note">' + (opening ? (giftOpp ? '🎁 Rakibin parası yok — <b>PAS</b> basarsan kart bedavaya onlara gider, teklif verirsen sen kaparsın! ' : '✊ Açılışta pas yok — en az <b>$' + min + '</b> vermelisin! ') : '') + 'Hızlı artış: ' + quickChips(min, max) + ' · Bütçen: <b>$' + max + '</b></div>' +
    '<div class="bid-actions"><button class="btn primary" id="bBid">' + (opening ? '✊ AÇILIŞI VER' : '🔨 KARŞI ARTIR') + '</button>' + ((opening && !giftOpp) ? '' : '<button class="btn ghost" id="bPass">' + (opening ? '🎁 PAS — rakibe bedava' : '✋ PAS') + '</button>') + '</div></div>';
  let val = startVal;
  const valEl = $('#bVal', ba), range = $('#bRange', ba);
  const setVal = v => {
    val = clamp(v, min, max);
    bidDraft = { key: s.current ? s.current.key : null, team: team, min: min, val: val };
    if (valEl) valEl.textContent = '$' + val;
    if (range) range.value = val;
  };
  const minus = $('#bMinus', ba), plus = $('#bPlus', ba);
  if (minus) minus.onclick = () => { sfx('click'); setVal(val - 1); };
  if (plus) plus.onclick = () => { sfx('click'); setVal(val + 1); };
  if (range) range.oninput = () => setVal(+range.value);
  $$('.qc', ba).forEach(q => { q.onclick = () => { sfx('click'); setVal(+q.dataset.v); }; });
  const bidBtn = $('#bBid', ba), passBtn = $('#bPass', ba);
  if (bidBtn) bidBtn.onclick = () => {
    if (MODE === 'guest') { bidBtn.disabled = true; if (passBtn) passBtn.disabled = true; bidBtn.textContent = '⏳ gönderiliyor…'; }
    act({ a: 'bid', amount: val, team: team });
  };
  if (passBtn) passBtn.onclick = () => {
    if (MODE === 'guest') { passBtn.disabled = true; if (bidBtn) bidBtn.disabled = true; }
    act({ a: 'pass', team: team });
  };
}

function renderReveal(s, ra) {
  if (!ra) return;
  const r = s.reveal;
  if (r.discarded) {
    ra.innerHTML = '<div class="reveal-row"><div class="reveal-bid show"><div class="rb-who">🗑️ ' + esc(r.card.emoji + ' ' + r.card.name) + '</div><div class="rb-sub">kimse istemedi — çöpe gitti</div></div></div>';
    return;
  }
  const t = s.teams[r.team];
  const rc = r.card;
  const chip = '<span class="rb-chip">' + (rc.img
    ? '<img src="' + esc(rc.img) + '" alt="" data-fb="' + rc.emoji + '" data-fb-cls="rb-fb" />'
    : rc.emoji) + esc(rc.name) + '</span>';
  ra.innerHTML = '<div class="reveal-row">' +
    '<div class="reveal-bid p' + r.team + ' winner show">' +
    '<div class="rb-who">' + (t ? t.avatar : '') + ' <b>' + esc(t ? t.name : '') + '</b> ' + (r.free ? 'kaptı!' : 'kazandı!') + (s.blind ? ' 🎭' : '') + '</div>' +
    '<div class="rb-amt">' + (r.free ? (r.gift ? '🎁 BEDAVA (pas hediyesi)' : '🎁 BEDAVA') : '$' + r.amount) + '</div>' +
    '<div class="rb-sub">' + chip + ((t && t.roundCount >= CARD_CAP) ? ' <b class="rb-full">🎴 bu tur doldu!</b>' : '') + '</div>' +
    '</div>' + trailHTML(s) + '</div>';
}

function renderLog(s) {
  const el = $('#logList');
  if (!el) return;
  const sig = s.log.length + '|' + s.log.map(l => l.html).join('\n');
  if (sig === uiLogSig) return;
  uiLogSig = sig;
  el.innerHTML = s.log.map(l => '<div class="log-item ' + (l.cls || '') + (l.gold ? ' gold' : '') + '">' + l.html + '</div>').join('');
  el.scrollTop = el.scrollHeight;
}

function renderOverlays(s) {
  const intro = $('#roundIntro');
  if (s.phase === 'intro') {
    if (uiPhase !== 'intro') {
      const ri = $('#riRound'); if (ri) ri.textContent = 'TUR ' + s.round + '/' + s.rounds;
      const pe = $('#riPackEmoji'); if (pe) pe.textContent = s.pack ? s.pack.emoji : '🎴';
      const pn = $('#riPackName'); if (pn) pn.textContent = s.pack ? String(s.pack.name).toUpperCase() : '';
      const sub = $('#riSub');
      const rb = $('#riBlind');
      if (rb) rb.classList.toggle('hidden', !s.blind);
      if (sub) {
        const opener = (typeof s.openNext === 'number') ? s.openNext : (s.round % 2 === 1 ? 0 : 1);
        const ot = s.teams && s.teams[opener];
        sub.innerHTML = s.blind
          ? '🎭 <b>KÖR BİD:</b> kartlar gizli! Sadece "nereden geldiği" ipucunu göreceksin — içinden efsane de çıkabilir, sıradan biri de. Kazanan kartı açar!<br>💰 Her takıma <b>$' + s.roundMoney + '</b> verildi. İlk kartı <b>' + (ot ? esc(ot.name) : '') + '</b> açar — sonra her kartta sırayla değişir!'
          : '💰 Her takıma <b>$' + s.roundMoney + '</b> verildi. İlk kartı <b>' + (ot ? esc(ot.name) : '') + '</b> açar — sonra her kartta sırayla değişir!<br>Kartlar açık artırmayla satılır — <b>her tur</b> en fazla <b>' + CARD_CAP + ' kart</b> toplanır (tur bitince sayaç sıfırlanır)!';
      }
    }
    if (intro) intro.classList.remove('hidden');
    const go = $('#btnRoundGo'), wEl = $('#riWait');
    if (go) go.classList.toggle('hidden', MODE === 'guest');
    if (wEl) wEl.classList.toggle('hidden', MODE !== 'guest');
  } else if (intro) intro.classList.add('hidden');

  const sum = $('#roundSummary');
  if (s.phase === 'roundEnd') {
    if (uiPhase !== 'roundEnd') {
      const ti = $('#rsTitle'); if (ti) ti.textContent = 'TUR ' + s.round + ' BİTTİ!';
      for (let i = 0; i < 2; i++) {
        const t = s.teams[i];
        const nm = $('#rsName' + i); if (nm) nm.textContent = t.avatar + ' ' + t.name;
        const rg = $('#rsRound' + i); if (rg) rg.textContent = '+' + t.roundCount;
        const rc = $('#rsCards' + i);
        if (rc) rc.innerHTML = (t.roundCards || []).map(c =>
          '<div class="pcard sm"><span class="pc-thumb">' + (c.img
            ? '<img src="' + esc(c.img) + '" alt="" loading="lazy" data-fb="' + c.emoji + '" data-fb-cls="pc-fb" />'
            : c.emoji) + '</span><span class="pc-nm">' + esc(c.name) + '</span></div>').join('') || '<small style="color:var(--mut)">kart yok 😢</small>';
        const tt = $('#rsTotal' + i); if (tt) tt.innerHTML = 'Bu tur: <b>' + t.roundCount + '/' + CARD_CAP + ' kart</b> · Genel: <b>' + t.count + ' kart</b>';
      }
      const nb0 = $('#btnRoundNext');
      if (nb0) nb0.textContent = s.round >= s.rounds ? '🏁 SONUÇLARI GÖR' : 'SONRAKİ TUR ▶';
    }
    if (sum) sum.classList.remove('hidden');
    const nb = $('#btnRoundNext'), wEl = $('#rsWait');
    if (nb) nb.classList.toggle('hidden', MODE === 'guest');
    if (wEl) wEl.classList.toggle('hidden', MODE !== 'guest');
  } else if (sum) sum.classList.add('hidden');
}

function renderEvents(s) {
  const evs = s.events || [];
  if (!evs.length) return;
  let max = lastEventId;
  evs.forEach(e => { if (e.id > lastEventId) toast(e.msg, e.type); if (e.id > max) max = e.id; });
  lastEventId = max;
}

function renderEnd(s) {
  const e = s.endInfo;
  if (!e) return;
  /* Online odada host her 2.5 sn'de durum yolluyor; maç bittiyse vitrini
     baştan çizmeye gerek yok (onlarca fotoğraf yeniden yükleniyordu). */
  const sig = e.counts.join(',') + '|' + s.teams.map(t => t.money + ':' + t.cards.length).join('|');
  if (sig === uiEndSig) return;
  uiEndSig = sig;
  const banner = $('#endBanner');
  if (banner) banner.innerHTML = '🎉 <b>MAÇ BİTTİ!</b><div class="banner-sub">İşte takımların vitrini 🎴</div>';
  for (let i = 0; i < 2; i++) {
    const t = s.teams[i];
    const col = $('#endCol' + i);
    if (!col) continue;
    col.className = 'end-col glass' + (i === 1 ? ' mirror' : '');
    const groups = (e.groups && e.groups[i]) || [];
    col.innerHTML =
      '<div class="end-head">' + t.avatar + ' ' + esc(t.name) + '</div>' +
      '<div class="end-money"><b>' + e.counts[i] + '</b> kart topladı 🎴 · kalan para <b>$' + t.money + '</b></div>' +
      groups.map(g =>
        '<div class="end-group"><div class="eg-title">TUR ' + g.round + ' · ' + g.emoji + ' ' + esc(g.name) + '</div><div class="eg-cards">' +
        g.cards.map(c => '<div class="end-card">' + (c.img
          ? '<img class="ec-img" src="' + esc(c.img) + '" alt="" loading="lazy" data-fb="' + c.emoji + '" data-fb-cls="ec-fb" />'
          : '<span>' + c.emoji + '</span>') + '<span>' + esc(c.name) + '</span></div>').join('') +
        '</div></div>').join('') || '<div class="end-group"><div class="eg-cards"><small style="color:var(--mut)">kart yok 😅</small></div></div>';
  }
  const hint = $('#endHint');
  if (hint) hint.textContent = MODE === 'guest' ? '🌐 Online maç: rövanşı host başlatabilir.' : '';
}

/* ============================================================
   ONLINE ODA (MQTT)
   ============================================================ */
/* mqtt.min.js (~340 KB) artık ilk yüklemede değil, online oda açılırken gelir.
   Böylece site ilk açılışta bu dosyayı indirmek için beklemez. */
let MQTT_PROMISE = null;
function ensureMqtt() {
  if (window.mqtt) return Promise.resolve(true);
  if (MQTT_PROMISE) return MQTT_PROMISE;
  MQTT_PROMISE = new Promise(resolve => {
    const s = document.createElement('script');
    s.src = 'mqtt.min.js';
    s.async = true;
    s.onload = () => resolve(!!window.mqtt);
    s.onerror = () => { MQTT_PROMISE = null; resolve(false); };
    document.head.appendChild(s);
  });
  return MQTT_PROMISE;
}

function setupNet(role, code) {
  NET = new window.Net.Room(role, code);
  NET.onStatus = onNetStatus;
  NET.onMessage = onNetMessage;
  NET.start();
  if (role === 'guest') {
    if (LINK_TIMER) clearInterval(LINK_TIMER);
    LINK_TIMER = setInterval(() => {
      if (MODE !== 'guest') return;
      const dot = $('#connDot');
      if (gameStateSeen && Date.now() - lastHostMsgAt > 12000 && dot) dot.className = 'conn-dot lost';
    }, 4000);
  }
}
function onNetStatus(st) {
  const dot = $('#connDot');
  if (dot) dot.className = 'conn-dot ' + (st === 'ready' ? 'ready' : st === 'connecting' ? 'connecting' : st === 'lost' ? 'lost' : '');
  if (MODE === 'host') {
    if (!G) {
      const lc = $('#lobbyStatus');
      if (st === 'connecting' && lc) lc.innerHTML = '📡 Sunucuya bağlanılıyor…';
      else if (st === 'ready') lobbySetStatus();
      else if (st === 'lost' && lc) lc.innerHTML = '⚠️ Bağlantı koptu — tekrar deneniyor…';
      else if (st === 'error' && lc) lc.innerHTML = '❌ Sunucuya ulaşılamıyor — otomatik tekrar deneniyor…';
    }
  } else if (MODE === 'guest') {
    if (st === 'connecting') setJoinStatus('📡 Bağlanılıyor…');
    else if (st === 'ready') { setJoinStatus('✅ Bağlandı — odaya giriliyor…'); if (!gameStateSeen) startGuestHello(); }
    else if (st === 'lost') setJoinStatus('⚠️ Bağlantı koptu, tekrar deneniyor…');
    else if (st === 'error') setJoinStatus('❌ Bağlantı kurulamadı — internetini kontrol et.');
  }
}
function onNetMessage(m) {
  if (!m) return;
  if (MODE === 'host') {
    if (m.t === 'join') {
      const was = !!GUEST;
      GUEST = {
        name: String(m.name || 'Oyuncu').slice(0, 14),
        avatar: String(m.avatar || '🐻').slice(0, 4),
        teamName: String(m.teamName || '').slice(0, 16) || (S.teamNames[1 - MY_TEAM] || 'Mavi Takım'),
      };
      if (!G) {
        /* misafir 'join' mesajını onay alana kadar tekrarlar → gereksiz toast yapma */
        if (!was) { toast('✅ ' + esc(GUEST.name) + ' odaya katıldı!', 'good'); sfx('lock'); }
        lobbySetStatus();
        broadcastLobby();
      } else {
        toast((was ? '🔄 ' : '✅ ') + esc(GUEST.name) + (was ? ' yeniden bağlandı!' : ' oyuna katıldı!'), 'good');
        push();
      }
    } else if (m.t === 'action') {
      const a = m.action;
      if (!a || !G) return;
      const team = 1 - MY_TEAM;
      if (a.seq != null && a.seq <= G.lastGuestSeq) { G.lastAck = { seq: a.seq, ok: true }; push(); return; }  // zaten işlendi → onay niyetine durumu tekrar yolla
      if (a.seq != null) G.lastGuestSeq = a.seq;
      const ok = canApplyAction(a, team);
      G.lastAck = { seq: a.seq != null ? a.seq : null, ok: ok };
      if (ok) applyAction(a, team);
      push();   // her durumda durumu (ve sonucu) gönder — geçersizse misafir "hamlen yetişmedi" uyarısı görür
    } else if (m.t === 'bye') {
      GUEST = null;
      toast('🚪 Rakip odadan ayrıldı', 'bad');
      if (!G) lobbySetStatus();
    }
  } else if (MODE === 'guest') {
    if (m.t !== 'state' || !m.s) return;
    lastHostMsgAt = Date.now();
    const dot = $('#connDot'); if (dot) dot.className = 'conn-dot ready';
    const s = m.s;
    LAST_S = s;
    if (ACT_PENDING) {
      if (s.ack && s.ack.seq === ACT_PENDING.seq) {
        if (s.ack.ok) ACT_PENDING = null;
        else {
          ACT_PENDING = null;
          toast('⚠️ Hamlen yetişmedi — durum değişti, tekrar dene!', 'bad');
          uiPanelSig = null;
        }
      } else if (s.lastGuestSeq != null && s.lastGuestSeq >= ACT_PENDING.seq) ACT_PENDING = null;
    }
    if (s.phase === 'lobby') {
      hostSeen = true;
      if (s.lobby && s.lobby.guestJoined) {
        /* Host bizi gerçekten gördü → odaya girdik. */
        gameStateSeen = true;
        MY_TEAM = 1 - s.lobby.hostTeam;
        renderGuestLobby(s.lobby);
      } else {
        /* Host henüz bizi görmedi (ilk 'join' kaybolmuş olabilir) → 'join' göndermeye DEVAM et.
           Eskiden burada hemen gameStateSeen=true yapılıyordu ve katılma döngüsü duruyordu;
           ilk mesaj kaybolunca oda "odaya giriliyor…" ekranında takılı kalıyordu. */
        setJoinStatus('📡 Oda bulundu — host seni onaylıyor…');
      }
      return;
    }
    gameStateSeen = true;
    if (s.hostTeam != null && s.hostTeam >= 0) MY_TEAM = 1 - s.hostTeam;
    hideLobby();
    const jr = $('#joinRoom'); if (jr) jr.classList.add('hidden');
    if (!seenGame) {
      seenGame = true;
      lastEventId = 0;
      (s.events || []).forEach(e => { if (e.id > lastEventId) lastEventId = e.id; });
    }
    renderState(s);
  }
}

function cfgFromS() {
  if (!S.selected.length) { toast('⚠️ En az 1 paket seç (Kurulum ekranı)', 'bad'); return null; }
  return { rounds: S.rounds, roundMoney: S.roundMoney, packIds: [...S.selected], teams: localTeams(), blind: S.mode === 'blind' };
}
function localTeams() {
  return [0, 1].map(i => ({ name: S.teamNames[i] || 'Takım ' + (i + 1), avatar: S.teamAvatars[i] || '🦊', members: memberList(S.teamMembers[i]) }));
}
function showLobby() { const el = $('#lobby'); if (el) el.classList.remove('hidden'); }
function hideLobby() { const el = $('#lobby'); if (el) el.classList.add('hidden'); }
function syncTeamPick() {
  const pr = $('#pickRed'), pb = $('#pickBlue');
  if (pr) pr.classList.toggle('on', HOST_TEAM === 0);
  if (pb) pb.classList.toggle('on', HOST_TEAM === 1);
}
function lobbySetStatus() {
  const st = $('#lobbyStatus');
  if (!st) return;
  if (!GUEST) st.innerHTML = '⏳ Arkadaşını bekliyorum…<br><small>O, "ODAYA KATIL"a basıp <b>' + ROOM_CODE + '</b> kodunu girsin.</small>';
  else st.innerHTML = '✅ <b>' + esc(GUEST.name) + '</b> katıldı (' + esc(GUEST.teamName) + ')! Başlatabilirsin! 🎉';
  const bs = $('#btnLobbyStart');
  if (bs) bs.classList.toggle('hidden', !GUEST);
}
function broadcastLobby() { if (MODE === 'host' && NET) NET.send({ t: 'state', s: lobbySnap() }); }

async function hostRoom() {
  const cfg = cfgFromS();
  if (!cfg) return;
  if (!window.Net) { toast('🌐 Online mod bu tarayıcıda desteklenmiyor.', 'bad'); return; }
  MODE = 'host';
  MY_TEAM = HOST_TEAM;
  ROOM_CODE = window.Net.makeCode();
  GUEST = null;
  const lt = $('#lobbyTitle'); if (lt) lt.textContent = '🌐 Oda Kuruldu';
  const cw = $('#lobbyCodeWrap'); if (cw) cw.classList.remove('hidden');
  const lc = $('#lobbyCode'); if (lc) lc.textContent = ROOM_CODE;
  const tp = $('#lobbyTeamPick'); if (tp) tp.classList.remove('hidden');
  const bs = $('#btnLobbyStart'); if (bs) bs.classList.add('hidden');
  const bl = $('#btnLobbyLeave'); if (bl) bl.textContent = '🚪 Kapat';
  syncTeamPick();
  lobbySetStatus();
  showLobby();
  const rc = $('#roomChip'), rce = $('#roomCode');
  if (rc) rc.classList.remove('hidden');
  if (rce) rce.textContent = ROOM_CODE;
  if (NET) { NET.stop(); NET = null; }
  const st = $('#lobbyStatus');
  if (st) st.innerHTML = '📡 Sunucuya bağlanılıyor…';
  const myCode = ROOM_CODE;
  const ok = await ensureMqtt();
  if (MODE !== 'host' || ROOM_CODE !== myCode) return;   // kullanıcı beklerken vazgeçti / yeni oda açtı
  if (!ok) {
    if (st) st.innerHTML = '❌ Online mod için internet bağlantısı gerekiyor. "Kapat"a basıp tekrar dene.';
    toast('🌐 Online mod için internet bağlantısı gerekiyor (MQTT yüklenemedi).', 'bad');
    return;
  }
  setupNet('host', ROOM_CODE);
  if (LOBBY_TIMER) clearInterval(LOBBY_TIMER);
  LOBBY_TIMER = setInterval(() => { if (MODE === 'host' && NET && !G) NET.send({ t: 'state', s: lobbySnap() }); }, 2500);
}
function lobbyStart() {
  if (MODE !== 'host' || !GUEST) return;
  const cfg = cfgFromS();
  if (!cfg) return;
  cfg.teams = [0, 1].map(i => i === MY_TEAM
    ? { name: S.teamNames[i] || 'Takım ' + (i + 1), avatar: S.teamAvatars[i] || '🦊', members: memberList(S.teamMembers[i]) }
    : { name: GUEST.teamName || S.teamNames[i] || 'Takım ' + (i + 1), avatar: GUEST.avatar || '🐻', members: [GUEST.name] });
  hideLobby();
  beginMatch(cfg);
}

function openJoinRoom() {
  if (!window.Net) { toast('🌐 Online mod bu tarayıcıda desteklenmiyor.', 'bad'); return; }
  const el = $('#joinRoom');
  if (el) el.classList.remove('hidden');
  const jc = $('#joinCode'); if (jc) jc.value = '';
  const bg = $('#btnJoinGo'); if (bg) bg.disabled = false;
  setJoinStatus('Kodu host\'tan al — 4 karakter.');
  ensureMqtt();   // kullanıcı kodu yazarken arka planda indir
}
function setJoinStatus(t) { const el = $('#joinStatus'); if (el) el.innerHTML = t; }
async function joinGo() {
  const jc = $('#joinCode');
  const code = (jc ? String(jc.value) : '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  if (code.length !== 4) { setJoinStatus('⚠️ 4 karakterlik oda kodunu gir!'); return; }
  const nameEl = $('#joinName'), avEl = $('#joinAvatar'), tnEl = $('#joinTeamName');
  guestIdentity = {
    name: (nameEl && nameEl.value ? nameEl.value : '').trim().slice(0, 14) || 'Oyuncu',
    avatar: (avEl && avEl.value) || '🐻',
    teamName: (tnEl && tnEl.value ? tnEl.value : '').trim().slice(0, 16) || 'Mavi Takım',
  };
  if (NET) { NET.stop(); NET = null; }
  MODE = 'guest';
  MY_TEAM = null;
  ROOM_CODE = code;
  seenGame = false; gameStateSeen = false; hostSeen = false; lastHostMsgAt = 0;
  setJoinStatus('📡 Odaya bağlanılıyor…');
  const bg = $('#btnJoinGo'); if (bg) bg.disabled = true;
  const rc = $('#roomChip'), rce = $('#roomCode');
  if (rc) rc.classList.remove('hidden');
  if (rce) rce.textContent = code;
  const ok = await ensureMqtt();
  if (MODE !== 'guest' || ROOM_CODE !== code) return;   // kullanıcı beklerken vazgeçti
  if (!ok) {
    setJoinStatus('❌ Online mod için internet bağlantısı gerekiyor. İnternetini kontrol et.');
    if (bg) bg.disabled = false;
    return;
  }
  setupNet('guest', code);
  setTimeout(() => {
    if (MODE === 'guest' && !gameStateSeen) {
      const b = $('#btnJoinGo');
      if (hostSeen) {
        setJoinStatus('📡 <b>' + code + '</b> odasını buldum — host seni onaylıyor… birkaç saniye daha bekle.');
      } else {
        setJoinStatus('⚠️ <b>' + code + '</b> odasına ulaşılamadı. Kodu kontrol et — arkadaşın "ODA KUR"a basmış olmalı.');
        if (b) b.disabled = false;
      }
    }
  }, 9000);
}
function startGuestHello() {
  if (JOIN_TIMER) { clearInterval(JOIN_TIMER); JOIN_TIMER = null; }
  const hello = () => {
    if (MODE !== 'guest' || !NET || gameStateSeen) { if (JOIN_TIMER) { clearInterval(JOIN_TIMER); JOIN_TIMER = null; } return; }
    NET.send({ t: 'join', name: guestIdentity.name, avatar: guestIdentity.avatar, teamName: guestIdentity.teamName });
  };
  hello();
  JOIN_TIMER = setInterval(hello, 2600);
}
function renderGuestLobby(l) {
  const jr = $('#joinRoom'); if (jr) jr.classList.add('hidden');
  const bg = $('#btnJoinGo'); if (bg) bg.disabled = false;
  showLobby();
  const lt = $('#lobbyTitle'); if (lt) lt.textContent = '🌐 Odadasın!';
  const cw = $('#lobbyCodeWrap'); if (cw) cw.classList.remove('hidden');
  const lc = $('#lobbyCode'); if (lc) lc.textContent = l.code || ROOM_CODE;
  const tp = $('#lobbyTeamPick'); if (tp) tp.classList.add('hidden');
  const st = $('#lobbyStatus');
  const myIdx = 1 - l.hostTeam;
  if (st) st.innerHTML = '✅ <b>' + esc(l.hostName) + '</b> odada (' + (l.hostTeam === 0 ? '🔴 1. Takım' : '🔵 2. Takım') + ').<br>Sen: ' + (myIdx === 0 ? '🔴' : '🔵') + ' <b>' + esc(guestIdentity.teamName) + '</b><br>⏳ Host maçı başlatıyor…';
  const bs = $('#btnLobbyStart'); if (bs) bs.classList.add('hidden');
  const bl = $('#btnLobbyLeave'); if (bl) bl.textContent = '🚪 Ayrıl';
}

function exitOnline(silent) {
  if (NET) {
    try { NET.send({ t: 'bye' }); } catch (e) {}
    NET.stop(); NET = null;
  }
  if (LOBBY_TIMER) { clearInterval(LOBBY_TIMER); LOBBY_TIMER = null; }
  if (JOIN_TIMER) { clearInterval(JOIN_TIMER); JOIN_TIMER = null; }
  if (GAME_HB) { clearInterval(GAME_HB); GAME_HB = null; }
  if (LINK_TIMER) { clearInterval(LINK_TIMER); LINK_TIMER = null; }
  MODE = 'local'; MY_TEAM = null; ROOM_CODE = ''; GUEST = null;
  const rc = $('#roomChip'); if (rc) rc.classList.add('hidden');
  hideLobby();
  const jr = $('#joinRoom'); if (jr) jr.classList.add('hidden');
  if (!silent) toast('🚪 Odadan ayrıldın');
}

/* ============================================================
   BAŞLATMA
   ============================================================ */
function fallbackCopy(t, ok) {
  try {
    const i = document.createElement('input');
    i.value = t;
    document.body.appendChild(i);
    i.select();
    document.execCommand('copy');
    i.remove();
    ok();
  } catch (e) { toast('📋 Oda kodu: <b>' + t + '</b>', 'gold'); }
}

function init() {
  loadSetup();
  initSetupUI();
  /* Foto yüklenemezse otomatik emoji'ye düş */
  document.addEventListener('error', e => {
    const img = e.target;
    if (img && img.tagName === 'IMG' && img.dataset && img.dataset.fb) {
      const sp = document.createElement('span');
      sp.className = img.dataset.fbCls || 'img-fb';
      sp.textContent = img.dataset.fb;
      if (img.parentNode) img.parentNode.replaceChild(sp, img);
    }
  }, true);
  const ja = $('#joinAvatar');
  if (ja) ja.innerHTML = AVATARS.map(a => '<option>' + a + '</option>').join('');

  const start = $('#btnStart');
  if (start) start.onclick = () => {
    sfx('click');
    const cfg = cfgFromS();
    if (!cfg) return;
    exitOnline(true);
    MODE = 'local'; MY_TEAM = null;
    beginMatch(cfg);
  };
  const host = $('#btnHost');
  if (host) host.onclick = () => { sfx('click'); hostRoom(); };
  const join = $('#btnJoin');
  if (join) join.onclick = () => { sfx('click'); openJoinRoom(); };
  const jg = $('#btnJoinGo');
  if (jg) jg.onclick = () => { sfx('click'); joinGo(); };
  const jc = $('#btnJoinCancel');
  if (jc) jc.onclick = () => { sfx('click'); if (MODE === 'guest') exitOnline(true); const el = $('#joinRoom'); if (el) el.classList.add('hidden'); };
  const jci = $('#joinCode');
  if (jci) jci.addEventListener('keydown', e => { if (e.key === 'Enter') joinGo(); });
  const bls = $('#btnLobbyStart');
  if (bls) bls.onclick = () => { sfx('click'); lobbyStart(); };
  const bll = $('#btnLobbyLeave');
  if (bll) bll.onclick = () => { sfx('click'); exitOnline(); };
  const pr = $('#pickRed');
  if (pr) pr.onclick = () => { if (MODE !== 'host' || G) return; sfx('click'); HOST_TEAM = 0; MY_TEAM = 0; syncTeamPick(); broadcastLobby(); };
  const pb = $('#pickBlue');
  if (pb) pb.onclick = () => { if (MODE !== 'host' || G) return; sfx('click'); HOST_TEAM = 1; MY_TEAM = 1; syncTeamPick(); broadcastLobby(); };
  const cc = $('#btnCopyCode');
  if (cc) cc.onclick = () => {
    const t = ROOM_CODE || '----';
    const ok = () => toast('📋 Kod kopyalandı: <b>' + t + '</b>', 'good');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, () => fallbackCopy(t, ok));
      else fallbackCopy(t, ok);
    } catch (e) { fallbackCopy(t, ok); }
  };
  const mute = $('#btnMute');
  if (mute) mute.onclick = () => { muted = !muted; mute.textContent = muted ? '🔇' : '🔊'; };
  ['#btnRules1', '#btnRules2'].forEach(id => { const el = $(id); if (el) el.onclick = () => { sfx('click'); const r = $('#rules'); if (r) r.classList.remove('hidden'); }; });
  const rc = $('#btnRulesClose');
  if (rc) rc.onclick = () => { sfx('click'); const r = $('#rules'); if (r) r.classList.add('hidden'); };
  const rgb = $('#btnRoundGo');
  if (rgb) rgb.onclick = () => { goRound(); };
  const rn = $('#btnRoundNext');
  if (rn) rn.onclick = () => { nextRound(); };
  const rm = $('#btnRematch');
  if (rm) rm.onclick = () => {
    sfx('click');
    if (MODE === 'guest') { toast('🔁 Rövanşı host başlatır 🙂', 'gold'); return; }
    if (!G || !G.over) return;
    endedShown = false; confettiDone = false;
    beginMatch(G.cfg);
  };
  const ns = $('#btnNewSetup');
  if (ns) ns.onclick = () => {
    sfx('click');
    exitOnline(true);
    G = null;
    showScreen('setup');
    renderPackGrid();
  };
  const rules = $('#rules');
  if (rules) rules.addEventListener('click', e => { if (e.target === rules) rules.classList.add('hidden'); });
  showScreen('setup');
}
if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', init);
else init();
