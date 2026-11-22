/* Stein & Olive – Personalbereich: Admin, Geschäfte, Lager, Scanner, Berichte, Fahrer */
(function () {
'use strict';
const { sb, S, esc, money, fq, $, $$, toast, modal, closeModal, L, fmtDate, ALLERGENS, DAYS, receiptHtml, DOMAIN, ic, bgImg, safeUrl } = App;
const SI = (t) => App.shopIc(t, 's');
const A = (ar, de) => S.lang === 'ar' ? ar : de;
const ST = { orders: [], drivers: [], seen: null, ch: null, poll: null, sound: localStorage.getItem('so_sound') === '1', kds: false, tab: 'active', shopSel: null, geo: null, geoLast: 0, scanStop: null };

const STATUS = { new: ['جديد', 'Neu', 'warn'], preparing: ['قيد التحضير', 'In Zubereitung', 'be'], ready: ['جاهز', 'Fertig', 'ok'], on_way: ['بالطريق', 'Unterwegs', 'be'], delivered: ['تم التوصيل', 'Geliefert', 'ok'], picked_up: ['تم الاستلام', 'Abgeholt', 'ok'], cancelled: ['ملغي', 'Storniert', 'bad'], rejected: ['مرفوض', 'Abgelehnt', 'bad'] };
const stPill = s => `<span class="pill ${STATUS[s][2]}">${esc(A(STATUS[s][0], STATUS[s][1]))}</span>`;
const PAY = { cash: ['كاش', 'Bar'], card: ['بطاقة', 'Karte'], paypal: ['PayPal', 'PayPal'] };
const err = e => toast(App.errMsg(e), 1);

/* ---------- auth ---------- */
async function session() {
  const { data } = await sb.auth.getSession();
  if (!data.session) { S.staff = null; return null; }
  if (S.staff && S.staff.user_id === data.session.user.id) return S.staff;
  const { data: st } = await sb.from('staff').select('*').eq('user_id', data.session.user.id).maybeSingle();
  S.staff = st && st.active ? st : null;
  return S.staff;
}
function vLogin() {
  App.page(`<div class="card" style="max-width:420px;margin:30px auto"><img src="logo.png" style="width:170px;margin:0 auto 10px">
    <h3 style="text-align:center">${esc(A('دخول الموظفين', 'Personal-Login'))}</h3>
    <label class="f"><span>${esc(A('اسم المستخدم', 'Benutzername'))}</span><input type="text" id="lu" autocapitalize="off" autocomplete="username"></label>
    <label class="f"><span>${esc(A('كلمة السر', 'Passwort'))}</span><input type="password" id="lp" autocomplete="current-password"></label>
    <button class="btn full" id="lb">${esc(A('دخول', 'Anmelden'))}</button></div>`, { noBar: 1 });
  const go = async () => {
    let u = App.clean($('#lu').value, 120).toLowerCase(); if (!u) return;
    if (!App.allow('stafflogin', 5, 60)) return;
    if (!u.includes('@')) u += DOMAIN;
    $('#lb').disabled = true;
    const { error } = await sb.auth.signInWithPassword({ email: u, password: $('#lp').value });
    $('#lb').disabled = false;
    if (error) return toast(A('اسم المستخدم أو كلمة السر غلط', 'Benutzername oder Passwort falsch'), 1);
    S.staff = null; const st = await session();
    if (!st) { await sb.auth.signOut(); return toast(A('الحساب غير مفعّل', 'Konto nicht freigeschaltet'), 1); }
    location.hash = st.role === 'driver' ? '#/driver' : '#/admin/orders';
  };
  $('#lb').onclick = go; $('#lp').onkeydown = e => { if (e.key === 'Enter') go(); };
}
async function logout() { stopLive(); stopGeo(); await sb.auth.signOut(); S.staff = null; location.hash = '#/login'; }

/* ---------- layout ---------- */
const MENU = [
  ['orders', 'inbox', 'الطلبات', 'Bestellungen', ['admin', 'shop']],
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
    <main class="wrap" id="amain">${inner || ''}</main>`;
  $('#alang').onclick = () => { App.setLang(S.lang === 'ar' ? 'de' : 'ar'); App.route(); };
  $('#amenu').onclick = () => {
    const d = document.createElement('div'); d.className = 'drawer';
    d.innerHTML = `<div class="pn"><div class="who"><img src="logo.png" alt=""><div style="font-size:14px">${esc(S.staff.name || S.staff.username)} • ${esc(r === 'admin' ? 'Admin' : r === 'shop' ? L(App.shopById(S.staff.shop_id) || {}, 'name') : A('سائق', 'Fahrer'))}</div></div>
      ${items.map(m => `<a href="#/admin/${m[0]}" class="${m[0] === sec ? 'on' : ''}">${ic(m[1])} ${esc(A(m[2], m[3]))}</a>`).join('')}
      <hr><a href="#/">${ic('globe')} ${esc(A('الموقع', 'Zur Website'))}</a><button class="m" id="lo">${ic('logout')} ${esc(A('خروج', 'Abmelden'))}</button></div>`;
    d.onclick = e => { if (e.target === d || e.target.closest('a')) d.remove(); };
    document.body.appendChild(d); $('#lo', d).onclick = logout;
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
  if (ST.seen) { const nw = fresh.filter(o => !ST.seen.has(o.id)); if (nw.length) { beep(); notify(A('طلب جديد #', 'Neue Bestellung #') + nw.map(o => o.id).join(', #')); } }
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
     <button class="btn s o" id="kdsB">${ST.kds ? ' ' + esc(A('عرض عادي', 'Liste')) : ' ' + esc(A('شاشة المطبخ', 'Küchenansicht'))}</button>
     <button class="btn s o" id="rf" aria-label="Neu laden">${ic('refresh', 's')}</button></div>
    <div class="tabs" id="otabs">${[['active', 'الحالية', 'Aktiv'], ['done', 'المنتهية', 'Erledigt'], ['cancelled', 'الملغية', 'Storniert'], ['all', 'الكل', 'Alle']].map(x => `<button data-t="${x[0]}" class="${ST.tab === x[0] ? 'on' : ''}">${esc(A(x[1], x[2]))} <span id="cnt_${x[0]}"></span></button>`).join('')}</div>
    <input type="search" id="oq" placeholder="${esc(A('بحث برقم الطلب أو الاسم أو الهاتف', 'Suche: Nr., Name, Telefon'))}" style="margin-bottom:8px">
    <div id="olist" class="${ST.kds ? 'kds' : ''}"><div class="empty">…</div></div>`;
  $('#snd').onclick = () => { ST.sound = !ST.sound; localStorage.setItem('so_sound', ST.sound ? '1' : '0'); if (ST.sound) { beep(); if (window.Notification && Notification.permission === 'default') Notification.requestPermission(); } secOrders(main); };
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
   <div class="sum" style="margin-top:6px"><span>${esc(A('المجموع', 'Summe'))} • ${esc(A(PAY[o.payment] ? PAY[o.payment][0] : o.payment, PAY[o.payment] ? PAY[o.payment][1] : o.payment))}${o.paid ? ' ✓' : ''}</span><b style="color:var(--beige)">${money(o.total)}</b></div>
   ${o.mode === 'delivery' ? `<div class="note">${esc(A('السائق:', 'Fahrer:'))} ${drv ? esc(drv.name || drv.username) : o.driver_id ? '✓' : '—'}${o.cash_collected ? ' •  ' + esc(A('تم تحصيل الكاش', 'Bar kassiert')) : ''}</div>` : ''}
   <div class="acts noprint" style="margin-top:8px">
    ${o.mode === 'pickup' && o.status === 'ready' ? `<button class="btn s g" data-os="picked_up" data-oid="${o.id}">${esc(A('تم التسليم للزبون', 'An Kunde übergeben'))}</button>` : ''}
    ${admin && o.mode === 'delivery' && ['new', 'preparing', 'ready'].includes(o.status) ? `<select data-drv="${o.id}" style="width:auto;padding:6px 10px"><option value="">${esc(A('اختار سائق', 'Fahrer wählen'))}</option>${ST.drivers.map(d => `<option value="${d.user_id}" ${d.user_id === o.driver_id ? 'selected' : ''}>${esc(d.name || d.username)}</option>`).join('')}</select>` : ''}
    ${admin && o.mode === 'delivery' && o.status === 'on_way' ? `<button class="btn s g" data-os="delivered" data-oid="${o.id}">${esc(A('تم التوصيل', 'Geliefert'))}</button>` : ''}
    <button class="btn s o" data-pr="${o.id}">${ic('receipt', 's')}</button>
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
function bindOrderCards(root, refresh) {
  const run = async (p) => { try { const { error } = await p; if (error) throw error; await refresh(); } catch (e) { err(e); } };
  $$('[data-ss]', root).forEach(b => b.onclick = () => run(sb.rpc('shop_set_status', { p_order: +b.dataset.oid, p_status: b.dataset.ss })));
  $$('[data-os]', root).forEach(b => b.onclick = () => {
    const s = b.dataset.os; const o = ST.orders.find(x => x.id === +b.dataset.oid);
    if (s === 'cancelled' && !confirm(A('أكيد بدك تلغي الطلب؟ البضاعة بترجع للمخزون.', 'Bestellung wirklich stornieren? Ware wird zurückgebucht.'))) return;
    let cash = null; if (s === 'delivered' && o && o.payment === 'cash') cash = confirm(A('تم تحصيل الكاش؟', 'Bargeld kassiert?'));
    run(sb.rpc('order_set_status', { p_order: +b.dataset.oid, p_status: s, p_cash: cash }));
  });
  $$('[data-rej]', root).forEach(b => b.onclick = () => { if (confirm(A('هالمنتج غير متوفر؟ رح ينشال من الطلب.', 'Artikel nicht verfügbar? Er wird aus der Bestellung entfernt.'))) run(sb.rpc('reject_item', { p_item: +b.dataset.rej })); });
  $$('[data-w]', root).forEach(b => b.onclick = () => { const v = parseFloat(String($(`[data-wq="${b.dataset.w}"]`, root).value).replace(',', '.')); if (!(v > 0)) return; run(sb.rpc('set_final_qty', { p_item: +b.dataset.w, p_qty: v })).then(() => toast(' ✓')); });
  $$('[data-drv]', root).forEach(s => s.onchange = () => run(sb.rpc('admin_assign_driver', { p_order: +s.dataset.drv, p_driver: s.value || null })));
  $$('[data-pr]', root).forEach(b => b.onclick = () => printOrder(ST.orders.find(x => x.id === +b.dataset.pr)));
}
function printOrder(o) {
  const asView = Object.assign({}, o, { items: o.order_items.map(i => Object.assign({}, i, { line_total: i.final_total != null ? i.final_total : i.line_total })) });
  modal(`<button class="ib x noprint" data-close>✕</button><div class="receipt" id="rc"><div style="text-align:center"><img src="logo-dark.png" style="width:150px;margin:auto"></div>
     <div style="text-align:center;font-size:22px;font-weight:700">#${o.id}</div><div style="text-align:center">${fmtDate(o.created_at)} • ${o.mode === 'delivery' ? 'Lieferung' : 'Abholung'}</div>
     <div>${esc(o.customer_name)} • ${esc(o.phone)}${o.mode === 'delivery' ? '<br>' + esc(o.street) + ', ' + esc(o.plz) + ' ' + esc(o.city) : ''}</div><hr>${receiptHtml(asView)}</div>
     <div class="acts noprint" style="margin-top:10px"><button class="btn full" id="prt">${ic('print', 's')} ${esc(A('طباعة', 'Drucken'))}</button></div>`);
  $('#prt').onclick = () => window.print();
}

/* ---------- products ---------- */
async function secProducts(main) {
  const draw = () => {
    const pick = shopPicker(draw); const sid = ST.shopSel;
    const cats = S.cats.filter(c => c.shop_id === sid);
    main.innerHTML = pick + `<div class="acts" style="margin-bottom:10px">
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
async function reloadAll() { try { await App.loadData(); } catch (e) { err(e); } }
function compressImage(file, max) {
  return new Promise((res, rej) => { const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => { const sc = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(b => b ? res(b) : rej(new Error('img')), 'image/jpeg', 0.82); };
    img.onerror = rej; img.src = url; });
}
async function uploadImage(file, folder) {
  const blob = await compressImage(file, 900);
  const path = `${folder}/${Date.now()}-${App.uid()}.jpg`;
  const { error } = await sb.storage.from('images').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
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
    <div class="acts" style="margin-top:14px"><button class="btn" id="fSave" style="flex:1">${esc(A('حفظ', 'Speichern'))}</button>${!isNew ? `<button class="btn o" id="fDup"></button><button class="btn r" id="fDel"></button>` : ''}</div>`);
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
async function startCamera(box, onCode) {
  stopCamera();
  if ('BarcodeDetector' in window) {
    try {
      const det = new window.BarcodeDetector({ formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'itf'] });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const v = document.createElement('video'); v.setAttribute('playsinline', ''); v.muted = true; v.srcObject = stream; box.innerHTML = ''; box.appendChild(v); await v.play();
      let alive = true, last = '', lastT = 0;
      const loop = async () => { if (!alive) return; try { const r = await det.detect(v); if (r.length) { const c = r[0].rawValue; if (c !== last || Date.now() - lastT > 2500) { last = c; lastT = Date.now(); onCode(c); } } } catch (e) {} setTimeout(loop, 250); };
      loop();
      ST.scanStop = () => { alive = false; stream.getTracks().forEach(t => t.stop()); box.innerHTML = ''; };
      return;
    } catch (e) { /* fallback */ }
  }
  try {
    await loadH5(); box.innerHTML = '<div id="reader"></div>';
    const h = new window.Html5Qrcode('reader'); let last = '', lastT = 0;
    await h.start({ facingMode: 'environment' }, { fps: 8, qrbox: { width: 260, height: 160 } }, c => { if (c !== last || Date.now() - lastT > 2500) { last = c; lastT = Date.now(); onCode(c); } });
    ST.scanStop = () => { h.stop().catch(() => {}).then(() => { box.innerHTML = ''; }); };
  } catch (e) { box.innerHTML = `<div class="note" style="padding:14px">${esc(A('الكاميرا مش شغالة. اسمح للموقع باستعمال الكاميرا، أو استعمل جهاز Scanner (USB/Bluetooth).', 'Kamera nicht verfügbar. Kamerazugriff erlauben oder Hand-Scanner (USB/Bluetooth) nutzen.'))}</div>`; }
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
    <div class="acts" style="margin:10px 0"><button class="btn" id="cam">${esc(A('شغّل الكاميرا', 'Kamera starten'))}</button><button class="btn o" id="camx"></button></div>
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
      $('#nwp').onclick = () => editProduct({ shop_id: ST.shopSel, barcode: code }, () => secScan(main)); return; }
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
    if ($('#hand')) $('#hand').onclick = async () => { const { error } = await sb.rpc('order_set_status', { p_order: data.id, p_status: 'picked_up', p_cash: null }); if (error) return err(error); toast('✓ #' + data.id); res.innerHTML = `<div class="card" style="text-align:center;font-size:20px"> #${data.id}</div>`; };
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
    <div class="grp"><h4>${esc(A('أوقات الدوام (مثلاً 09:00-20:00، فاضي = مسكّر)', 'Öffnungszeiten (z. B. 09:00-20:00, leer = zu)'))}</h4>${DAYS.slice(1).concat('so').map(d => `<div class="li" style="padding:4px 0"><span style="width:90px">${esc(App.t('days')[d])}</span><input type="text" data-h="${d}" value="${esc((s.hours || {})[d] || '')}" placeholder="09:00-20:00"></div>`).join('')}</div>
    ${S.staff.role === 'admin' ? `<label class="chk"><input type="checkbox" id="sA" ${s.active ? 'checked' : ''}><span>${esc(A('ظاهر بالموقع', 'Sichtbar'))}</span></label>` : ''}
    <button class="btn full" id="sSave">${esc(A('حفظ', 'Speichern'))}</button>`);
  let img = s.image_url || '';
  $('#sImg', root).onchange = async e => { const f = e.target.files[0]; if (!f) return; try { img = await uploadImage(f, 'shops'); $('#sImgP', root).style.backgroundImage = `url('${safeUrl(img)}')`; } catch (x) { err(x); } };
  $('#sSave', root).onclick = async () => {
    const hours = {}; $$('[data-h]', root).forEach(i => hours[i.dataset.h] = i.value.trim());
    const o = { name_ar: $('#sNa', root).value.trim(), name_de: $('#sNd', root).value.trim(), desc_ar: $('#sDa', root).value.trim(), desc_de: $('#sDd', root).value.trim(), sort: +$('#sS', root).value || 0, phone: $('#sP', root).value.trim(), whatsapp: $('#sW', root).value.trim(), image_url: img || null, hours };
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
      <div class="acts" style="margin-top:6px"><button class="btn s o" data-ct="${esc(c.code)}" data-a="${c.active ? 0 : 1}">${c.active ? esc(A('إيقاف', 'Pausieren')) : esc(A('تفعيل', 'Aktivieren'))}</button><button class="btn s r" data-cx="${esc(c.code)}"></button></div></div>`).join('')}`;
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
      ${data.map(s => `<div class="card"><div class="sum"><b>${esc(s.name)}</b><button class="btn s r" data-sx="${s.id}"></button></div><div class="note">${s.phone ? `<a href="tel:${esc(s.phone)}">${esc(s.phone)}</a> ` : ''}${s.email ? `<a href="mailto:${esc(s.email)}">${esc(s.email)}</a> ` : ''}${esc(s.note || '')}</div></div>`).join('')}`;
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
function secSettings(main) {
  const s = JSON.parse(JSON.stringify(S.settings)); s.payments = s.payments || {}; s.zones = s.zones || [];
  const f = (k, lab, type) => `<label class="f"><span>${lab}</span><input type="${type || 'text'}" data-k="${k}" value="${esc(s[k] || '')}"></label>`;
  main.innerHTML = `<div class="card"><h3>${esc(A('معلومات الباساج (للـ Impressum)', 'Angaben (für Impressum)'))}</h3>
     ${f('name', 'Name')}${f('address', A('العنوان', 'Adresse'))}<div class="row">${f('phone', A('هاتف', 'Telefon'), 'tel')}${f('whatsapp', 'WhatsApp', 'tel')}</div><div class="row">${f('email', 'E-Mail', 'email')}${f('instagram', 'Instagram-Link')}</div>
     <div class="row">${f('owner', A('صاحب المحل (Inhaber)', 'Inhaber'))}${f('legal_form', A('الشكل القانوني', 'Rechtsform'))}</div><div class="row">${f('tax_id', 'Steuernummer')}${f('vat_id', 'USt-IdNr.')}</div></div>
    <div class="card"><h3>${esc(A('الاستلام والتوصيل', 'Abholung & Lieferung'))}</h3>
     <label class="chk"><input type="checkbox" id="sPk" ${s.pickup !== false ? 'checked' : ''}><span>${esc(A('استلام من المحل', 'Abholung'))}</span></label><label class="chk"><input type="checkbox" id="sDl" ${s.delivery !== false ? 'checked' : ''}><span>${esc(A('توصيل', 'Lieferung'))}</span></label>
     <div class="note">${esc(A('مناطق التوصيل: اكتب الرموز البريدية مفصولة بفاصلة، والسعر والحد الأدنى', 'Liefergebiete: PLZ mit Komma getrennt, Gebühr und Mindestbestellwert'))}</div>
     <div id="zones"></div><button class="btn s o" id="zAdd" style="margin-top:6px">${esc(A('منطقة', 'Gebiet'))}</button></div>
    <div class="card"><h3>${esc(A('الدفع', 'Zahlung'))}</h3>
     <label class="chk"><input type="checkbox" id="pCa" ${s.payments.cash !== false ? 'checked' : ''}><span>${esc(A('كاش', 'Bar'))}</span></label><label class="chk"><input type="checkbox" id="pCd" ${s.payments.card ? 'checked' : ''}><span>${esc(A('بطاقة EC عند الاستلام', 'EC-Karte bei Übergabe'))}</span></label>
     <label class="chk"><input type="checkbox" id="pPp" ${s.payments.paypal ? 'checked' : ''}><span>PayPal (PayPal.me)</span></label>
     <label class="f"><span>${esc(A('اسم PayPal.me (مثلاً steinolive)', 'PayPal.me-Name (z. B. steinolive)'))}</span><input type="text" id="pPm" value="${esc(s.payments.paypal_me || '')}"></label></div>
    <div class="card"><h3>${esc(A('إعلان بالصفحة الرئيسية', 'Hinweis auf Startseite'))}</h3>${f('announce_ar', 'بالعربي')}${f('announce_de', 'Deutsch')}
     <label class="f"><span>${esc(A('تنبيه الصلاحية قبل (أيام)', 'MHD-Warnung (Tage vorher)'))}</span><input type="number" id="sEx" value="${esc(s.expiry_warn_days || 3)}"></label></div>
    <button class="btn full" id="setSave">${esc(A('حفظ الإعدادات', 'Einstellungen speichern'))}</button>`;
  const dz = () => { $('#zones').innerHTML = s.zones.map((z, i) => `<div class="card" style="padding:8px"><input type="text" data-zp="${i}" value="${esc(z.plz)}" placeholder="20099, 20097"><div class="row" style="margin-top:6px"><label class="f" style="margin:0"><span>${esc(A('سعر التوصيل €', 'Gebühr €'))}</span><input type="number" step="0.1" data-zf="${i}" value="${esc(z.fee)}"></label><label class="f" style="margin:0"><span>${esc(A('الحد الأدنى €', 'Mindestwert €'))}</span><input type="number" step="0.5" data-zm="${i}" value="${esc(z.min)}"></label></div><button class="btn s r" data-zx="${i}" style="margin-top:6px">✕</button></div>`).join('');
    $$('[data-zx]').forEach(b => b.onclick = () => { readZ(); s.zones.splice(+b.dataset.zx, 1); dz(); }); };
  const readZ = () => { s.zones = s.zones.map((z, i) => ({ plz: $(`[data-zp="${i}"]`).value.replace(/\s/g, ''), fee: parseFloat($(`[data-zf="${i}"]`).value) || 0, min: parseFloat($(`[data-zm="${i}"]`).value) || 0 })); };
  dz(); $('#zAdd').onclick = () => { readZ(); s.zones.push({ plz: '', fee: 3, min: 20 }); dz(); };
  $('#setSave').onclick = async () => {
    readZ(); $$('[data-k]').forEach(i => s[i.dataset.k] = i.value.trim());
    s.pickup = $('#sPk').checked; s.delivery = $('#sDl').checked; s.expiry_warn_days = +$('#sEx').value || 3;
    s.payments = { cash: $('#pCa').checked, card: $('#pCd').checked, paypal: $('#pPp').checked, paypal_me: $('#pPm').value.trim() };
    const { error } = await sb.from('settings').update({ data: s }).eq('id', 1); if (error) return err(error);
    S.settings = s; toast('✓');
  };
}
function secScreens(main) {
  const base = location.origin + location.pathname;
  main.innerHTML = `<p class="note">${esc(A('افتح الرابط على شاشة التلفزيون (متصفح الـ Smart TV) واعمل Vollbild. المنيو بيتحدّث لحاله كل دقيقة، والمنتجات النافذة بتختفي.', 'Link im Browser des Smart-TVs öffnen und Vollbild aktivieren. Die Karte aktualisiert sich jede Minute, ausverkaufte Produkte verschwinden.'))}</p>
    ${myShops().map(s => `<div class="card"><b>${SI(s.type)} ${esc(L(s, 'name'))}</b><div class="acts" style="margin-top:8px"><a class="btn s" href="#/screen/${esc(s.id)}" target="_blank">${esc(A('فتح', 'Öffnen'))}</a><button class="btn s o" data-cp="${esc(base + '#/screen/' + s.id)}">${esc(A('نسخ الرابط', 'Link kopieren'))}</button></div><div class="note" style="word-break:break-all">${esc(base + '#/screen/' + s.id)}</div></div>`).join('')}`;
  $$('[data-cp]').forEach(b => b.onclick = () => navigator.clipboard.writeText(b.dataset.cp).then(() => toast('✓')));
}
function secAccount(main) {
  main.innerHTML = `<div class="card"><h3>${esc(A('تغيير كلمة السر', 'Passwort ändern'))}</h3><div class="note">${esc(A('اسم الدخول:', 'Login:'))} <b>${esc(S.staff.username)}</b></div>
    <label class="f"><span>${esc(A('كلمة السر الجديدة', 'Neues Passwort'))}</span><input type="password" id="np1"></label><label class="f"><span>${esc(A('أعدها', 'Wiederholen'))}</span><input type="password" id="np2"></label>
    <button class="btn" id="npGo">${esc(A('حفظ', 'Speichern'))}</button></div><button class="btn o full" id="lo2">${esc(A('خروج', 'Abmelden'))}</button>`;
  $('#npGo').onclick = async () => { const a = $('#np1').value; if (a.length < 8 || a !== $('#np2').value) return toast(A('كلمة السر قصيرة أو مش متطابقة', 'Passwort zu kurz oder ungleich'), 1); const { error } = await sb.auth.updateUser({ password: a }); if (error) return err(error); toast('✓'); };
  $('#lo2').onclick = logout;
}

/* ---------- driver portal ---------- */
function stopGeo() { if (ST.geo != null) { navigator.geolocation.clearWatch(ST.geo); ST.geo = null; } }
function syncGeo() {
  const mine = ST.orders.filter(o => o.driver_id === S.staff.user_id && o.status === 'on_way');
  if (!mine.length) { stopGeo(); return; }
  if (ST.geo != null || !navigator.geolocation) return;
  ST.geo = navigator.geolocation.watchPosition(pos => {
    if (Date.now() - ST.geoLast < 15000) return; ST.geoLast = Date.now();
    ST.orders.filter(o => o.driver_id === S.staff.user_id && o.status === 'on_way').forEach(o => sb.rpc('driver_pos', { p_order: o.id, lat: pos.coords.latitude, lng: pos.coords.longitude }));
  }, () => {}, { enableHighAccuracy: true, maximumAge: 10000 });
}
async function vDriver() {
  document.body.classList.add('staff');
  let tab = ST.dtab || 'avail';
  $('#app').innerHTML = `<header class="top"><div class="in"><img class="logo" src="logo.png" alt=""><b>${esc(S.staff.name || S.staff.username)}</b><div class="sp"></div>
     <span class="note" style="display:none" id="liveDot">●</span><button class="ib" id="dsnd">${ic(ST.sound ? 'bell' : 'belloff')}</button><button class="ib" id="dl">${esc(App.t('lang'))}</button><button class="ib" id="dlo" aria-label="Abmelden">${ic('logout')}</button></div></header>
    <main class="wrap"><div class="tabs" id="dtabs">${[['avail', 'متاحة', 'Verfügbar'], ['mine', 'طلباتي', 'Meine'], ['done', 'خلصت اليوم', 'Heute erledigt']].map(x => `<button data-t="${x[0]}" class="${tab === x[0] ? 'on' : ''}">${esc(A(x[1], x[2]))} <span id="dc_${x[0]}"></span></button>`).join('')}</div>
    <div id="geoInfo"></div><div id="dlist"><div class="empty">…</div></div></main>`;
  $('#dl').onclick = () => { App.setLang(S.lang === 'ar' ? 'de' : 'ar'); vDriver(); };
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
    const onWay = ST.orders.some(o => o.driver_id === me && o.status === 'on_way');
    $('#geoInfo').innerHTML = onWay ? `<div class="warnbox">${esc(A('موقعك عم يتشارك مع الزبون. خلّي الصفحة مفتوحة.', 'Dein Standort wird mit dem Kunden geteilt. Seite geöffnet lassen.'))}</div>` : '';
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
        <div class="sum tot"><span>${o.payment === 'cash' ? ' ' + esc(A('حصّل كاش', 'Bar kassieren')) : o.payment === 'card' ? ' ' + esc(A('بطاقة EC', 'EC-Karte')) : ' PayPal'}</span><span>${money(o.total)}</span></div>
        <div class="acts" style="margin-top:8px">
         ${tab === 'avail' ? `<button class="btn g" data-take="${o.id}">${esc(A('بآخدها', 'Übernehmen'))}</button>` : ''}
         ${tab === 'mine' ? `<a class="btn s o" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}">${esc(A('الطريق', 'Navigation'))}</a>
           <a class="btn s o" href="tel:${esc(o.phone)}"></a>${wa ? `<a class="btn s o" target="_blank" rel="noopener" href="https://wa.me/${wa}?text=${encodeURIComponent(o.lang === 'de' ? `Hallo ${o.customer_name}, ich bin dein Fahrer von Stein & Olive (#${o.id}).` : `مرحبا ${o.customer_name}، أنا السائق من بيت كرم (طلب #${o.id}).`)}">${ic('chat', 's')}</a>` : ''}
           ${o.status === 'ready' ? `<button class="btn w" data-go="${o.id}">${esc(A('طلعت', 'Losfahren'))}</button>` : ''}
           ${o.status === 'on_way' ? `<button class="btn g" data-dn="${o.id}">${esc(A('وصّلت', 'Zugestellt'))}</button>` : ''}
           ${o.status !== 'on_way' ? `<button class="btn s o" data-rel="${o.id}"></button>` : ''}` : ''}</div></div>`; }).join('') : `<div class="empty">${esc(A('ما في طلبات هلق', 'Gerade keine Aufträge'))}</div>`;
    const run = async p => { const { error } = await p; if (error) { if (/taken/.test(error.message)) toast(A('سائق تاني أخدها', 'Schon vergeben'), 1); else err(error); } await refresh(); };
    $$('[data-take]', el).forEach(b => b.onclick = () => run(sb.rpc('driver_take', { p_order: +b.dataset.take })).then(() => { tab = ST.dtab = 'mine'; $$('#dtabs button').forEach(x => x.classList.toggle('on', x.dataset.t === 'mine')); draw(); }));
    $$('[data-rel]', el).forEach(b => b.onclick = () => { if (confirm('?')) run(sb.rpc('driver_release', { p_order: +b.dataset.rel })); });
    $$('[data-go]', el).forEach(b => b.onclick = () => run(sb.rpc('order_set_status', { p_order: +b.dataset.go, p_status: 'on_way', p_cash: null })));
    $$('[data-dn]', el).forEach(b => b.onclick = () => { const o = ST.orders.find(x => x.id === +b.dataset.dn); let cash = null;
      if (o.payment === 'cash') { cash = confirm(A(`حصّلت ${money(o.total)} كاش؟`, `${money(o.total)} bar kassiert?`)); }
      run(sb.rpc('order_set_status', { p_order: o.id, p_status: 'delivered', p_cash: cash })); });
  }
  await refresh(); startLive(refresh);
}

/* ---------- router ---------- */
const SECS = { customers: secCustomers, orders: secOrders, products: secProducts, stock: secStock, scan: secScan, reports: secReports, shops: secShops, staff: secStaff, coupons: secCoupons, suppliers: secSuppliers, reviews: secReviews, settings: secSettings, screens: secScreens, account: secAccount };
async function route(r, sec) {
  stopCamera();
  const st = await session();
  if (r === 'login') { if (st) { location.hash = st.role === 'driver' ? '#/driver' : '#/admin/orders'; return; } return vLogin(); }
  if (!st) { location.hash = '#/login'; return; }
  if (r === 'driver' || st.role === 'driver') { if (r !== 'driver' && sec !== 'account') { location.hash = '#/driver'; return; } if (r === 'driver') return vDriver(); }
  stopLive();
  sec = SECS[sec] && MENU.find(m => m[0] === sec && m[4].includes(st.role)) ? sec : 'orders';
  const main = shell(sec);
  try { await SECS[sec](main); } catch (e) { err(e); }
}
function leave(r) { if (r !== 'admin' && r !== 'driver') { stopLive(); stopCamera(); if (r !== 'driver') stopGeo(); } else stopCamera(); }
window.Admin = { route, leave };
})();
