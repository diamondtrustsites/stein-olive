/* Stein & Olive bei Karam – animierte Menü-Bildschirme (40" quer, 1920×1080)
   Aufruf: menu/manakish.html?s=1  bzw. ?s=2
   Bilder: menu/img/<id>.webp (freigestellt). Echtes Foto: menu/img/<id>.png (freigestellt) hat Vorrang.
   Test: ?s=1&scene=3&hold=1 zeigt Szene 3 dauerhaft.
   Preise: unten bei price eintragen (z. B. '3,50'). Leer = ohne Preis. */
(function () {
  'use strict';
  const MENU = {
    brand: 'STEIN & OLIVE bei Karam',
    title_de: 'Manakish & Backwaren', title_ar: 'مناقيش ومعجنات',
    manakish: [
      { id: 'zaatar', ar: 'زعتر', de: 'Zaatar', price: '', top: 'zaatar' },
      { id: 'kaese', ar: 'جبنة', de: 'Käse', price: '', top: 'cheese' },
      { id: 'zaatar-kaese', ar: 'زعتر وجبنة', de: 'Zaatar & Käse', price: '', top: 'zaatarcheese' },
      { id: 'tomaten-zwiebeln', ar: 'بندورة وبصل', de: 'Tomaten & Zwiebeln', price: '', top: 'tomato' },
      { id: 'muhammara', ar: 'محمرة', de: 'Muhammara', price: '', top: 'muhammara' },
      { id: 'muhammara-kaese', ar: 'محمرة وجبنة', de: 'Muhammara & Käse', price: '', top: 'muhammaracheese' },
      { id: 'sucuk-kaese', ar: 'سجق وجبنة', de: 'Sucuk & Käse', price: '', top: 'sucuk' },
      { id: 'lahm-bi-ajin', ar: 'لحم بعجين', de: 'Lahm bi Ajin', price: '', top: 'lahm' },
      { id: 'spinat', ar: 'سبانخ', de: 'Spinat', price: '', top: 'spinach' },
    ],
    specials: [
      { id: 'beirut-961', ar: 'بيروت 961', de: 'Beirut 961', price: '', top: 'labneh', d_de: 'Manoushe mit luftigem Rand, Zaatar und cremigem Labneh-Topping.', d_ar: 'منقوشة بحافة هشّة، زعتر ولبنة كريمية من فوق.' },
      { id: 'duplex', ar: 'دوبلكس', de: 'Duplex', price: '', top: 'duplex', d_de: 'Gefüllte Manoushe mit Käse zwischen zwei Teigschichten und Zaatar obendrauf.', d_ar: 'منقوشة محشية جبنة بين طبقتين عجين، وزعتر من فوق.' },
    ],
    pizza: [
      { id: 'lebanese-pizza', ar: 'بيتزا لبنانية', de: 'Lebanese Pizza', price: '', top: 'pizza' },
      { id: 'istanbul-34', ar: 'إسطنبول 34', de: 'Istanbul 34', sub: 'Sucuk & Mozzarella', price: '', top: 'sucuk' },
      { id: 'margherita', ar: 'مارغريتا', de: 'Pizza Margherita', sub: 'Tomatensoße & Mozzarella', price: '', top: 'margherita' },
    ],
    sweet: [
      { id: 'arishe-honig', ar: 'عريشة وعسل', de: 'Arishe & Honig', sub: 'Libanesischer Frischkäse & Honig', price: '', top: 'honey' },
      { id: 'arishe-honig-nutella', ar: 'عريشة وعسل ونوتيلا', de: 'Arishe, Honig & Nutella', sub: 'Libanesischer Frischkäse, Honig & Nutella', price: '', top: 'nutella' },
      { id: 'nutella-banane', ar: 'نوتيلا وموز', de: 'Nutella & Banane', price: '', top: 'banana' },
    ],
    mini: {
      items: [{ id: 'mini-manakish', ar: 'ميني مناقيش', de: 'Mini-Manakish', top: 'zaatar', price: '' }, { id: 'mini-fatayer', ar: 'ميني فطاير', de: 'Mini-Fatayer', top: 'fatayer', price: '' }, { id: 'mini-pizza', ar: 'ميني بيتزا', de: 'Mini-Pizza', top: 'margherita', price: '' }],
      note_de: '12 Stück oder 1 kg · Gemischt oder nach Sorte', note_ar: '12 قطعة أو 1 كيلو · مشكّل أو حسب النوع',
      price12: '', priceKg: '',
    },
  };

  const $ = (q) => document.querySelector(q);
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eur = (p, cls) => (p ? `<span class="pr ${cls || ''}">${esc(p)}<i>€</i></span>` : '');
  const Q = new URLSearchParams(location.search);
  const S = Q.get('s') || '1';

  // Bild: zuerst echtes Foto (png), sonst Grafik (webp)
  const pic = (x, cls) => `<div class="pic ${cls || ''}" data-id="${esc(x.id)}"></div>`;
  function loadPics(root) {
    root.querySelectorAll('.pic[data-id]').forEach((el) => {
      const id = el.dataset.id; const a = new Image();
      a.onload = () => { el.style.backgroundImage = `url('${a.src}')`; };
      a.onerror = () => { const b = new Image(); b.onload = () => { el.style.backgroundImage = `url('${b.src}')`; }; b.src = `img/${id}.webp`; };
      a.src = `img/${id}.png`;
    });
  }
  const ALL = [...MENU.manakish, ...MENU.specials, ...MENU.pizza, ...MENU.sweet, ...MENU.mini.items];
  const by = (id) => ALL.find((x) => x.id === id);

  /* ---------- Szenen ---------- */
  const row = (x, i) => `<div class="mr" style="--i:${i}">${pic(x, 'mt')}<div class="mn"><b>${esc(x.de)}</b><span>${esc(x.ar)}</span></div>${eur(x.price)}</div>`;
  const grp = (de, ar, list, o) => `<section class="mg"><h3>${esc(de)} <b>${esc(ar)}</b></h3>${list.map((x, i) => row(x, i + o)).join('')}</section>`;
  function menuScene() {
    const m = MENU.manakish;
    return { t: 20, cls: 'menu', html: `<div class="mcols">
      <div class="mc">${grp('Manakish', 'مناقيش', m.slice(0, 5), 0)}</div>
      <div class="mc">${grp('Manakish', 'مناقيش', m.slice(5), 5)}${grp('Spezialitäten', 'خاص من بيت كرم', MENU.specials, 9)}</div>
      <div class="mc">${grp('Pizza', 'بيتزا', MENU.pizza, 11)}${grp('Süße Manakish', 'مناقيش حلوة', MENU.sweet, 14)}</div>
    </div>
    <div class="mfoot"><b>Mini-Gebäck & Salé</b> · ${esc(MENU.mini.note_de)} <span class="ar">ميني مناقيش · فطاير · بيتزا — ${esc(MENU.mini.note_ar)}</span>${MENU.mini.price12 ? eur(MENU.mini.price12) : ''}</div>` };
  }
  function heroScene(x, kick, kick_ar) {
    return { t: 10, cls: 'hero', html: `<div class="hz">
      <div class="hpic">${pic(x, 'hp')}<div class="steam"><i></i><i></i><i></i></div></div>
      <div class="htx"><span class="kk">${esc(kick)} · ${esc(kick_ar)}</span>
        <h2>${esc(x.de)}</h2><b class="ar">${esc(x.ar)}</b>
        ${x.sub ? `<p>${esc(x.sub)}</p>` : ''}${x.d_de ? `<p>${esc(x.d_de)}</p><p class="ar">${esc(x.d_ar)}</p>` : ''}
        ${eur(x.price, 'badge')}</div></div>` };
  }
  function trioScene(de, ar, list, note) {
    return { t: 11, cls: 'trio', html: `<h2 class="tt">${esc(de)} <b>${esc(ar)}</b></h2>
      <div class="tr">${list.map((x, i) => `<div class="ti" style="--i:${i}">${pic(x, 'tp')}<b>${esc(x.de)}</b><span class="ar">${esc(x.ar)}</span>${x.sub ? `<small>${esc(x.sub)}</small>` : ''}${eur(x.price, 'badge sm')}</div>`).join('')}</div>
      ${note ? `<div class="tn">${note}</div>` : ''}` };
  }
  const brandScene = () => ({ t: 8, cls: 'brand', html: `<img src="../logo.png" alt=""><h2>Frisch aus dem Ofen</h2><b class="ar">طازة من الفرن، كل يوم</b><div class="url">stein-olive.de</div><p>Online bestellen · Lieferung zu dir · اطلب أونلاين ومنوصّلك</p>` });

  const H = (id, a, b) => heroScene(by(id), a, b);
  const SP = ['Spezialität des Hauses', 'خاص من بيت كرم'];
  const seq = [
    menuScene(),
    H('beirut-961', ...SP),
    trioScene('Pizza', 'بيتزا', MENU.pizza),
    H('istanbul-34', 'Pizza-Tipp', 'جرّب'),
    menuScene(),
    H('duplex', ...SP),
    trioScene('Süße Manakish', 'مناقيش حلوة', MENU.sweet),
    H('arishe-honig-nutella', 'Süß & warm', 'حلو وسخن'),
    menuScene(),
    trioScene('Mini-Gebäck & Salé', 'معجنات صغيرة', MENU.mini.items, `<b>${esc(MENU.mini.note_de)}</b><span class="ar">${esc(MENU.mini.note_ar)}</span>`),
    H('zaatar', 'Der Klassiker', 'الأصلي'),
    trioScene('Klassiker', 'الكلاسيكيات', [by('kaese'), by('zaatar-kaese'), by('sucuk-kaese')]),
    H('lahm-bi-ajin', 'Herzhaft', 'للجوعانين'),
    brandScene(),
  ];
  // Bildschirm 2 läuft versetzt, damit beide nie dasselbe zeigen
  let n = Q.has('scene') ? +Q.get('scene') : (S === '2' ? 2 : 0);

  document.body.innerHTML = `<div class="tv">
    <header class="hd"><img src="../logo.png" alt=""><div><span class="br">${esc(MENU.brand)}</span><h1>${esc(MENU.title_de)} <small>${esc(MENU.title_ar)}</small></h1></div><div class="bar" id="bar"><i></i></div></header>
    <main id="st"></main>
    <div class="tick"><div class="tk">${Array(3).fill('<span>Frisch aus dem Ofen</span><i>✦</i><span>طازة من الفرن</span><i>✦</i><span>Online bestellen · stein-olive.de</span><i>✦</i><span>اطلب أونلاين ومنوصّلك</span><i>✦</i>').join('')}</div></div>
  </div>`;
  const st = $('#st'), bar = $('#bar i');
  function show() {
    const sc = seq[n % seq.length]; n++;
    const old = st.firstElementChild; if (old) { old.classList.add('out'); setTimeout(() => old.remove(), 700); }
    const el = document.createElement('section'); el.className = `sc ${sc.cls}`; el.innerHTML = sc.html; st.appendChild(el); loadPics(el);
    bar.style.transition = 'none'; bar.style.width = '0'; void bar.offsetWidth; bar.style.transition = `width ${sc.t}s linear`; bar.style.width = '100%';
    if (sc.cls === 'menu') { const rows = [...el.querySelectorAll('.mr')]; let k = 0; el._t = setInterval(() => { rows.forEach((r) => r.classList.remove('hl')); rows[k++ % rows.length].classList.add('hl'); }, 1600); }
    if (old && old._t) clearInterval(old._t);
    if (!Q.has('hold')) setTimeout(show, sc.t * 1000);
  }
  show();
  setTimeout(() => location.reload(), 3600 * 1000);
})();
