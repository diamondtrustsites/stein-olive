/* Stein & Olive – Personalbereich: Admin, Geschäfte, Lager, Scanner, Berichte, Fahrer */
(function () {
'use strict';
const { sb, S, esc, money, fq, $, $$, toast, modal, closeModal, L, fmtDate, ALLERGENS, DAYS, receiptHtml, DOMAIN, ic, bgImg, safeUrl } = App;
const SI = (t) => App.shopIc(t, 's');
const A = (ar, de) => S.lang === 'ar' ? ar : de;
const ST = { orders: [], drivers: [], seen: null, ch: null, poll: null, sound: localStorage.getItem('so_sound') === '1', kds: false, tab: 'active', shopSel: null, geo: null, geoLast: 0, scanStop: null };

const STATUS = { new: ['جديد', 'Neu', 'warn'], preparing: ['قيد التحضير', 'In Zubereitung', 'be'], ready: ['جاهز', 'Fertig', 'ok'], on_way: ['بالطريق', 'Unterwegs', 'be'], delivered: ['تم التوصيل', 'Geliefert', 'ok'], picked_up: ['تم الاستلام', 'Abgeholt', 'ok'], cancelled: ['ملغي', 'Storniert', 'bad'], rejected: ['مرفوض', 'Abgelehnt', 'bad'] };
const stPill = s => `<span class="pill ${STATUS[s][2]}">${esc(A(STATUS[s][0], STATUS[s][1]))}</span>`;
const PAY = { cash: ['كاش', 'Bar'], card: ['بطاقة', 'Karte'], paypal: ['PayPal', 'PayPal'], transfer: ['تحويل بنكي', 'Überweisung'], stripe: ['بطاقة أونلاين', 'Karte online'] };
const err = e => toast(App.errMsg(e), 1);

/* ---------- eigene App auf dem Startbildschirm: Team (/team/) und Fahrer (/fahrer/) ---------- */
let instEvt = null;
const appKind = () => document.documentElement.getAttribute('data-app');
const isStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); if (appKind()) instEvt = e; });
window.addEventListener('appinstalled', () => { instEvt = null; $$('[data-inst]').forEach(b => b.remove()); });
function instBtn(kind) {
  if (isStandalone() && appKind() === kind) return '';
  const lab = kind === 'fahrer' ? A('ضيف تطبيق السائق للشاشة الرئيسية', 'Fahrer-App zum Startbildschirm') : A('ضيف تطبيق الإدارة للشاشة الرئيسية', 'Team-App zum Startbildschirm');
  return `<button class="btn s o" data-inst="${kind}">${ic('plus', 's')} ${esc(lab)}</button>`;
}
function bindInst(root) {
  $$('[data-inst]', root || document).forEach(b => b.onclick = async () => {
    const kind = b.dataset.inst;
    if (appKind() !== kind) { // zuerst auf die eigene Seite der App wechseln, dort kann man sie installieren
      sessionStorage.setItem('so_inst', kind);
      location.href = new URL(kind + '/', document.baseURI).href + (kind === 'fahrer' ? '#/driver' : '#/team'); return;
    }
    if (instEvt) { const ev = instEvt; instEvt = null; ev.prompt(); try { await ev.userChoice; } catch (_) {} return; }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    modal(`<button class="ib x" data-close>${ic('x')}</button><h3>${esc(A('ضيف التطبيق للشاشة الرئيسية', 'Zum Startbildschirm hinzufügen'))}</h3>
      <p>${esc(ios ? A('بـ Safari: اكبس على زر المشاركة تحت، وبعدين «إلى الشاشة الرئيسية».', 'In Safari unten auf „Teilen“ tippen, dann „Zum Home-Bildschirm“.')
        : A('اكبس على النقاط التلاتة (⋮) فوق بـ Chrome، وبعدين «App installieren» أو «Zum Startbildschirm hinzufügen».', 'Oben in Chrome auf ⋮ tippen, dann „App installieren“ bzw. „Zum Startbildschirm hinzufügen“.'))}</p>
      <p class="note">${esc(A('إذا مكتوب إنو التطبيق محمّل: احذف أيقونات Stein & Olive القديمة من الشاشة الرئيسية وجرّب مرة تانية.', 'Steht dort „bereits installiert“: alte Stein-&-Olive-Symbole vom Startbildschirm löschen und nochmal versuchen.'))}</p>`);
  });
  if (sessionStorage.getItem('so_inst') === appKind()) { sessionStorage.removeItem('so_inst'); const b = $(`[data-inst="${appKind()}"]`, root || document); if (b) { b.classList.remove('o'); toast(A('اكبس الزر مرة تانية لتضيف التطبيق', 'Tippe nochmal auf den Knopf, um die App hinzuzufügen')); } }
}

/* ---------- auth ---------- */
async function session() {
  const { data } = await sb.auth.getSession();
  if (!data.session) { S.staff = null; return null; }
  if (S.staff && S.staff.user_id === data.session.user.id) return S.staff;
  const { data: st } = await sb.from('staff').select('*').eq('user_id', data.session.user.id).maybeSingle();
  S.staff = st && st.active ? st : null;
  return S.staff;
}
async function vLogin() {
  document.body.classList.add('staff');
  document.body.classList.remove('tvmode');
  $('#app').innerHTML = `<main class="login-wrap"><div class="login-card">
    <img class="login-logo" src="logo-dark.png" alt="Stein & Olive">
    <div class="login-hd"><h1>${esc(appKind() === 'fahrer' ? A('دخول السائق', 'Fahrer-Login') : A('دخول الفريق', 'Team-Login'))}</h1><button class="ib" id="llang">${esc(App.t('lang'))}</button></div>
    <p class="note">${esc(A('اختار حسابك واكتب كلمة السر.', 'Konto wählen und Passwort eingeben.'))}</p>
    <div class="acc-pick" id="lacc" role="radiogroup" aria-label="Konto"><div class="note">…</div></div>
    <label class="f"><span>${esc(A('كلمة السر', 'Passwort'))}</span><input type="password" id="lp" autocomplete="current-password" maxlength="200"></label>
    <button class="btn full" id="lb">${esc(A('دخول', 'Anmelden'))}</button>
    <button class="lnk" id="lman" style="display:block;margin:14px auto 0">${esc(A('دخول باسم المستخدم', 'Mit Benutzername anmelden'))}</button>
    <label class="f" id="luw" hidden><span>${esc(A('اسم المستخدم', 'Benutzername'))}</span><input type="text" id="lu" autocapitalize="off" autocomplete="username" maxlength="120"></label>
  </div></main>`;
  $('#llang').onclick = () => { App.setLang(S.lang === 'ar' ? 'de' : 'ar'); vLogin(); };
  let sel = localStorage.getItem('so_last_staff') || '';
  const roleIc = { admin: 'key', shop: 'store', driver: 'truck' };
  const label = a => a.r === 'admin' ? A('الإدارة', 'Verwaltung') : a.r === 'driver' ? (A('سائق', 'Fahrer') + (a.n && !/^fahrer$/i.test(a.n) ? ' · ' + a.n : '')) : (L(App.shopById(a.s) || {}, 'name') || a.n || a.u);
  const sub = a => a.r === 'admin' ? 'Admin' : a.r === 'driver' ? A('تطبيق السائق', 'Fahrer-App') : A('محل', 'Geschäft');
  const { data, error } = await sb.rpc('staff_logins');
  const all = (!error && Array.isArray(data)) ? data : [];
  // Fahrer-App: nur Fahrer-Konten. Team-App: Verwaltung und Geschäfte (Fahrer haben ihre eigene App).
  const list = appKind() === 'fahrer' ? all.filter(a => a.r === 'driver') : appKind() === 'team' ? all.filter(a => a.r !== 'driver') : all;
  const box = $('#lacc'); if (!box) return;
  if (!list.length) { box.hidden = true; $('#luw').hidden = false; $('#lman').hidden = true; }
  else {
    if (!list.some(a => a.u === sel)) sel = '';
    box.innerHTML = list.map(a => `<button type="button" role="radio" aria-checked="${a.u === sel}" class="acc-opt${a.u === sel ? ' on' : ''}" data-u="${esc(a.u)}">${ic(roleIc[a.r] || 'user')}<span><b>${esc(label(a))}</b><small>${esc(sub(a))}</small></span></button>`).join('');
    $$('.acc-opt', box).forEach(b => b.onclick = () => { sel = b.dataset.u; $$('.acc-opt', box).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); }); $('#lp').focus(); });
  }
  $('#lman').onclick = () => { $('#luw').hidden = false; $('#lman').hidden = true; $('#lu').focus(); };
  const go = async () => {
    let u = !$('#luw').hidden && $('#lu').value.trim() ? App.clean($('#lu').value, 120).toLowerCase() : sel;
    if (!u) return toast(A('اختار الحساب أول شي.', 'Bitte zuerst ein Konto wählen.'), 1);
    if (!$('#lp').value) return toast(A('اكتب كلمة السر.', 'Bitte Passwort eingeben.'), 1);
    if (!App.allow('stafflogin', 5, 60)) return;
    const email = u.includes('@') ? u : u + DOMAIN;
    $('#lb').disabled = true;
    const { error } = await sb.auth.signInWithPassword({ email, password: $('#lp').value });
    $('#lb').disabled = false;
    if (error) { $('#lp').classList.add('bad'); $('#lp').select(); return toast(A('كلمة السر غلط.', 'Passwort falsch.'), 1); }
    S.staff = null; const st = await session();
    if (!st) { await sb.auth.signOut(); return toast(A('الحساب غير مفعّل', 'Konto nicht freigeschaltet'), 1); }
    if (appKind() === 'team' && st.role === 'driver') { await sb.auth.signOut({ scope: 'local' }); S.staff = null; return toast(A('السواق إلو تطبيق لحالو: stein-olive.de/fahrer', 'Fahrer nutzen die Fahrer-App: stein-olive.de/fahrer'), 1); }
    if (appKind() === 'fahrer' && st.role !== 'driver') { await sb.auth.signOut({ scope: 'local' }); S.staff = null; return toast(A('هاد تطبيق السواقين بس. الإدارة والمحلات من تطبيق الفريق.', 'Nur für Fahrer. Verwaltung und Geschäfte nutzen die Team-App.'), 1); }
    try { localStorage.setItem('so_last_staff', u.replace(DOMAIN, '')); } catch (_) {}
    location.hash = st.role === 'driver' ? '#/driver' : '#/admin/orders';
  };
  $('#lb').onclick = go; $('#lp').onkeydown = e => { if (e.key === 'Enter') go(); };
}
async function logout() { stopLive(); stopGeo(); await sb.auth.signOut({ scope: 'local' }); S.staff = null; location.hash = '#/team'; }

/* ---------- layout ---------- */
const MENU = [
  ['orders', 'inbox', 'الطلبات', 'Bestellungen', ['admin', 'shop']],
  ['ai', 'chat', 'المساعد الذكي', 'KI-Assistent', ['admin']],
  ['products', 'tag', 'المنتجات', 'Produkte', ['admin', 'shop']],
  ['stock', 'box', 'المخزون', 'Lager', ['admin', 'shop']],
  ['scan', 'scan', 'الماسح (Scanner)', 'Scanner', ['admin', 'shop']],
  ['reports', 'chart', 'التقارير', 'Berichte', ['admin', 'shop']],
  ['shops', 'store', 'المحلات', 'Geschäfte', ['admin', 'shop']],
  ['customers', 'user', 'الزبائن', 'Kunden', ['admin']],
  ['coupons', 'tag', 'كوبونات الخصم', 'Gutscheine', ['admin', 'shop']],
  ['suppliers', 'truck', 'الموردين', 'Lieferanten', ['admin', 'shop']],
  ['reviews', 'star', 'التقييمات', 'Bewertungen', ['admin', 'shop']],
  ['staff', 'users', 'الموظفين والسائقين', 'Personal & Fahrer', ['admin']],
  ['settings', 'settings', 'الإعدادات', 'Einstellungen', ['admin']],
  ['screens', 'tv', 'شاشات المنيو', 'Menü-Bildschirme', ['admin', 'shop']],
  ['account', 'key', 'حسابي', 'Mein Konto', ['admin', 'shop', 'driver']]
];
function shell(sec, inner) {
  document.body.classList.add('staff');
  const r = S.staff.role; const items = MENU.filter(m => m[4].includes(r));
  const cur = items.find(m => m[0] === sec) || items[0];
  $('#app').innerHTML = `<header class="top noprint"><div class="in"><button class="ib" id="amenu" aria-label="Menü">${ic('menu')}</button>
     <b style="font-size:17px;display:inline-flex;gap:8px;align-items:center">${ic(cur[1])} ${esc(A(cur[2], cur[3]))}</b><div class="sp"></div>
     <span class="note" style="display:none" id="liveDot">●</span>
     <button class="ib" id="alang">${esc(App.t('lang'))}</button></div></header>
    ${instBtn('team') && localStorage.getItem('so_inst_hide') !== '1' ? `<div class="wrap noprint instbar"><div class="card" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 12px;margin:10px 0 0">${instBtn('team')}<div class="sp" style="flex:1"></div><button class="ib" id="instX" aria-label="${esc(A('إخفاء', 'Ausblenden'))}">${ic('x')}</button></div></div>` : ''}
    <main class="wrap enter" id="amain">${inner || ''}</main>`;
  aiFab();
  bindInst($('.instbar')); if ($('#instX')) $('#instX').onclick = () => { localStorage.setItem('so_inst_hide', '1'); const b = $('.instbar'); if (b) b.remove(); };
  $('#alang').onclick = () => { App.setLang(S.lang === 'ar' ? 'de' : 'ar'); App.route(); };
  $('#amenu').onclick = () => {
    const d = document.createElement('div'); d.className = 'drawer';
    d.innerHTML = `<div class="pn"><div class="who"><img src="logo.png" alt=""><div style="font-size:14px">${esc(S.staff.name || S.staff.username)} • ${esc(r === 'admin' ? 'Admin' : r === 'shop' ? L(App.shopById(S.staff.shop_id) || {}, 'name') : A('سائق', 'Fahrer'))}</div></div>
      ${items.map(m => `<a href="#/admin/${m[0]}" class="${m[0] === sec ? 'on' : ''}">${ic(m[1])} ${esc(A(m[2], m[3]))}</a>`).join('')}
      <hr>${r === 'driver' ? '' : `<div style="padding:4px 0 8px">${instBtn('team')}</div>`}<a href="#/">${ic('globe')} ${esc(A('الموقع', 'Zur Website'))}</a><button class="m" id="lo">${ic('logout')} ${esc(A('خروج', 'Abmelden'))}</button></div>`;
    d.onclick = e => { if (e.target === d || e.target.closest('a')) d.remove(); };
    document.body.appendChild(d); $('#lo', d).onclick = logout; bindInst(d);
  };
  return $('#amain');
}
function myShops() { return S.staff.role === 'admin' ? S.shops : S.shops.filter(s => s.id === S.staff.shop_id); }
function shopPicker(onChange) {
  const list = myShops();
  if (!ST.shopSel || !list.some(s => s.id === ST.shopSel)) ST.shopSel = (list[0] || {}).id;
  if (list.length < 2) return '';
  setTimeout(() => { const el = $('#shopSel'); if (el) el.onchange = () => { ST.shopSel = el.value; onChange(); }; });
  return `<select id="shopSel" style="margin-bottom:10px">${list.map(s => `<option value="${esc(s.id)}" ${s.id === ST.shopSel ? 'selected' : ''}>${esc(L(s, 'name'))}</option>`).join('')}</select>`;
}

/* ---------- sound / notifications ---------- */
let actx = null;
function beep() {
  if (!ST.sound) return;
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    [0, .25, .5].forEach((d, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = 'sine'; o.frequency.value = i === 1 ? 1175 : 880;
      g.gain.setValueAtTime(.0001, actx.currentTime + d); g.gain.exponentialRampToValueAtTime(.5, actx.currentTime + d + .02); g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + d + .22);
      o.connect(g).connect(actx.destination); o.start(actx.currentTime + d); o.stop(actx.currentTime + d + .25); });
  } catch (e) {}
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
}
function notify(txt) { try { if (window.Notification && Notification.permission === 'granted') new Notification('Stein & Olive', { body: txt, icon: 'icon-192.png' }); } catch (e) {} }

/* ---------- live orders ---------- */
async function fetchOrders() {
  const since = new Date(Date.now() - 36 * 3600 * 1000).toISOString();
  const { data, error } = await sb.from('orders').select('*, order_items(*)').or(`status.in.(new,preparing,ready,on_way),created_at.gte.${since}`).order('created_at', { ascending: false }).limit(300);
  if (error) throw error;
  data.forEach(o => o.order_items.sort((a, b) => a.id - b.id));
  const fresh = data.filter(o => o.status === 'new' && o.order_items.some(i => i.status === 'new'));
  if (ST.seen) { const nw = fresh.filter(o => !ST.seen.has(o.id)); if (nw.length) { beep(); notify(A('طلب جديد #', 'Neue Bestellung #') + nw.map(o => o.id).join(', #')); if (autoPrintOn()) nw.slice().reverse().forEach(o => queueBon(o)); } }
  ST.seen = new Set(data.map(o => o.id));
  ST.orders = data;
  return data;
}
function startLive(onChange) {
  stopLive();
  let tmr = null; const deb = () => { clearTimeout(tmr); tmr = setTimeout(onChange, 400); };
  ST.ch = sb.channel('live-' + Math.random()).on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, deb)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, deb).subscribe(s => { const d = $('#liveDot'); if (d) { d.style.display = ''; d.style.color = s === 'SUBSCRIBED' ? 'var(--ok)' : 'var(--bad)'; } });
  ST.poll = setInterval(onChange, 25000);
}
function stopLive() { if (ST.ch) { sb.removeChannel(ST.ch); ST.ch = null; } clearInterval(ST.poll); ST.poll = null; }
async function loadDrivers() { if (S.staff.role !== 'admin') return; const { data } = await sb.from('staff').select('user_id,name,username,phone,active').eq('role', 'driver').eq('active', true); ST.drivers = data || []; }

/* ---------- orders section ---------- */
async function secOrders(main) {
  const myShop = S.staff.role === 'shop' ? App.shopById(S.staff.shop_id) : null;
  const isRest = myShop && myShop.type === 'restaurant';
  if (isRest && localStorage.getItem('so_kds') == null) ST.kds = true; else ST.kds = localStorage.getItem('so_kds') === '1';
  main.innerHTML = `<div class="acts noprint" style="margin-bottom:6px">
     <button class="btn s ${ST.sound ? 'g' : 'o'}" id="snd">${ic(ST.sound ? 'bell' : 'belloff', 's')} ${esc(A('الصوت', 'Ton'))}</button>
     <button class="btn s o" id="pushB">${ic('belloff', 's')}</button>
     <button class="btn s ${autoPrintOn() ? 'g' : 'o'}" id="apB">${ic('print', 's')} ${esc(A('طباعة تلقائية', 'Auto-Druck'))}</button>
     <button class="btn s o" id="kdsB">${ST.kds ? ' ' + esc(A('عرض عادي', 'Liste')) : ' ' + esc(A('شاشة المطبخ', 'Küchenansicht'))}</button>
     <button class="btn s o" id="rf" aria-label="Neu laden">${ic('refresh', 's')}</button></div>
    <div class="tabs" id="otabs">${[['active', 'الحالية', 'Aktiv'], ['done', 'المنتهية', 'Erledigt'], ['cancelled', 'الملغية', 'Storniert'], ['all', 'الكل', 'Alle']].map(x => `<button data-t="${x[0]}" class="${ST.tab === x[0] ? 'on' : ''}">${esc(A(x[1], x[2]))} <span id="cnt_${x[0]}"></span></button>`).join('')}</div>
    <input type="search" id="oq" placeholder="${esc(A('بحث برقم الطلب أو الاسم أو الهاتف', 'Suche: Nr., Name, Telefon'))}" style="margin-bottom:8px">
    <div id="olist" class="${ST.kds ? 'kds' : ''}"><div class="empty">…</div></div>`;
  $('#snd').onclick = () => { ST.sound = !ST.sound; localStorage.setItem('so_sound', ST.sound ? '1' : '0'); if (ST.sound) { beep(); if (window.Notification && Notification.permission === 'default') Notification.requestPermission(); } secOrders(main); };
  paintPush($('#pushB')); $('#pushB').onclick = () => pushToggle($('#pushB'));
  $('#apB').onclick = () => { const on = !autoPrintOn(); localStorage.setItem('so_autoprint', on ? '1' : '0'); toast(on ? A('كل طلب جديد رح ينطبع بون لحالو على هالجهاز. خلّي الصفحة مفتوحة.', 'Jede neue Bestellung wird auf diesem Gerät automatisch gedruckt. Seite offen lassen.') : A('الطباعة التلقائية انطفت.', 'Auto-Druck aus.')); secOrders(main); };
  $('#kdsB').onclick = () => { ST.kds = !ST.kds; localStorage.setItem('so_kds', ST.kds ? '1' : '0'); secOrders(main); };
  $('#rf').onclick = refresh;
  $$('#otabs button').forEach(b => b.onclick = () => { ST.tab = b.dataset.t; $$('#otabs button').forEach(x => x.classList.toggle('on', x === b)); draw(); });
  $('#oq').oninput = draw;
  await loadDrivers();
  async function refresh() { try { await fetchOrders(); draw(); } catch (e) { err(e); } }
  function draw() {
    const el = $('#olist'); if (!el) return;
    if (el.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return;
    const grp = { active: o => ['new', 'preparing', 'ready', 'on_way'].includes(o.status), done: o => ['delivered', 'picked_up'].includes(o.status), cancelled: o => o.status === 'cancelled', all: () => true };
    Object.keys(grp).forEach(k => { const c = $('#cnt_' + k); if (c) c.textContent = '(' + ST.orders.filter(grp[k]).length + ')'; });
    const q = ($('#oq').value || '').trim().toLowerCase();
    let list = ST.orders.filter(grp[ST.tab]).filter(o => !q || String(o.id).includes(q) || (o.customer_name || '').toLowerCase().includes(q) || (o.phone || '').includes(q));
    if (ST.kds) list = list.slice().sort((a, b) => b.id - a.id);
    el.innerHTML = list.length ? (ST.kds ? `<div class="grid2">${list.map(orderCard).join('')}</div>` : list.map(orderCard).join('')) : `<div class="empty">${esc(A('ما في طلبات', 'Keine Bestellungen'))}</div>`;
    bindOrderCards(el, refresh);
  }
  await refresh();
  startLive(refresh);
}
function orderCard(o) {
  const admin = S.staff.role === 'admin';
  const items = o.order_items;
  const byShop = {}; items.forEach(i => (byShop[i.shop_id] = byShop[i.shop_id] || []).push(i));
  const hasNew = items.some(i => i.status === 'new');
  const drv = ST.drivers.find(d => d.user_id === o.driver_id);
  const wa = String(o.phone || '').replace(/\D/g, '').replace(/^0/, '49');
  return `<div class="oc ${hasNew && o.status !== 'cancelled' ? 'new' : ''}" data-o="${o.id}">
   <div class="hd"><span class="no">#${o.id}</span>${stPill(o.status)}<span class="pill be">${o.mode === 'delivery' ? ' ' + esc(A('توصيل', 'Lieferung')) : ' ' + esc(A('استلام', 'Abholung'))}</span>
    <span class="note">${fmtDate(o.created_at)}</span></div>
   ${o.scheduled_at ? `<div class="warnbox">${esc(A('مطلوب على:', 'Gewünscht für:'))} <b>${fmtDate(o.scheduled_at)}</b></div>` : ''}
   <div class="note" style="margin:6px 0"> <b style="color:var(--cream)">${esc(o.customer_name)}</b> • <a href="tel:${esc(o.phone)}">${esc(o.phone)}</a>${wa ? ` • <a target="_blank" rel="noopener" href="https://wa.me/${wa}">WhatsApp</a>` : ''}
     ${o.mode === 'delivery' ? `<br>${esc(o.street)}, ${esc(o.plz)} ${esc(o.city)}${o.address_note ? ' (' + esc(o.address_note) + ')' : ''}` : ''}
     ${o.note ? `<br> <b style="color:var(--warn)">${esc(o.note)}</b>` : ''}</div>
   ${Object.keys(byShop).map(sid => { const sh = App.shopById(sid) || { name_ar: sid, name_de: sid }; const its = byShop[sid]; const act = its.filter(i => i.status !== 'rejected');
     const gst = act.length && act.every(i => i.status === 'ready') ? 'ready' : act.some(i => i.status !== 'new') ? 'preparing' : act.length ? 'new' : 'rejected';
     const mine = admin || sid === S.staff.shop_id;
     return `<div class="shopgrp"><div class="hd" style="margin-bottom:4px"><b>${SI(sh.type)} ${esc(L(sh, 'name'))}</b>${stPill(gst)}</div>
      ${its.map(i => `<div class="itm" style="${i.status === 'rejected' ? 'opacity:.4;text-decoration:line-through' : ''}"><span class="q">${fq(i.final_qty || i.qty, i.unit)}</span><div class="t"><b>${esc(S.lang === 'ar' ? i.name_ar : i.name_de)}</b>${i.cooled ? ' <span class="badge c">' + ic('snow', 's') + '</span>' : ''}
          ${(i.options || []).length ? `<div class="note">${esc(i.options.map(x => (S.lang === 'ar' ? x.ar : x.de)).join(' • '))}</div>` : ''}
          ${i.cake ? `<div class="note" style="color:var(--warn)">${esc(i.cake.date)} ${i.cake.text ? ' «' + esc(i.cake.text) + '»' : ''}</div>` : ''}
          ${i.note ? `<div class="note" style="color:var(--warn)">${esc(i.note)}</div>` : ''}
          ${i.unit === 'kg' && mine && i.status !== 'rejected' && !['delivered', 'picked_up', 'cancelled'].includes(o.status) ? `<div class="acts" style="margin-top:4px"><input type="number" step="0.005" min="0" inputmode="decimal" value="${+(i.final_qty || i.qty)}" data-wq="${i.id}" style="width:110px;padding:6px 8px"> kg <button class="btn s o" data-w="${i.id}">${esc(A('حفظ الوزن', 'Gewicht speichern'))}</button></div>` : ''}
        </div><span class="note">${money(i.final_total != null ? i.final_total : i.line_total)}</span>
        ${mine && i.status !== 'rejected' && ['new', 'preparing'].includes(o.status) ? `<button class="btn s o" data-rej="${i.id}" title="${esc(A('غير متوفر', 'Nicht verfügbar'))}">✕</button>` : ''}</div>`).join('')}
      ${mine && act.length && ['new', 'preparing', 'ready'].includes(o.status) ? `<div class="acts" style="margin-top:8px">
        ${gst === 'new' ? `<button class="btn s w" data-ss="preparing" data-oid="${o.id}">‍ ${esc(A('بلّش التحضير', 'Zubereitung starten'))}</button>` : ''}
        ${gst !== 'ready' ? `<button class="btn s g" data-ss="ready" data-oid="${o.id}">${esc(A('جاهز', 'Fertig'))}</button>` : `<button class="btn s o" data-ss="preparing" data-oid="${o.id}">${esc(A('رجوع', 'Zurück'))}</button>`}</div>` : ''}</div>`; }).join('')}
   <div class="sum" style="margin-top:6px"><span>${esc(A('المجموع', 'Summe'))} • ${esc(A(PAY[o.payment] ? PAY[o.payment][0] : o.payment, PAY[o.payment] ? PAY[o.payment][1] : o.payment))}${o.paid ? ' ✓' : ''}</span><b>${money(o.total)}</b></div>
   ${o.payment === 'stripe' ? `<div class="acts" style="margin-top:4px"><span class="pill ${o.paid ? 'ok' : 'bad'}">${o.paid ? esc(A('مدفوع بالبطاقة أونلاين', 'Online bezahlt')) : esc(A('البطاقة أونلاين: لسا مش مدفوع', 'Karte online: noch nicht bezahlt'))}</span></div>` : ''}
   ${o.payment === 'transfer' ? `<div class="acts" style="margin-top:4px"><span class="pill ${o.paid ? 'ok' : 'warn'}">${o.paid ? esc(A('التحويل وصل', 'Überweisung erhalten')) : esc(A('التحويل لسا ما وصل', 'Überweisung offen'))}</span><button class="btn s o" data-paid="${o.id}" data-v="${o.paid ? 0 : 1}">${o.paid ? esc(A('رجّعها غير مدفوعة', 'Als offen markieren')) : esc(A('وصل المبلغ', 'Als bezahlt markieren'))}</button></div>` : ''}
   ${o.mode === 'delivery' ? `<div class="note">${esc(A('السائق:', 'Fahrer:'))} ${drv ? esc(drv.name || drv.username) : o.driver_id ? '✓' : '—'}${o.cash_collected ? ' •  ' + esc(A('تم تحصيل الكاش', 'Bar kassiert')) : ''}${safeUrl(o.proof_url) ? ` • <a href="${esc(safeUrl(o.proof_url))}" target="_blank" rel="noopener">${esc(A('صورة التسليم', 'Übergabe-Foto'))}</a>` : ''}</div>` : ''}
   <div class="acts noprint" style="margin-top:8px">
    ${o.mode === 'pickup' && o.status === 'ready' ? `<button class="btn s g" data-os="picked_up" data-oid="${o.id}">${esc(A('تم التسليم للزبون', 'An Kunde übergeben'))}</button>` : ''}
    ${admin && o.mode === 'delivery' && ['new', 'preparing', 'ready'].includes(o.status) ? `<select data-drv="${o.id}" style="width:auto;padding:6px 10px"><option value="">${esc(A('اختار سائق', 'Fahrer wählen'))}</option>${ST.drivers.map(d => `<option value="${d.user_id}" ${d.user_id === o.driver_id ? 'selected' : ''}>${esc(d.name || d.username)}</option>`).join('')}</select>` : ''}
    ${admin && o.mode === 'delivery' && o.status === 'on_way' ? `<button class="btn s g" data-os="delivered" data-oid="${o.id}">${esc(A('تم التوصيل', 'Geliefert'))}</button>` : ''}
    <button class="btn s o" data-pr="${o.id}" aria-label="${esc(A('فاتورة', 'Rechnung'))}">${ic('receipt', 's')}</button>
    <button class="btn s o" data-bon="${o.id}">${ic('print', 's')} Bon</button>
    <button class="btn s o" data-lbl="${o.id}">${ic('print', 's')} ${esc(A('ملصق', 'Etikett'))}</button>
    ${wa ? `<a class="btn s o" target="_blank" rel="noopener" href="https://wa.me/${wa}?text=${encodeURIComponent(waText(o))}">${ic('chat', 's')}</a>` : ''}
    ${admin && !['delivered', 'picked_up', 'cancelled'].includes(o.status) ? `<button class="btn s r" data-os="cancelled" data-oid="${o.id}">${esc(A('إلغاء', 'Stornieren'))}</button>` : ''}
   </div></div>`;
}
function waText(o) {
  const ar = o.lang !== 'de';
  const s = { new: ['استلمنا طلبك', 'wir haben deine Bestellung erhalten'], preparing: ['طلبك قيد التحضير', 'deine Bestellung wird zubereitet'], ready: [o.mode === 'pickup' ? 'طلبك جاهز للاستلام' : 'طلبك جاهز وبيطلع قريباً', o.mode === 'pickup' ? 'deine Bestellung ist abholbereit' : 'deine Bestellung ist fertig und kommt bald'], on_way: ['السائق بالطريق لعندك', 'der Fahrer ist unterwegs'], delivered: ['شكراً لطلبك!', 'danke für deine Bestellung!'], picked_up: ['شكراً لطلبك!', 'danke für deine Bestellung!'], cancelled: ['للأسف تم إلغاء طلبك', 'deine Bestellung wurde leider storniert'] }[o.status] || ['', ''];
  const link = location.origin + location.pathname + '#/track/' + o.token;
  return ar ? `مرحبا ${o.customer_name}، ${s[0]} (طلب #${o.id}) – بيت كرم Stein & Olive\n${link}` : `Hallo ${o.customer_name}, ${s[1]} (Bestellung #${o.id}) – Stein & Olive\n${link}`;
}
function codeErr(e) {
  const m = String((e && e.message) || e);
  if (/badcode/.test(m)) return toast(A('الكود غلط. اطلب الكود من الزبون، بيلاقيه بصفحة الطلب.', 'Code falsch. Bitte den Code vom Kunden zeigen lassen (steht auf seiner Bestellseite).'), 1);
  if (/rate_limited/.test(m)) return toast(A('محاولات كتير. استنى ربع ساعة أو اتصل بالأدمن.', 'Zu viele Versuche. 15 Minuten warten oder den Admin anrufen.'), 1);
  if (/status/.test(m)) return toast(A('الطلب مش بهالمرحلة.', 'Die Bestellung ist nicht in diesem Schritt.'), 1);
  return err(e);
}
function codeDialog(o, done) {
  const del = o.mode === 'delivery', cashQ = o.payment === 'cash', admin = S.staff && S.staff.role === 'admin';
  const m = modal(`<button class="ib x" data-close>${ic('x')}</button>
    <h3>${esc(del ? A('تسليم الطلب', 'Übergabe') : A('تسليم للزبون', 'An Kunde übergeben'))} #${+o.id}</h3>
    <p class="note">${esc(A('اطلب من الزبون كود التسليم (4 أرقام). بيلاقيه بصفحة الطلب أو بالإيميل.', 'Lass dir vom Kunden den 4-stelligen Übergabe-Code nennen. Er steht auf seiner Bestellseite und in der E-Mail.'))}</p>
    <input type="text" id="hcCode" class="codein" inputmode="numeric" autocomplete="one-time-code" maxlength="4" pattern="[0-9]*" placeholder="• • • •" aria-label="Code">
    ${del ? `<label class="proofpick"><input type="file" accept="image/*" capture="environment" id="hcPhoto" hidden><span id="hcPhotoL">${ic('camera', 's')} ${esc(A('صورة التسليم (اختياري)', 'Foto der Übergabe (optional)'))}</span></label>` : ''}
    ${cashQ ? `<label class="chk" style="margin-top:12px"><input type="checkbox" id="hcCash"><span>${esc(A('حصّلت', 'Kassiert:'))} <b>${money(o.total)}</b> ${esc(A('كاش', 'bar'))}</span></label>` : ''}
    <button class="btn g full" id="hcGo" style="margin-top:14px">${esc(A('تأكيد التسليم', 'Übergabe bestätigen'))}</button>
    ${admin ? `<button class="lnk" id="hcOver" style="display:block;margin:12px auto 0">${esc(A('بدون كود (بس للأدمن)', 'Ohne Code (nur Admin)'))}</button>` : ''}`);
  const inp = $('#hcCode', m); setTimeout(() => inp.focus(), 60);
  inp.oninput = () => { inp.value = inp.value.replace(/\D/g, '').slice(0, 4); };
  const cash = () => cashQ ? $('#hcCash', m).checked : null;
  let photo = null;
  if ($('#hcPhoto', m)) $('#hcPhoto', m).onchange = e => { photo = e.target.files[0] || null; $('#hcPhotoL', m).innerHTML = photo ? `${ic('check', 's')} ${esc(A('الصورة جاهزة', 'Foto bereit'))}` : ''; };
  const upProof = async () => {
    if (!photo) return;
    try {
      const blob = await compressImage(photo, 1200);
      const path = `${o.id}/${App.uid()}${App.uid()}.jpg`;
      const { error } = await sb.storage.from('proofs').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      if (error) throw error;
      const url = sb.storage.from('proofs').getPublicUrl(path).data.publicUrl;
      const r = await sb.rpc('driver_proof', { p_order: o.id, p_url: url }); if (r.error) throw r.error;
    } catch (e) { toast(A('الصورة ما انرفعت، بس الطلب انسكّر.', 'Foto nicht hochgeladen, Bestellung ist trotzdem abgeschlossen.'), 1); }
  };
  const go = async () => {
    if (!/^\d{4}$/.test(inp.value)) { inp.classList.add('bad'); return toast(A('اكتب الكود (4 أرقام).', 'Bitte den 4-stelligen Code eingeben.'), 1); }
    if (cashQ && !cash() && !confirm(A('ما حصّلت الكاش؟ رح ينحفظ إنو لسا ما انحصّل.', 'Bargeld nicht kassiert? Wird als offen gespeichert.'))) return;
    const b = $('#hcGo', m); b.disabled = true;
    const { error } = await sb.rpc('order_complete', { p_order: o.id, p_code: inp.value, p_cash: cash() });
    b.disabled = false;
    if (error) { b.disabled = false; inp.classList.add('bad'); inp.select(); return codeErr(error); }
    await upProof();
    closeModal(); toast('✓ #' + o.id); done && done();
  };
  $('#hcGo', m).onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') go(); };
  if ($('#hcOver', m)) $('#hcOver', m).onclick = async () => {
    if (!confirm(A('أكيد بدك تسكّر الطلب بدون كود؟', 'Bestellung wirklich ohne Code abschließen?'))) return;
    const { error } = await sb.rpc('order_set_status', { p_order: o.id, p_status: del ? 'delivered' : 'picked_up', p_cash: cash() });
    if (error) return err(error); await upProof(); closeModal(); toast('✓ #' + o.id); done && done();
  };
}
function bindOrderCards(root, refresh) {
  const run = async (p) => { try { const { error } = await p; if (error) throw error; await refresh(); } catch (e) { err(e); } };
  $$('[data-ss]', root).forEach(b => b.onclick = () => run(sb.rpc('shop_set_status', { p_order: +b.dataset.oid, p_status: b.dataset.ss })));
  $$('[data-os]', root).forEach(b => b.onclick = () => {
    const s = b.dataset.os; const o = ST.orders.find(x => x.id === +b.dataset.oid);
    if (s === 'cancelled' && !confirm(A('أكيد بدك تلغي الطلب؟ البضاعة بترجع للمخزون.', 'Bestellung wirklich stornieren? Ware wird zurückgebucht.'))) return;
    if ((s === 'picked_up' || s === 'delivered') && o) return codeDialog(o, refresh);
    run(sb.rpc('order_set_status', { p_order: +b.dataset.oid, p_status: s, p_cash: null }));
  });
  $$('[data-rej]', root).forEach(b => b.onclick = () => { if (confirm(A('هالمنتج غير متوفر؟ رح ينشال من الطلب.', 'Artikel nicht verfügbar? Er wird aus der Bestellung entfernt.'))) run(sb.rpc('reject_item', { p_item: +b.dataset.rej })); });
  $$('[data-w]', root).forEach(b => b.onclick = () => { const v = parseFloat(String($(`[data-wq="${b.dataset.w}"]`, root).value).replace(',', '.')); if (!(v > 0)) return; run(sb.rpc('set_final_qty', { p_item: +b.dataset.w, p_qty: v })).then(() => toast(' ✓')); });
  $$('[data-drv]', root).forEach(s => s.onchange = () => run(sb.rpc('admin_assign_driver', { p_order: +s.dataset.drv, p_driver: s.value || null })));
  $$('[data-pr]', root).forEach(b => b.onclick = () => printOrder(ST.orders.find(x => x.id === +b.dataset.pr)));
  $$('[data-bon]', root).forEach(b => b.onclick = () => { const o = ST.orders.find(x => x.id === +b.dataset.bon); if (o) printBon(o); });
  $$('[data-lbl]', root).forEach(b => b.onclick = () => { const o = ST.orders.find(x => x.id === +b.dataset.lbl); if (o) printLabel(o); });
  $$('[data-paid]', root).forEach(b => b.onclick = () => run(sb.rpc('order_set_paid', { p_order: +b.dataset.paid, p_paid: b.dataset.v === '1' })));
}
/* ---------- push notifications (works with the page closed) ---------- */
const b64u = s => { const p = '='.repeat((4 - s.length % 4) % 4); const r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...r].map(c => c.charCodeAt(0))); };
const pushOk = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
async function pushState() {
  if (!pushOk()) return 'no';
  if (Notification.permission === 'denied') return 'denied';
  const reg = await navigator.serviceWorker.getRegistration(); const sub = reg && await reg.pushManager.getSubscription();
  return sub ? 'on' : 'off';
}
async function pushToggle(btn) {
  if (!pushOk()) {
    const ios = /iPhone|iPad/.test(navigator.userAgent);
    return toast(ios ? A('على الآيفون: افتح الموقع بـ Safari، اكبس «مشاركة» ← «إلى الشاشة الرئيسية»، وافتحو من هونيك، وبعدين فعّل الإشعارات.', 'iPhone: Seite in Safari öffnen, „Teilen“ → „Zum Home-Bildschirm“, von dort öffnen und dann Mitteilungen aktivieren.') : A('هالمتصفح ما بيدعم الإشعارات.', 'Dieser Browser unterstützt keine Mitteilungen.'), 1);
  }
  const reg = await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready;
  const cur = await reg.pushManager.getSubscription();
  if (cur) { await sb.rpc('push_unsubscribe', { p_endpoint: cur.endpoint }); await cur.unsubscribe(); toast(A('الإشعارات انطفت على هالجهاز.', 'Mitteilungen auf diesem Gerät aus.')); }
  else {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return toast(A('لازم تسمح بالإشعارات من إعدادات المتصفح.', 'Bitte Mitteilungen in den Browser-Einstellungen erlauben.'), 1);
    let key = (await sb.rpc('vapid_public')).data;
    if (!key) { try { const r = await fetch(App.CFG.url + '/functions/v1/staff-push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"init":true}' }); key = (await r.json()).key; } catch (_) {} }
    if (!key) return toast(A('ما زبط، جرّب كمان شوي.', 'Hat nicht geklappt, bitte gleich nochmal versuchen.'), 1);
    try {
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(key) });
      const j = sub.toJSON();
      const { error } = await sb.rpc('push_subscribe', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth });
      if (error) { await sub.unsubscribe(); return err(error); }
      toast(A('تمام! رح توصلك إشعارات حتى لو الصفحة مسكّرة.', 'Fertig! Du bekommst Mitteilungen, auch wenn die Seite zu ist.'));
    } catch (e) { return toast(A('ما زبط تفعيل الإشعارات.', 'Mitteilungen konnten nicht aktiviert werden.'), 1); }
  }
  if (btn) paintPush(btn);
}
async function paintPush(btn) {
  const st = await pushState();
  btn.classList.toggle('g', st === 'on'); btn.classList.toggle('o', st !== 'on');
  btn.innerHTML = `${ic(st === 'on' ? 'bell' : 'belloff', 's')} ${esc(st === 'on' ? A('الإشعارات شغالة', 'Mitteilungen an') : A('فعّل الإشعارات', 'Mitteilungen aktivieren'))}`;
}
/* ---------- kitchen / shop slip (Bon) ---------- */
const autoPrintOn = () => localStorage.getItem('so_autoprint') === '1' && S.staff && S.staff.role !== 'driver';
const bonW = () => { const v = localStorage.getItem('so_bon_w') || '80'; return v === 'a4' ? 'a4' : +v; };
const bonCopies = () => Math.min(3, Math.max(1, +(localStorage.getItem('so_bon_copies') || 1)));
const bonQ = [];
const autoLabelOn = () => localStorage.getItem('so_auto_lbl') === '1';
function queueBon(o) {
  const was = bonQ.length;
  for (let i = 0; i < bonCopies(); i++) bonQ.push({ o, k: 'bon' });
  if (o.mode === 'delivery' && autoLabelOn()) bonQ.push({ o, k: 'lbl' });
  if (!was) runBon();
}
function runBon() { const j = bonQ[0]; if (!j) return; (j.k === 'lbl' ? printLabel : printBon)(j.o, () => { bonQ.shift(); setTimeout(runBon, 400); }); }
const asView = o => Object.assign({}, o, { items: (o.order_items || o.items || []).map(i => Object.assign({}, i, { line_total: i.final_total != null ? i.final_total : i.line_total })) });
const bonLogo = () => localStorage.getItem('so_bon_logo') !== '0';
function bonHtml(o) {
  const mine = S.staff.role === 'shop' ? S.staff.shop_id : null;
  const items = o.order_items.filter(i => i.status !== 'rejected' && (!mine || i.shop_id === mine));
  const by = {}; items.forEach(i => (by[i.shop_id] = by[i.shop_id] || []).push(i));
  const tm = d => new Date(d).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' });
  return `<div class="slip bon">${bonLogo() ? '<img class="sl-logo" src="logo-dark.png" alt="">' : ''}<div class="bon-no">#${+o.id}</div>
    <div class="bon-m">${o.mode === 'delivery' ? 'LIEFERUNG · <span dir="rtl">توصيل</span>' : 'ABHOLUNG · <span dir="rtl">استلام</span>'}</div>
    <div class="bon-t">${tm(o.created_at)}${o.scheduled_at ? '<br><b>Termin: ' + tm(o.scheduled_at) + '</b>' : ''}</div>
    ${Object.keys(by).map(sid => `<div class="sl-shop">${esc((App.shopById(sid) || {}).name_de || sid)}</div>` + by[sid].map(i => `<div class="bon-i"><b class="q">${esc(fq(i.final_qty || i.qty, i.unit))}</b><div class="d"><b>${esc(i.name_de)}</b><div class="sl-ar" dir="rtl">${esc(i.name_ar)}</div>${(i.options || []).length ? `<div class="sl-sm">${esc(i.options.map(x => x.de || x.ar).join(', '))}</div>` : ''}${i.note ? `<div class="sl-sm">» ${esc(i.note)}</div>` : ''}${i.cake ? `<div class="sl-sm">Torte ${esc(i.cake.date)} ${esc(i.cake.text || '')}</div>` : ''}${i.cooled ? '<div class="sl-sm">❄ Kühlware</div>' : ''}</div></div>`).join('')).join('')}
    ${o.note ? `<div class="lb-box"><b>Notiz:</b> ${esc(o.note)}</div>` : ''}
    <div class="bon-c">${esc(o.customer_name)} · ${esc(o.phone || '')}</div></div>`;
}
function printSlip(html, done, forceW) {
  let area = $('#bonArea'); if (!area) { area = document.createElement('div'); area.id = 'bonArea'; document.body.appendChild(area); }
  area.innerHTML = html;
  const w = forceW || bonW(); const paper = w === 'a4' ? '210mm' : w === 58 ? '58mm' : '80mm';
  area.style.setProperty('--bonw', w === 'a4' ? '180mm' : w === 58 ? '48mm' : '72mm');
  // Papiergröße und Rand 0 setzen, sonst schneidet der Thermodrucker die Ränder ab
  let pg = $('#slipPage'); if (!pg) { pg = document.createElement('style'); pg.id = 'slipPage'; document.head.appendChild(pg); }
  pg.textContent = w === 'a4' ? '@page{size:A4;margin:12mm}' : `@page{size:${paper} auto;margin:0}`;
  document.body.classList.add('bonprint');
  let fin = false; const end = () => { if (fin) return; fin = true; document.body.classList.remove('bonprint'); area.innerHTML = ''; pg.textContent = ''; window.removeEventListener('afterprint', end); done && done(); };
  window.addEventListener('afterprint', end);
  const imgs = [...area.querySelectorAll('img')].filter(im => !im.complete);
  Promise.all(imgs.map(im => new Promise(r => { im.onload = im.onerror = r; setTimeout(r, 1500); }))).then(() => setTimeout(() => { try { window.print(); } catch (_) {} setTimeout(end, 1500); }, 80));
}
function printBon(o, done) { printSlip(bonHtml(o), done); }
function printLabel(o, done) { printSlip(App.labelHtml(asView(o)), done); }
function printOrder(o) {
  const v = asView(o); const thermal = bonW() !== 'a4';
  modal(`<button class="ib x noprint" data-close>${ic('x')}</button><div class="acts noprint" style="margin-bottom:10px">
    <button class="btn s" id="prt">${ic('print', 's')} ${esc(thermal ? A('اطبع على البون', 'Auf Bon drucken') : A('طباعة', 'Drucken'))}</button>
    ${thermal ? `<button class="btn s o" id="prtA4">A4</button>` : ''}
    <button class="btn s o" id="prtL">${ic('print', 's')} ${esc(A('ملصق الكيس', 'Tüten-Etikett'))}</button></div>
    <div class="slip-prev">${thermal ? App.thermInvoiceHtml(v, bonLogo()) : App.invoiceHtml(v)}</div>`);
  $('#prt').onclick = () => thermal ? printSlip(App.thermInvoiceHtml(v, bonLogo())) : window.print();
  if ($('#prtA4')) $('#prtA4').onclick = () => printSlip(App.invoiceHtml(v), null, 'a4');
  $('#prtL').onclick = () => printLabel(o);
}

