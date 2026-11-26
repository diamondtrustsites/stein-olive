/* Stein & Olive bei Karam – animierte Menü-Bildschirme (40" quer, 1920×1080)
   Aufruf: menu/manakish.html?s=1  bzw. ?s=2
   Fotos: Datei unter menu/img/<id>.jpg ablegen (quadratisch, weißer oder heller Hintergrund). Fehlt das Foto, wird eine Zeichnung gezeigt.
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
      items: [{ id: 'mini-manakish', ar: 'ميني مناقيش', de: 'Mini-Manakish', top: 'zaatar' }, { id: 'mini-fatayer', ar: 'ميني فطاير', de: 'Mini-Fatayer', top: 'fatayer' }, { id: 'mini-pizza', ar: 'ميني بيتزا', de: 'Mini-Pizza', top: 'margherita' }],
      note_de: '12 Stück oder 1 kg · Gemischt oder nach Sorte', note_ar: '12 قطعة أو 1 كيلو · مشكّل أو حسب النوع',
      price12: '', priceKg: '',
    },
  };

  const $ = (s) => document.querySelector(s);
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eur = (p) => (p ? `<span class="pr">${esc(p)}<i>€</i></span>` : '');

  /* ---------- Zeichnung, solange kein Foto da ist ---------- */
  const R = (seed) => { let x = seed * 9301 + 49297; return () => ((x = (x * 9301 + 49297) % 233280) / 233280); };
  const TOP = {
    zaatar: [['#5C6B2E', 70, 3.2], ['#7E8A3A', 40, 2.4], ['#3F4A1F', 25, 2]],
    cheese: [['#FFF3D6', 26, 9], ['#F3DFA8', 14, 7]],
    zaatarcheese: [['#FFF3D6', 16, 9], ['#5C6B2E', 55, 3]],
    tomato: [['#C8402F', 14, 8], ['#E9D3E8', 10, 6], ['#9B2E22', 10, 4]],
    muhammara: [['#B5432A', 60, 5], ['#8E2E1B', 30, 3]],
    muhammaracheese: [['#FFF3D6', 14, 9], ['#B5432A', 45, 4]],
    sucuk: [['#9C2B23', 12, 9], ['#FFF0C9', 16, 8]],
    lahm: [['#7A3B26', 60, 4.5], ['#B5432A', 30, 3], ['#5C6B2E', 10, 2]],
    spinach: [['#2F5A27', 50, 6], ['#4F7A33', 30, 4]],
    labneh: [['#FFFFFF', 10, 14], ['#5C6B2E', 60, 2.6], ['#A8B34A', 8, 3]],
    duplex: [['#5C6B2E', 80, 2.6], ['#E7C27A', 14, 6]],
    pizza: [['#C8402F', 12, 8], ['#FFF3D6', 16, 8], ['#2F5A27', 10, 4]],
    margherita: [['#FFF3D6', 9, 13], ['#2F7A2F', 6, 6]],
    honey: [['#FFFFFF', 12, 11], ['#E5A322', 26, 4]],
    nutella: [['#4B2A18', 18, 9], ['#FFFFFF', 8, 9], ['#E5A322', 14, 3]],
    banana: [['#4B2A18', 14, 9], ['#F6E39A', 12, 8]],
    fatayer: [['#2F5A27', 8, 6]],
  };
  function draw(item, seed) {
    const r = R(seed + 7); const t = TOP[item.top] || TOP.zaatar; let dots = '';
    t.forEach(([c, n, s]) => { for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 68; dots += `<circle cx="${(100 + Math.cos(a) * d).toFixed(1)}" cy="${(100 + Math.sin(a) * d).toFixed(1)}" r="${(s * (0.6 + r() * 0.7)).toFixed(1)}" fill="${c}" opacity="${(0.75 + r() * 0.25).toFixed(2)}"/>`; } });
    const fat = item.top === 'fatayer';
    const dough = fat ? `<path d="M100 22 L178 162 L22 162 Z" fill="url(#g${seed})" stroke="#B9813F" stroke-width="3" stroke-linejoin="round"/>` : `<circle cx="100" cy="100" r="86" fill="url(#g${seed})"/><circle cx="100" cy="100" r="76" fill="#E7B66B" opacity=".35"/>`;
    return `<svg viewBox="0 0 200 200" class="ill" aria-hidden="true"><defs><radialGradient id="g${seed}" cx="45%" cy="40%" r="70%"><stop offset="0" stop-color="#F6D49A"/><stop offset=".75" stop-color="#E2A85B"/><stop offset="1" stop-color="#B9813F"/></radialGradient></defs>
      <ellipse cx="100" cy="186" rx="80" ry="9" fill="#000" opacity=".25"/>${dough}<g clip-path="${fat ? '' : ''}">${fat ? '' : dots}</g></svg>`;
  }
  // Foto wenn vorhanden, sonst Zeichnung
  let seed = 1;
  function pic(item, cls) {
    const s = seed++;
    return `<div class="pic ${cls || ''}" data-img="img/${esc(item.id)}.jpg">${draw(item, s)}</div>`;
  }
  function loadPhotos(root) {
    root.querySelectorAll('.pic[data-img]').forEach((el) => {
      const src = el.dataset.img; const im = new Image();
      im.onload = () => { el.classList.add('photo'); el.style.backgroundImage = `url('${src}')`; el.innerHTML = ''; };
      im.src = src;
    });
  }

  /* ---------- Bildschirm 1: Manakish-Karte + wechselnde Spezialität ---------- */
  function screen1() {
    const m = MENU.manakish;
    $('#app').innerHTML = `
      <div class="b1">
        <header class="hd"><img src="../logo.png" alt=""><div class="ttl"><span class="br">${esc(MENU.brand)}</span><h1>${esc(MENU.title_de)}<small>${esc(MENU.title_ar)}</small></h1></div></header>
        <section class="list">
          <h2><span>Manakish</span><b>مناقيش</b></h2>
          <div class="grid">${m.map((it, i) => `<div class="row" style="--i:${i}">${pic(it, 'th')}<div class="nm"><b>${esc(it.de)}</b><span>${esc(it.ar)}</span></div>${eur(it.price)}</div>`).join('')}</div>
        </section>
        <aside class="hero" id="hero"></aside>
        <div class="tick"><div class="tk">${Array(3).fill(`<span>Frisch aus dem Ofen</span><i>✦</i><span>طازة من الفرن</span><i>✦</i><span>Online bestellen · stein-olive.de</span><i>✦</i><span>اطلب أونلاين</span><i>✦</i>`).join('')}</div></div>
      </div>`;
    loadPhotos($('#app'));
    const rows = [...document.querySelectorAll('.row')];
    let k = 0; setInterval(() => { rows.forEach((r) => r.classList.remove('hl')); rows[k % rows.length].classList.add('hl'); k++; }, 2200);
    const heroes = [...MENU.specials.map((x) => ({ ...x, tag: 'Spezialität des Hauses', tag_ar: 'خاص من بيت كرم' })), ...m.slice(0, 3).map((x) => ({ ...x, tag: 'Klassiker', tag_ar: 'الكلاسيكي' }))];
    let h = 0;
    const showHero = () => {
      const x = heroes[h++ % heroes.length];
      const el = $('#hero');
      el.innerHTML = `<div class="hcard"><div class="steam"><i></i><i></i><i></i></div>${pic(x, 'big')}<div class="htx"><span class="tag">${esc(x.tag)} · ${esc(x.tag_ar)}</span><h3>${esc(x.de)}</h3><b class="ar">${esc(x.ar)}</b>${x.d_de ? `<p>${esc(x.d_de)}</p><p class="ar">${esc(x.d_ar)}</p>` : ''}${eur(x.price)}</div></div>`;
      loadPhotos(el);
    };
    showHero(); setInterval(showHero, 9000);
  }

  /* ---------- Bildschirm 2: Szenen wie bei großen Ketten, laufen nacheinander und wiederholen sich ---------- */
  function screen2() {
    const sp = MENU.specials, mn = MENU.mini;
    const scenes = [
      () => `<div class="sc s-sp"><div class="kick">Spezialitäten des Hauses · خاص من بيت كرم</div><div class="duo">${sp.map((x, i) => `<div class="sp" style="--i:${i}">${pic(x, 'big')}<h3>${esc(x.de)}</h3><b class="ar">${esc(x.ar)}</b><p>${esc(x.d_de)}</p><p class="ar">${esc(x.d_ar)}</p>${eur(x.price)}</div>`).join('')}</div></div>`,
      () => cards('Pizza', 'بيتزا', MENU.pizza, 'red'),
      () => cards('Süße Manakish', 'مناقيش حلوة', MENU.sweet, 'gold'),
      () => `<div class="sc s-mini"><div class="kick">Mini-Gebäck & Salé · معجنات صغيرة</div><div class="minis">${mn.items.map((x, i) => `<div class="mi" style="--i:${i}">${pic(x, 'mid')}<b>${esc(x.de)}</b><span class="ar">${esc(x.ar)}</span></div>`).join('')}</div>
         <div class="mnote"><b>${esc(mn.note_de)}</b><span class="ar">${esc(mn.note_ar)}</span>${mn.price12 || mn.priceKg ? `<div class="mp">${mn.price12 ? `<span>12 Stk ${eur(mn.price12)}</span>` : ''}${mn.priceKg ? `<span>1 kg ${eur(mn.priceKg)}</span>` : ''}</div>` : ''}</div></div>`,
      () => `<div class="sc s-brand"><img src="../logo.png" alt=""><h2>Frisch aus dem Ofen</h2><b class="ar">طازة من الفرن، كل يوم</b><div class="url">stein-olive.de</div><p>Online bestellen · Lieferung zu dir · اطلب أونلاين ومنوصّلك</p></div>`,
    ];
    function cards(de, ar, list, tone) {
      return `<div class="sc s-cards ${tone}"><div class="kick">${esc(de)} · ${esc(ar)}</div><div class="cards">${list.map((x, i) => `<div class="cd" style="--i:${i}">${pic(x, 'mid')}<h3>${esc(x.de)}</h3><b class="ar">${esc(x.ar)}</b>${x.sub ? `<p>${esc(x.sub)}</p>` : ''}${eur(x.price)}</div>`).join('')}</div></div>`;
    }
    $('#app').innerHTML = `<div class="b2"><header class="hd sm"><img src="../logo.png" alt=""><div class="ttl"><span class="br">${esc(MENU.brand)}</span><h1>${esc(MENU.title_de)}<small>${esc(MENU.title_ar)}</small></h1></div><div class="dots" id="dots">${scenes.map(() => '<i></i>').join('')}</div></header><main class="stage" id="stage"></main></div>`;
    let n = 0;
    const next = () => {
      const st = $('#stage'); const i = n++ % scenes.length;
      st.innerHTML = scenes[i](); loadPhotos(st);
      document.querySelectorAll('#dots i').forEach((d, j) => d.classList.toggle('on', j === i));
    };
    next(); setInterval(next, 11000);
  }

  const s = new URLSearchParams(location.search).get('s') || '1';
  document.documentElement.dataset.s = s;
  if (s === '2') screen2(); else screen1();
  // einmal pro Stunde neu laden (neue Preise/Fotos)
  setTimeout(() => location.reload(), 3600 * 1000);
})();