/* ---------- products ---------- */
async function secProducts(main) {
  const draw = () => {
    const pick = shopPicker(draw); const sid = ST.shopSel;
    const cats = S.cats.filter(c => c.shop_id === sid);
    main.innerHTML = pick + `<div class="acts" style="margin-bottom:10px">
       <button class="btn s g" id="pQuick">${ic('scan', 's')} ${esc(A('إضافة سريعة بالسكانر', 'Schnell erfassen (Scanner)'))}</button>
       <button class="btn s" id="pAdd">${esc(A('منتج جديد', 'Neues Produkt'))}</button>
       <button class="btn s o" id="pCats">${esc(A('الأقسام', 'Kategorien'))} (${cats.length})</button>
       <button class="btn s o" id="pImp">${esc(A('استيراد Excel/CSV', 'Import Excel/CSV'))}</button>
       <button class="btn s o" id="pExp"> CSV</button>
       ${S.staff.role === 'admin' && S.products.some(p => p.demo) ? `<button class="btn s r" id="pDemo">${esc(A('احذف كل منتجات التجربة', 'Alle Demo-Produkte löschen'))} (${S.products.filter(p => p.demo).length})</button>` : ''}</div>
      <div class="row"><input type="search" id="pq" placeholder="${esc(A('بحث أو باركود', 'Suche oder Barcode'))}"><select id="pc"><option value="">${esc(A('كل الأقسام', 'Alle Kategorien'))}</option>${cats.map(c => `<option value="${c.id}">${esc(L(c, 'name'))}</option>`).join('')}<option value="-">${esc(A('بدون قسم', 'Ohne Kategorie'))}</option></select></div>
      <div id="plst" style="margin-top:10px"></div>`;
    const list = () => {
      const q = $('#pq').value.trim().toLowerCase(), c = $('#pc').value;
      const ps = S.products.filter(p => p.shop_id === sid && (!c || (c === '-' ? !p.category_id : p.category_id === c)) && (!q || (p.name_ar + ' ' + p.name_de + ' ' + (p.barcode || '')).toLowerCase().includes(q)));
      $('#plst').innerHTML = ps.length ? `<div class="note">${ps.length} ${esc(A('منتج', 'Produkte'))}</div>` + ps.slice(0, 400).map(p => `<div class="li" data-ed="${p.id}" style="cursor:pointer;${p.active ? '' : 'opacity:.45'}">
         <div class="thumb" style="${bgImg(p.image_url)}"></div>
         <div class="t"><b>${esc(L(p, 'name'))}</b><small>${App.priceLabel(p)}${p.track_stock ? ` •  ${fq(p.stock, p.unit)}` : ''}${p.barcode ? ' • ' + esc(p.barcode) : ''}</small></div>
         ${p.track_stock && +p.stock <= +p.min_stock ? '<span class="pill bad"></span>' : ''}${p.featured ? ic('star', 's') : ''}<label class="chk" data-stop><input type="checkbox" data-act="${p.id}" ${p.active ? 'checked' : ''}></label></div>`).join('') : `<div class="empty">${esc(A('ما في منتجات لسا. اضغط "منتج جديد"', 'Noch keine Produkte. Tippe auf „Neues Produkt“'))}</div>`;
      $$('[data-ed]').forEach(el => el.onclick = () => editProduct(prodBy(el.dataset.ed), draw));
      $$('[data-stop]').forEach(l => l.onclick = e => e.stopPropagation());
      $$('[data-act]').forEach(ch => ch.onchange = async () => { const { error } = await sb.from('products').update({ active: ch.checked }).eq('id', ch.dataset.act); if (error) return err(error); prodBy(ch.dataset.act).active = ch.checked; list(); });
    };
    $('#pq').oninput = list; $('#pc').onchange = list; list();
    $('#pAdd').onclick = () => editProduct({ shop_id: sid }, draw);
    $('#pQuick').onclick = () => scanAdd(main, () => secProducts(main));
    $('#pCats').onclick = () => editCats(sid, draw);
    $('#pImp').onclick = () => importCsv(sid, draw);
    $('#pExp').onclick = () => exportCsv(sid);
    if ($('#pDemo')) $('#pDemo').onclick = async () => {
      if (!confirm(A('أكيد؟ رح تنمسح كل منتجات وأقسام التجربة بكل المحلات. منتجاتك الحقيقية ما بتنمس.', 'Sicher? Alle Demo-Produkte und Demo-Kategorien aller Geschäfte werden gelöscht. Echte Produkte bleiben.'))) return;
      const r1 = await sb.from('products').delete().eq('demo', true); if (r1.error) return err(r1.error);
      const r2 = await sb.from('categories').delete().eq('demo', true); if (r2.error) return err(r2.error);
      toast('✓'); await reloadAll(); draw();
    };
  };
  draw();
}
const prodBy = id => S.products.find(p => p.id === id);
/* ---------- Schnell erfassen: Barcode scannen → Name/Foto automatisch (Open Food Facts) → Preis → Enter → nächstes Produkt ---------- */
const OFF_ALG = { 'en:gluten': 'gluten', 'en:crustaceans': 'crust', 'en:eggs': 'eggs', 'en:fish': 'fish', 'en:peanuts': 'peanut', 'en:soybeans': 'soy', 'en:milk': 'milk', 'en:nuts': 'nuts', 'en:celery': 'celery', 'en:mustard': 'mustard', 'en:sesame-seeds': 'sesame', 'en:sulphur-dioxide-and-sulphites': 'sulph', 'en:lupin': 'lupin', 'en:molluscs': 'mollusc' };
async function offLookup(code) {
  if (!/^\d{8,14}$/.test(code)) return null;
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 6000);
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_de,product_name_ar,brands,quantity,image_front_url,allergens_tags,categories_tags`, { signal: ctl.signal });
    if (!r.ok) return null; const j = await r.json(); return j && j.product && (j.product.product_name || j.product.product_name_de || j.product.product_name_ar) ? j.product : null;
  } catch (_) { return null; } finally { clearTimeout(to); }
}
async function offImage(url) {
  if (!/^https:\/\/images\.openfoodfacts\.org\//.test(url || '')) return null;
  try { const r = await fetch(url); if (!r.ok) return null; const b = await r.blob(); return /^image\//.test(b.type) ? b : null; } catch (_) { return null; }
}
async function eanCall(body) {
  const { data } = await sb.auth.getSession();
  const tok = data.session && data.session.access_token;
  const r = await fetch(App.CFG.url + '/functions/v1/ean-lookup', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: App.CFG.key, Authorization: 'Bearer ' + tok }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || 'error'); e.code = j.error; throw e; }
  return j;
}
// Server fragt: eigene Produktdatei → Open Food Facts (+ Kosmetik/Haushalt) → Google. Wenn der Server nicht antwortet: direkt Open Food Facts.
async function eanLookup(code) {
  try { return await eanCall({ mode: 'lookup', code }); }
  catch (_) { const pr = await offLookup(code); return pr ? { found: true, source: 'off', product: { name_de: [String(pr.brands || '').split(',')[0].trim(), pr.product_name_de || pr.product_name, pr.quantity].filter(Boolean).join(' ').slice(0, 120), name_ar: pr.product_name_ar || '', image_url: pr.image_front_url, allergens: (pr.allergens_tags || []).map(x => OFF_ALG[x]).filter(Boolean), bev: (pr.categories_tags || []).includes('en:beverages') } } : { found: false }; }
}
/* ---------- Profi-Foto: Hintergrund weg → weiß → quadratisch, Produkt mittig ---------- */
// Hintergrund-Entfernung läuft komplett im Browser (lib/bg, IS-Net), ohne Kosten und ohne Upload zu Fremden.
let bgW = null, bgSeq = 0; const bgJobs = {};
function bgWorker() {
  if (bgW) return bgW;
  bgW = new Worker(new URL('lib/bg/bg-worker.js', document.baseURI), { type: 'module' });
  bgW.onmessage = e => { const j = bgJobs[e.data.id]; if (!j) return; delete bgJobs[e.data.id]; if (e.data.error) j.rej(new Error(e.data.error)); else j.res(e.data.mask); };
  bgW.onerror = () => { Object.keys(bgJobs).forEach(k => { bgJobs[k].rej(new Error('worker')); delete bgJobs[k]; }); try { bgW.terminate(); } catch (_) {} bgW = null; };
  return bgW;
}
function bgMask(bitmap) {
  return new Promise((res, rej) => {
    const id = ++bgSeq; bgJobs[id] = { res, rej };
    try { bgWorker().postMessage({ id, bitmap }, [bitmap]); } catch (e) { delete bgJobs[id]; rej(e); return; }
    setTimeout(() => { if (bgJobs[id]) { delete bgJobs[id]; rej(new Error('timeout')); } }, 180000);
  });
}
// Anteil weißer Pixel am Bildrand (1 = komplett weißer Rand)
function whiteEdge(d, W, H) {
  const wh = (x, y) => { const i = (y * W + x) * 4; return d[i + 3] < 20 || (d[i] > 236 && d[i + 1] > 236 && d[i + 2] > 236); };
  let n = 0, ok = 0; const st = Math.max(1, Math.round((W + H) / 600));
  for (let i = 0; i < W; i += st) { n += 2; ok += wh(i, 0) + wh(i, H - 1); }
  for (let j = 0; j < H; j += st) { n += 2; ok += wh(0, j) + wh(W - 1, j); }
  return n ? ok / n : 0;
}
async function proFrame(blob, opt) {
  opt = opt || {};
  try {
    const bmp = await createImageBitmap(blob); let W = bmp.width, H = bmp.height; if (!W || !H) return blob;
    const sc0 = Math.min(1, 1600 / Math.max(W, H)); W = Math.round(W * sc0); H = Math.round(H * sc0);
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d', { willReadFrequently: true });
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.drawImage(bmp, 0, 0, W, H);
    let d = x.getImageData(0, 0, W, H).data;
    let white = whiteEdge(d, W, H) > 0.8;
    if (!white && opt.cut) {
      // Hintergrund entfernen
      try {
        opt.onCut && opt.onCut();
        const mask = await bgMask(await createImageBitmap(c));
        const mc = document.createElement('canvas'); mc.width = 1024; mc.height = 1024; const mx = mc.getContext('2d');
        const md = mx.createImageData(1024, 1024); for (let i = 0; i < mask.length; i++) { md.data[i * 4 + 3] = mask[i]; }
        mx.putImageData(md, 0, 0);
        const fg = document.createElement('canvas'); fg.width = W; fg.height = H; const fx = fg.getContext('2d');
        fx.drawImage(bmp, 0, 0, W, H); fx.globalCompositeOperation = 'destination-in'; fx.imageSmoothingQuality = 'high'; fx.drawImage(mc, 0, 0, W, H);
        let covered = 0; const fd = fx.getImageData(0, 0, W, H).data; for (let i = 3; i < fd.length; i += 16) if (fd[i] > 128) covered++;
        const ratio = covered / (fd.length / 16);
        if (ratio > 0.03 && ratio < 0.97) { // sinnvolles Ergebnis → übernehmen
          x.globalCompositeOperation = 'source-over'; x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.drawImage(fg, 0, 0);
          d = x.getImageData(0, 0, W, H).data; white = true; opt.cutDone = true;
        }
      } catch (e) { console.warn('bg', e); opt.cutFail = true; }
    }
    let x0 = 0, y0 = 0, x1 = W - 1, y1 = H - 1;
    if (white) {
      const wh = (px, py) => { const i = (py * W + px) * 4; return d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 240; };
      x0 = W; y0 = H; x1 = 0; y1 = 0;
      for (let j = 0; j < H; j += 2) for (let i = 0; i < W; i += 2) if (!wh(i, j)) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
      if (x1 <= x0 || y1 <= y0) { x0 = 0; y0 = 0; x1 = W - 1; y1 = H - 1; }
    }
    const cw = x1 - x0 + 1, chh = y1 - y0 + 1, S = 1000; const room = white ? S * 0.84 : S;
    const k = Math.min(room / cw, room / chh); const dw = cw * k, dh = chh * k;
    const o = document.createElement('canvas'); o.width = S; o.height = S; const ox = o.getContext('2d');
    ox.fillStyle = '#fff'; ox.fillRect(0, 0, S, S); ox.imageSmoothingQuality = 'high';
    ox.drawImage(c, x0, y0, cw, chh, (S - dw) / 2, (S - dh) / 2, dw, dh);
    opt.white = white;
    return await new Promise(r => o.toBlob(b => r(b || blob), 'image/jpeg', 0.9));
  } catch (_) { return blob; }
}
function dataUrlBlob(u) { try { const [h, b] = String(u).split(','); const bin = atob(b); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: (h.match(/data:([^;]+)/) || [])[1] || 'image/jpeg' }); } catch (_) { return null; } }
function eanImportDlg() {
  const root = modal(`<button class="ib x" data-close>✕</button><h3>${esc(A('قاعدة المنتجات', 'Produktdatei'))}</h3>
    <p class="note">${esc(A('هون منحمّل عشرات الآلاف من المنتجات المعروفة (ألمانيا، تركيا، لبنان، سوريا…) لملف عندك. بعدها لما تمسح باركود، الاسم والصورة بيطلعوا فوراً. بتعملها مرة وحدة، وبتاخد حوالي 10 دقايق. خلّي الصفحة مفتوحة.', 'Lädt zehntausende bekannte Produkte in eure eigene Datei. Danach kommen Name und Foto beim Scannen sofort. Einmalig, ca. 10 Minuten. Seite offen lassen.'))}</p>
    <div class="card" style="margin:8px 0"><b id="eiT">…</b><div style="height:10px;background:#eee;border-radius:6px;margin-top:8px;overflow:hidden"><div id="eiB" style="height:100%;width:0;background:var(--ok,#4a6b2a)"></div></div></div>
    <div class="acts"><button class="btn" id="eiGo" style="flex:1">${esc(A('ابدأ التحميل', 'Laden starten'))}</button><button class="btn o" id="eiStop" hidden>${esc(A('وقّف', 'Stopp'))}</button></div>`);
  let run = false;
  const show = r => { $('#eiT', root).textContent = A(`بالملف: ${r.total || 0} منتج • الخطوة ${r.step || 0} من ${r.of || '?'}`, `In der Datei: ${r.total || 0} Produkte • Schritt ${r.step || 0} von ${r.of || '?'}`) + (r.done ? ' ✓' : ''); $('#eiB', root).style.width = (r.of ? Math.round(100 * (r.step || 0) / r.of) : 0) + '%'; if (r.done) { $('#eiGo', root).textContent = A('خلص ✓ (اكبس لتحمّل من جديد)', 'Fertig ✓ (nochmal laden)'); } };
  eanCall({ mode: 'status' }).then(show).catch(() => { $('#eiT', root).textContent = A('ما قدرت أتصل بالسيرفر', 'Server nicht erreichbar'); });
  closeModal.cb = () => { run = false; };
  $('#eiStop', root).onclick = () => { run = false; };
  $('#eiGo', root).onclick = async () => {
    if (run) return; run = true; $('#eiGo', root).disabled = true; $('#eiStop', root).hidden = false;
    let first = true, fails = 0;
    try {
      while (run && document.body.contains(root)) {
        let r;
        try { r = await eanCall({ mode: 'import', reset: first && /✓/.test($('#eiGo', root).textContent) }); fails = 0; } catch (e) { if (++fails > 3) { toast(A('صار خطأ، جرب بعدين', 'Fehler, später nochmal'), 1); break; } await new Promise(z => setTimeout(z, 15000)); continue; }
        first = false; show(r); if (r.done) break;
        await new Promise(z => setTimeout(z, r.wait ? 30000 : 7000)); // Open Food Facts erlaubt ca. 10 Suchanfragen pro Minute
      }
    } finally { run = false; if (document.body.contains(root)) { $('#eiGo', root).disabled = false; $('#eiStop', root).hidden = true; } }
  };
}
/* ---------- Schnell erfassen: viele Produkte scannen → Liste → alle (oder einzeln) bestätigen und anlegen ---------- */
function scanAdd(main, back, firstCode) {
  const D = Object.assign({ cat: '', vat: 7, unit: 'piece', track: true, pfand: 0, look: true, pro: true, cut: false }, JSON.parse(localStorage.getItem('so_qa') || '{}'));
  // ab jetzt: offizielle Fotos statt ausgeschnittener Handyfotos
  if (D.v !== 3) { D.v = 3; D.pro = true; D.cut = false; try { localStorage.setItem('so_qa', JSON.stringify(D)); } catch (_) {} }
  const saveD = () => { try { localStorage.setItem('so_qa', JSON.stringify(D)); } catch (_) {} };
  let items = []; let added = []; let seq = 0; let camOn = false;
  const num = v => parseFloat(String(v == null ? '' : v).replace(',', '.'));
  const byKey = k => items.find(i => i.key === +k);
  const draw = () => {
    const pick = shopPicker(() => { D.cat = ''; saveD(); draw(); }); const sid = ST.shopSel;
    const cats = S.cats.filter(c => c.shop_id === sid); if (D.cat && !cats.some(c => c.id === D.cat)) D.cat = '';
    main.innerHTML = `<div class="acts" style="margin-bottom:10px"><button class="btn s o" id="qBack">${ic(S.lang === 'ar' ? 'fwd' : 'back', 's')} ${esc(A('رجوع للمنتجات', 'Zurück zu Produkten'))}</button></div>
      <h2 style="margin:0 0 4px">${esc(A('إضافة سريعة بالسكانر', 'Schnell erfassen'))}</h2>
      <p class="note" style="margin:0 0 10px">${esc(A('امسح كل المنتجات ورا بعض ← كل منتج بينزل باللستة مع اسمو وصورتو ← اكتب السعر والكمية ← بالآخر اكبس «إضافة الكل».', 'Alle Produkte nacheinander scannen → jedes erscheint mit Name und Foto → Preis und Menge eintragen → am Ende „Alle hinzufügen“.'))}</p>
      ${pick}
      <details class="card qa-def"${localStorage.getItem('so_qa_open') === '1' ? ' open' : ''}><summary><b>${esc(A('⚙️ إعدادات لكل المنتجات الجاية', '⚙️ Einstellungen für alle folgenden Produkte'))}</b></summary>
        <div class="row" style="margin-top:8px"><label class="f"><span>${esc(A('القسم', 'Kategorie'))}</span><select id="qCat"><option value="">—</option>${cats.map(c => `<option value="${c.id}" ${c.id === D.cat ? 'selected' : ''}>${esc(L(c, 'name'))}</option>`).join('')}</select></label>
          <label class="f"><span>${esc(A('الوحدة', 'Einheit'))}</span><select id="qU"><option value="piece" ${D.unit === 'piece' ? 'selected' : ''}>${esc(A('قطعة', 'Stück'))}</option><option value="kg" ${D.unit === 'kg' ? 'selected' : ''}>${esc(A('بالكيلو', 'pro kg'))}</option></select></label></div>
        <div class="row"><label class="f"><span>${esc(A('الضريبة', 'MwSt'))}</span><select id="qV">${[7, 19, 0].map(v => `<option ${+D.vat === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
          <label class="f"><span>Pfand €</span><input type="number" step="0.01" min="0" id="qPf" value="${esc(D.pfand)}"></label></div>
        <label class="chk"><input type="checkbox" id="qTr" ${D.track ? 'checked' : ''}><span>${esc(A('تتبع المخزون (الكمية)', 'Bestand verfolgen (Menge)'))}</span></label>
        <label class="chk"><input type="checkbox" id="qLk" ${D.look ? 'checked' : ''}><span>${esc(A('جيب الاسم والصورة تلقائياً (الملف ← Open Food Facts ← جوجل)', 'Name und Foto automatisch suchen (Datei → Open Food Facts → Google)'))}</span></label>
        <label class="chk"><input type="checkbox" id="qPro" ${D.pro ? 'checked' : ''}><span>${esc(A('📸 جيب الصورة الرسمية من جوجل (موقع الشركة أو المتاجر الكبيرة)', '📸 Offizielles Foto über Google (Hersteller oder große Shops)'))}</span></label>
        <label class="chk"><input type="checkbox" id="qCut" ${D.cut ? 'checked' : ''}><span>${esc(A('🪄 لصور إنت بتصوّرها بس: شيل الخلفية (أول مرة بينزّل ملف ~60MB)', '🪄 Nur für eigene Fotos: Hintergrund entfernen (1. Mal ~60 MB)'))}</span></label>
        ${S.staff && S.staff.role === 'admin' ? `<button class="btn s o" id="qImp" style="margin-top:8px">${esc(A('📦 قاعدة المنتجات (تحميل مرة وحدة)', '📦 Produktdatei laden (einmalig)'))}</button>` : ''}</details>
      <div class="card qa-scan" id="qScan"><div class="qa-st" id="qSt"></div>
        <div class="acts" style="flex-wrap:nowrap"><input type="text" id="qIn" inputmode="numeric" autocomplete="off" enterkeyhint="go" placeholder="${esc(A('امسح الباركود هون', 'Hier Barcode scannen'))}" style="flex:1;font-size:20px">
          <button class="btn s o" id="qCam" title="Kamera">${ic('camera', 's')}</button><button class="btn s o" id="qNo">${esc(A('بلا باركود', 'Ohne Barcode'))}</button></div>
        <div class="scanbox qa-cam" id="qBox" style="margin-top:8px"></div></div>
      <div id="qList"></div>
      <div class="card" id="qDone"${added.length ? '' : ' hidden'}><h4 style="margin:0 0 6px">${esc(A('انضافوا هلق', 'Gerade angelegt'))} (<span id="qN">${added.length}</span>)</h4><div id="qL"></div></div>
      <div class="qa-bar" id="qBar"><button class="btn" id="qAll" style="flex:1"></button></div>`;
    const inp = $('#qIn');
    inp.onfocus = st; inp.onblur = () => setTimeout(st, 50); st();
    inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); const c = inp.value.trim(); inp.value = ''; if (c) scanned(c); } };
    $('#qBack').onclick = () => { stopCamera(); camOn = false; if (items.length && !confirm(A('في منتجات لسا ما انضافت. أكيد بدك ترجع؟', 'Es gibt noch nicht hinzugefügte Produkte. Wirklich zurück?'))) return; document.removeEventListener('keydown', onKey, true); back(); };
    $('details.qa-def').ontoggle = e => { try { localStorage.setItem('so_qa_open', e.target.open ? '1' : '0'); } catch (_) {} };
    $('#qCat').onchange = e => { D.cat = e.target.value; saveD(); };
    $('#qU').onchange = e => { D.unit = e.target.value; saveD(); };
    $('#qV').onchange = e => { D.vat = +e.target.value; saveD(); };
    $('#qPf').oninput = e => { D.pfand = num(e.target.value) || 0; saveD(); };
    $('#qTr').onchange = e => { D.track = e.target.checked; saveD(); items.forEach(paintItem); };
    $('#qLk').onchange = e => { D.look = e.target.checked; saveD(); };
    $('#qPro').onchange = e => { D.pro = e.target.checked; saveD(); };
    $('#qCut').onchange = e => { D.cut = e.target.checked; saveD(); };
    if ($('#qImp')) $('#qImp').onclick = () => eanImportDlg();
    $('#qNo').onclick = () => scanned('');
    $('#qCam').onclick = () => { if (ST.scanStop) { stopCamera(); camOn = false; $('#qScan').classList.remove('cam'); return; } camOn = true; $('#qScan').classList.add('cam'); startCamera($('#qBox'), c => scanned(String(c).trim())); };
    $('#qAll').onclick = () => review(items);
    paintAll(); paintDone();
    if (!items.length) setTimeout(() => inp.focus(), 50);
  };
  const st = () => {
    const el = $('#qSt'); if (!el) return; const ok = document.activeElement === $('#qIn') || camOn;
    el.className = 'qa-st ' + (ok ? 'ok' : 'wait');
    el.textContent = ok ? A('جاهز: امسح المنتج', 'Bereit: jetzt scannen') : A('اكبس على الخانة أو شغّل الكاميرا قبل ما تمسح', 'Vor dem Scannen ins Feld tippen oder Kamera starten');
  };
  const bar = () => {
    const b = $('#qAll'); if (!b) return; const n = items.length;
    $('#qBar').hidden = !n;
    b.innerHTML = `${ic('check', 's')} ${esc(A(`إضافة الكل (${n})`, `Alle hinzufügen (${n})`))}`;
  };
  /* ----- eine Produkt-Karte ----- */
  const status = it => {
    if (it.loading) return A('عم دوّر على المنتج…', 'Suche Produktdaten…');
    if (it.cutBusy) return A('🪄 عم شيل الخلفية…', '🪄 Hintergrund wird entfernt…');
    if (it.proBusy) return A('📸 عم جيب الصورة الرسمية من جوجل…', '📸 Hole offizielles Foto…');
    if (it.ex) return A('موجود من قبل – بتقدر تغيّر السعر أو تزيد عالمخزون', 'Schon vorhanden – Preis ändern oder Bestand erhöhen');
    if (it.found) return (it.src === 'google' ? A('لقيتو بالإنترنت', 'Im Internet gefunden') : it.src === 'file' ? A('من ملف المنتجات ✓', 'Aus der Produktdatei ✓') : A('لقيت الاسم ✓ اتأكد منو', 'Gefunden ✓ bitte prüfen')) + (it.pro ? A(' • صورة رسمية ✓', ' • Offizielles Foto ✓') : '');
    if (it.found === false) return it.quota ? A('ما لقيتو (حد البحث بالإنترنت خلص لليوم)، اكتب الاسم', 'Nicht gefunden (Internet-Limit für heute), Name eingeben') : A('ما لقيتو، اكتب الاسم أو صوّرو', 'Nicht gefunden, Name eingeben oder fotografieren');
    return '';
  };
  const itemHtml = it => {
    const p = it.ex; const img = it.imgUrl ? `background-image:url('${it.imgUrl}')` : (p ? bgImg(p.image_url) : '');
    return `<div class="qa-it${it.ask ? ' ask' : ''}${it.err ? ' bad' : ''}" data-k="${it.key}">
      <div class="qa-h"><div class="thumb qa-th" style="${img}">${it.cutBusy || it.loading ? '<i class="qa-spin"></i>' : ''}</div>
        <div class="t"><b dir="ltr">${it.code ? esc(it.code) : esc(A('منتج بلا باركود', 'Ohne Barcode'))}</b><small>${esc(status(it))}</small></div>
        <div class="qa-tools"><label class="ib" title="${esc(A('صوّر', 'Foto'))}">${ic('camera', 's')}<input type="file" accept="image/*" capture="environment" data-ph hidden></label>
          ${p || it.loading ? '' : `<button class="ib" data-pro title="${esc(A('صورة احترافية', 'Profi-Foto'))}">📸</button>`}
          <button class="ib" data-rm title="${esc(A('شيل', 'Entfernen'))}">✕</button></div></div>
      ${it.ask ? `<div class="qa-ask"><b>${esc(A('هل هاد هو المنتج؟', 'Ist das das Produkt?'))}</b> <span>${esc(it.name_de)}</span>${it.sources && it.sources.length ? `<small>${esc(A('المصدر', 'Quelle'))}: ${esc(it.sources.join(', '))}</small>` : ''}
        <div class="acts" style="margin-top:6px"><button class="btn s" data-yes style="flex:1">${esc(A('✓ نعم', '✓ Ja'))}</button><button class="btn s o" data-no style="flex:1">${esc(A('✗ لا', '✗ Nein'))}</button></div></div>` : ''}
      ${p ? `<div class="qa-name"><b>${esc(L(p, 'name'))}</b> <small>${esc(L(App.shopById(p.shop_id), 'name'))} • ${App.priceLabel(p)}${p.track_stock ? ' • ' + esc(A('المخزون', 'Bestand')) + ' ' + fq(p.stock, p.unit) : ''}</small></div>
        <div class="row"><label class="f"><span>${esc(A('السعر €', 'Preis €'))}</span><input type="number" step="0.01" min="0" inputmode="decimal" data-f="price" value="${esc(it.price)}"></label>
          <label class="f"><span>${esc(A('زيد عالمخزون', 'Bestand +'))}</span><input type="number" step="1" min="0" inputmode="numeric" data-f="qty" value="${esc(it.qty)}" placeholder="0"></label></div>`
      : `<div class="row"><label class="f"><span>Name Deutsch *</span><input type="text" data-f="name_de" dir="auto" value="${esc(it.name_de)}" maxlength="120"></label>
          <label class="f"><span>الاسم بالعربي</span><input type="text" data-f="name_ar" dir="rtl" value="${esc(it.name_ar)}" maxlength="120" placeholder="${esc(A('إذا تركتو فاضي بينحط الألماني', 'leer = wie Deutsch'))}"></label></div>
        <div class="row3"><label class="f"><span>${esc(A('السعر €', 'Preis €'))} *</span><input type="number" step="0.01" min="0" inputmode="decimal" data-f="price" value="${esc(it.price)}"></label>
          ${D.track ? `<label class="f"><span>${esc(A('كم قطعة', 'Menge'))}</span><input type="number" step="1" min="0" inputmode="numeric" data-f="qty" value="${esc(it.qty)}" placeholder="0"></label>` : ''}
          <label class="f"><span>${esc(A('الضريبة', 'MwSt'))}</span><select data-f="vat">${[7, 19, 0].map(v => `<option ${+it.vat === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>
        ${it.vatHint ? `<p class="note" style="margin:0">${esc(A('ⓘ مشروب: الضريبة 19% عادةً (إلا الحليب).', 'ⓘ Getränk: meist 19 % MwSt (außer Milch).'))}</p>` : ''}`}
      ${it.err ? `<p class="note" style="color:var(--bad);margin:4px 0 0">${esc(it.err)}</p>` : ''}
      <div class="acts" style="margin-top:8px"><button class="btn s o" data-one>${ic('check', 's')} ${esc(A('إضافة هاد بس', 'Nur dieses hinzufügen'))}</button></div></div>`;
  };
  const bindItem = (el, it) => {
    $$('[data-f]', el).forEach(i => {
      const ev = i.tagName === 'SELECT' ? 'onchange' : 'oninput';
      i[ev] = () => { it[i.dataset.f] = i.tagName === 'SELECT' ? +i.value : i.value; if (it.err) { it.err = ''; el.classList.remove('bad'); } };
      i.onkeydown = e => {
        if (e.key !== 'Enter') return; e.preventDefault();
        const fs = $$('input[data-f]', el); const ix = fs.indexOf(i);
        if (ix >= 0 && ix < fs.length - 1) fs[ix + 1].focus(); else if (!camOn) $('#qIn').focus(); else i.blur();
      };
    });
    const ph = $('[data-ph]', el); if (ph) ph.onchange = e => { const f = e.target.files[0]; if (f) { it.own = true; it.pro = false; setImg(it, f, false); } };
    const pr = $('[data-pro]', el); if (pr) pr.onclick = () => findPro(it, true);
    $('[data-rm]', el).onclick = () => { items = items.filter(x => x !== it); el.remove(); bar(); };
    const y = $('[data-yes]', el); if (y) y.onclick = () => { it.ask = false; it.ok = true; paintItem(it); if (D.pro && !it.pro) findPro(it); focusPrice(it); };
    const n = $('[data-no]', el); if (n) n.onclick = () => { Object.assign(it, { ask: false, found: false, src: '', name_de: '', name_ar: '', img: null, imgUrl: '', vat: D.vat, vatHint: false, pro: false }); paintItem(it); const f = $(`[data-k="${it.key}"] [data-f="name_de"]`); if (f) f.focus(); };
    $('[data-one]', el).onclick = () => review([it]);
  };
  const paintItem = it => {
    const old = $(`[data-k="${it.key}"]`); if (!old) return;
    const act = document.activeElement; const af = act && old.contains(act) && act.dataset ? act.dataset.f : null; const pos = af && act.selectionStart;
    const t = document.createElement('div'); t.innerHTML = itemHtml(it); const el = t.firstElementChild;
    old.replaceWith(el); bindItem(el, it);
    if (af) { const n = $(`[data-f="${af}"]`, el); if (n) { n.focus(); try { if (pos != null) n.setSelectionRange(pos, pos); } catch (_) {} } }
  };
  const paintAll = () => {
    const box = $('#qList'); if (!box) return;
    box.innerHTML = items.map(itemHtml).join('');
    items.forEach(it => { const el = $(`[data-k="${it.key}"]`, box); if (el) bindItem(el, it); }); bar();
  };
  const paintDone = () => {
    if (!$('#qL')) return; $('#qDone').hidden = !added.length; $('#qN').textContent = added.length;
    $('#qL').innerHTML = added.slice(0, 60).map(p => `<div class="li" data-qe="${p.id}" style="cursor:pointer"><div class="thumb" style="${bgImg(p.image_url)}"></div><div class="t"><b>${esc(L(p, 'name'))}</b><small>${App.priceLabel(p)}${p.barcode ? ' • ' + esc(p.barcode) : ''}</small></div></div>`).join('');
    $$('[data-qe]').forEach(el => el.onclick = () => { const p = prodBy(el.dataset.qe); if (p) editProduct(p, () => { added = added.map(x => x.id === p.id ? prodBy(p.id) || x : x); paintDone(); }); });
  };
  const focusPrice = it => { if (camOn) return; const f = $(`[data-k="${it.key}"] [data-f="price"]`); if (f) { f.focus(); f.select && f.select(); } };
  const showItem = it => {
    const el = $(`[data-k="${it.key}"]`); if (!el) return;
    el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1200);
    // unter die Kamera/Scan-Leiste scrollen, damit das neue Produkt sichtbar ist
    const sc = $('#qScan'); const off = (sc && camOn ? sc.getBoundingClientRect().height : 0) + 70;
    const y = el.getBoundingClientRect().top + window.scrollY - off;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  };
  /* ----- Fotos ----- */
  const setImg = async (it, blob, pro) => {
    if (!blob) return; if (it.pro && !pro && !it.own) return;
    const my = (it.imgTok = (it.imgTok || 0) + 1);
    // Foto sofort zeigen, die weiße Version kommt danach
    if (!it.imgUrl || pro || it.own) { it.img = blob; it.imgUrl = URL.createObjectURL(blob); paintItem(it); }
    const opt = { cut: D.cut && !pro && it.own, onCut: () => { it.cutBusy = true; paintItem(it); } };
    const p = proFrame(blob, opt); it.imgP = p;
    const f = await p; if (it.imgTok !== my) return;
    it.cutBusy = false; it.img = f; it.imgUrl = URL.createObjectURL(f); it.pro = !!pro; it.cutDone = !!opt.cutDone;
    if (opt.cutFail && D.cut) toast(A('ما قدرت شيل الخلفية بهالجهاز، الصورة انحطت مثل ما هي', 'Hintergrund konnte hier nicht entfernt werden'), 1);
    paintItem(it);
  };
  const findPro = async (it, manual) => {
    const name = it.name_de || it.name_ar; if (!name || it.proBusy) { if (manual && !name) toast(A('اكتب الاسم أول', 'Erst Namen eingeben'), 1); return; }
    it.proBusy = true; paintItem(it);
    try {
      const r = await eanCall({ mode: 'proimg', code: it.code || '', name, brand: (it.gp && it.gp.brand) || '' });
      if (r && r.found && r.image && (manual || !it.own)) { const b = dataUrlBlob(r.image); if (b && (r.pro || r.official || !it.img || manual)) { it.own = false; it.proBusy = false; await setImg(it, b, true); } }
      else if (manual) toast(r && r.error === 'quota' ? A('حد البحث بالإنترنت خلص لليوم', 'Internet-Limit für heute erreicht') : A('ما لقيت صورة احترافية، صوّرها إنت', 'Kein Profi-Foto gefunden, bitte selbst fotografieren'), 1);
    } catch (_) { if (manual) toast(A('ما زبط، جرب كمان مرة', 'Hat nicht geklappt'), 1); }
    finally { it.proBusy = false; paintItem(it); }
  };
  /* ----- Scan ----- */
  const scanned = async code => {
    beepOk();
    const sid = ST.shopSel;
    if (code) {
      const dup = items.find(x => x.code === code);
      if (dup) { dup.qty = String((num(dup.qty) || 0) + 1); paintItem(dup); showItem(dup); toast(A('نفس المنتج: الكمية +1', 'Gleiches Produkt: Menge +1')); return; }
    }
    const ex = code && (S.products.find(x => x.barcode === code && x.shop_id === sid) || S.products.find(x => x.barcode === code && myShops().some(s => s.id === x.shop_id)));
    const it = { key: ++seq, code, ex: ex || null, name_de: '', name_ar: '', price: ex ? ex.price : '', qty: ex ? '' : '', vat: D.vat, pfand: D.pfand, allergens: [], img: null, imgUrl: '', loading: !ex && !!(code && D.look && /^\d{8,14}$/.test(code)) };
    items.unshift(it);
    const box = $('#qList'); const t = document.createElement('div'); t.innerHTML = itemHtml(it); const el = t.firstElementChild; box.prepend(el); bindItem(el, it); bar();
    showItem(it);
    if (ex) { focusPrice(it); return; }
    if (!it.loading) { const f = $('[data-f="name_de"]', el); if (f && !camOn) f.focus(); return; }
    const r = await eanLookup(code);
    it.loading = false;
    const pr = r && r.found && r.product;
    if (pr) {
      if (!it.name_de) it.name_de = String(pr.name_de || '').slice(0, 120); if (!it.name_ar && pr.name_ar) it.name_ar = String(pr.name_ar).trim().slice(0, 120);
      it.allergens = pr.allergens || [];
      if (pr.bev) { it.vat = 19; it.vatHint = true; }
      Object.assign(it, { found: true, src: r.source, ask: !!r.confirm, gp: pr, sources: pr.sources || [] });
      paintItem(it);
      if (pr.image) setImg(it, dataUrlBlob(pr.image), !!pr.pro); else if (pr.image_url) offImage(pr.image_url).then(b => setImg(it, b, false));
      if (D.pro && !pr.pro && !it.ask) findPro(it);
      if (!it.ask && document.activeElement === $('#qIn')) { /* Hand-Scanner: bereit für den nächsten */ }
    } else { it.found = false; if (r && r.error === 'quota') it.quota = true; paintItem(it); }
  };
  /* ----- Bestätigen ----- */
  const check = it => {
    if (it.ask) return A('جاوب أول: هل هاد هو المنتج؟', 'Erst bestätigen: Ist das das Produkt?');
    if (it.ex) return isNaN(num(it.price)) ? A('السعر ناقص', 'Preis fehlt') : '';
    if (!String(it.name_de || it.name_ar || '').trim()) return A('الاسم ناقص', 'Name fehlt');
    if (String(it.price).trim() === '' || isNaN(num(it.price)) || num(it.price) < 0) return A('السعر ناقص', 'Preis fehlt');
    return '';
  };
  const review = list => {
    list = list.filter(Boolean); if (!list.length) return;
    const rows = list.map(it => ({ it, e: check(it), on: !check(it) }));
    const root = modal(`<button class="ib x" data-close>✕</button><h3>${esc(A('تأكيد الإضافة', 'Hinzufügen bestätigen'))}</h3>
      <p class="note" style="margin:0 0 8px">${esc(A('شيّك على المنتجات. شيل علامة ✓ عن أي منتج ما بدك تضيفو هلق.', 'Bitte prüfen. Haken entfernen, wenn ein Produkt jetzt nicht angelegt werden soll.'))}</p>
      <div class="qa-rv">${rows.map((r, i) => { const it = r.it; const p = it.ex; const img = it.imgUrl ? `background-image:url('${it.imgUrl}')` : (p ? bgImg(p.image_url) : '');
        return `<label class="qa-rr${r.e ? ' bad' : ''}"><input type="checkbox" data-i="${i}" ${r.on ? 'checked' : ''} ${r.e ? 'disabled' : ''}><div class="thumb" style="${img}"></div>
          <div class="t"><b>${esc(p ? L(p, 'name') : (it.name_de || it.name_ar || '—'))}</b><small>${r.e ? `<span style="color:var(--bad)">${esc(r.e)}</span>` : `${esc(A('السعر', 'Preis'))} ${esc(money(num(it.price)))}${num(it.qty) ? ' • ' + esc(A(p ? 'زيادة' : 'الكمية', p ? 'Bestand +' : 'Menge')) + ' ' + num(it.qty) : ''}${p ? ' • ' + esc(A('موجود من قبل', 'vorhanden')) : ''}`}</small></div></label>`; }).join('')}</div>
      <div class="acts" style="margin-top:12px"><button class="btn" id="rvOk" style="flex:1"></button><button class="btn o" data-close>${esc(A('رجوع', 'Zurück'))}</button></div>`);
    const upd = () => { const n = $$('[data-i]:checked', root).length; $('#rvOk', root).disabled = !n; $('#rvOk', root).innerHTML = `${ic('check', 's')} ${esc(A(`تأكيد وإضافة (${n})`, `Bestätigen und anlegen (${n})`))}`; };
    $$('[data-i]', root).forEach(c => c.onchange = upd); upd();
    $('#rvOk', root).onclick = async () => {
      const sel = $$('[data-i]:checked', root).map(c => rows[+c.dataset.i].it);
      const b = $('#rvOk', root); b.disabled = true; let ok = 0, i = 0;
      for (const it of sel) { i++; b.textContent = A(`عم ضيف ${i} من ${sel.length}…`, `Lege an ${i} von ${sel.length}…`); if (await saveItem(it)) ok++; }
      closeModal(); paintAll(); paintDone(); beepOk();
      toast(ok === sel.length ? A(`✓ انضافوا ${ok} منتج`, `✓ ${ok} Produkte angelegt`) : A(`انضاف ${ok} من ${sel.length}. شوف الأحمر.`, `${ok} von ${sel.length} angelegt. Rot markierte prüfen.`), ok !== sel.length);
      if (!items.length && !camOn) $('#qIn') && $('#qIn').focus();
    };
  };
  const saveItem = async it => {
    const sid = ST.shopSel;
    try {
      if (it.imgP) await it.imgP.catch(() => {});
      if (it.ex) {
        const p = it.ex; const np = num(it.price); const add = num(it.qty) || 0;
        if (!isNaN(np) && np !== +p.price) { const { error } = await sb.from('products').update({ price: np }).eq('id', p.id); if (error) throw error; p.price = np; }
        if (add) { const { data, error } = await sb.rpc('stock_adjust', { p_product: p.id, p_delta: add, p_reason: 'receive', p_ref: 'Schnell erfassen' }); if (error) throw error; p.stock = data; p.track_stock = true; }
        items = items.filter(x => x !== it); return true;
      }
      const name_de = String(it.name_de || '').trim(), name_ar = String(it.name_ar || '').trim();
      let image_url = null;
      if (it.img) { try { image_url = await uploadImage(it.img, sid, 800); } catch (_) { image_url = null; } }
      const unit = D.unit; const qty = num(it.qty) || 0; const track = D.track && qty > 0 ? true : D.track;
      const o = { shop_id: sid, name_de: name_de || name_ar, name_ar: name_ar || name_de, price: num(it.price), unit, step: unit === 'kg' ? 0.25 : 1, min_qty: unit === 'kg' ? 0.25 : 1, barcode: it.code || null, category_id: D.cat || null,
        vat: [0, 7, 19].includes(+it.vat) ? +it.vat : 7, pfand: num(it.pfand) || 0, track_stock: track, stock: track ? qty : 0, allergens: it.allergens || [], image_url, active: true };
      const { data, error } = await sb.from('products').insert(o).select().single();
      if (error) throw error;
      if (track && qty) { const u = (await sb.auth.getUser()).data.user; await sb.from('stock_moves').insert({ product_id: data.id, shop_id: sid, delta: qty, reason: 'start', user_id: u && u.id }).then(() => {}, () => {}); }
      if (image_url && it.code && /^\d{8,14}$/.test(it.code) && (it.pro || it.own || it.cutDone)) eanCall({ mode: 'setimg', code: it.code, url: image_url, name_de: data.name_de, name_ar: data.name_ar }).catch(() => {});
      if (it.ok && it.src === 'google' && it.code) eanCall({ mode: 'confirm', code: it.code, name_de: data.name_de, name_ar: data.name_ar, brand: it.gp && it.gp.brand, quantity: it.gp && it.gp.quantity, bev: +data.vat === 19, image_url: image_url || '' }).catch(() => {});
      S.products.push(data); added.unshift(data); items = items.filter(x => x !== it); return true;
    } catch (e) { it.err = (e && e.message) || A('صار خطأ', 'Fehler'); return false; }
  };
  // Handscanner tippen sehr schnell und drücken Enter. Landet so ein Scan in einem Feld der Liste,
  // nehmen wir die Ziffern wieder raus und behandeln es als neuen Scan.
  const buf = { s: '', t0: 0, last: 0, el: null, before: '' };
  const onKey = e => {
    if (!document.body.contains(main) || !$('#qIn')) { document.removeEventListener('keydown', onKey, true); return; }
    const el = e.target; if (!el || el.id === 'qIn' || !el.closest || !el.closest('#qList')) return;
    const now = performance.now();
    if (e.key && e.key.length === 1) { if (now - buf.last > 60 || buf.el !== el) { buf.s = ''; buf.t0 = now; buf.el = el; buf.before = el.value; } buf.s += e.key; buf.last = now; return; }
    if (e.key === 'Enter' && buf.el === el && buf.s.length >= 6 && now - buf.last < 80 && (buf.last - buf.t0) / (buf.s.length - 1) < 35) {
      e.preventDefault(); e.stopImmediatePropagation();
      const code = buf.s.trim(); el.value = buf.before; el.dispatchEvent(new Event('input')); buf.s = ''; scanned(code);
    }
  };
  document.addEventListener('keydown', onKey, true);
  draw();
  if (D.cut) setTimeout(() => { try { const id = ++bgSeq; bgJobs[id] = { res() {}, rej() {} }; bgWorker().postMessage({ id, warm: true }); } catch (_) {} }, 800);
  loadBD().catch(() => {});
  if (firstCode) scanned(String(firstCode));
}
async function reloadAll() { try { await App.loadData(); } catch (e) { err(e); } }
function compressImage(file, max) {
  return new Promise((res, rej) => { const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => { const sc = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(b => b ? res(b) : rej(new Error('img')), 'image/jpeg', 0.82); };
    img.onerror = rej; img.src = url; });
}
async function uploadImage(file, folder, max) {
  const blob = await compressImage(file, max || 900);
  const path = `${folder}/${Date.now()}-${App.uid()}.jpg`;
  const { error } = await sb.storage.from('images').upload(path, blob, { contentType: 'image/jpeg', upsert: false, cacheControl: '31536000' });
  if (error) throw error;
  return sb.storage.from('images').getPublicUrl(path).data.publicUrl;
}
function optsToText(opts) { return (opts || []).map(g => ({ name_ar: g.name_ar, name_de: g.name_de, multi: !!g.multi, required: !!g.required, text: g.choices.map(c => `${c.ar} | ${c.de} | ${c.price || 0}`).join('\n') })); }
function editProduct(p, done) {
  const isNew = !p.id; const sh = App.shopById(p.shop_id) || {};
  p = Object.assign({ name_ar: '', name_de: '', desc_ar: '', desc_de: '', price: '', unit: ['butcher', 'deli'].includes(sh.type) ? 'kg' : 'piece', step: '', min_qty: '', barcode: '', image_url: '', track_stock: sh.type === 'supermarket', stock: 0, min_stock: 0, expiry: '', allergens: [], halal: sh.type === 'butcher', cooled: false, pfand: 0, vat: 7, kind: 'normal', options: [], featured: false, active: true, category_id: null, sort: 0 }, p);
  let groups = optsToText(p.options);
  const cats = S.cats.filter(c => c.shop_id === p.shop_id);
  const ck = (id, v, lab) => `<label class="chk"><input type="checkbox" id="${id}" ${v ? 'checked' : ''}><span>${lab}</span></label>`;
  const root = modal(`<button class="ib x" data-close>✕</button><h3>${isNew ? ' ' + esc(A('منتج جديد', 'Neues Produkt')) : ' ' + esc(L(p, 'name'))}</h3>
    <div class="row"><label class="f"><span>الاسم بالعربي *</span><input type="text" id="fNa" value="${esc(p.name_ar)}"></label><label class="f"><span>Name Deutsch *</span><input type="text" id="fNd" value="${esc(p.name_de)}"></label></div>
    <div class="row"><label class="f"><span>الوصف بالعربي</span><textarea id="fDa">${esc(p.desc_ar)}</textarea></label><label class="f"><span>Beschreibung</span><textarea id="fDd">${esc(p.desc_de)}</textarea></label></div>
    <label class="f"><span>${esc(A('القسم', 'Kategorie'))}</span><select id="fCat"><option value="">—</option>${cats.map(c => `<option value="${c.id}" ${c.id === p.category_id ? 'selected' : ''}>${esc(L(c, 'name'))}</option>`).join('')}</select></label>
    <div class="row3"><label class="f"><span>${esc(A('السعر €', 'Preis €'))} *</span><input type="number" step="0.01" min="0" inputmode="decimal" id="fPr" value="${esc(p.price)}"></label>
     <label class="f"><span>${esc(A('الوحدة', 'Einheit'))}</span><select id="fU"><option value="piece" ${p.unit === 'piece' ? 'selected' : ''}>${esc(A('قطعة', 'Stück'))}</option><option value="kg" ${p.unit === 'kg' ? 'selected' : ''}>${esc(A('بالكيلو', 'pro kg'))}</option></select></label>
     <label class="f"><span>${esc(A('الضريبة', 'MwSt'))}</span><select id="fV">${[7, 19, 0].map(v => `<option ${+p.vat === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>
    <div class="row" id="kgRow"><label class="f"><span>${esc(A('خطوة الوزن (كغ)', 'Gewichtsschritt (kg)'))}</span><input type="number" step="0.05" min="0.05" id="fSt" value="${esc(p.step || 0.25)}"></label><label class="f"><span>${esc(A('أقل كمية (كغ)', 'Mindestmenge (kg)'))}</span><input type="number" step="0.05" min="0" id="fMq" value="${esc(p.min_qty || 0.25)}"></label></div>
    <div class="row"><label class="f"><span>${esc(A('الباركود', 'Barcode/EAN'))}</span><div class="acts" style="flex-wrap:nowrap"><input type="text" inputmode="numeric" id="fB" value="${esc(p.barcode || '')}"><button class="btn s o" id="fBs">${ic('camera', 's')}</button></div></label>
     <label class="f"><span>Pfand €</span><input type="number" step="0.01" min="0" id="fPf" value="${esc(p.pfand || 0)}"></label></div>
    <label class="f"><span>${esc(A('الصورة', 'Foto'))}</span><div class="acts"><div class="thumb" id="fImgP" style="width:70px;height:70px;${bgImg(p.image_url)}"></div><input type="file" accept="image/*" id="fImg" style="flex:1">${p.image_url ? `<button class="btn s o" id="fImgX"></button>` : ''}</div></label>
    <div class="grp"><h4>${esc(A('المخزون', 'Lager'))}</h4>${ck('fTs', p.track_stock, esc(A('تتبع المخزون لهالمنتج', 'Bestand verfolgen')))}
     <div class="row3"><label class="f"><span>${esc(A('الكمية الحالية', 'Bestand'))}</span><input type="number" step="0.001" id="fS" value="${esc(p.stock)}" ${isNew ? '' : 'disabled title="→ Lager"'}></label>
     <label class="f"><span>${esc(A('تنبيه تحت', 'Warnung unter'))}</span><input type="number" step="0.001" id="fMs" value="${esc(p.min_stock)}"></label>
     <label class="f"><span>${esc(A('تاريخ الصلاحية MHD', 'MHD'))}</span><input type="date" id="fEx" value="${esc(p.expiry || '')}"></label></div></div>
    <div class="grp"><h4>${esc(A('معلومات', 'Eigenschaften'))}</h4>${ck('fH', p.halal, 'Halal ✓')}${ck('fC', p.cooled, esc(A('مبرّد  (للسائق)', 'Kühlware  (für Fahrer)')))}${ck('fF', p.featured, esc(A('منتج مختار  (بالرئيسية)', 'Empfehlung  (Startseite)')))}${ck('fA', p.active, esc(A('ظاهر بالموقع', 'Sichtbar im Shop')))}
     <label class="f"><span>${esc(A('نوع المنتج', 'Produkttyp'))}</span><select id="fK"><option value="normal">${esc(A('عادي', 'Normal'))}</option><option value="cake" ${p.kind === 'cake' ? 'selected' : ''}>${esc(A('قالب كاتو (تاريخ + كتابة)', 'Torte (Datum + Aufschrift)'))}</option><option value="basket" ${p.kind === 'basket' ? 'selected' : ''}>${esc(A('سلة هدايا (الزبون بيختار)', 'Geschenkkorb (Kunde wählt)'))}</option></select></label></div>
    <div class="grp"><h4>${esc(A('مسببات الحساسية (إجباري قانونياً)', 'Allergene (gesetzlich Pflicht)'))}</h4><div class="row">${Object.keys(ALLERGENS).map(a => `<label class="chk"><input type="checkbox" data-al="${a}" ${(p.allergens || []).includes(a) ? 'checked' : ''}><span>${esc(ALLERGENS[a][S.lang === 'ar' ? 0 : 1])}</span></label>`).join('')}</div></div>
    <div class="grp"><h4>${esc(A('خيارات وإضافات', 'Optionen & Extras'))}</h4><div class="note">${esc(A('كل سطر: عربي | Deutsch | السعر الإضافي. مثلاً: مفروم | Hack | 0', 'Je Zeile: Arabisch | Deutsch | Aufpreis. z. B. مفروم | Hack | 0'))}</div><div id="grpW"></div>
     <button class="btn s o" id="gAdd" style="margin-top:8px">${esc(A('مجموعة خيارات', 'Optionsgruppe'))}</button></div>
    <div class="acts" style="margin-top:14px"><button class="btn" id="fSave" style="flex:1">${esc(A('حفظ', 'Speichern'))}</button>${!isNew ? `<button class="btn o" id="fDup">${esc(A('نسخ', 'Kopieren'))}</button><button class="btn r" id="fDel">${esc(A('حذف', 'Löschen'))}</button>` : ''}</div>`);
  const drawG = () => {
    $('#grpW', root).innerHTML = groups.map((g, i) => `<div class="card" style="padding:10px"><div class="row"><input type="text" data-gna="${i}" placeholder="اسم المجموعة (مثلاً التقطيع)" value="${esc(g.name_ar)}"><input type="text" data-gnd="${i}" placeholder="Gruppe (z. B. Zuschnitt)" value="${esc(g.name_de)}"></div>
      <textarea data-gt="${i}" style="margin-top:6px" placeholder="مفروم | Hack | 0&#10;شقف | Würfel | 0">${esc(g.text)}</textarea>
      <div class="acts"><label class="chk"><input type="checkbox" data-gm="${i}" ${g.multi ? 'checked' : ''}><span>${esc(A('أكتر من خيار', 'Mehrfachauswahl'))}</span></label><label class="chk"><input type="checkbox" data-gr="${i}" ${g.required ? 'checked' : ''}><span>${esc(A('إجباري', 'Pflicht'))}</span></label><button class="btn s r" data-gx="${i}">✕</button></div></div>`).join('');
    $$('[data-gx]', root).forEach(b => b.onclick = () => { readG(); groups.splice(+b.dataset.gx, 1); drawG(); });
  };
  const readG = () => { groups = groups.map((g, i) => ({ name_ar: $(`[data-gna="${i}"]`, root).value, name_de: $(`[data-gnd="${i}"]`, root).value, text: $(`[data-gt="${i}"]`, root).value, multi: $(`[data-gm="${i}"]`, root).checked, required: $(`[data-gr="${i}"]`, root).checked })); };
  drawG();
  $('#gAdd', root).onclick = () => { readG(); groups.push({ name_ar: '', name_de: '', text: '', multi: false, required: false }); drawG(); };
  const kgVis = () => { $('#kgRow', root).hidden = $('#fU', root).value !== 'kg'; }; $('#fU', root).onchange = kgVis; kgVis();
  let img = p.image_url || '';
  $('#fImg', root).onchange = async e => { const f = e.target.files[0]; if (!f) return; toast(''); try { img = await uploadImage(f, p.shop_id); $('#fImgP', root).style.backgroundImage = `url('${safeUrl(img)}')`; toast('✓'); } catch (x) { err(x); } };
  if ($('#fImgX', root)) $('#fImgX', root).onclick = () => { img = ''; $('#fImgP', root).style.backgroundImage = ''; };
  $('#fBs', root).onclick = () => scanOnce(code => { $('#fB', root).value = code; });
  const collect = () => {
    readG();
    const num = id => parseFloat(String($(id, root).value).replace(',', '.')) || 0;
    const options = groups.filter(g => g.text.trim()).map(g => ({ name_ar: g.name_ar.trim() || g.name_de.trim(), name_de: g.name_de.trim() || g.name_ar.trim(), multi: g.multi, required: g.required,
      choices: g.text.split('\n').map(l => l.split('|').map(x => x.trim())).filter(x => x[0]).map(x => ({ ar: x[0], de: x[1] || x[0], price: parseFloat(String(x[2] || '0').replace(',', '.')) || 0 })) }));
    const unit = $('#fU', root).value;
    const o = { shop_id: p.shop_id, name_ar: $('#fNa', root).value.trim(), name_de: $('#fNd', root).value.trim(), desc_ar: $('#fDa', root).value.trim(), desc_de: $('#fDd', root).value.trim(),
      category_id: $('#fCat', root).value || null, price: num('#fPr'), unit, step: unit === 'kg' ? (num('#fSt') || 0.25) : 1, min_qty: unit === 'kg' ? (num('#fMq') || num('#fSt') || 0.25) : 1,
      barcode: $('#fB', root).value.trim() || null, image_url: img || null, track_stock: $('#fTs', root).checked, min_stock: num('#fMs'), expiry: $('#fEx', root).value || null,
      allergens: $$('[data-al]:checked', root).map(x => x.dataset.al), halal: $('#fH', root).checked, cooled: $('#fC', root).checked, featured: $('#fF', root).checked, active: $('#fA', root).checked,
      pfand: num('#fPf'), vat: +$('#fV', root).value, kind: $('#fK', root).value, options };
    if (isNew) o.stock = num('#fS');
    if (!o.name_ar && !o.name_de) { toast(A('اكتب اسم المنتج', 'Name fehlt'), 1); return null; }
    if (!o.name_ar) o.name_ar = o.name_de; if (!o.name_de) o.name_de = o.name_ar;
    return o;
  };
  $('#fSave', root).onclick = async () => {
    const o = collect(); if (!o) return;
    $('#fSave', root).disabled = true;
    const q = isNew ? sb.from('products').insert(o).select().single() : sb.from('products').update(o).eq('id', p.id).select().single();
    const { data, error } = await q; $('#fSave', root).disabled = false;
    if (error) return err(error);
    if (isNew && o.stock) await sb.from('stock_moves').insert({ product_id: data.id, shop_id: o.shop_id, delta: o.stock, reason: 'start', user_id: (await sb.auth.getUser()).data.user.id }).then(() => {}, () => {});
    toast('✓'); closeModal(); await reloadAll(); done();
  };
  if ($('#fDup', root)) $('#fDup', root).onclick = () => { const o = collect(); if (!o) return; closeModal(); editProduct(Object.assign({}, o, { name_ar: o.name_ar + ' (2)', name_de: o.name_de + ' (2)', barcode: '', stock: 0 }), done); };
  if ($('#fDel', root)) $('#fDel', root).onclick = async () => {
    if (!confirm(A('حذف المنتج نهائياً؟', 'Produkt endgültig löschen?'))) return;
    const { error } = await sb.from('products').delete().eq('id', p.id); if (error) return err(error);
    closeModal(); await reloadAll(); done();
  };
}
function editCats(sid, done) {
  const draw = () => {
    const cats = S.cats.filter(c => c.shop_id === sid);
    const root = modal(`<button class="ib x" data-close>✕</button><h3>${esc(A('الأقسام', 'Kategorien'))}</h3>
      ${cats.map(c => `<div class="li"><input type="number" data-cs="${c.id}" value="${c.sort}" style="width:64px"><input type="text" data-ca="${c.id}" value="${esc(c.name_ar)}"><input type="text" data-cd="${c.id}" value="${esc(c.name_de)}"><button class="btn s r" data-cx="${c.id}">✕</button></div>`).join('')}
      <div class="li"><span></span><input type="text" id="nca" placeholder="بالعربي"><input type="text" id="ncd" placeholder="Deutsch"></div>
      <button class="btn full" id="csave" style="margin-top:10px">${esc(A('حفظ', 'Speichern'))}</button>`);
    $$('[data-cx]', root).forEach(b => b.onclick = async () => { if (!confirm(A('حذف القسم؟ المنتجات بتضل.', 'Kategorie löschen? Produkte bleiben.'))) return; const { error } = await sb.from('categories').delete().eq('id', b.dataset.cx); if (error) return err(error); await reloadAll(); draw(); });
    $('#csave', root).onclick = async () => {
      const ups = cats.map(c => ({ id: c.id, shop_id: sid, sort: +$(`[data-cs="${c.id}"]`, root).value || 0, name_ar: $(`[data-ca="${c.id}"]`, root).value.trim(), name_de: $(`[data-cd="${c.id}"]`, root).value.trim() }));
      const na = $('#nca', root).value.trim(), nd = $('#ncd', root).value.trim();
      if (na || nd) ups.push({ shop_id: sid, sort: cats.length + 1, name_ar: na || nd, name_de: nd || na });
      if (ups.length) { const { error } = await sb.from('categories').upsert(ups); if (error) return err(error); }
      await reloadAll(); toast('✓'); if (na || nd) draw(); else { closeModal(); done(); }
    };
  };
  draw();
}
function parseCsv(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split('\n')[0]; const d = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : (first.includes('\t') ? '\t' : ',');
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) { const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true; else if (ch === d) { row.push(cur); cur = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; } else cur += ch; }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim()));
}
const CSV_COLS = ['name_ar', 'name_de', 'price', 'unit', 'category', 'barcode', 'stock', 'min_stock', 'vat', 'pfand', 'halal', 'cooled', 'allergens', 'desc_ar', 'desc_de', 'expiry'];
function downloadFile(name, text) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
const csvCell = v => { v = v == null ? '' : String(v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
function exportCsv(sid) {
  const cats = Object.fromEntries(S.cats.map(c => [c.id, c.name_de]));
  const rows = S.products.filter(p => p.shop_id === sid).map(p => [p.name_ar, p.name_de, String(p.price).replace('.', ','), p.unit, cats[p.category_id] || '', p.barcode || '', String(p.stock).replace('.', ','), String(p.min_stock).replace('.', ','), p.vat, String(p.pfand).replace('.', ','), p.halal ? 1 : 0, p.cooled ? 1 : 0, (p.allergens || []).join(','), p.desc_ar, p.desc_de, p.expiry || '']);
  downloadFile(`produkte-${sid}.csv`, [CSV_COLS].concat(rows).map(r => r.map(csvCell).join(';')).join('\n'));
}
function importCsv(sid, done) {
  const root = modal(`<button class="ib x" data-close>✕</button><h3>${esc(A('استيراد منتجات', 'Produkte importieren'))}</h3>
    <p class="note">${esc(A('بالـ Excel: احفظ الملف كـ "CSV". الأعمدة: name_ar, name_de, price, unit (piece/kg), category, barcode, stock, min_stock, vat, pfand, halal (1/0), cooled (1/0), allergens, desc_ar, desc_de, expiry. إذا الباركود موجود، المنتج بيتحدّث.', 'In Excel als „CSV“ speichern. Spalten: name_ar, name_de, price, unit (piece/kg), category, barcode, stock, min_stock, vat, pfand, halal (1/0), cooled (1/0), allergens, desc_ar, desc_de, expiry. Gleicher Barcode → Produkt wird aktualisiert.'))}</p>
    <button class="btn s o" id="tpl">⬇ ${esc(A('نموذج فاضي', 'Vorlage herunterladen'))}</button>
    <label class="f"><span>CSV</span><input type="file" accept=".csv,text/csv,.txt" id="csvF"></label><div id="csvP" class="note"></div>
    <button class="btn full" id="csvGo" disabled>${esc(A('استيراد', 'Importieren'))}</button>`);
  $('#tpl', root).onclick = () => downloadFile('vorlage-produkte.csv', CSV_COLS.join(';') + '\nحليب طازج;Frische Milch;1,29;piece;Milchprodukte;4001234567890;20;5;7;0;0;1;milk;;;\nلحم غنم;Lammfleisch;18,90;kg;Lamm;;10;2;7;0;1;1;;;;');
  let rows = [];
  $('#csvF', root).onchange = async e => {
    const f = e.target.files[0]; if (!f) return; const text = await f.text(); const all = parseCsv(text);
    const head = all[0].map(h => h.trim().toLowerCase()); rows = all.slice(1).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()]))).filter(r => r.name_ar || r.name_de);
    $('#csvP', root).textContent = `${rows.length} ${A('منتج جاهز', 'Produkte gefunden')}`; $('#csvGo', root).disabled = !rows.length;
  };
  $('#csvGo', root).onclick = async () => {
    $('#csvGo', root).disabled = true;
    const num = v => parseFloat(String(v || '0').replace(/\./g, (m, i, s) => (s.indexOf(',') >= 0 ? '' : '.')).replace(',', '.')) || 0;
    const catMap = {}; S.cats.filter(c => c.shop_id === sid).forEach(c => { catMap[c.name_de.toLowerCase()] = c.id; catMap[c.name_ar.toLowerCase()] = c.id; });
    const newCats = [...new Set(rows.map(r => r.category).filter(c => c && !catMap[c.toLowerCase()]))];
    if (newCats.length) { const { data, error } = await sb.from('categories').insert(newCats.map((c, i) => ({ shop_id: sid, name_ar: c, name_de: c, sort: 100 + i }))).select(); if (error) return err(error); data.forEach(c => catMap[c.name_de.toLowerCase()] = c.id); }
    const byBar = {}; S.products.filter(p => p.shop_id === sid && p.barcode).forEach(p => byBar[p.barcode] = p);
    const ins = [], upd = [];
    rows.forEach(r => {
      const o = { shop_id: sid, name_ar: r.name_ar || r.name_de, name_de: r.name_de || r.name_ar, price: num(r.price), unit: /kg/i.test(r.unit) ? 'kg' : 'piece', category_id: r.category ? catMap[r.category.toLowerCase()] || null : null,
        barcode: r.barcode || null, min_stock: num(r.min_stock), vat: [0, 7, 19].includes(+r.vat) ? +r.vat : 7, pfand: num(r.pfand), halal: /^(1|ja|yes|true|x)$/i.test(r.halal || ''), cooled: /^(1|ja|yes|true|x)$/i.test(r.cooled || ''),
        allergens: (r.allergens || '').split(/[,\s]+/).filter(a => ALLERGENS[a]), desc_ar: r.desc_ar || '', desc_de: r.desc_de || '', expiry: /^\d{4}-\d{2}-\d{2}$/.test(r.expiry || '') ? r.expiry : null };
      if (o.unit === 'kg') { o.step = 0.25; o.min_qty = 0.25; }
      if (r.stock !== undefined && r.stock !== '') { o.track_stock = true; o.stock = num(r.stock); }
      if (o.barcode && byBar[o.barcode]) upd.push(Object.assign({ id: byBar[o.barcode].id }, o)); else ins.push(o);
    });
    try {
      for (let i = 0; i < ins.length; i += 400) { const { error } = await sb.from('products').insert(ins.slice(i, i + 400)); if (error) throw error; }
      for (let i = 0; i < upd.length; i += 400) { const { error } = await sb.from('products').upsert(upd.slice(i, i + 400)); if (error) throw error; }
    } catch (e) { $('#csvGo', root).disabled = false; return err(e); }
    toast(`✓ ${ins.length} + ${upd.length}`); closeModal(); await reloadAll(); done();
  };
}

/* ---------- stock ---------- */
async function secStock(main) {
  let tab = ST.stockTab || 'over';
  const draw = async () => {
    const pick = shopPicker(draw); const sid = ST.shopSel; ST.stockTab = tab;
    main.innerHTML = pick + `<div class="tabs">${[['over', ' نظرة عامة', ' Übersicht'], ['count', ' جرد', ' Inventur'], ['in', ' استلام بضاعة', ' Wareneingang'], ['move', ' نقل بين المحلات', ' Umlagerung'], ['log', ' السجل', ' Bewegungen']].map(x => `<button data-st="${x[0]}" class="${tab === x[0] ? 'on' : ''}">${esc(A(x[1], x[2]))}</button>`).join('')}</div><div id="sb"></div>`;
    $$('[data-st]').forEach(b => b.onclick = () => { tab = b.dataset.st; draw(); });
    const box = $('#sb'); const ps = S.products.filter(p => p.shop_id === sid);
    const warnDays = +(S.settings.expiry_warn_days || 3); const lim = new Date(Date.now() + warnDays * 86400000).toISOString().slice(0, 10); const today = new Date().toISOString().slice(0, 10);
    if (tab === 'over') {
      const low = ps.filter(p => p.track_stock && +p.stock <= +p.min_stock);
      const exp = ps.filter(p => p.expiry && p.expiry <= lim).sort((a, b) => a.expiry.localeCompare(b.expiry));
      const val = ps.filter(p => p.track_stock).reduce((s, p) => s + Math.max(0, +p.stock) * +p.price, 0);
      box.innerHTML = `<div class="kpis"><div class="kpi"><small>${esc(A('منتجات', 'Produkte'))}</small><b>${ps.length}</b></div><div class="kpi"><small>${esc(A('قربت تخلص', 'Niedriger Bestand'))}</small><b style="color:var(--bad)">${low.length}</b></div>
         <div class="kpi"><small>${esc(A('صلاحية قريبة', 'MHD bald'))}</small><b style="color:var(--warn)">${exp.length}</b></div><div class="kpi"><small>${esc(A('قيمة المخزون (سعر البيع)', 'Lagerwert (VK)'))}</small><b>${money(val)}</b></div></div>
        <div class="card"><h3>${esc(A('قربت تخلص', 'Niedriger Bestand'))}</h3>${low.length ? low.map(p => `<div class="li"><div class="t"><b>${esc(L(p, 'name'))}</b><small>${esc(A('موجود:', 'Bestand:'))} ${fq(p.stock, p.unit)} • ${esc(A('الحد:', 'Mindest:'))} ${fq(p.min_stock, p.unit)}</small></div><button class="btn s o" data-rcv="${p.id}">${ic('inbox', 's')}</button></div>`).join('') + `<button class="btn s" id="ordSup" style="margin-top:10px">${esc(A('اطلب من المورد', 'Beim Lieferanten bestellen'))}</button>` : `<div class="note">✓</div>`}</div>
        <div class="card"><h3>${esc(A('الصلاحية (MHD) خلال', 'MHD innerhalb'))} ${warnDays} ${esc(A('أيام', 'Tagen'))}</h3>${exp.length ? exp.map(p => `<div class="li"><div class="t"><b>${esc(L(p, 'name'))}</b><small>${esc(p.expiry)} ${p.expiry < today ? ' ' + esc(A('منتهي', 'abgelaufen')) : ''}</small></div><button class="btn s o" data-ed="${p.id}">${ic('edit', 's')}</button></div>`).join('') : `<div class="note">✓</div>`}</div>`;
      $$('[data-rcv]', box).forEach(b => b.onclick = () => receiveDlg(prodBy(b.dataset.rcv), draw));
      $$('[data-ed]', box).forEach(b => b.onclick = () => editProduct(prodBy(b.dataset.ed), draw));
      if ($('#ordSup')) $('#ordSup').onclick = () => supplierOrder(sid, low);
    } else if (tab === 'count') {
      box.innerHTML = `<p class="note">${esc(A('اكتب الكمية اللي عدّيتها لكل منتج، بعدين اضغط "حفظ الجرد". أو استعمل الماسح ← وضع الجرد.', 'Gezählte Menge eintragen und „Inventur speichern“. Oder Scanner → Inventur-Modus.'))}</p>
        <input type="search" id="cq" placeholder="${esc(A('بحث', 'Suche'))}" style="margin-bottom:8px"><div class="tw"><table class="tbl"><thead><tr><th>${esc(A('المنتج', 'Produkt'))}</th><th>${esc(A('بالنظام', 'System'))}</th><th>${esc(A('المعدود', 'Gezählt'))}</th></tr></thead><tbody id="ctb"></tbody></table></div>
        <button class="btn full" id="csv" style="margin-top:10px">${esc(A('حفظ الجرد', 'Inventur speichern'))}</button>`;
      const counts = {};
      const rowsH = () => { const q = $('#cq').value.trim().toLowerCase(); $('#ctb').innerHTML = ps.filter(p => !q || (p.name_ar + p.name_de + (p.barcode || '')).toLowerCase().includes(q)).slice(0, 500).map(p => `<tr><td>${esc(L(p, 'name'))}</td><td>${p.track_stock ? fq(p.stock, p.unit) : '—'}</td><td><input type="number" step="0.001" inputmode="decimal" data-cn="${p.id}" value="${counts[p.id] != null ? counts[p.id] : ''}" style="width:100px;padding:6px"></td></tr>`).join('');
        $$('[data-cn]').forEach(i => i.oninput = () => { if (i.value === '') delete counts[i.dataset.cn]; else counts[i.dataset.cn] = parseFloat(i.value.replace(',', '.')); }); };
      $('#cq').oninput = rowsH; rowsH();
      $('#csv').onclick = async () => { const ids = Object.keys(counts).filter(k => !isNaN(counts[k])); if (!ids.length) return;
        for (const id of ids) { const { error } = await sb.rpc('stock_set', { p_product: id, p_count: counts[id], p_ref: 'Inventur ' + new Date().toLocaleDateString('de-DE') }); if (error) return err(error); }
        toast(`✓ ${ids.length}`); await reloadAll(); draw(); };
    } else if (tab === 'in') {
      box.innerHTML = `<p class="note">${esc(A('امسح الباركود أو ابحث عن المنتج وزيد الكمية اللي وصلت.', 'Barcode scannen oder Produkt suchen und gelieferte Menge buchen.'))}</p>
        <div class="acts" style="flex-wrap:nowrap"><input type="search" id="iq" placeholder="${esc(A('بحث أو باركود', 'Suche oder Barcode'))}"><button class="btn o" id="isc">${ic('camera', 's')}</button></div><div id="ires" style="margin-top:8px"></div>`;
      const res = () => { const q = $('#iq').value.trim().toLowerCase(); if (!q) { $('#ires').innerHTML = ''; return; }
        const r = ps.filter(p => (p.barcode && p.barcode === q) || (p.name_ar + ' ' + p.name_de).toLowerCase().includes(q)).slice(0, 30);
        $('#ires').innerHTML = r.map(p => `<div class="li"><div class="t"><b>${esc(L(p, 'name'))}</b><small>${p.track_stock ? fq(p.stock, p.unit) : '—'}</small></div><button class="btn s" data-rcv="${p.id}">${esc(A('استلام', 'Buchen'))}</button></div>`).join('') || `<div class="note">${esc(A('ما لقيت', 'Nicht gefunden'))}</div>`;
        $$('[data-rcv]', box).forEach(b => b.onclick = () => receiveDlg(prodBy(b.dataset.rcv), draw)); };
      $('#iq').oninput = res; $('#isc').onclick = () => scanOnce(c => { $('#iq').value = c; res(); const p = ps.find(x => x.barcode === c); if (p) receiveDlg(p, draw); });
    } else if (tab === 'move') {
      const others = S.shops.filter(s => s.id !== sid);
      box.innerHTML = `<p class="note">${esc(A('انقل بضاعة من هالمحل لمحل تاني بالباساج. إذا المنتج مش موجود بالمحل التاني، بينعمل نسخة مخفية.', 'Ware an ein anderes Geschäft der Passage umbuchen. Fehlt das Produkt dort, wird eine versteckte Kopie angelegt.'))}</p>
        <label class="f"><span>${esc(A('المنتج', 'Produkt'))}</span><select id="mp">${ps.filter(p => p.kind !== 'basket').map(p => `<option value="${p.id}">${esc(L(p, 'name'))} (${p.track_stock ? fq(p.stock, p.unit) : '—'})</option>`).join('')}</select></label>
        <div class="row"><label class="f"><span>${esc(A('لمحل', 'An Geschäft'))}</span><select id="mt">${others.map(s => `<option value="${s.id}">${esc(L(s, 'name'))}</option>`).join('')}</select></label>
        <label class="f"><span>${esc(A('الكمية', 'Menge'))}</span><input type="number" step="0.001" id="mq" inputmode="decimal"></label></div><button class="btn full" id="mgo">${esc(A('نقل', 'Umbuchen'))}</button>`;
      $('#mgo').onclick = async () => { const q = parseFloat(($('#mq').value || '').replace(',', '.')); if (!(q > 0)) return;
        const { error } = await sb.rpc('stock_transfer', { p_product: $('#mp').value, p_target: $('#mt').value, p_qty: q }); if (error) return err(error); toast('✓'); await reloadAll(); draw(); };
    } else {
      box.innerHTML = '<div class="empty">…</div>';
      const { data, error } = await sb.from('stock_moves').select('*').eq('shop_id', sid).order('created_at', { ascending: false }).limit(300);
      if (error) return err(error);
      const R = { order: ['طلب', 'Bestellung'], manual: ['يدوي', 'Manuell'], inventory: ['جرد', 'Inventur'], receive: ['استلام', 'Wareneingang'], transfer: ['نقل', 'Umlagerung'], waste: ['تالف', 'Schwund'], weight: ['تعديل وزن', 'Gewicht'], return: ['مرتجع', 'Rückbuchung'], start: ['بداية', 'Anfangsbestand'] };
      box.innerHTML = data.length ? `<div class="tw"><table class="tbl"><thead><tr><th>${esc(A('الوقت', 'Zeit'))}</th><th>${esc(A('المنتج', 'Produkt'))}</th><th>±</th><th>${esc(A('السبب', 'Grund'))}</th></tr></thead><tbody>${data.map(m => { const p = prodBy(m.product_id); return `<tr><td>${fmtDate(m.created_at)}</td><td>${esc(p ? L(p, 'name') : '?')}</td><td style="color:${m.delta < 0 ? 'var(--bad)' : 'var(--ok)'}">${m.delta > 0 ? '+' : ''}${(+m.delta).toLocaleString('de-DE')}</td><td>${esc(R[m.reason] ? A(R[m.reason][0], R[m.reason][1]) : m.reason)} ${esc(m.ref || '')}</td></tr>`; }).join('')}</tbody></table></div>` : `<div class="empty">–</div>`;
    }
  };
  draw();
}
function receiveDlg(p, done) {
  const root = modal(`<button class="ib x" data-close>✕</button><h3>${esc(L(p, 'name'))}</h3><div class="note">${esc(A('الموجود حالياً:', 'Aktueller Bestand:'))} <b>${p.track_stock ? fq(p.stock, p.unit) : '—'}</b></div>
    <div class="seg" id="rm" style="margin:10px 0"><button data-v="receive" class="on">${esc(A('استلام', 'Eingang'))}</button><button data-v="waste">${esc(A('تالف', 'Schwund'))}</button><button data-v="set">${esc(A('تحديد', 'Setzen'))}</button></div>
    <label class="f"><span>${esc(A('الكمية', 'Menge'))} (${p.unit === 'kg' ? 'kg' : esc(A('قطعة', 'Stück'))})</span><input type="number" step="0.001" inputmode="decimal" id="rq" autofocus></label>
    <label class="f"><span>${esc(A('ملاحظة (مثلاً المورد أو رقم الفاتورة)', 'Notiz (z. B. Lieferant, Rechnungsnr.)'))}</span><input type="text" id="rn"></label>
    <label class="f"><span>${esc(A('صلاحية جديدة (اختياري)', 'Neues MHD (optional)'))}</span><input type="date" id="re" value="${esc(p.expiry || '')}"></label>
    <button class="btn full" id="rgo">${esc(A('حفظ', 'Speichern'))}</button>`);
  let mode = 'receive';
  $$('#rm button', root).forEach(b => b.onclick = () => { mode = b.dataset.v; $$('#rm button', root).forEach(x => x.classList.toggle('on', x === b)); });
  $('#rgo', root).onclick = async () => {
    const q = parseFloat(($('#rq', root).value || '').replace(',', '.')); if (isNaN(q)) return;
    const ref = $('#rn', root).value.trim();
    const r = mode === 'set' ? await sb.rpc('stock_set', { p_product: p.id, p_count: q, p_ref: ref || 'Korrektur' }) : await sb.rpc('stock_adjust', { p_product: p.id, p_delta: mode === 'waste' ? -Math.abs(q) : Math.abs(q), p_reason: mode, p_ref: ref });
    if (r.error) return err(r.error);
    const ex = $('#re', root).value || null; if (ex !== (p.expiry || null)) await sb.from('products').update({ expiry: ex }).eq('id', p.id);
    toast('✓ ' + fq(r.data, p.unit)); closeModal(); await reloadAll(); if (done) done();
  };
}
async function supplierOrder(sid, items) {
  const { data } = await sb.from('suppliers').select('*').eq('shop_id', sid);
  const sh = App.shopById(sid);
  const txt = `Bestellung – ${sh.name_de} (Stein & Olive, ${S.settings.address || ''})\n\n` + items.map(p => `• ${p.name_de}${p.barcode ? ' (' + p.barcode + ')' : ''}: ${A('الكمية', 'Menge')} ____ (${A('موجود', 'Bestand')} ${fq(p.stock, p.unit)})`).join('\n') + '\n\nDanke!';
  const root = modal(`<button class="ib x" data-close>✕</button><h3>${esc(A('طلب من المورد', 'Lieferanten-Bestellung'))}</h3><textarea id="sotx" style="min-height:220px">${esc(txt)}</textarea>
    <div style="margin-top:10px">${(data || []).map(s => `<div class="li"><div class="t"><b>${esc(s.name)}</b><small>${esc(s.phone)} ${esc(s.email)}</small></div>${s.phone ? `<button class="btn s" data-wa="${esc(s.phone)}">WhatsApp</button>` : ''}${s.email ? `<button class="btn s o" data-em="${esc(s.email)}">E-Mail</button>` : ''}</div>`).join('') || `<div class="note">${esc(A('ضيف موردين من قسم "الموردين"', 'Lieferanten unter „Lieferanten“ anlegen'))}</div>`}</div>
    <button class="btn o full" id="socp" style="margin-top:8px">${esc(A('نسخ النص', 'Text kopieren'))}</button>`);
  $$('[data-wa]', root).forEach(b => b.onclick = () => window.open('https://wa.me/' + b.dataset.wa.replace(/\D/g, '').replace(/^0/, '49') + '?text=' + encodeURIComponent($('#sotx', root).value), '_blank'));
  $$('[data-em]', root).forEach(b => b.onclick = () => location.href = 'mailto:' + b.dataset.em + '?subject=' + encodeURIComponent('Bestellung ' + sh.name_de) + '&body=' + encodeURIComponent($('#sotx', root).value));
  $('#socp', root).onclick = () => { navigator.clipboard.writeText($('#sotx', root).value).then(() => toast('✓')); };
}

/* ---------- scanner ---------- */
let h5lib = null;
function loadH5() { if (h5lib) return h5lib; h5lib = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'lib/html5-qrcode.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); return h5lib; }
// Prüfziffer von EAN-8 / UPC-A / EAN-13 / EAN-14 kontrollieren (verhindert falsch gelesene Nummern)
function eanOk(c) {
  if (!/^(\d{8}|\d{12,14})$/.test(c)) return true;
  const d = c.split('').map(Number); const chk = d.pop(); let sum = 0;
  d.reverse().forEach((n, i) => { sum += n * (i % 2 === 0 ? 3 : 1); });
  return (10 - sum % 10) % 10 === chk;
}
// Gibt jeden Code nur einmal weiter; Zahlen-Barcodes erst, wenn Prüfziffer stimmt und sie 2× gleich gelesen wurden
function codeFilter(onCode) {
  let last = '', lastT = 0, cand = '', candT = 0;
  return raw => {
    const c = String(raw || '').trim(); if (!c) return; const now = Date.now();
    if (/^\d+$/.test(c)) {
      if (!eanOk(c)) return;
      // EAN-13 mit richtiger Prüfziffer sofort nehmen; kürzere Codes (EAN-8/UPC) zur Sicherheit 2× lesen
      if (!(c.length === 13 || c.length === 14) && (c !== cand || now - candT > 1500)) { cand = c; candT = now; return; }
    }
    if (c === last && now - lastT < 2500) return;
    last = c; lastT = now; cand = '';
    try { navigator.vibrate && navigator.vibrate(60); } catch (_) {}
    onCode(c);
  };
}
function camFrame(box) {
  box.innerHTML = `<div class="scanwrap"><div class="scanvid"></div><div class="scanguide"><i></i></div><button type="button" class="scantorch" hidden>💡</button></div>
    <div class="scanhint">${esc(A('حط الباركود بالعرض جوّا المربع، وبعّد التلفون شي شبر (15–20 سم) لحتى يصير واضح. إذا ما قرا، اكبس عالصورة لتركّز.', 'Barcode quer ins Feld halten, ca. 15–20 cm Abstand, bis es scharf ist. Tippen = scharf stellen.'))}</div>`;
  return box.querySelector('.scanvid');
}
async function camTune(track, box) {
  try {
    const caps = track.getCapabilities ? track.getCapabilities() : {};
    const adv = {};
    if ((caps.focusMode || []).includes('continuous')) adv.focusMode = 'continuous';
    if (caps.zoom && caps.zoom.max >= 1.5) adv.zoom = Math.min(caps.zoom.max, 1.6); // leicht zoomen → Handy weiter weg halten → schärfer
    if (Object.keys(adv).length) await track.applyConstraints({ advanced: [adv] }).catch(() => {});
    const tb = box.querySelector('.scantorch');
    if (caps.torch && tb) { let on = false; tb.hidden = false; tb.onclick = e => { e.stopPropagation(); on = !on; track.applyConstraints({ advanced: [{ torch: on }] }).catch(() => {}); tb.classList.toggle('on', on); }; }
    const wrap = box.querySelector('.scanwrap');
    if (wrap && (caps.focusMode || []).includes('single-shot')) wrap.onclick = () => track.applyConstraints({ advanced: [{ focusMode: 'single-shot' }] }).then(() => adv.focusMode && track.applyConstraints({ advanced: [{ focusMode: adv.focusMode }] })).catch(() => {});
  } catch (_) { /* Kamera ohne Extras */ }
}
// Barcode-Leser: Chrome/Android haben ihn eingebaut; iPhone & Co. bekommen ZXing (WebAssembly, lib/bd) – gleich schnell.
let bdLib = null;
function loadBD() {
  if (bdLib) return bdLib;
  bdLib = new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'lib/bd/barcode-detector.js'; sc.onload = () => {
    try { const api = window.BarcodeDetectionAPI; api.setZXingModuleOverrides({ locateFile: (f) => new URL('lib/bd/' + f, document.baseURI).href }); res(api.BarcodeDetector); } catch (e) { rej(e); } }; sc.onerror = rej; document.head.appendChild(sc); });
  return bdLib;
}
async function makeDetector() {
  const F = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'code_128', 'code_39', 'itf'];
  if ('BarcodeDetector' in window) { try { const f = await window.BarcodeDetector.getSupportedFormats(); if (f.includes('ean_13')) return new window.BarcodeDetector({ formats: F.filter(x => f.includes(x)) }); } catch (_) {} }
  const BD = await loadBD(); return new BD({ formats: F });
}
async function startCamera(box, onCode) {
  stopCamera();
  const emit = codeFilter(onCode);
  const HD = { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } };
  let stream = null, alive = true;
  ST.scanStop = () => { alive = false; if (stream) stream.getTracks().forEach(t => t.stop()); box.innerHTML = ''; };
  try {
    const detP = makeDetector(); // Leser lädt parallel zur Kamera
    try { stream = await navigator.mediaDevices.getUserMedia({ video: HD, audio: false }); } catch (_) { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }); }
    if (!alive) { stream.getTracks().forEach(t => t.stop()); return; }
    const holder = camFrame(box);
    const v = document.createElement('video'); v.setAttribute('playsinline', ''); v.setAttribute('muted', ''); v.muted = true; v.autoplay = true; v.srcObject = stream; holder.appendChild(v); await v.play().catch(() => {});
    camTune(stream.getVideoTracks()[0], box);
    const det = await detP;
    // nur den Bereich im Rahmen lesen (mittleres Band) → schneller und genauer; jedes 3. Bild das ganze Bild
    const cv = document.createElement('canvas'); const cx = cv.getContext('2d', { willReadFrequently: true }); let n = 0;
    const loop = async () => {
      if (!alive) return;
      try {
        if (v.readyState >= 2 && v.videoWidth) {
          const W = v.videoWidth, H = v.videoHeight; let r;
          if (n++ % 3 === 2) r = await det.detect(v);
          else {
            const sw = Math.round(W * 0.9), sh = Math.round(H * 0.5), sx = Math.round((W - sw) / 2), sy = Math.round((H - sh) / 2);
            const k = Math.min(1, 1280 / sw); cv.width = Math.round(sw * k); cv.height = Math.round(sh * k);
            cx.drawImage(v, sx, sy, sw, sh, 0, 0, cv.width, cv.height); r = await det.detect(cv);
          }
          for (const x of r || []) emit(x.rawValue);
        }
      } catch (_) {}
      if (alive) setTimeout(loop, 60);
    };
    loop();
  } catch (e) {
    ST.scanStop && ST.scanStop(); ST.scanStop = null;
    box.innerHTML = `<div class="note" style="padding:14px">${esc(A('الكاميرا مش شغالة. اسمح للموقع باستعمال الكاميرا (من إعدادات المتصفح)، أو استعمل جهاز Scanner.', 'Kamera nicht verfügbar. Kamerazugriff im Browser erlauben oder Hand-Scanner nutzen.'))}</div>`;
  }
}
function stopCamera() { if (ST.scanStop) { try { ST.scanStop(); } catch (e) {} ST.scanStop = null; } }
function scanOnce(cb) {
  const root = modal(`<button class="ib x" data-close>✕</button><h3> Scanner</h3><div class="scanbox" id="sx"></div><input type="text" id="sxi" placeholder="Barcode" style="margin-top:8px">`);
  closeModal.cb = stopCamera;
  const fin = c => { stopCamera(); closeModal.cb = null; closeModal(); cb(String(c).trim()); };
  startCamera($('#sx', root), fin);
  $('#sxi', root).onkeydown = e => { if (e.key === 'Enter' && e.target.value.trim()) fin(e.target.value); };
}
function beepOk() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 1500; g.gain.value = .2; o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + .08); } catch (e) {} }
function secScan(main) {
  let mode = ST.scanMode || 'find'; const counts = ST.scanCounts || (ST.scanCounts = {});
  const pick = shopPicker(() => secScan(main));
  main.innerHTML = pick + `<div class="seg" id="smode">${[['find', ' بحث', ' Suchen'], ['in', ' استلام +1', ' Eingang +1'], ['count', ' جرد', ' Inventur'], ['order', ' تسليم طلب', ' Übergabe']].map(x => `<button data-v="${x[0]}" class="${mode === x[0] ? 'on' : ''}">${esc(A(x[1], x[2]))}</button>`).join('')}</div>
    <div class="acts" style="margin:10px 0"><button class="btn" id="cam">${esc(A('شغّل الكاميرا', 'Kamera starten'))}</button><button class="btn o" id="camx">${esc(A('وقّف الكاميرا', 'Kamera aus'))}</button></div>
    <div class="scanbox" id="sbox"></div>
    <input type="text" id="sin" placeholder="${esc(A('أو امسح بجهاز الـ Scanner / اكتب الباركود + Enter', 'Oder Hand-Scanner / Barcode eintippen + Enter'))}" style="margin-top:10px" autocomplete="off">
    <div id="sres" style="margin-top:10px"></div>`;
  $$('#smode button').forEach(b => b.onclick = () => { ST.scanMode = b.dataset.v; stopCamera(); secScan(main); });
  const inp = $('#sin'); inp.focus();
  const res = $('#sres');
  const showCount = () => {
    const ids = Object.keys(counts); if (mode !== 'count') return;
    res.innerHTML = `<div class="card"><h3>${esc(A('المعدود', 'Gezählt'))} (${ids.length})</h3>${ids.map(id => { const p = prodBy(id); return p ? `<div class="li"><div class="t"><b>${esc(L(p, 'name'))}</b><small>${esc(A('بالنظام', 'System'))}: ${fq(p.stock, p.unit)}</small></div><input type="number" data-cc="${id}" value="${counts[id]}" style="width:90px;padding:6px"></div>` : ''; }).join('') || '<div class="note">–</div>'}
      ${ids.length ? `<button class="btn full" id="capp" style="margin-top:10px">${esc(A('حفظ الجرد', 'Inventur speichern'))}</button>` : ''}</div>`;
    $$('[data-cc]', res).forEach(i => i.oninput = () => counts[i.dataset.cc] = parseFloat(i.value.replace(',', '.')) || 0);
    if ($('#capp', res)) $('#capp', res).onclick = async () => { for (const id of Object.keys(counts)) { const { error } = await sb.rpc('stock_set', { p_product: id, p_count: counts[id], p_ref: 'Scanner-Inventur' }); if (error) return err(error); }
      toast('✓'); Object.keys(counts).forEach(k => delete counts[k]); await reloadAll(); showCount(); };
  };
  showCount();
  const handle = async code => {
    code = String(code || '').trim(); if (!code) return; beepOk();
    const tok = code.startsWith('SO:') ? code.slice(3) : (/^[0-9a-f-]{36}$/i.test(code) ? code : (code.match(/track\/([0-9a-f-]{36})/i) || [])[1]);
    if (tok || mode === 'order') {
      if (!tok) { const o = ST.orders.find(x => String(x.id) === code.replace('#', '')); if (o) return orderHand(o.token); return toast(A('ما لقيت الطلب', 'Bestellung nicht gefunden'), 1); }
      return orderHand(tok);
    }
    const p = S.products.find(x => x.barcode === code && x.shop_id === ST.shopSel) || S.products.find(x => x.barcode === code && myShops().some(s => s.id === x.shop_id));
    if (!p) { res.innerHTML = `<div class="card"><b>${esc(code)}</b><p class="note">${esc(A('منتج مش موجود', 'Produkt nicht vorhanden'))}</p><button class="btn" id="nwp">${esc(A('أضفه كمنتج جديد', 'Als neues Produkt anlegen'))}</button></div>`;
      $('#nwp').onclick = () => { stopCamera(); scanAdd(main, () => secScan(main), code); }; return; }
    if (mode === 'in') { const { data, error } = await sb.rpc('stock_adjust', { p_product: p.id, p_delta: 1, p_reason: 'receive', p_ref: 'Scanner' }); if (error) return err(error); p.stock = data; p.track_stock = true;
      res.innerHTML = `<div class="card"><b>${esc(L(p, 'name'))}</b> +1 → <b style="color:var(--ok)">${fq(data, p.unit)}</b><div class="acts" style="margin-top:8px"><button class="btn s o" id="rcvN">± ${esc(A('كمية تانية', 'Andere Menge'))}</button></div></div>`;
      $('#rcvN').onclick = () => receiveDlg(p); return; }
    if (mode === 'count') { counts[p.id] = (counts[p.id] || 0) + 1; showCount(); return; }
    res.innerHTML = `<div class="card"><div class="li"><div class="thumb" style="${bgImg(p.image_url)}"></div><div class="t"><b>${esc(L(p, 'name'))}</b><small>${App.priceLabel(p)} • ${esc(L(App.shopById(p.shop_id), 'name'))}</small></div></div>
      <div class="kpis" style="margin:8px 0"><div class="kpi"><small>${esc(A('المخزون', 'Bestand'))}</small><b>${p.track_stock ? fq(p.stock, p.unit) : '—'}</b></div><div class="kpi"><small>MHD</small><b style="font-size:16px">${esc(p.expiry || '—')}</b></div></div>
      <div class="acts"><button class="btn s" id="scR">${esc(A('تعديل المخزون', 'Bestand ändern'))}</button><button class="btn s o" id="scE">${esc(A('تعديل المنتج', 'Bearbeiten'))}</button></div></div>`;
    $('#scR').onclick = () => receiveDlg(p, () => handle(code)); $('#scE').onclick = () => editProduct(p, () => secScan(main));
  };
  const orderHand = async tok => {
    const { data, error } = await sb.rpc('handover', { p_token: tok }); if (error) return err(error);
    res.innerHTML = `<div class="card"><div class="hd" style="display:flex;justify-content:space-between;align-items:center"><span class="big" style="font-size:26px">#${data.id}</span>${stPill(data.status)}</div>
      <div>${esc(data.name)} • ${data.mode === 'pickup' ? esc(A('استلام', 'Abholung')) : esc(A('توصيل', 'Lieferung'))}</div><div class="sum tot"><span>${esc(A(PAY[data.payment] ? PAY[data.payment][0] : '', PAY[data.payment] ? PAY[data.payment][1] : ''))}</span><span>${money(data.total)}</span></div>
      ${data.mode === 'pickup' && data.status === 'ready' ? `<button class="btn g full" id="hand">${esc(A('تم التسليم للزبون', 'An Kunde übergeben'))}</button>` : data.status !== 'ready' && data.mode === 'pickup' ? `<div class="warnbox">${esc(A('الطلب لسا مش جاهز بكل المحلات', 'Noch nicht in allen Geschäften fertig'))}</div>` : ''}</div>`;
    if ($('#hand')) $('#hand').onclick = async () => { const { error } = await sb.rpc('order_complete', { p_order: data.id, p_code: tok, p_cash: null }); if (error) return codeErr(error); toast('✓ #' + data.id); res.innerHTML = `<div class="card" style="text-align:center;font-size:20px"> #${data.id}</div>`; };
  };
  inp.onkeydown = e => { if (e.key === 'Enter') { handle(inp.value); inp.value = ''; } };
  $('#cam').onclick = () => startCamera($('#sbox'), handle);
  $('#camx').onclick = stopCamera;
  if (!ST.orders.length) fetchOrders().catch(() => {});
}

/* ---------- reports ---------- */
async function secReports(main) {
  const today = new Date().toISOString().slice(0, 10);
  const st = ST.rep || (ST.rep = { from: today, to: today });
  main.innerHTML = `<div class="row"><label class="f"><span>${esc(A('من', 'Von'))}</span><input type="date" id="rf" value="${st.from}"></label><label class="f"><span>${esc(A('إلى', 'Bis'))}</span><input type="date" id="rt" value="${st.to}"></label></div>
    <div class="acts">${[['اليوم', 'Heute', 0], ['7 أيام', '7 Tage', 6], ['30 يوم', '30 Tage', 29]].map(x => `<button class="btn s o" data-rd="${x[2]}">${esc(A(x[0], x[1]))}</button>`).join('')}<button class="btn s" id="rgo">↻</button><button class="btn s o" id="rcsv"> CSV</button></div><div id="rb" style="margin-top:12px"><div class="empty">…</div></div>`;
  $$('[data-rd]').forEach(b => b.onclick = () => { st.to = today; st.from = new Date(Date.now() - (+b.dataset.rd) * 86400000).toISOString().slice(0, 10); secReports(main); });
  $('#rgo').onclick = () => { st.from = $('#rf').value; st.to = $('#rt').value; secReports(main); };
  const from = new Date(st.from + 'T00:00:00').toISOString(), to = new Date(st.to + 'T23:59:59').toISOString();
  let all = [], off = 0;
  for (;;) { const { data, error } = await sb.from('orders').select('*, order_items(*)').gte('created_at', from).lte('created_at', to).order('id').range(off, off + 499); if (error) return err(error); all = all.concat(data); if (data.length < 500) break; off += 500; }
  const valid = all.filter(o => o.status !== 'cancelled');
  const items = []; valid.forEach(o => o.order_items.filter(i => i.status !== 'rejected').forEach(i => items.push(Object.assign({ _o: o }, i))));
  const amt = i => +(i.final_total != null ? i.final_total : i.line_total);
  const byShop = {}; items.forEach(i => { const b = byShop[i.shop_id] = byShop[i.shop_id] || { rev: 0, orders: new Set() }; b.rev += amt(i); b.orders.add(i.order_id); });
  const rev = items.reduce((s, i) => s + amt(i), 0);
  const top = {}; items.forEach(i => { const k = i.product_id || i.name_de; const t = top[k] = top[k] || { n: S.lang === 'ar' ? i.name_ar : i.name_de, q: 0, r: 0, u: i.unit }; t.q += +(i.final_qty || i.qty); t.r += amt(i); });
  const topL = Object.values(top).sort((a, b) => b.r - a.r).slice(0, 15);
  const admin = S.staff.role === 'admin';
  const pays = {}; valid.forEach(o => pays[o.payment] = (pays[o.payment] || 0) + +o.total);
  const fees = valid.reduce((s, o) => s + +o.delivery_fee, 0), disc = valid.reduce((s, o) => s + +o.discount, 0), pf = valid.reduce((s, o) => s + +o.pfand, 0);
  let drv = '';
  if (admin) { await loadDrivers(); const d = {}; valid.filter(o => o.mode === 'delivery' && o.status === 'delivered').forEach(o => { const x = d[o.driver_id || '-'] = d[o.driver_id || '-'] || { n: 0, cash: 0, fee: 0 }; x.n++; x.fee += +o.delivery_fee; if (o.payment === 'cash' && o.cash_collected) x.cash += +o.total; });
    drv = `<div class="card"><h3>${esc(A('السائقين', 'Fahrer'))}</h3>${Object.keys(d).map(k => { const dr = ST.drivers.find(x => x.user_id === k); return `<div class="sum"><span>${esc(dr ? dr.name || dr.username : '—')} • ${d[k].n} ${esc(A('توصيلة', 'Fahrten'))}</span><span> ${money(d[k].cash)}</span></div>`; }).join('') || '<div class="note">–</div>'}</div>`; }
  const maxS = Math.max(1, ...Object.values(byShop).map(b => b.rev));
  $('#rb').innerHTML = `<div class="kpis"><div class="kpi"><small>${esc(A('المبيعات', 'Umsatz'))}</small><b>${money(rev)}</b></div><div class="kpi"><small>${esc(A('عدد الطلبات', 'Bestellungen'))}</small><b>${new Set(items.map(i => i.order_id)).size}</b></div>
     <div class="kpi"><small>${esc(A('متوسط الطلب', 'Ø Bestellung'))}</small><b>${money(valid.length ? valid.reduce((s, o) => s + +o.total, 0) / valid.length : 0)}</b></div><div class="kpi"><small>${esc(A('ملغية', 'Storniert'))}</small><b>${all.length - valid.length}</b></div>
     ${admin ? `<div class="kpi"><small>${esc(A('رسوم التوصيل', 'Liefergebühren'))}</small><b>${money(fees)}</b></div><div class="kpi"><small>${esc(A('الخصومات', 'Rabatte'))}</small><b>${money(disc)}</b></div><div class="kpi"><small>Pfand</small><b>${money(pf)}</b></div>` : ''}</div>
    <div class="card"><h3>${esc(A('حسب المحل', 'Nach Geschäft'))}</h3>${Object.keys(byShop).map(sid => `<div style="margin:8px 0"><div class="sum"><span>${esc(L(App.shopById(sid) || {}, 'name'))} (${byShop[sid].orders.size})</span><b>${money(byShop[sid].rev)}</b></div><div class="bar"><i style="width:${byShop[sid].rev / maxS * 100}%"></i></div></div>`).join('') || '<div class="note">–</div>'}</div>
    ${admin ? `<div class="card"><h3>${esc(A('طرق الدفع', 'Zahlungsarten'))}</h3>${Object.keys(pays).map(k => `<div class="sum"><span>${esc(A((PAY[k] || [k])[0], (PAY[k] || [k, k])[1]))}</span><span>${money(pays[k])}</span></div>`).join('') || '<div class="note">–</div>'}</div>${drv}` : ''}
    <div class="card"><h3>${esc(A('الأكثر مبيعاً', 'Top-Produkte'))}</h3><div class="tw"><table class="tbl">${topL.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x.n)}</td><td>${fq(x.q, x.u)}</td><td>${money(x.r)}</td></tr>`).join('')}</table></div></div>`;
  $('#rcsv').onclick = () => downloadFile(`bericht-${st.from}-${st.to}.csv`, [['Bestellung', 'Datum', 'Geschäft', 'Artikel', 'Menge', 'Einheit', 'Betrag', 'MwSt', 'Status', 'Zahlung', 'Art']].concat(items.map(i => [i.order_id, new Date(i._o.created_at).toLocaleString('de-DE'), i.shop_id, i.name_de, String(+(i.final_qty || i.qty)).replace('.', ','), i.unit, amt(i).toFixed(2).replace('.', ','), i.vat, i._o.status, i._o.payment, i._o.mode])).map(r => r.map(csvCell).join(';')).join('\n'));
}

/* ---------- shops ---------- */
function secShops(main) {
  const list = myShops();
  main.innerHTML = list.map(s => `<div class="card" style="display:flex;gap:12px;align-items:center"><div class="thumb" style="width:56px;height:56px;${bgImg(s.image_url)}">${s.image_url ? '' : SI(s.type)}</div>
     <div style="flex:1"><b>${esc(L(s, 'name'))}</b><div class="note">${s.active ? '' : esc(A('مخفي · ', 'Versteckt · '))}${App.isOpenNow(s) ? esc(A('مفتوح الآن', 'Jetzt geöffnet')) : esc(A('مغلق الآن', 'Jetzt geschlossen'))}</div></div>
     <label class="chk" title="${esc(A('استقبال طلبات', 'Bestellungen annehmen'))}"><input type="checkbox" data-op="${esc(s.id)}" ${s.is_open ? 'checked' : ''}><span>${esc(A('يستقبل طلبات', 'Nimmt an'))}</span></label><button class="btn s o" data-se="${esc(s.id)}">${ic('edit', 's')}</button></div>`).join('')
    + (S.staff.role === 'admin' ? `<button class="btn" id="sAdd">${esc(A('محل جديد', 'Neues Geschäft'))}</button>` : '');
  $$('[data-op]').forEach(c => c.onchange = async () => { const { error } = await sb.from('shops').update({ is_open: c.checked }).eq('id', c.dataset.op); if (error) return err(error); await reloadAll(); secShops(main); });
  $$('[data-se]').forEach(b => b.onclick = () => editShop(App.shopById(b.dataset.se), () => secShops(main)));
  if ($('#sAdd')) $('#sAdd').onclick = () => editShop(null, () => secShops(main));
}
function editShop(s, done) {
  const isNew = !s; s = s || { id: '', name_ar: '', name_de: '', type: 'other', desc_ar: '', desc_de: '', hours: {}, is_open: true, active: true, phone: '', whatsapp: '', sort: S.shops.length + 1, image_url: '' };
  const types = { supermarket: ['سوبرماركت', 'Supermarkt'], restaurant: ['مطعم', 'Restaurant'], sweets: ['حلويات', 'Süßigkeiten'], butcher: ['ملحمة', 'Metzgerei'], deli: ['أجبان وزيتون', 'Feinkost'], other: ['غيره', 'Sonstiges'] };
  const root = modal(`<button class="ib x" data-close>✕</button><h3>${esc(isNew ? A('محل جديد', 'Neues Geschäft') : L(s, 'name'))}</h3>
    ${isNew ? `<label class="f"><span>ID (a-z, ohne Leerzeichen)</span><input type="text" id="sId" autocapitalize="off"></label>` : ''}
    <div class="row"><label class="f"><span>الاسم بالعربي</span><input type="text" id="sNa" value="${esc(s.name_ar)}"></label><label class="f"><span>Name Deutsch</span><input type="text" id="sNd" value="${esc(s.name_de)}"></label></div>
    <div class="row"><label class="f"><span>الوصف</span><input type="text" id="sDa" value="${esc(s.desc_ar)}"></label><label class="f"><span>Beschreibung</span><input type="text" id="sDd" value="${esc(s.desc_de)}"></label></div>
    <div class="row"><label class="f"><span>${esc(A('النوع', 'Typ'))}</span><select id="sT" ${S.staff.role !== 'admin' ? 'disabled' : ''}>${Object.keys(types).map(k => `<option value="${k}" ${s.type === k ? 'selected' : ''}>${esc(A(types[k][0], types[k][1]))}</option>`).join('')}</select></label><label class="f"><span>${esc(A('الترتيب', 'Reihenfolge'))}</span><input type="number" id="sS" value="${s.sort}"></label></div>
    <div class="row"><label class="f"><span>${esc(A('هاتف', 'Telefon'))}</span><input type="tel" id="sP" value="${esc(s.phone || '')}"></label><label class="f"><span>WhatsApp</span><input type="tel" id="sW" value="${esc(s.whatsapp || '')}"></label></div>
    <label class="f"><span>${esc(A('صورة المحل', 'Bild'))}</span><div class="acts"><div class="thumb" id="sImgP" style="width:60px;height:60px;${bgImg(s.image_url)}"></div><input type="file" accept="image/*" id="sImg" style="flex:1"></div></label>
    <label class="f"><span>${esc(A('خلفية صفحة المحل (بالعرض، غامقة)', 'Hintergrund der Geschäftsseite (breit, dunkel)'))}</span><div class="acts"><div class="thumb" id="sBnP" style="width:120px;height:40px;${bgImg(s.banner_url)}"></div><input type="file" accept="image/*" id="sBn" style="flex:1"></div></label>
    <div class="grp"><h4>${esc(A('أوقات الدوام (مثلاً 09:00-20:00، فاضي = مسكّر)', 'Öffnungszeiten (z. B. 09:00-20:00, leer = zu)'))}</h4>${DAYS.slice(1).concat('so').map(d => `<div class="li" style="padding:4px 0"><span style="width:90px">${esc(App.t('days')[d])}</span><input type="text" data-h="${d}" value="${esc((s.hours || {})[d] || '')}" placeholder="09:00-20:00"></div>`).join('')}</div>
    ${S.staff.role === 'admin' ? `<label class="chk"><input type="checkbox" id="sA" ${s.active ? 'checked' : ''}><span>${esc(A('ظاهر بالموقع', 'Sichtbar'))}</span></label>` : ''}
    <button class="btn full" id="sSave">${esc(A('حفظ', 'Speichern'))}</button>`);
  let img = s.image_url || ''; let banner = s.banner_url || '';
  $('#sBn', root).onchange = async e => { const f = e.target.files[0]; if (!f) return; try { banner = await uploadImage(f, 'shops', 1600); $('#sBnP', root).style.backgroundImage = `url('${safeUrl(banner)}')`; } catch (x) { err(x); } };
  $('#sImg', root).onchange = async e => { const f = e.target.files[0]; if (!f) return; try { img = await uploadImage(f, 'shops'); $('#sImgP', root).style.backgroundImage = `url('${safeUrl(img)}')`; } catch (x) { err(x); } };
  $('#sSave', root).onclick = async () => {
    const hours = {}; $$('[data-h]', root).forEach(i => hours[i.dataset.h] = i.value.trim());
    const o = { name_ar: $('#sNa', root).value.trim(), name_de: $('#sNd', root).value.trim(), desc_ar: $('#sDa', root).value.trim(), desc_de: $('#sDd', root).value.trim(), sort: +$('#sS', root).value || 0, phone: $('#sP', root).value.trim(), whatsapp: $('#sW', root).value.trim(), image_url: img || null, banner_url: banner || null, hours };
    if (S.staff.role === 'admin') { o.type = $('#sT', root).value; o.active = $('#sA', root).checked; }
    let r;
    if (isNew) { o.id = $('#sId', root).value.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''); if (!o.id || !o.name_de) return toast('ID / Name ?', 1); r = await sb.from('shops').insert(o); }
    else r = await sb.from('shops').update(o).eq('id', s.id);
    if (r.error) return err(r.error); toast('✓'); closeModal(); await reloadAll(); done();
  };
}

/* ---------- staff ---------- */
async function secStaff(main) {
  const { data, error } = await sb.from('staff').select('*').order('role'); if (error) return err(error);
  const R = { admin: ['مدير', 'Admin'], shop: ['محل', 'Geschäft'], driver: ['سائق', 'Fahrer'] };
  main.innerHTML = `<button class="btn" id="stAdd">${esc(A('حساب جديد', 'Neues Konto'))}</button>
    ${data.map(u => `<div class="card" style="${u.active ? '' : 'opacity:.5'}"><div class="sum"><b>${esc(u.name || u.username)}</b><span class="pill be">${esc(A((R[u.role] || ['?'])[0], (R[u.role] || ['?', '?'])[1]))}${u.shop_id ? ' • ' + esc(L(App.shopById(u.shop_id) || {}, 'name')) : ''}</span></div>
      <div class="note">${esc(A('اسم الدخول:', 'Login:'))} <b style="color:var(--cream)">${esc(u.username)}</b>${u.phone ? ' • ' + esc(u.phone) : ''}</div>
      ${u.user_id !== S.staff.user_id ? `<div class="acts" style="margin-top:8px"><button class="btn s o" data-pw="${u.user_id}">${esc(A('كلمة سر جديدة', 'Neues Passwort'))}</button><button class="btn s ${u.active ? 'r' : 'g'}" data-tg="${u.user_id}" data-a="${u.active ? 0 : 1}">${u.active ? esc(A('إيقاف', 'Sperren')) : esc(A('تفعيل', 'Aktivieren'))}</button></div>` : ''}</div>`).join('')}`;
  $('#stAdd').onclick = () => {
    const root = modal(`<button class="ib x" data-close>✕</button><h3>${esc(A('حساب جديد', 'Neues Konto'))}</h3>
      <label class="f"><span>${esc(A('النوع', 'Rolle'))}</span><select id="nR"><option value="shop">${esc(A('محل', 'Geschäft'))}</option><option value="driver">${esc(A('سائق', 'Fahrer'))}</option><option value="admin">${esc(A('مدير', 'Admin'))}</option></select></label>
      <label class="f" id="nSw"><span>${esc(A('المحل', 'Geschäft'))}</span><select id="nS">${S.shops.map(s => `<option value="${s.id}">${esc(L(s, 'name'))}</option>`).join('')}</select></label>
      <label class="f"><span>${esc(A('اسم الدخول (إنجليزي بدون مسافات)', 'Login-Name (ohne Leerzeichen)'))}</span><input type="text" id="nU" autocapitalize="off" placeholder="z. B. metzgerei, fahrer1"></label>
      <label class="f"><span>${esc(A('كلمة السر (8 أحرف على الأقل)', 'Passwort (min. 8 Zeichen)'))}</span><input type="text" id="nP"></label>
      <div class="row"><label class="f"><span>${esc(A('الاسم', 'Name'))}</span><input type="text" id="nN"></label><label class="f"><span>${esc(A('الهاتف', 'Telefon'))}</span><input type="tel" id="nT"></label></div>
      <button class="btn full" id="nGo">${esc(A('إنشاء', 'Anlegen'))}</button>`);
    $('#nR', root).onchange = () => $('#nSw', root).hidden = $('#nR', root).value !== 'shop';
    $('#nGo', root).onclick = async () => {
      const { error } = await sb.rpc('admin_create_staff', { p_username: $('#nU', root).value, p_password: $('#nP', root).value, p_role: $('#nR', root).value, p_shop: $('#nR', root).value === 'shop' ? $('#nS', root).value : '', p_name: $('#nN', root).value, p_phone: $('#nT', root).value });
      if (error) return toast(/exists/.test(error.message) ? A('الاسم مستعمل', 'Name vergeben') : /password/.test(error.message) ? A('كلمة السر قصيرة', 'Passwort zu kurz') : App.errMsg(error), 1);
      toast('✓'); closeModal(); secStaff(main);
    };
  };
  $$('[data-pw]').forEach(b => b.onclick = async () => { const p = prompt(A('كلمة السر الجديدة (8 أحرف على الأقل):', 'Neues Passwort (min. 8 Zeichen):')); if (!p) return; const { error } = await sb.rpc('admin_set_password', { p_user: b.dataset.pw, p_password: p }); if (error) return err(error); toast('✓'); });
  $$('[data-tg]').forEach(b => b.onclick = async () => { const { error } = await sb.rpc('admin_toggle_staff', { p_user: b.dataset.tg, p_active: b.dataset.a === '1' }); if (error) return err(error); if (b.dataset.a === '1') toast(A('مفعّل. اعطيه كلمة سر جديدة.', 'Aktiviert. Bitte neues Passwort vergeben.')); secStaff(main); });
}

/* ---------- coupons ---------- */
async function secCoupons(main) {
  const admin = S.staff.role === 'admin';
  let q = sb.from('coupons').select('*').order('code'); if (!admin) q = q.eq('shop_id', S.staff.shop_id);
  const { data, error } = await q; if (error) return err(error);
  main.innerHTML = `<div class="card"><h3>${esc(A('كوبون جديد', 'Neuer Gutschein'))}</h3>
     <div class="row"><label class="f"><span>${esc(A('الكود', 'Code'))}</span><input type="text" id="cC" style="text-transform:uppercase"></label><label class="f"><span>${esc(A('النوع', 'Art'))}</span><select id="cT"><option value="percent">%</option><option value="fixed">€</option></select></label></div>
     <div class="row3"><label class="f"><span>${esc(A('القيمة', 'Wert'))}</span><input type="number" step="0.01" id="cV"></label><label class="f"><span>${esc(A('أقل طلب €', 'Mindestwert €'))}</span><input type="number" step="0.01" id="cM" value="0"></label><label class="f"><span>${esc(A('أقصى استعمال', 'Max. Nutzungen'))}</span><input type="number" id="cU"></label></div>
     <div class="row"><label class="f"><span>${esc(A('ينتهي', 'Gültig bis'))}</span><input type="date" id="cE"></label>${admin ? `<label class="f"><span>${esc(A('لمحل معيّن', 'Nur für Geschäft'))}</span><select id="cS"><option value="">${esc(A('كل المحلات', 'Alle'))}</option>${S.shops.map(s => `<option value="${s.id}">${esc(L(s, 'name'))}</option>`).join('')}</select></label>` : ''}</div>
     <button class="btn" id="cGo">${esc(A('حفظ', 'Speichern'))}</button></div>
    ${data.map(c => `<div class="card" style="${c.active ? '' : 'opacity:.5'}"><div class="sum"><b>${esc(c.code)}</b><span>${c.kind === 'percent' ? (+c.value) + '%' : money(c.value)}</span></div>
      <div class="note">${c.shop_id ? esc(L(App.shopById(c.shop_id) || {}, 'name')) + ' • ' : ''}${+c.min_total ? esc(A('من', 'ab')) + ' ' + money(c.min_total) + ' • ' : ''}${esc(A('استُعمل', 'Genutzt'))} ${c.uses}${c.max_uses ? '/' + c.max_uses : ''}${c.expires ? ' •  ' + esc(c.expires) : ''}</div>
      <div class="acts" style="margin-top:6px"><button class="btn s o" data-ct="${esc(c.code)}" data-a="${c.active ? 0 : 1}">${c.active ? esc(A('إيقاف', 'Pausieren')) : esc(A('تفعيل', 'Aktivieren'))}</button><button class="btn s r" data-cx="${esc(c.code)}">${esc(A('حذف', 'Löschen'))}</button></div></div>`).join('')}`;
  $('#cGo').onclick = async () => {
    const o = { code: $('#cC').value.trim().toUpperCase(), kind: $('#cT').value, value: parseFloat($('#cV').value) || 0, min_total: parseFloat($('#cM').value) || 0, max_uses: parseInt($('#cU').value) || null, expires: $('#cE').value || null, shop_id: admin ? ($('#cS').value || null) : S.staff.shop_id };
    if (!o.code || !o.value) return toast(A('عبّي الكود والقيمة', 'Code und Wert angeben'), 1);
    const { error } = await sb.from('coupons').insert(o); if (error) return err(error); toast('✓'); secCoupons(main);
  };
  $$('[data-ct]').forEach(b => b.onclick = async () => { const { error } = await sb.from('coupons').update({ active: b.dataset.a === '1' }).eq('code', b.dataset.ct); if (error) return err(error); secCoupons(main); });
  $$('[data-cx]').forEach(b => b.onclick = async () => { if (!confirm('?')) return; const { error } = await sb.from('coupons').delete().eq('code', b.dataset.cx); if (error) return err(error); secCoupons(main); });
}

/* ---------- suppliers ---------- */
async function secSuppliers(main) {
  const draw = async () => {
    const pick = shopPicker(draw); const sid = ST.shopSel;
    const { data, error } = await sb.from('suppliers').select('*').eq('shop_id', sid).order('name'); if (error) return err(error);
    main.innerHTML = pick + `<div class="card"><h3>${esc(A('مورد جديد', 'Neuer Lieferant'))}</h3><div class="row"><input type="text" id="spN" placeholder="${esc(A('الاسم', 'Name'))}"><input type="tel" id="spP" placeholder="${esc(A('الهاتف / WhatsApp', 'Telefon / WhatsApp'))}"></div>
       <div class="row" style="margin-top:8px"><input type="email" id="spE" placeholder="E-Mail"><input type="text" id="spO" placeholder="${esc(A('ملاحظة', 'Notiz'))}"></div><button class="btn" id="spGo" style="margin-top:8px">${esc(A('حفظ', 'Speichern'))}</button></div>
      ${data.map(s => `<div class="card"><div class="sum"><b>${esc(s.name)}</b><button class="btn s r" data-sx="${s.id}">${esc(A('حذف', 'Löschen'))}</button></div><div class="note">${s.phone ? `<a href="tel:${esc(s.phone)}">${esc(s.phone)}</a> ` : ''}${s.email ? `<a href="mailto:${esc(s.email)}">${esc(s.email)}</a> ` : ''}${esc(s.note || '')}</div></div>`).join('')}`;
    $('#spGo').onclick = async () => { const n = $('#spN').value.trim(); if (!n) return; const { error } = await sb.from('suppliers').insert({ shop_id: sid, name: n, phone: $('#spP').value.trim(), email: $('#spE').value.trim(), note: $('#spO').value.trim() }); if (error) return err(error); draw(); };
    $$('[data-sx]').forEach(b => b.onclick = async () => { if (!confirm('?')) return; await sb.from('suppliers').delete().eq('id', b.dataset.sx); draw(); });
  };
  draw();
}

/* ---------- reviews ---------- */
async function secReviews(main) {
  const { data, error } = await sb.from('reviews').select('*').order('created_at', { ascending: false }).limit(300); if (error) return err(error);
  const admin = S.staff.role === 'admin';
  main.innerHTML = data.length ? data.map(r => `<div class="card"><div class="sum"><b>${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</b><span class="note">${esc(L(App.shopById(r.shop_id) || {}, 'name'))} • #${r.order_id}</span></div>
     <div>${esc(r.text || '—')}</div><div class="note">${esc(r.name)} • ${fmtDate(r.created_at)} • ${r.approved ? ' ' + esc(A('ظاهر', 'Sichtbar')) : ' ' + esc(A('مخفي', 'Versteckt'))}</div>
     ${admin ? `<div class="acts" style="margin-top:6px"><button class="btn s ${r.approved ? 'o' : 'g'}" data-ra="${r.id}" data-a="${r.approved ? 0 : 1}">${r.approved ? esc(A('إخفاء', 'Verbergen')) : esc(A('إظهار', 'Freischalten'))}</button><button class="btn s r" data-rx="${r.id}"></button></div>` : ''}</div>`).join('') : `<div class="empty">–</div>`;
  $$('[data-ra]').forEach(b => b.onclick = async () => { const { error } = await sb.from('reviews').update({ approved: b.dataset.a === '1' }).eq('id', b.dataset.ra); if (error) return err(error); secReviews(main); });
  $$('[data-rx]').forEach(b => b.onclick = async () => { if (!confirm('?')) return; await sb.from('reviews').delete().eq('id', b.dataset.rx); secReviews(main); });
}


/* ---------- customers ---------- */
async function secCustomers(main) {
  const { data, error } = await sb.rpc('admin_customers'); if (error) return err(error);
  main.innerHTML = `<input type="search" id="cuq" placeholder="${esc(A('بحث بالاسم أو الإيميل أو الهاتف', 'Suche: Name, E-Mail, Telefon'))}" style="margin-bottom:10px">
    <div class="kpis"><div class="kpi"><small>${esc(A('عدد الزبائن', 'Kunden'))}</small><b>${data.length}</b></div><div class="kpi"><small>${esc(A('مجموع مشترياتهم', 'Umsatz gesamt'))}</small><b>${money(data.reduce((s, c) => s + +c.spent, 0))}</b></div></div><div id="cul"></div>`;
  const draw = () => {
    const q = $('#cuq').value.trim().toLowerCase();
    const l = data.filter(c => !q || (c.name + ' ' + c.email + ' ' + c.phone).toLowerCase().includes(q));
    $('#cul').innerHTML = l.length ? l.map(c => `<div class="card"><div class="sum"><b>${esc(c.name || '—')}</b><span class="note">${c.orders} ${esc(A('طلب', 'Bestellungen'))} · ${money(c.spent)}</span></div>
      <div class="note">${esc(c.email)}${c.phone ? ' · <a href="tel:' + esc(c.phone) + '">' + esc(c.phone) + '</a>' : ''}${c.plz ? ' · ' + esc(c.plz) : ''}</div>
      <div class="note">${esc(A('من', 'Seit'))} ${fmtDate(c.created_at)}</div>
      <div class="acts" style="margin-top:8px"><button class="btn s o" data-cpw="${esc(c.id)}">${ic('key', 's')} ${esc(A('كلمة سر جديدة', 'Neues Passwort'))}</button></div></div>`).join('') : `<div class="empty">${esc(A('لسا ما في زبائن مسجلين.', 'Noch keine registrierten Kunden.'))}</div>`;
    $$('[data-cpw]').forEach(b => b.onclick = async () => { const p = prompt(A('كلمة السر الجديدة للزبون (8 أحرف على الأقل):', 'Neues Passwort für den Kunden (min. 8 Zeichen):')); if (!p) return;
      const { error } = await sb.rpc('admin_customer_password', { p_id: b.dataset.cpw, p_new: p }); if (error) return err(error); toast(A('تمام. ابعتلو كلمة السر الجديدة.', 'Erledigt. Bitte das neue Passwort an den Kunden geben.')); });
  };
  $('#cuq').oninput = draw; draw();
}

/* ---------- settings ---------- */
const APPVER = '2026.11.23-16';
const SETSEC = [
  ['general', 'store', 'معلومات المحل', 'Geschäftsdaten', 'الاسم، العنوان، Impressum', 'Name, Adresse, Impressum'],
  ['orders', 'inbox', 'استقبال الطلبات', 'Bestellannahme', 'إيقاف مؤقت، طلب مسبق، حد أدنى', 'Pause, Vorbestellung, Mindestwert'],
  ['delivery', 'truck', 'التوصيل والاستلام', 'Lieferung & Abholung', 'مناطق التوصيل والأسعار', 'Liefergebiete und Gebühren'],
  ['times', 'clock', 'الأوقات والتقرير', 'Zeiten & Bericht', 'مدة التحضير، التقرير اليومي', 'Zubereitungszeit, Tagesbericht'],
  ['payment', 'tag', 'الدفع', 'Zahlung', 'كاش، بطاقة، Stripe، تحويل', 'Bar, Karte, Stripe, Überweisung'],
  ['invoice', 'receipt', 'الفاتورة والضريبة', 'Rechnung & Steuer', 'Kleinunternehmer، ضريبة', 'Kleinunternehmer, MwSt'],
  ['emails', 'chat', 'الإيميلات', 'E-Mails', 'Resend، المرسل، تجربة', 'Resend, Absender, Test'],
  ['printer', 'print', 'الطابعة', 'Drucker', 'بون، عرض الورق، طباعة تلقائية', 'Bon, Papierbreite, Auto-Druck'],
  ['notify', 'bell', 'الإشعارات والصوت', 'Mitteilungen & Ton', 'إشعارات الموبايل، الصوت', 'Push-Mitteilungen, Ton'],
  ['home', 'home', 'الصفحة الرئيسية', 'Startseite', 'إعلان، تنبيه الصلاحية', 'Hinweis, MHD-Warnung'],
  ['system', 'key', 'الأمان والنظام', 'Sicherheit & System', 'كلمة السر، الأجهزة، التحديث', 'Passwort, Geräte, Update'],
];
function secSettings(main) {
  const s = JSON.parse(JSON.stringify(S.settings)); s.payments = s.payments || {}; s.zones = s.zones || [];
  const f = (k, lab, type) => `<label class="f"><span>${lab}</span><input type="${type || 'text'}" data-k="${k}" value="${esc(s[k] || '')}"></label>`;
  main.innerHTML = `<div class="setnav" id="setNav">${SETSEC.map(x => `<button data-go="${x[0]}">${ic(x[1])}<span><b>${esc(A(x[2], x[3]))}</b><small>${esc(A(x[4], x[5]))}</small></span>${ic(S.lang === 'ar' ? 'back' : 'fwd', 's')}</button>`).join('')}</div>
    <div class="sethd" id="setHd" hidden><button class="btn s o" id="setBack">${ic(S.lang === 'ar' ? 'fwd' : 'back', 's')} ${esc(A('كل الإعدادات', 'Alle Einstellungen'))}</button><h2 id="setTitle"></h2></div>
    <div class="card" data-sec="general"><h3>${esc(A('معلومات الباساج (للـ Impressum)', 'Angaben (für Impressum)'))}</h3>
     ${f('name', 'Name')}${f('address', A('العنوان', 'Adresse'))}<div class="row">${f('phone', A('هاتف', 'Telefon'), 'tel')}${f('whatsapp', 'WhatsApp', 'tel')}</div><div class="row">${f('email', 'E-Mail', 'email')}${f('instagram', 'Instagram-Link')}</div>
     <div class="row">${f('owner', A('صاحب المحل (Inhaber)', 'Inhaber'))}${f('legal_form', A('الشكل القانوني', 'Rechtsform'))}</div><div class="row">${f('tax_id', 'Steuernummer')}${f('vat_id', 'USt-IdNr.')}</div></div>
    <div class="card" data-sec="delivery"><h3>${esc(A('الاستلام والتوصيل', 'Abholung & Lieferung'))}</h3>
     <label class="chk"><input type="checkbox" id="sPk" ${s.pickup !== false ? 'checked' : ''}><span>${esc(A('استلام من المحل', 'Abholung'))}</span></label><label class="chk"><input type="checkbox" id="sDl" ${s.delivery !== false ? 'checked' : ''}><span>${esc(A('توصيل', 'Lieferung'))}</span></label>
     <div class="note">${esc(A('مناطق التوصيل: اكتب الرموز البريدية مفصولة بفاصلة، والسعر والحد الأدنى', 'Liefergebiete: PLZ mit Komma getrennt, Gebühr und Mindestbestellwert'))}</div>
     <div id="zones"></div><button class="btn s o" id="zAdd" style="margin-top:6px">${esc(A('منطقة', 'Gebiet'))}</button></div>
    <div class="card" data-sec="payment"><h3>${esc(A('الدفع', 'Zahlung'))}</h3>
     <label class="chk"><input type="checkbox" id="pCa" ${s.payments.cash !== false ? 'checked' : ''}><span>${esc(A('كاش', 'Bar'))}</span></label><label class="chk"><input type="checkbox" id="pCd" ${s.payments.card ? 'checked' : ''}><span>${esc(A('بطاقة EC عند الاستلام', 'EC-Karte bei Übergabe'))}</span></label>
     <label class="chk"><input type="checkbox" id="pPp" ${s.payments.paypal ? 'checked' : ''}><span>PayPal (PayPal.me)</span></label>
     <label class="f"><span>${esc(A('اسم PayPal.me (مثلاً steinolive)', 'PayPal.me-Name (z. B. steinolive)'))}</span><input type="text" id="pPm" value="${esc(s.payments.paypal_me || '')}"></label></div>
    <div class="card" data-sec="payment"><h3>${esc(A('الدفع بالبطاقة أونلاين (Stripe)', 'Online-Kartenzahlung (Stripe)'))}</h3>
     <p class="note">${esc(A('الزبون بيدفع بالبطاقة أو Apple Pay أو Google Pay، والمصاري بتنزل بحساب Stripe تبع صاحب المحل، ومنو لحسابو البنكي (Sparkasse). Stripe بياخد عمولة صغيرة على كل دفعة.', 'Kunden zahlen mit Karte, Apple Pay oder Google Pay. Das Geld geht auf das Stripe-Konto des Inhabers und von dort auf sein Bankkonto (z. B. Sparkasse). Stripe berechnet pro Zahlung eine kleine Gebühr.'))}</p>
     <div id="stState" class="note">…</div>
     <label class="chk"><input type="checkbox" id="pSt" ${s.payments.stripe ? 'checked' : ''}><span>${esc(A('اعرض الدفع بالبطاقة أونلاين للزباين', 'Online-Kartenzahlung anbieten'))}</span></label>
     <label class="f"><span>${esc(A('المفتاح السري (Secret key، بيبلّش بـ sk_live_ أو rk_live_)', 'Geheimer Schlüssel (Secret key, beginnt mit sk_live_ oder rk_live_)'))}</span><input type="password" id="stSk" autocomplete="off" spellcheck="false" maxlength="210" placeholder="sk_live_…"></label>
     <label class="f"><span>${esc(A('مفتاح الـ Webhook (Signing secret، بيبلّش بـ whsec_)', 'Webhook-Schlüssel (Signing secret, beginnt mit whsec_)'))}</span><input type="password" id="stWh" autocomplete="off" spellcheck="false" maxlength="210" placeholder="whsec_…"></label>
     <div class="acts"><button class="btn s" id="stSave">${esc(A('حفظ مفاتيح Stripe', 'Stripe-Schlüssel speichern'))}</button><button class="btn s r" id="stDel" hidden>${esc(A('فصل Stripe', 'Stripe trennen'))}</button></div>
     <p class="note" style="margin-top:10px">${esc(A('رابط الـ Webhook اللي لازم ينحط بـ Stripe (الحدث: checkout.session.completed):', 'Webhook-Adresse für Stripe (Ereignis: checkout.session.completed):'))}<br><code dir="ltr" style="word-break:break-all">${esc(App.CFG.url)}/functions/v1/stripe/webhook</code></p></div>
    <div class="card" data-sec="payment"><h3>${esc(A('الحساب البنكي (للتحويل)', 'Bankverbindung (für Überweisung)'))}</h3>
     <label class="chk"><input type="checkbox" id="pTr" ${s.payments.transfer ? 'checked' : ''}><span>${esc(A('السماح بالدفع بالتحويل البنكي', 'Zahlung per Überweisung anbieten'))}</span></label>
     <p class="note">${esc(A('الزبون بيشوف هالمعلومات مع كود QR بيفتح تطبيق البنك (Sparkasse وغيره) والتحويل معبّى. المصاري بتروح مباشرة عحساب صاحب المحل.', 'Der Kunde sieht diese Daten mit einem QR-Code (GiroCode) für seine Banking-App. Das Geld geht direkt auf das Konto des Inhabers.'))}</p>
     ${f('bank_holder', A('اسم صاحب الحساب', 'Kontoinhaber'))}<div class="row">${f('bank_iban', 'IBAN')}${f('bank_bic', 'BIC')}</div>${f('bank_name', A('اسم البنك', 'Bank'))}</div>
    <div class="card" data-sec="invoice"><h3>${esc(A('الفاتورة والضريبة', 'Rechnung & Steuer'))}</h3>
     <label class="chk"><input type="checkbox" id="sKu" ${s.kleinunternehmer ? 'checked' : ''}><span>${esc(A('Kleinunternehmer (بدون ضريبة، § 19 UStG)', 'Kleinunternehmer (ohne MwSt, § 19 UStG)'))}</span></label>
     <label class="f"><span>${esc(A('ضريبة رسوم التوصيل %', 'MwSt auf Liefergebühr %'))}</span><select id="sDv">${[7, 19].map(v => `<option ${+(s.delivery_vat || 7) === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
     <p class="note">${esc(A('اسأل المستشار الضريبي (Steuerberater) عن الضريبة الصحيحة.', 'Den richtigen Steuersatz bitte mit dem Steuerberater klären.'))}</p></div>
    <div class="card" data-sec="emails"><h3>${esc(A('الإيميلات للزباين', 'E-Mails an Kunden'))}</h3>
     <p class="note">${esc(A('بتنبعت لحالها: وصل الطلب، قيد التحضير، جاهز، بالطريق، تم التوصيل/الاستلام، ملغي، وصل التحويل.', 'Werden automatisch gesendet: eingegangen, in Zubereitung, fertig, unterwegs, geliefert/abgeholt, storniert, Zahlung erhalten.'))}</p>
     ${f('mail_from', A('المرسل (مثلاً Stein & Olive <bestellung@deine-domain.de>)', 'Absender (z. B. Stein & Olive <bestellung@deine-domain.de>)'))}${f('site_url', A('رابط الموقع', 'Website-Adresse'))}
     <div class="sub" style="margin:14px 0 6px"><b>${esc(A('مفتاح Resend', 'Resend-Schlüssel'))}</b></div>
     <div id="rsState" class="note">…</div>
     <div class="row"><label class="f"><span>${esc(A('المفتاح الجديد (بيبلّش بـ re_)', 'Neuer Schlüssel (beginnt mit re_)'))}</span><input type="password" id="rsKey" autocomplete="off" spellcheck="false" maxlength="210" placeholder="re_…"></label></div>
     <div class="acts" style="margin-bottom:10px"><button class="btn s" id="rsSave">${esc(A('حفظ المفتاح', 'Schlüssel speichern'))}</button><button class="btn s r" id="rsDel" hidden>${esc(A('حذف المفتاح', 'Schlüssel löschen'))}</button></div>
     <p class="note">${esc(A('المفتاح بينحفظ بمكان مقفول بالسيرفر. ما حدا بيقدر يشوفو، ولا حتى من هون. بيطلع بس آخر 4 أحرف.', 'Der Schlüssel wird gesperrt auf dem Server gespeichert. Niemand kann ihn wieder auslesen, auch nicht hier. Angezeigt werden nur die letzten 4 Zeichen.'))}</p>
     <div class="row"><label class="f"><span>${esc(A('إيميل تجربة', 'Test-E-Mail an'))}</span><input type="email" id="rsTo" maxlength="120" value="${esc(s.email || '')}"></label></div>
     <button class="btn s o" id="rsTest">${esc(A('ابعت إيميل تجربة', 'Test-E-Mail senden'))}</button>
     <div id="mailLog" class="note" style="margin-top:12px">…</div></div>
    <div class="card" data-sec="times"><h3>${esc(A('الأوقات والتقرير اليومي', 'Zeiten & Tagesbericht'))}</h3>
     <div class="row">${f('prep_min', A('مدة التحضير (دقايق)', 'Zubereitung (Minuten)'), 'number')}${f('drive_min', A('مدة التوصيل (دقايق)', 'Lieferfahrt (Minuten)'), 'number')}</div>
     <p class="note">${esc(A('منها بنحسب الوقت المتوقع اللي بيشوفو الزبون.', 'Daraus berechnen wir die Zeit, die der Kunde sieht.'))}</p>
     ${f('report_email', A('إيميل التقرير اليومي (مثلاً إيميل صاحب المحل)', 'E-Mail für den Tagesbericht (z. B. Inhaber)'), 'email')}
     <p class="note">${esc(A('كل يوم الساعة 23:00 بيوصل إيميل فيه: المبيعات لكل محل، أكتر شي انباع، والمنتجات اللي قربت تخلص. اتركها فاضية إذا ما بدك.', 'Jeden Tag um 23:00 Uhr kommt eine E-Mail mit Umsatz pro Geschäft, Bestsellern und knappen Produkten. Leer lassen = kein Bericht.'))}</p>
     <button class="btn s o" id="repTest">${esc(A('ابعت تقرير اليوم هلق', 'Heutigen Bericht jetzt senden'))}</button></div>
    <div class="card" data-sec="home"><h3>${esc(A('إعلان بالصفحة الرئيسية', 'Hinweis auf Startseite'))}</h3>${f('announce_ar', 'بالعربي')}${f('announce_de', 'Deutsch')}
     <label class="f"><span>${esc(A('تنبيه الصلاحية قبل (أيام)', 'MHD-Warnung (Tage vorher)'))}</span><input type="number" id="sEx" value="${esc(s.expiry_warn_days || 3)}"></label></div>
    <div class="card" data-sec="orders"><h3>${esc(A('استقبال الطلبات', 'Bestellannahme'))}</h3>
     <label class="chk"><input type="checkbox" id="oPause" ${s.orders_paused ? 'checked' : ''}><span><b>${esc(A('وقّف الطلبات مؤقتاً', 'Bestellungen pausieren'))}</b> · ${esc(A('مثلاً إذا في ضغط كبير أو مشكلة', 'z. B. bei Überlastung oder Problemen'))}</span></label>
     <div class="row">${f('pause_ar', A('رسالة للزباين (عربي)', 'Hinweis für Kunden (Arabisch)'))}${f('pause_de', A('رسالة للزباين (ألماني)', 'Hinweis für Kunden (Deutsch)'))}</div>
     <label class="chk"><input type="checkbox" id="oSched" ${s.allow_scheduled !== false ? 'checked' : ''}><span>${esc(A('الزبون بيقدر يختار وقت محدد (طلب مسبق)', 'Vorbestellung mit Wunschzeit erlauben'))}</span></label>
     <label class="chk"><input type="checkbox" id="oAcc" ${s.require_account ? 'checked' : ''}><span>${esc(A('الطلب بس مع حساب (بدون طلب كضيف)', 'Bestellen nur mit Kundenkonto (kein Gastkauf)'))}</span></label>
     <div class="row">${f('min_total', A('حد أدنى عام للطلب € (0 = بلا)', 'Mindestbestellwert allgemein € (0 = keiner)'), 'number')}<span></span></div>
     <p class="note">${esc(A('أوقات الدوام وفتح وسكر كل محل بتتغير من «المحلات».', 'Öffnungszeiten und Geöffnet/Geschlossen pro Geschäft stellst du unter „Geschäfte“ ein.'))}</p></div>
    <div class="card" data-sec="printer"><h3>${esc(A('الطابعة', 'Drucker'))}</h3>
     <p class="note">${esc(A('هالإعدادات لهالجهاز بس (كل محل بيضبط جهازو). بتنحفظ لحالها.', 'Diese Einstellungen gelten nur für dieses Gerät (jedes Geschäft stellt sein Gerät ein). Wird sofort gespeichert.'))}</p>
     <label class="chk"><input type="checkbox" id="dAuto" ${autoPrintOn() ? 'checked' : ''}><span><b>${esc(A('طباعة تلقائية لكل طلب جديد', 'Neue Bestellungen automatisch drucken'))}</b></span></label>
     <div class="row"><label class="f"><span>${esc(A('عرض ورق البون', 'Papierbreite Bon'))}</span><select id="dW"><option value="80" ${bonW() === 80 ? 'selected' : ''}>80 mm</option><option value="58" ${bonW() === 58 ? 'selected' : ''}>58 mm</option><option value="a4" ${bonW() === 'a4' ? 'selected' : ''}>A4</option></select></label>
     <label class="f"><span>${esc(A('عدد النسخ', 'Anzahl Kopien'))}</span><select id="dC">${[1, 2, 3].map(n => `<option ${bonCopies() === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
     <label class="chk"><input type="checkbox" id="dLbl" ${autoLabelOn() ? 'checked' : ''}><span><b>${esc(A('اطبع ملصق الكيس تلقائياً مع كل طلب توصيل', 'Bei Lieferungen automatisch das Tüten-Etikett drucken'))}</b></span></label>
     <label class="chk"><input type="checkbox" id="dLogo" ${localStorage.getItem('so_bon_logo') !== '0' ? 'checked' : ''}><span>${esc(A('اللوغو على البون', 'Logo auf dem Bon'))}</span></label>
     <button class="btn s" id="dTest">${ic('print', 's')} ${esc(A('اطبع بون تجربة', 'Testbon drucken'))}</button><button class="btn s o" id="dTestL">${ic('print', 's')} ${esc(A('اطبع ملصق تجربة', 'Test-Etikett drucken'))}</button>
     <details class="howto"><summary>${esc(A('كيف بوصل الطابعة؟', 'Wie verbinde ich den Drucker?'))}</summary>
      <ol><li>${esc(A('اشتري طابعة بونات 80mm بتشتغل WLAN أو Bluetooth، ومكتوب عليها إنها بتدعم AirPrint (آيفون/آيباد) أو Mopria (أندرويد).', 'Einen 80-mm-Bondrucker mit WLAN oder Bluetooth kaufen, der AirPrint (iPhone/iPad) oder Mopria (Android) unterstützt.'))}</li>
      <li>${esc(A('أندرويد: الإعدادات ← الأجهزة المتصلة ← الطباعة ← فعّل «خدمة الطباعة الافتراضية» أو ركّب تطبيق الطابعة من Play Store. إذا الطابعة Bluetooth بس، ركّب تطبيق RawBT.', 'Android: Einstellungen → Verbundene Geräte → Drucken → „Standard-Druckdienst“ aktivieren oder die Drucker-App aus dem Play Store installieren. Bei reinem Bluetooth-Drucker die App RawBT nutzen.'))}</li>
      <li>${esc(A('آيفون/آيباد: الطابعة والجهاز على نفس الـ WLAN، وبتطلع لحالها لما تكبس طباعة.', 'iPhone/iPad: Drucker und Gerät im selben WLAN, der Drucker erscheint beim Drucken automatisch.'))}</li>
      <li>${esc(A('كمبيوتر ويندوز: ركّب الطابعة وخليها «الطابعة الافتراضية». للطباعة بدون ما يطلع شباك الطباعة: افتح Chrome بـ اختصار مع الإضافة --kiosk-printing.', 'Windows-PC: Drucker installieren und als Standarddrucker setzen. Für Druck ohne Druckfenster Chrome über eine Verknüpfung mit --kiosk-printing starten.'))}</li>
      <li>${esc(A('بعدين اكبس «اطبع بون تجربة» وتأكد إنو الورق والعرض مظبوطين.', 'Dann „Testbon drucken“ und prüfen, ob Breite und Papier passen.'))}</li></ol></details></div>
    <div class="card" data-sec="notify"><h3>${esc(A('الإشعارات والصوت', 'Mitteilungen & Ton'))}</h3>
     <p class="note">${esc(A('لهالجهاز بس.', 'Nur für dieses Gerät.'))}</p>
     <div class="acts"><button class="btn s o" id="nPush">${ic('belloff', 's')}</button><button class="btn s o" id="nTest">${esc(A('إشعار تجربة', 'Test-Mitteilung'))}</button></div>
     <label class="chk" style="margin-top:10px"><input type="checkbox" id="nSnd" ${ST.sound ? 'checked' : ''}><span>${esc(A('صوت لما يجي طلب جديد', 'Ton bei neuer Bestellung'))}</span></label>
     <button class="btn s o" id="nBeep">${esc(A('جرّب الصوت', 'Ton testen'))}</button>
     <p class="note">${esc(A('على الآيفون الإشعارات بتشتغل بس إذا الموقع منضاف للشاشة الرئيسية (Safari ← مشاركة ← إلى الشاشة الرئيسية).', 'Auf dem iPhone funktionieren Mitteilungen nur, wenn die Seite zum Home-Bildschirm hinzugefügt wurde (Safari → Teilen → Zum Home-Bildschirm).'))}</p></div>
    <div class="card" data-sec="system"><h3>${esc(A('الأمان والنظام', 'Sicherheit & System'))}</h3>
     <div class="acts"><a class="btn s o" href="#/admin/account">${ic('key', 's')} ${esc(A('غيّر كلمة السر تبعي', 'Mein Passwort ändern'))}</a><a class="btn s o" href="#/admin/staff">${ic('users', 's')} ${esc(A('الموظفين وكلمات السر', 'Mitarbeiter & Passwörter'))}</a></div>
     <p class="note" style="margin-top:12px">${esc(A('إذا موبايل ضاع أو حدا عرف كلمة السر: غيّر كلمة السر، وبعدين اطلع من كل الأجهزة.', 'Wenn ein Handy weg ist oder jemand das Passwort kennt: Passwort ändern und dann auf allen Geräten abmelden.'))}</p>
     <button class="btn s r" id="sysOut">${esc(A('اطلع من كل الأجهزة', 'Auf allen Geräten abmelden'))}</button>
     <hr><div class="sum"><span>${esc(A('نسخة البرنامج', 'Version'))}</span><b dir="ltr">${esc(APPVER)}</b></div>
     <button class="btn s o" id="sysRl">${ic('refresh', 's')} ${esc(A('حدّث التطبيق على هالجهاز', 'App auf diesem Gerät aktualisieren'))}</button>
     <p class="note">${esc(A('الموقع: ', 'Website: '))}<span dir="ltr">${esc(location.origin)}</span> · ${esc(A('دخول الفريق: ', 'Team-Login: '))}<span dir="ltr">${esc(location.origin)}/team</span></p></div>
    <div class="setbar" id="setBar"><button class="btn full" id="setSave">${esc(A('حفظ الإعدادات', 'Einstellungen speichern'))}</button></div>`;
  const dz = () => { $('#zones').innerHTML = s.zones.map((z, i) => `<div class="card" style="padding:8px"><input type="text" data-zp="${i}" value="${esc(z.plz)}" placeholder="20099, 20097"><div class="row" style="margin-top:6px"><label class="f" style="margin:0"><span>${esc(A('سعر التوصيل €', 'Gebühr €'))}</span><input type="number" step="0.1" data-zf="${i}" value="${esc(z.fee)}"></label><label class="f" style="margin:0"><span>${esc(A('الحد الأدنى €', 'Mindestwert €'))}</span><input type="number" step="0.5" data-zm="${i}" value="${esc(z.min)}"></label></div><button class="btn s r" data-zx="${i}" style="margin-top:6px">✕</button></div>`).join('');
    $$('[data-zx]').forEach(b => b.onclick = () => { readZ(); s.zones.splice(+b.dataset.zx, 1); dz(); }); };
  const readZ = () => { s.zones = s.zones.map((z, i) => ({ plz: $(`[data-zp="${i}"]`).value.replace(/\s/g, ''), fee: parseFloat($(`[data-zf="${i}"]`).value) || 0, min: parseFloat($(`[data-zm="${i}"]`).value) || 0 })); };
  const EVN = { report: A('تقرير يومي', 'Tagesbericht'), test: A('تجربة', 'Test'), reset: A('كلمة سر جديدة', 'Passwort'), created: A('طلب جديد', 'Eingang'), preparing: A('تحضير', 'Zubereitung'), ready: A('جاهز', 'Fertig'), on_way: A('بالطريق', 'Unterwegs'), delivered: A('توصيل', 'Geliefert'), picked_up: A('استلام', 'Abgeholt'), cancelled: A('إلغاء', 'Storniert'), paid: A('دفع', 'Bezahlt') };
  const mailLog = () => sb.from('mail_queue').select('event,created_at,sent_at,error,order_id').order('created_at', { ascending: false }).limit(8).then(({ data }) => {
    const el = $('#mailLog'); if (!el) return;
    el.innerHTML = (data || []).length ? data.map(m => `<div class="sum"><span>${m.order_id ? '#' + (+m.order_id) + ' · ' : ''}${esc(EVN[m.event] || m.event)} · ${fmtDate(m.created_at)}</span><span>${m.sent_at ? '<span class="pill ok">' + esc(A('انبعت', 'Gesendet')) + '</span>' : '<span class="pill bad">' + esc((m.error || A('بالانتظار', 'Wartet')).slice(0, 40)) + '</span>'}</span></div>`).join('')
      : esc(A('لسا ما انبعت شي.', 'Noch keine E-Mails.'));
  });
  const rsState = async () => {
    const { data } = await sb.rpc('admin_mail_status'); const el = $('#rsState'); if (!el) return;
    el.innerHTML = data && data.set ? `<span class="pill ok">${esc(A('المفتاح محفوظ', 'Schlüssel gespeichert'))}</span> <span dir="ltr">${esc(data.hint)}</span>`
      : `<div class="warnbox">${esc(A('ما في مفتاح لسا. بدونو ما بتنبعت إيميلات.', 'Noch kein Schlüssel. Ohne ihn werden keine E-Mails gesendet.'))}</div>`;
    $('#rsDel').hidden = !(data && data.set);
  };
  mailLog(); rsState();
  const stState = async () => {
    const { data } = await sb.rpc('admin_secret_status'); const el = $('#stState'); if (!el) return;
    const ok = data && data.stripe && data.stripe_whsec;
    el.innerHTML = ok ? `<span class="pill ok">${esc(A('Stripe موصول', 'Stripe verbunden'))}</span> <span dir="ltr">${esc(data.stripe.hint)}</span>${/_test_/.test(data.stripe.hint) ? ` <span class="pill warn">${esc(A('وضع التجربة', 'Testmodus'))}</span>` : ''}`
      : `<div class="warnbox">${esc(A('Stripe لسا مش موصول. الزباين ما رح يشوفو الدفع بالبطاقة.', 'Stripe noch nicht verbunden. Kunden sehen die Kartenzahlung noch nicht.'))}</div>`;
    $('#stDel').hidden = !(data && (data.stripe || data.stripe_whsec));
  };
  stState();
  $('#stSave').onclick = async () => {
    const sk = $('#stSk').value.trim(), wh = $('#stWh').value.trim();
    if (!sk && !wh) return toast(A('حط مفتاح واحد على الأقل.', 'Mindestens einen Schlüssel eintragen.'), 1);
    if (sk && !/^(sk|rk)_(live|test)_[A-Za-z0-9]{10,200}$/.test(sk)) return toast(A('المفتاح السري لازم يبلّش بـ sk_live_ أو rk_live_.', 'Der geheime Schlüssel muss mit sk_live_ oder rk_live_ beginnen.'), 1);
    if (wh && !/^whsec_[A-Za-z0-9]{10,200}$/.test(wh)) return toast(A('مفتاح الـ Webhook لازم يبلّش بـ whsec_.', 'Der Webhook-Schlüssel muss mit whsec_ beginnen.'), 1);
    for (const [n, v] of [['stripe', sk], ['stripe_whsec', wh]]) { if (!v) continue; const { error } = await sb.rpc('admin_set_secret', { p_name: n, p_value: v }); if (error) return err(error); }
    $('#stSk').value = ''; $('#stWh').value = ''; toast(A('انحفظ', 'Gespeichert')); stState();
  };
  $('#stDel').onclick = async () => {
    if (!confirm(A('أكيد بدك تفصل Stripe؟', 'Stripe wirklich trennen?'))) return;
    for (const n of ['stripe', 'stripe_whsec']) await sb.rpc('admin_set_secret', { p_name: n, p_value: '' });
    toast(A('انفصل', 'Getrennt')); stState();
  };
  $('#repTest').onclick = async () => {
    const v = ($('[data-k="report_email"]').value || '').trim();
    if ((s.report_email || '') !== v) return toast(A('احفظ الإعدادات أول شي (الزر تحت)، وبعدين جرّب.', 'Bitte zuerst die Einstellungen speichern (Button unten).'), 1);
    if (!v) return toast(A('اكتب إيميل التقرير أول شي.', 'Bitte zuerst die Bericht-E-Mail eintragen.'), 1);
    const { error } = await sb.rpc('admin_report_now'); if (error) return err(error);
    toast(A('انبعت التقرير. شوف الإيميل بعد دقيقة.', 'Bericht gesendet. In einer Minute ins Postfach schauen.')); setTimeout(mailLog, 4000);
  };
  $('#rsSave').onclick = async () => {
    const k = $('#rsKey').value.trim();
    if (!/^re_[A-Za-z0-9_]{10,200}$/.test(k)) return toast(A('المفتاح لازم يبلّش بـ re_. انسخو كامل من Resend.', 'Der Schlüssel muss mit re_ beginnen. Bitte komplett aus Resend kopieren.'), 1);
    const { error } = await sb.rpc('admin_set_resend_key', { p_key: k });
    if (error) return err(error);
    $('#rsKey').value = ''; toast(A('انحفظ المفتاح', 'Schlüssel gespeichert')); rsState();
  };
  $('#rsDel').onclick = async () => {
    const { error } = await sb.rpc('admin_set_resend_key', { p_key: '' });
    if (error) return err(error);
    toast(A('انحذف المفتاح', 'Schlüssel gelöscht')); rsState();
  };
  $('#rsTest').onclick = async () => {
    const to = $('#rsTo').value.trim();
    const b = $('#rsTest'); b.disabled = true;
    const { error } = await sb.rpc('admin_test_mail', { p_to: to });
    b.disabled = false;
    if (error) return err(error);
    toast(A('انبعت الطلب. شوف الإيميل بعد دقيقة.', 'Gesendet. Schau in einer Minute ins Postfach.'));
    setTimeout(mailLog, 4000);
  };
  const show = sec => {
    ST.setSec = sec || null;
    $('#setNav').hidden = !!sec; $('#setHd').hidden = !sec;
    $$('[data-sec]', main).forEach(c => { c.hidden = c.dataset.sec !== sec; });
    const x = SETSEC.find(y => y[0] === sec); $('#setTitle').textContent = x ? A(x[2], x[3]) : '';
    $('#setBar').hidden = !sec || ['printer', 'notify', 'system'].includes(sec);
    window.scrollTo(0, 0);
  };
  $$('#setNav [data-go]').forEach(b => b.onclick = () => show(b.dataset.go));
  $('#setBack').onclick = () => show(null);
  show(SETSEC.some(x => x[0] === ST.sub) ? ST.sub : null);
  $('#dAuto').onchange = e => { localStorage.setItem('so_autoprint', e.target.checked ? '1' : '0'); toast('✓'); };
  $('#dW').onchange = e => { localStorage.setItem('so_bon_w', e.target.value); toast('✓'); };
  $('#dC').onchange = e => { localStorage.setItem('so_bon_copies', e.target.value); toast('✓'); };
  $('#dLbl').onchange = e => { localStorage.setItem('so_auto_lbl', e.target.checked ? '1' : '0'); toast('✓'); };
  $('#dLogo').onchange = e => { localStorage.setItem('so_bon_logo', e.target.checked ? '1' : '0'); toast('✓'); };
  $('#dTest').onclick = () => printBon({ id: 1234, mode: 'delivery', created_at: new Date().toISOString(), customer_name: 'Test', phone: '0170 0000000', note: A('بون تجربة', 'Testbon'),
    order_items: [{ shop_id: (S.staff.shop_id || (S.shops[0] || {}).id), status: 'new', qty: 2, unit: 'piece', name_de: 'Testartikel', name_ar: 'منتج تجربة', options: [] }, { shop_id: (S.staff.shop_id || (S.shops[0] || {}).id), status: 'new', qty: 0.5, unit: 'kg', name_de: 'Oliven', name_ar: 'زيتون', options: [{ de: 'scharf', ar: 'حار' }] }] });
  $('#dTestL').onclick = () => printLabel({ id: 1234, mode: 'delivery', created_at: new Date().toISOString(), customer_name: 'Test Kunde', phone: '0170 0000000', street: 'Steintorweg 4', plz: '20099', city: 'Hamburg', address_note: A('الطابق 2، الجرس: Test', '2. OG, Klingel: Test'), payment: 'cash', paid: false, total: 18.9,
    order_items: [{ shop_id: (S.staff.shop_id || (S.shops[0] || {}).id), status: 'new', qty: 2, unit: 'piece', name_de: 'Testartikel', name_ar: 'منتج تجربة', options: [], line_total: 10 }] });
  paintPush($('#nPush')); $('#nPush').onclick = () => pushToggle($('#nPush'));
  $('#nTest').onclick = async () => {
    if (!('Notification' in window)) return toast(A('هالمتصفح ما بيدعم الإشعارات.', 'Dieser Browser unterstützt keine Mitteilungen.'), 1);
    if (Notification.permission !== 'granted' && await Notification.requestPermission() !== 'granted') return toast(A('الإشعارات مش مسموحة.', 'Mitteilungen nicht erlaubt.'), 1);
    const reg = await navigator.serviceWorker.getRegistration();
    const opt = { body: A('هيك بيطلع الإشعار لما يجي طلب.', 'So sieht eine Mitteilung bei neuer Bestellung aus.'), icon: 'icon-192.png', tag: 'so-test' };
    if (reg) reg.showNotification('Stein & Olive', opt); else new Notification('Stein & Olive', opt);
  };
  $('#nSnd').onchange = e => { ST.sound = e.target.checked; localStorage.setItem('so_sound', ST.sound ? '1' : '0'); if (ST.sound) beep(); };
  $('#nBeep').onclick = () => beep();
  $('#sysOut').onclick = async () => { if (!confirm(A('أكيد؟ كل الأجهزة اللي فاتت بهالحساب رح تطلع.', 'Sicher? Alle Geräte mit diesem Konto werden abgemeldet.'))) return; stopLive(); await sb.auth.signOut({ scope: 'global' }); S.staff = null; location.hash = '#/team'; };
  $('#sysRl').onclick = async () => { try { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map(r => r.update())); } catch (_) {} location.reload(); };
  dz(); $('#zAdd').onclick = () => { readZ(); s.zones.push({ plz: '', fee: 3, min: 20 }); dz(); };
  $('#setSave').onclick = async () => {
    readZ(); $$('[data-k]').forEach(i => s[i.dataset.k] = i.value.trim());
    s.pickup = $('#sPk').checked; s.delivery = $('#sDl').checked; s.expiry_warn_days = +$('#sEx').value || 3;
    s.payments = { cash: $('#pCa').checked, card: $('#pCd').checked, transfer: $('#pTr').checked, paypal: $('#pPp').checked, paypal_me: $('#pPm').value.trim(), stripe: $('#pSt').checked };
    s.kleinunternehmer = $('#sKu').checked; s.delivery_vat = +$('#sDv').value;
    s.orders_paused = $('#oPause').checked; s.allow_scheduled = $('#oSched').checked; s.require_account = $('#oAcc').checked;
    s.min_total = String(Math.max(0, parseFloat(String(s.min_total || '0').replace(',', '.')) || 0));
    s.prep_min = String(Math.min(240, Math.max(5, parseInt(s.prep_min, 10) || 25))); s.drive_min = String(Math.min(120, Math.max(5, parseInt(s.drive_min, 10) || 15)));
    if (s.bank_iban) s.bank_iban = s.bank_iban.replace(/\s/g, '').toUpperCase();
    if (s.payments.transfer && !/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s.bank_iban || '')) return toast(A('الـ IBAN مش صحيح', 'IBAN ungültig'), 1);
    const { error } = await sb.from('settings').update({ data: s }).eq('id', 1); if (error) return err(error);
    S.settings = s; toast('✓');
  };
}
function secScreens(main) {
  const base = location.origin + '/';
  const KEY = 'so_tvn'; let N = {}; try { N = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) {}
  const draw = () => {
    const mk = n => location.origin + '/menu/video.html?s=' + n;
    const tvn = n => n === 1 ? A('المنيو', 'Karte') : A('العروض والصور', 'Spezialitäten & Bilder');
    main.innerHTML = `<div class="card"><b>🥙 ${esc(A('الفرن – مناقيش ومعجنات (شاشات متحركة)', 'Bäckerei – Manakish & Backwaren (animiert)'))}</b>
      ${[1, 2].map(n => `<div class="row" style="align-items:center;margin-top:8px"><b>${esc(A('شاشة', 'Bildschirm'))} ${n} · ${esc(tvn(n))}</b><div class="acts"><a class="btn s" href="${esc(mk(n))}" target="_blank">${esc(A('فتح', 'Öffnen'))}</a><button class="btn s o" data-cp="${esc(mk(n))}">${esc(A('نسخ الرابط', 'Link kopieren'))}</button></div></div><div class="note" dir="ltr" style="font-size:15px">${esc(mk(n).replace(/^https?:\/\//, ''))}</div>`).join('')}</div>
    <p class="note">${esc(A('افتح الرابط على متصفح التلفزيون (Smart TV) واعمل شاشة كاملة. المنيو بيتحدّث لحالو كل دقيقة، والمنتجات الخلصانة بتختفي لحالها. إذا المحل عندو شاشتين، الأقسام بتتقسم عليهن تلقائياً.', 'Link im Browser des Smart-TV öffnen und Vollbild. Das Menü aktualisiert sich jede Minute, ausverkaufte Produkte verschwinden. Bei 2 Bildschirmen werden die Kategorien automatisch aufgeteilt.'))}</p>
    ${myShops().map(sh => { const n = N[sh.id] || 2;
      return `<div class="card"><div class="li" style="align-items:center"><div class="t"><b>${SI(sh.type)} ${esc(L(sh, 'name'))}</b></div>
        <label class="f" style="margin:0;min-width:140px"><span>${esc(A('عدد الشاشات', 'Bildschirme'))}</span><select data-n="${esc(sh.id)}">${[1, 2, 3].map(v => `<option ${v === n ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>
        ${Array.from({ length: n }, (_, i) => { const url = `${base}#/tv/${sh.id}/${i + 1}/${n}`;
          return `<div class="row" style="align-items:center;margin-top:8px"><b>${esc(A('شاشة', 'Bildschirm'))} ${i + 1}</b>
            <div class="acts"><a class="btn s" href="${esc(url)}" target="_blank">${esc(A('فتح', 'Öffnen'))}</a><button class="btn s o" data-cp="${esc(url)}">${esc(A('نسخ الرابط', 'Link kopieren'))}</button></div></div>
            <div class="note" style="word-break:break-all;font-size:15px" dir="ltr">${esc(url.replace(/^https?:\/\//, ''))}</div>`; }).join('')}</div>`; }).join('')}`;
    $$('[data-cp]').forEach(b => b.onclick = () => navigator.clipboard.writeText(b.dataset.cp).then(() => toast('✓')));
    $$('[data-n]').forEach(sel => sel.onchange = () => { N[sel.dataset.n] = +sel.value; try { localStorage.setItem(KEY, JSON.stringify(N)); } catch (_) {} draw(); });
  };
  draw();
}
/* ---------- KI-Assistent (nur Admin): schwebender Knopf auf jeder Seite + eigene Seite.
   Schreiben → Vorschlag ansehen → bestätigen → rückgängig möglich. Kann auch zu Seiten führen. ---------- */
const AI = { msgs: [], plan: null, preview: null, prompt: '', busy: false, lastLog: null, root: null };
const SPARK = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c.6 3.9 2.1 5.4 6 6-3.9.6-5.4 2.1-6 6-.6-3.9-2.1-5.4-6-6 3.9-.6 5.4-2.1 6-6Z"/><path d="M19 15c.3 1.6.9 2.2 2.5 2.5-1.6.3-2.2.9-2.5 2.5-.3-1.6-.9-2.2-2.5-2.5 1.6-.3 2.2-.9 2.5-2.5Z"/></svg>';
const SENDI = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>';
// Seiten mit Kundendaten: deren Inhalt wird NICHT an die KI geschickt (Datenschutz), nur der Seitenname.
const AI_PRIVATE = ['orders', 'customers', 'staff', 'reports', 'account'];
async function aiCall(body) {
  const { data } = await sb.auth.getSession();
  const tok = data.session && data.session.access_token;
  const r = await fetch(App.CFG.url + '/functions/v1/admin-ai', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: App.CFG.key, Authorization: 'Bearer ' + tok }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || 'error'); e.code = j.error; e.detail = j.detail; throw e; }
  return j;
}
const AI_F = { price: ['السعر', 'Preis'], name_ar: ['الاسم عربي', 'Name AR'], name_de: ['الاسم ألماني', 'Name DE'], desc_ar: ['الوصف عربي', 'Beschreibung AR'], desc_de: ['الوصف ألماني', 'Beschreibung DE'], active: ['ظاهر/متوفر', 'Verfügbar'], featured: ['مميز', 'Hervorgehoben'], halal: ['حلال', 'Halal'], cooled: ['مبرد', 'Gekühlt'], track_stock: ['تتبع المخزون', 'Lager führen'], stock: ['المخزون', 'Bestand'], min_stock: ['حد أدنى للمخزون', 'Mindestbestand'], category_id: ['القسم', 'Kategorie'], unit: ['الوحدة', 'Einheit'], barcode: ['باركود', 'Barcode'], vat: ['الضريبة %', 'MwSt %'], pfand: ['Pfand', 'Pfand'] };
function aiVal(k, v) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? A('نعم', 'Ja') : A('لا', 'Nein');
  if (k === 'price' || k === 'pfand') return money(v);
  if (k === 'unit') return v === 'kg' ? A('كيلو', 'kg') : A('قطعة', 'Stück');
  if (k === 'category_id') return typeof v === 'object' ? L(v, 'name') : String(v);
  return String(v);
}
function aiPreviewHtml(lines) {
  const TAG = { update: ['be', 'edit', 'تعديل', 'Ändern'], create: ['ok', 'plus', 'جديد', 'Neu'], delete: ['bad', 'trash', 'حذف', 'Löschen'], category: ['ok', 'list', 'قسم جديد', 'Neue Kategorie'] };
  return lines.map(l => {
    const t = TAG[l.kind]; if (!t) return '';
    const nm = esc(S.lang === 'ar' ? l.name_ar : l.name_de);
    let body = '';
    if (l.kind === 'update') body = l.diff.map(d => `<div class="ai-diff"><span>${esc(A((AI_F[d.field] || [d.field])[0], (AI_F[d.field] || [d.field, d.field])[1]))}</span><s>${esc(aiVal(d.field, d.from))}</s><i>${ic(S.lang === 'ar' ? 'back' : 'fwd', 's')}</i><b>${esc(aiVal(d.field, d.to))}</b></div>`).join('');
    if (l.kind === 'create') body = `<div class="ai-diff"><b>${esc(money(l.price))}${l.unit === 'kg' ? ' / kg' : ''}</b>${l.stock ? `<span>${esc(A('مخزون', 'Bestand'))} ${esc(l.stock)}</span>` : ''}</div>`;
    return `<div class="ai-row ${l.kind}"><span class="ai-ic ${t[0]}">${ic(t[1], 's')}</span><div class="ai-rt"><div class="ai-rn"><b>${nm}</b><span class="ai-tag ${t[0]}">${esc(A(t[2], t[3]))}</span></div>${l.shop ? `<small>${esc(L(l.shop, 'name'))}</small>` : ''}${body}</div></div>`;
  }).join('');
}
function aiErr(e) {
  if (e.code === 'quota') return A('خلص الحد المجاني لهلأ. جرّب بعد شوي أو بكرا.', 'Gratis-Kontingent für jetzt aufgebraucht. Bitte später oder morgen erneut versuchen.');
  if (e.code === 'forbidden') return A('المساعد للأدمن بس. سجّل دخول من جديد.', 'Nur für Admins. Bitte neu anmelden.');
  if (e.code === 'no_key') return A('مفتاح Gemini مش محطوط بـ Supabase.', 'Gemini-Schlüssel fehlt in Supabase.');
  if (e.detail) console.warn('admin-ai', e.detail);
  return A('صار خطأ، جرّب مرة تانية.', 'Fehler, bitte nochmal versuchen.');
}
const curSec = () => { const m = location.hash.match(/^#\/admin\/([a-z]+)/); return m ? m[1] : 'orders'; };
function aiPage() {
  const sec = curSec(); const m = MENU.find(x => x[0] === sec);
  const o = { section: sec, title: m ? A(m[2], m[3]) : sec };
  if (sec === 'settings' && ST.setSec) o.sub = ST.setSec;
  if (!AI_PRIVATE.includes(sec)) { const el = $('#amain'); if (el) o.text = el.innerText.replace(/\s+\n/g, '\n').replace(/[ \t]+/g, ' ').slice(0, 2500); }
  return o;
}
function aiGo(nav) {
  if (!nav || !nav.section) return;
  ST.sub = nav.sub || null;
  if (nav.section === 'orders' && ['active', 'done', 'cancelled', 'all'].includes(nav.tab)) ST.tab = nav.tab;
  aiClose();
  const target = '#/admin/' + nav.section + (nav.sub ? '/' + nav.sub : '');
  const after = () => { if (!nav.search) return; setTimeout(() => { const i = $('#amain input[type=search]'); if (i) { i.value = nav.search; i.dispatchEvent(new Event('input')); } }, 350); };
  if (location.hash === target) App.route(); else location.hash = target;
  after();
}
function aiExamples() {
  const sec = curSec();
  const base = { products: [A('شو المنتجات اللي ما إلها صورة؟', 'Welche Produkte haben kein Foto?'), A('زيد أسعار الملحمة 5%', 'Metzgerei-Preise um 5 % erhöhen')], settings: [A('وين بغيّر رسوم التوصيل؟', 'Wo ändere ich die Liefergebühr?'), A('كيف بوقّف الطلبات مؤقتاً؟', 'Wie pausiere ich Bestellungen?')], stock: [A('شو المنتجات اللي قربت تخلص؟', 'Was ist fast ausverkauft?')] }[sec] || [];
  return base.concat([A('ودّيني على الطلبات الجديدة', 'Zeig mir die neuen Bestellungen'), A('غيّر سعر زيت الزيتون لـ 8.99', 'Olivenöl auf 8,99 setzen'), A('ضيف منتج: لبنة 500غ بالسوبرماركت بـ 2.49', 'Neu: Labneh 500 g im Supermarkt, 2,49')]).slice(0, 4);
}
// **fett** aus der KI-Antwort sauber anzeigen statt Sternchen
function aiFmt(t) { return esc(String(t || '').replace(/^#+\s*/gm, '')).replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>').replace(/(^|\s)\*([^*\n]+)\*(?=\s|$)/g, '$1$2').replace(/^\s*[*-]\s+/gm, '• '); }
function aiRender() {
  const root = AI.root; if (!root) return;
  const msgs = AI.msgs.map(m => `<div class="ai-msg ${m.role === 'user' ? 'me' : 'bot'}${m.err ? ' err' : ''}">${m.role === 'user' ? '' : `<span class="ai-av">${SPARK}</span>`}<div class="ai-bub">${aiFmt(m.text)}${m.nav ? `<button class="ai-go" data-nav="${AI.msgs.indexOf(m)}">${ic(S.lang === 'ar' ? 'back' : 'fwd', 's')} ${esc(A('روح', 'Öffnen'))}</button>` : ''}</div></div>`).join('');
  const hello = `<div class="ai-hello"><span class="ai-orb">${SPARK}</span><h3>${esc(A('أهلين! كيف فيني ساعدك؟', 'Hallo! Wie kann ich helfen?'))}</h3>
      <p>${esc(A('بغيّر أسعار، بضيف وبحذف منتجات، بدبّر المخزون، وبودّيك على أي صفحة. ما بيتغيّر شي قبل ما تأكّد.', 'Preise ändern, Produkte anlegen/löschen, Lager pflegen und dich zu jeder Seite bringen. Nichts ändert sich ohne deine Bestätigung.'))}</p></div>`;
  root.querySelector('.ai-body').innerHTML = (AI.msgs.length ? msgs : hello)
    + (AI.busy ? `<div class="ai-msg bot"><span class="ai-av">${SPARK}</span><div class="ai-bub ai-typing"><i></i><i></i><i></i></div></div>` : '')
    + (AI.preview && AI.preview.length ? `<div class="ai-plan" id="aiPlan"><div class="ai-ph"><b>${esc(A('التغييرات المقترحة', 'Vorgeschlagene Änderungen'))}</b><span class="ai-count">${AI.preview.length}</span></div>
        <div class="ai-rows">${aiPreviewHtml(AI.preview)}</div>
        <div class="ai-pa"><button class="btn g" id="aiOk">${ic('check', 's')} ${esc(A('تأكيد التنفيذ', 'Ausführen'))}</button><button class="btn o" id="aiNo">${esc(A('إلغاء', 'Abbrechen'))}</button></div></div>` : '')
    + (AI.lastLog ? `<div class="ai-done"><span class="ai-ic ok">${ic('check', 's')}</span><span>${esc(A('تم التنفيذ', 'Ausgeführt'))}</span><button class="btn s o" id="aiUndo">${ic('repeat', 's')} ${esc(A('تراجع', 'Rückgängig'))}</button></div>` : '');
  const chips = root.querySelector('.ai-chips');
  chips.innerHTML = AI.busy || AI.preview ? '' : aiExamples().map(t => `<button data-ex="${esc(t)}">${esc(t)}</button>`).join('');
  const inp = root.querySelector('.ai-in'); inp.disabled = AI.busy; root.querySelector('.ai-send').disabled = AI.busy;
  root.querySelector('.ai-new').hidden = !AI.msgs.length;
  const body = root.querySelector('.ai-body');
  requestAnimationFrame(() => { const p = $('#aiPlan', root); if (p) p.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); else body.scrollTop = body.scrollHeight; });
  $$('[data-ex]', root).forEach(b => b.onclick = () => aiSend(b.dataset.ex));
  $$('[data-nav]', root).forEach(b => b.onclick = () => aiGo(AI.msgs[+b.dataset.nav].nav));
  if ($('#aiNo', root)) $('#aiNo', root).onclick = () => { AI.plan = null; AI.preview = null; AI.msgs.push({ role: 'model', text: A('تمام، ما غيّرت شي.', 'OK, nichts geändert.') }); aiRender(); };
  if ($('#aiOk', root)) $('#aiOk', root).onclick = async (ev) => {
    const del = AI.preview.filter(l => l.kind === 'delete').length;
    if (del && !confirm(A(`أكيد؟ رح ينحذف ${del} منتج.`, `Sicher? ${del} Produkt(e) werden gelöscht.`))) return;
    ev.currentTarget.disabled = true;
    try {
      const r = await aiCall({ mode: 'execute', prompt: AI.prompt, plan: AI.plan });
      AI.lastLog = r.log_id; AI.plan = null; AI.preview = null;
      AI.msgs.push({ role: 'model', text: A(`✓ تم. (${r.done} تغيير)`, `✓ Erledigt. (${r.done} Änderung(en))`) });
      await reloadAll(); toast('✓'); aiRefreshPage();
    } catch (e) { toast(aiErr(e), 1); }
    aiRender();
  };
  if ($('#aiUndo', root)) $('#aiUndo', root).onclick = async (ev) => {
    if (!confirm(A('ترجّع آخر تغيير؟', 'Letzte Änderung rückgängig machen?'))) return;
    ev.currentTarget.disabled = true;
    try { await aiCall({ mode: 'undo', log_id: AI.lastLog }); AI.lastLog = null; AI.msgs.push({ role: 'model', text: A('↩ رجّعت التغيير.', '↩ Rückgängig gemacht.') }); await reloadAll(); toast('✓'); aiRefreshPage(); }
    catch (e) { toast(aiErr(e), 1); }
    aiRender();
  };
}
// nach einer Änderung die Seite dahinter neu zeichnen (z. B. Produktliste), außer die KI-Seite selbst
function aiRefreshPage() { const s = curSec(); if (s !== 'ai' && ['products', 'stock', 'shops'].includes(s)) App.route(); }
async function aiSend(txt) {
  txt = String(txt || '').trim(); if (!txt || AI.busy) return;
  if (!App.allow('ai', 12, 60)) return;
  const inp = AI.root && AI.root.querySelector('.ai-in'); if (inp) { inp.value = ''; inp.style.height = ''; }
  AI.msgs.push({ role: 'user', text: txt }); AI.prompt = txt; AI.plan = null; AI.preview = null; AI.lastLog = null; AI.busy = true; aiRender();
  try {
    const r = await aiCall({ mode: 'chat', messages: AI.msgs.filter(m => !m.err).map(m => ({ role: m.role, text: m.text })), page: aiPage(), lang: S.lang });
    const nav = r.nav && r.nav.section ? r.nav : null;
    AI.msgs.push({ role: 'model', text: r.reply || (r.plan && r.plan.length ? A('راجع التغييرات تحت وأكّد.', 'Bitte Änderungen unten prüfen und bestätigen.') : nav ? A('تفضّل:', 'Bitte:') : '…'), nav });
    AI.plan = r.plan && r.plan.length ? r.plan : null; AI.preview = r.preview || null;
    AI.busy = false;
    if (nav && !AI.plan) { aiRender(); setTimeout(() => aiGo(nav), 700); return; }
  } catch (e) { AI.msgs[AI.msgs.length - 1].err = true; AI.msgs.push({ role: 'model', text: aiErr(e), err: true }); }
  AI.busy = false; aiRender();
}
function aiShell(cls) {
  return `<div class="ai-box ${cls}"><div class="ai-head"><span class="ai-orb sm">${SPARK}</span><div class="ai-ht"><b>${esc(A('المساعد الذكي', 'KI-Assistent'))}</b><small><i class="ai-dot"></i>${esc(A('بيعرف منتجاتك وصفحاتك', 'Kennt deine Produkte und Seiten'))}</small></div>
      <button class="ai-hb ai-new" title="${esc(A('محادثة جديدة', 'Neues Gespräch'))}" hidden>${ic('refresh', 's')}</button>${cls === 'ai-sheet' ? `<button class="ai-hb ai-x" aria-label="${esc(A('سكّر', 'Schließen'))}">${ic('x', 's')}</button>` : ''}</div>
    <div class="ai-body"></div>
    <div class="ai-foot"><div class="ai-chips"></div>
      <div class="ai-bar"><textarea class="ai-in" rows="1" placeholder="${esc(A('اكتب طلبك أو سؤالك…', 'Frag oder schreib, was du willst …'))}"></textarea><button class="ai-send" aria-label="${esc(A('إرسال', 'Senden'))}">${SENDI}</button></div></div></div>`;
}
function aiBind(root) {
  AI.root = root;
  const inp = root.querySelector('.ai-in');
  inp.oninput = () => { inp.style.height = 'auto'; inp.style.height = Math.min(inp.scrollHeight, 140) + 'px'; };
  inp.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) { e.preventDefault(); aiSend(inp.value); } };
  root.querySelector('.ai-send').onclick = () => aiSend(inp.value);
  root.querySelector('.ai-new').onclick = () => { AI.msgs = []; AI.plan = null; AI.preview = null; AI.lastLog = null; aiRender(); };
  const x = root.querySelector('.ai-x'); if (x) x.onclick = aiClose;
  aiRender();
}
function aiOpen() {
  if (curSec() === 'ai' || $('.ai-ov')) return;
  const ov = document.createElement('div'); ov.className = 'ai-ov';
  ov.innerHTML = aiShell('ai-sheet');
  ov.onclick = e => { if (e.target === ov) aiClose(); };
  document.body.appendChild(ov); document.body.classList.add('ai-lock');
  aiBind(ov.querySelector('.ai-box'));
  const f = $('.ai-fab'); if (f) f.hidden = true;
  if (!('ontouchstart' in window)) setTimeout(() => { const i = ov.querySelector('.ai-in'); if (i) i.focus(); }, 250);
}
function aiClose() {
  const ov = $('.ai-ov'); if (ov) ov.remove(); document.body.classList.remove('ai-lock');
  if (AI.root && !document.body.contains(AI.root)) AI.root = null;
  const f = $('.ai-fab'); if (f) f.hidden = curSec() === 'ai';
}
function aiFab() {
  let f = $('.ai-fab');
  if (!S.staff || S.staff.role !== 'admin') { if (f) f.remove(); return; }
  if (!f) { f = document.createElement('button'); f.className = 'ai-fab noprint'; f.setAttribute('aria-label', A('المساعد الذكي', 'KI-Assistent')); f.innerHTML = SPARK; f.onclick = aiOpen; document.body.appendChild(f); }
  f.hidden = curSec() === 'ai';
}
function secAi(main) {
  aiClose();
  main.innerHTML = aiShell('ai-pagebox');
  aiBind(main.querySelector('.ai-box'));
}
function secAccount(main) {
  main.innerHTML = `<div class="card"><h3>${esc(A('تغيير كلمة السر', 'Passwort ändern'))}</h3><div class="note">${esc(A('اسم الدخول:', 'Login:'))} <b>${esc(S.staff.username)}</b></div>
    <label class="f"><span>${esc(A('كلمة السر الجديدة', 'Neues Passwort'))}</span><input type="password" id="np1"></label><label class="f"><span>${esc(A('أعدها', 'Wiederholen'))}</span><input type="password" id="np2"></label>
    <button class="btn" id="npGo">${esc(A('حفظ', 'Speichern'))}</button></div><button class="btn o full" id="lo2">${esc(A('خروج', 'Abmelden'))}</button>`;
  $('#npGo').onclick = async () => { const a = $('#np1').value; if (a.length < 8 || a !== $('#np2').value) return toast(A('كلمة السر قصيرة أو مش متطابقة', 'Passwort zu kurz oder ungleich'), 1); const { error } = await sb.auth.updateUser({ password: a }); if (error) return err(error); toast('✓'); };
  $('#lo2').onclick = logout;
}

/* ---------- driver portal ---------- */
function stopGeo() {
  if (ST.geo != null && navigator.geolocation) navigator.geolocation.clearWatch(ST.geo);
  ST.geo = null; clearInterval(ST.geoTimer); ST.geoTimer = null; ST.geoPos = null; ST.geoLast = 0;
}
function sendPos() {
  const p = ST.geoPos; if (!p || !S.staff) return;
  const mine = ST.orders.filter(o => o.driver_id === S.staff.user_id && o.status === 'on_way');
  // supabase rpc() only runs once awaited/then'd
  mine.forEach(o => sb.rpc('driver_pos', { p_order: o.id, lat: p.lat, lng: p.lng }).then(({ error }) => { ST.geoSendErr = !!error; geoBox(); }));
  ST.geoLast = Date.now(); geoBox();
}
function geoBox() {
  const el = $('#geoInfo'); if (!el || !S.staff) return;
  const onWay = ST.orders.some(o => o.driver_id === S.staff.user_id && o.status === 'on_way');
  if (!onWay) { el.innerHTML = ''; return; }
  if (ST.geoErr === 'denied' || ST.geoErr === 'unsupported') { el.innerHTML = `<div class="warnbox bad">${ic('alert', 's')}<span>${esc(A('الموقع مسكّر، والزبون ما عم يشوفك. فعّل الموقع (Standort) للمتصفح من إعدادات الموبايل، وبعدين حدّث الصفحة.', 'Standort ist blockiert, der Kunde sieht dich nicht. Standort für den Browser in den Handy-Einstellungen erlauben und Seite neu laden.'))}</span></div>`; return; }
  if (!ST.geoPos) { el.innerHTML = `<div class="warnbox">${ic('clock', 's')}<span>${esc(A('عم ندوّر على موقعك… إذا سألك المتصفح، اكبس «سماح».', 'Standort wird gesucht… Wenn der Browser fragt, bitte „Zulassen“ tippen.'))}</span></div>`; return; }
  el.innerHTML = `<div class="infobox">${ic('check', 's')}<span>${esc(A('موقعك عم يتشارك مع الزبون. خلّي الصفحة مفتوحة.', 'Dein Standort wird mit dem Kunden geteilt. Seite geöffnet lassen.'))}${ST.geoSendErr ? ' ⚠' : ''}</span></div>`;
}
function syncGeo() {
  const mine = ST.orders.filter(o => o.driver_id === S.staff.user_id && o.status === 'on_way');
  if (!mine.length) { stopGeo(); geoBox(); return; }
  if (!navigator.geolocation) { ST.geoErr = 'unsupported'; geoBox(); return; }
  if (ST.geo != null) { geoBox(); return; }
  ST.geoErr = null;
  ST.geo = navigator.geolocation.watchPosition(pos => {
    ST.geoPos = { lat: pos.coords.latitude, lng: pos.coords.longitude }; ST.geoErr = null;
    if (!ST.geoLast || Date.now() - ST.geoLast > 12000) sendPos(); else geoBox();
  }, e => { ST.geoErr = e && e.code === 1 ? 'denied' : 'unavail'; geoBox(); }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 });
  clearInterval(ST.geoTimer); ST.geoTimer = setInterval(sendPos, 15000);
  geoBox();
}
async function vDriver() {
  document.body.classList.add('staff');
  let tab = ST.dtab || 'avail';
  $('#app').innerHTML = `<header class="top"><div class="in"><img class="logo l-on-dark" src="logo.png" alt=""><img class="logo l-on-lite" src="logo-dark.png" alt="Stein & Olive"><b>${esc(S.staff.name || S.staff.username)}</b><div class="sp"></div>
     <span class="note" style="display:none" id="liveDot">●</span><button class="ib" id="dsnd">${ic(ST.sound ? 'bell' : 'belloff')}</button><button class="ib" id="dl">${esc(App.t('lang'))}</button><button class="ib" id="dlo" aria-label="Abmelden">${ic('logout')}</button></div></header>
    <main class="wrap"><div class="tabs" id="dtabs">${[['avail', 'متاحة', 'Verfügbar'], ['mine', 'طلباتي', 'Meine'], ['done', 'خلصت اليوم', 'Heute erledigt']].map(x => `<button data-t="${x[0]}" class="${tab === x[0] ? 'on' : ''}">${esc(A(x[1], x[2]))} <span id="dc_${x[0]}"></span></button>`).join('')}</div>
    <div class="acts" style="margin-bottom:8px"><button class="btn s o" id="pushD">${ic('belloff', 's')}</button>${instBtn('fahrer')}</div>
    <div id="geoInfo"></div><div id="dlist"><div class="empty">…</div></div></main>`;
  $('#dl').onclick = () => { App.setLang(S.lang === 'ar' ? 'de' : 'ar'); vDriver(); };
  paintPush($('#pushD')); $('#pushD').onclick = () => pushToggle($('#pushD')); bindInst();
  $('#dlo').onclick = logout;
  $('#dsnd').onclick = () => { ST.sound = !ST.sound; localStorage.setItem('so_sound', ST.sound ? '1' : '0'); if (ST.sound) beep(); $('#dsnd').innerHTML = ic(ST.sound ? 'bell' : 'belloff'); };
  $$('#dtabs button').forEach(b => b.onclick = () => { tab = ST.dtab = b.dataset.t; $$('#dtabs button').forEach(x => x.classList.toggle('on', x === b)); draw(); });
  const me = S.staff.user_id;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const sets = { avail: o => !o.driver_id && ['new', 'preparing', 'ready'].includes(o.status), mine: o => o.driver_id === me && ['new', 'preparing', 'ready', 'on_way'].includes(o.status), done: o => o.driver_id === me && o.status === 'delivered' && new Date(o.done_at || o.created_at) >= today };
  async function refresh() { try { await fetchOrders(); draw(); syncGeo(); } catch (e) { err(e); } }
  function draw() {
    const el = $('#dlist'); if (!el) return;
    Object.keys(sets).forEach(k => { const c = $('#dc_' + k); if (c) c.textContent = '(' + ST.orders.filter(o => o.mode === 'delivery' && sets[k](o)).length + ')'; });
    geoBox();
    const list = ST.orders.filter(o => o.mode === 'delivery' && sets[tab](o)).sort((a, b) => a.id - b.id);
    if (tab === 'done') { const cash = list.filter(o => o.payment === 'cash' && o.cash_collected).reduce((s, o) => s + +o.total, 0);
      el.innerHTML = `<div class="kpis"><div class="kpi"><small>${esc(A('توصيلات', 'Fahrten'))}</small><b>${list.length}</b></div><div class="kpi"><small>${esc(A('كاش معك', 'Bargeld bei dir'))}</small><b>${money(cash)}</b></div></div>` + list.map(o => `<div class="card"><div class="sum"><b>#${o.id}</b><span>${money(o.total)} ${o.payment === 'cash' ? (o.cash_collected ? '✓' : '?') : ''}</span></div><div class="note">${esc(o.street)}, ${esc(o.plz)}</div></div>`).join(''); return; }
    el.innerHTML = list.length ? list.map(o => {
      const byShop = {}; o.order_items.forEach(i => (byShop[i.shop_id] = byShop[i.shop_id] || []).push(i));
      const addr = `${o.street}, ${o.plz} ${o.city}`; const cooled = o.order_items.some(i => i.cooled && i.status !== 'rejected');
      const wa = String(o.phone || '').replace(/\D/g, '').replace(/^0/, '49');
      return `<div class="oc"><div class="hd"><span class="no">#${o.id}</span>${stPill(o.status)}${cooled ? '<span class="pill">' + ic('snow', 's') + ' ' + esc(A('فيه مبرّد', 'Kühlware')) + '</span>' : ''}</div>
        ${o.scheduled_at ? `<div class="warnbox"> ${fmtDate(o.scheduled_at)}</div>` : ''}
        <div style="margin:8px 0"> <b>${esc(addr)}</b>${o.address_note ? `<div class="note">${esc(o.address_note)}</div>` : ''}</div>
        ${tab === 'mine' ? `<div class="note">${esc(o.customer_name)} • <a href="tel:${esc(o.phone)}">${esc(o.phone)}</a>${o.note ? `<br>${esc(o.note)}` : ''}</div>` : ''}
        ${Object.keys(byShop).map(sid => { const its = byShop[sid].filter(i => i.status !== 'rejected'); const rdy = its.length && its.every(i => i.status === 'ready');
          return `<div class="shopgrp"><div class="sum"><b>${SI((App.shopById(sid) || {}).type)} ${esc(L(App.shopById(sid) || {}, 'name'))}</b><span class="pill ${rdy ? 'ok' : 'warn'}">${rdy ? ' ' + esc(A('جاهز', 'Fertig')) : ' ' + esc(A('عم يتحضّر', 'In Arbeit'))}</span></div>
            <div class="note">${its.map(i => `${fq(i.final_qty || i.qty, i.unit)} ${esc(S.lang === 'ar' ? i.name_ar : i.name_de)}${i.cooled ? ' *' : ''}`).join(' • ')}</div></div>`; }).join('')}
        <div class="sum tot"><span>${o.payment === 'cash' ? esc(A('حصّل كاش', 'Bar kassieren')) : o.payment === 'card' ? esc(A('بطاقة EC', 'EC-Karte')) : o.payment === 'transfer' ? esc(o.paid ? A('تحويل، مدفوع', 'Überweisung, bezahlt') : A('تحويل، لسا ما وصل', 'Überweisung, offen')) : 'PayPal'}</span><span>${money(o.total)}</span></div>
        <div class="acts" style="margin-top:8px">
         ${tab === 'avail' ? `<button class="btn g" data-take="${o.id}">${esc(A('بآخدها', 'Übernehmen'))}</button>` : ''}
         ${tab === 'mine' ? `<a class="btn s o" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}">${esc(A('الطريق', 'Navigation'))}</a>
           <a class="btn s o" href="tel:${esc(o.phone)}" aria-label="${esc(A('اتصال', 'Anrufen'))}">${ic('phone', 's')}</a>${wa ? `<a class="btn s o" target="_blank" rel="noopener" href="https://wa.me/${wa}?text=${encodeURIComponent(o.lang === 'de' ? `Hallo ${o.customer_name}, ich bin dein Fahrer von Stein & Olive (#${o.id}).` : `مرحبا ${o.customer_name}، أنا السائق من بيت كرم (طلب #${o.id}).`)}">${ic('chat', 's')}</a>` : ''}
           ${o.status === 'ready' ? `<button class="btn w" data-go="${o.id}">${esc(A('طلعت', 'Losfahren'))}</button>` : ''}
           ${o.status === 'on_way' ? `<button class="btn g" data-dn="${o.id}">${esc(A('وصّلت', 'Zugestellt'))}</button>` : ''}
           ${o.status !== 'on_way' ? `<button class="btn s o" data-rel="${o.id}">${esc(A('اتركها', 'Abgeben'))}</button>` : ''}` : ''}</div></div>`; }).join('') : `<div class="empty">${esc(A('ما في طلبات هلق', 'Gerade keine Aufträge'))}</div>`;
    const run = async p => { const { error } = await p; if (error) { if (/taken/.test(error.message)) toast(A('سائق تاني أخدها', 'Schon vergeben'), 1); else err(error); } await refresh(); };
    $$('[data-take]', el).forEach(b => b.onclick = () => run(sb.rpc('driver_take', { p_order: +b.dataset.take })).then(() => { tab = ST.dtab = 'mine'; $$('#dtabs button').forEach(x => x.classList.toggle('on', x.dataset.t === 'mine')); draw(); }));
    $$('[data-rel]', el).forEach(b => b.onclick = () => { if (confirm(A('بدك تترك هالطلب لسائق تاني؟', 'Auftrag für andere Fahrer freigeben?'))) run(sb.rpc('driver_release', { p_order: +b.dataset.rel })); });
    $$('[data-go]', el).forEach(b => b.onclick = () => run(sb.rpc('order_set_status', { p_order: +b.dataset.go, p_status: 'on_way', p_cash: null })));
    $$('[data-dn]', el).forEach(b => b.onclick = () => { const o = ST.orders.find(x => x.id === +b.dataset.dn); if (o) codeDialog(o, refresh); });
  }
  await refresh(); startLive(refresh);
}

/* ---------- router ---------- */
const SECS = { customers: secCustomers, orders: secOrders, products: secProducts, stock: secStock, scan: secScan, reports: secReports, shops: secShops, staff: secStaff, coupons: secCoupons, suppliers: secSuppliers, reviews: secReviews, settings: secSettings, screens: secScreens, ai: secAi, account: secAccount };
async function route(r, sec, parts) {
  stopCamera();
  ST.sub = (parts && parts[2]) || null;
  const st0 = await session();
  // Jede App hat ihre eigenen Konten: Fahrer-App nur Fahrer, Team-App nur Verwaltung und Geschäfte.
  // (Alte Anmeldungen von früher, als alle Apps eine Anmeldung teilten, werden hier abgemeldet.)
  const wrongApp = st0 && ((appKind() === 'fahrer' && st0.role !== 'driver') || (appKind() === 'team' && st0.role === 'driver'));
  if (wrongApp) { await sb.auth.signOut({ scope: 'local' }); S.staff = null; }
  const st = wrongApp ? null : st0;
  if (r === 'login' || r === 'team') { if (st) { location.hash = st.role === 'driver' ? '#/driver' : '#/admin/orders'; return; } return vLogin(); }
  if (!st) { location.hash = '#/team'; return; }
  if (r === 'driver' || st.role === 'driver') { if (r !== 'driver' && sec !== 'account') { location.hash = '#/driver'; return; } if (r === 'driver') return vDriver(); }
  stopLive();
  sec = SECS[sec] && MENU.find(m => m[0] === sec && m[4].includes(st.role)) ? sec : 'orders';
  const main = shell(sec);
  if (st.role === 'admin') autoImport();
  try { await SECS[sec](main); } catch (e) { err(e); }
}
// Produktdatei für den Scanner im Hintergrund füllen, solange ein Admin den Verwaltungsbereich offen hat (läuft nur 1× pro Sitzung)
let autoImp = false;
async function autoImport() {
  if (autoImp) return; autoImp = true;
  try {
    let st;
    // neue Version der Produktdatei (mehr Seiten je Filter): einmal von vorne laden, bestehende Einträge bleiben
    if (localStorage.getItem('so_imp_v') !== '2') { st = await eanCall({ mode: 'import', reset: true }); try { localStorage.setItem('so_imp_v', '2'); } catch (_) {} }
    else st = await eanCall({ mode: 'status' });
    if (st.done) return;
    let fails = 0;
    while (!st.done && fails < 4) {
      if (document.hidden) { await new Promise(z => setTimeout(z, 20000)); continue; }
      try { st = await eanCall({ mode: 'import' }); fails = 0; } catch (_) { fails++; await new Promise(z => setTimeout(z, 30000)); continue; }
      await new Promise(z => setTimeout(z, st.wait ? 30000 : 7000)); // Open Food Facts: max. ca. 10 Suchanfragen pro Minute
    }
  } catch (_) { /* still */ }
}
function leave(r) { if (r !== 'admin') { aiClose(); const f = $('.ai-fab'); if (f) f.remove(); } if (r !== 'admin' && r !== 'driver') { stopLive(); stopCamera(); if (r !== 'driver') stopGeo(); } else stopCamera(); }
window.Admin = { route, leave };
})();
