/* Stein & Olive by Karam – Online-Bestellsystem (Kundenbereich + Kern) */
(function () {
'use strict';
const SB_URL = 'https://xboagmemkfxlkaqblcco.supabase.co';
const SB_KEY = 'sb_publishable_VqfyuqAoLJ0wYkrdbpS0hA_tyZB6yaQ';
const DOMAIN = '@stein-olive.app';
const sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

/* ---------- i18n ---------- */
const T = {
 ar: {
  home:'الرئيسية', shops:'المحلات', search:'ابحث عن منتج…', cart:'السلة', checkout:'إتمام الطلب', add:'أضف للسلة', open:'مفتوح الآن', closed:'مغلق الآن',
  all:'الكل', featured:'منتجات مختارة', perkg:'/ كغ', piece:'قطعة', kg:'كغ', outstock:'نفذت الكمية', halal:'حلال', cooled:'مبرّد', allergens:'مسببات الحساسية',
  noallerg:'لا توجد مسببات حساسية مسجلة', qty:'الكمية', note:'ملاحظة', notep:'مثلاً: بدون بصل…', required:'إجباري', byweight:'السعر النهائي حسب الوزن الفعلي بعد التحضير. الفرق بيكون قليل.',
  cakedate:'تاريخ الاستلام', caketext:'الكتابة على القالب', basket:'اختار محتوى السلة', basketmin:'اختار منتج واحد على الأقل',
  empty:'السلة فاضية', subtotal:'المجموع', pfand:'Pfand (تأمين العبوات)', delivery:'التوصيل', discount:'الخصم', total:'الإجمالي', toshop:'تابع التسوق',
  pickup:'استلام من المحل', deliv:'توصيل', name:'الاسم', phone:'رقم الهاتف', email:'الإيميل (اختياري)', street:'الشارع ورقم البيت', plz:'الرمز البريدي PLZ', city:'المدينة',
  addrnote:'ملاحظة للعنوان (طابق، جرس…)', when:'متى؟', asap:'بأسرع وقت', later:'وقت محدد', payment:'طريقة الدفع', cash:'كاش عند الاستلام', card:'بطاقة عند الاستلام (EC)', paypal:'PayPal',
  coupon:'كود خصم', ordernote:'ملاحظة للطلب', agree:'قرأت وأوافق على الشروط وسياسة الخصوصية', place:'أرسل الطلب', minorder:'الحد الأدنى للطلب', zoneok:'التوصيل متاح لهذه المنطقة', zonebad:'للأسف ما منوصل لهالمنطقة',
  track:'تتبع الطلب', myorders:'طلباتي', order:'طلب', st_new:'استلمنا الطلب', st_preparing:'قيد التحضير', st_ready:'جاهز', st_on_way:'بالطريق', st_delivered:'تم التوصيل', st_picked_up:'تم الاستلام', st_cancelled:'ملغي',
  showqr:'ورجي هالكود بالمحل وقت الاستلام', driver:'السائق', rate:'قيّم', thanks:'شكراً لتقييمك!', receipt:'الفاتورة', print:'طباعة', staff:'دخول الموظفين', lang:'Deutsch',
  impressum:'Impressum', privacy:'الخصوصية (Datenschutz)', terms:'الشروط (AGB)', hours:'أوقات الدوام', days:{mo:'الإثنين',di:'الثلاثاء',mi:'الأربعاء',do:'الخميس',fr:'الجمعة',sa:'السبت',so:'الأحد'},
  closedday:'مغلق', sent:'تم إرسال طلبك ✅', err:'صار خطأ، جرب مرة تانية', schedreq:'بعض المحلات مسكّرة هلق، اختار وقت محدد', paypalnote:'رح تنفتح صفحة PayPal لتدفع المبلغ', contact:'تواصل معنا',
  e_zone:'ما منوصل لهالرمز البريدي', e_min:'الحد الأدنى للطلب هو', e_coupon:'كود الخصم غير صالح', e_coupon_min:'كود الخصم بحاجة لطلب أكبر من', e_stock:'الكمية غير متوفرة:', e_closed:'المحل مسكّر:', e_contact:'عبّي الاسم ورقم الهاتف', e_address:'عبّي العنوان', e_product:'منتج غير متوفر، حدّث الصفحة',
  cut:'التقطيع', items:'منتجات', estim:'تقريباً', yourrating:'تقييمك', comment:'تعليق (اختياري)', send:'إرسال', back:'رجوع', install:'ثبّت التطبيق', welcome:'أهلاً فيك ببيت كرم', sub:'سوبرماركت • مطعم • حلويات • ملحمة • أجبان وزيتون',
  noresults:'ما في نتائج', vatincl:'الأسعار شاملة الضريبة', orderno:'رقم الطلب', light:'الوضع الفاتح', dark:'الوضع الداكن'
 },
 de: {
  home:'Start', shops:'Geschäfte', search:'Produkt suchen…', cart:'Warenkorb', checkout:'Zur Kasse', add:'In den Warenkorb', open:'Jetzt geöffnet', closed:'Geschlossen',
  all:'Alle', featured:'Empfehlungen', perkg:'/ kg', piece:'Stück', kg:'kg', outstock:'Ausverkauft', halal:'Halal', cooled:'Gekühlt', allergens:'Allergene',
  noallerg:'Keine Allergene hinterlegt', qty:'Menge', note:'Anmerkung', notep:'z. B. ohne Zwiebeln…', required:'Pflicht', byweight:'Der Endpreis richtet sich nach dem tatsächlichen Gewicht. Kleine Abweichungen sind möglich.',
  cakedate:'Abholdatum', caketext:'Aufschrift auf der Torte', basket:'Korb zusammenstellen', basketmin:'Bitte mindestens ein Produkt wählen',
  empty:'Dein Warenkorb ist leer', subtotal:'Zwischensumme', pfand:'Pfand', delivery:'Lieferung', discount:'Rabatt', total:'Gesamt', toshop:'Weiter einkaufen',
  pickup:'Abholung', deliv:'Lieferung', name:'Name', phone:'Telefon', email:'E-Mail (optional)', street:'Straße und Hausnummer', plz:'PLZ', city:'Ort',
  addrnote:'Hinweis zur Adresse (Etage, Klingel…)', when:'Wann?', asap:'So schnell wie möglich', later:'Zu einer Uhrzeit', payment:'Zahlungsart', cash:'Bar bei Übergabe', card:'Karte bei Übergabe (EC)', paypal:'PayPal',
  coupon:'Gutscheincode', ordernote:'Anmerkung zur Bestellung', agree:'Ich akzeptiere die AGB und die Datenschutzerklärung', place:'Zahlungspflichtig bestellen', minorder:'Mindestbestellwert', zoneok:'Lieferung in dieses Gebiet möglich', zonebad:'Leider liefern wir nicht in dieses Gebiet',
  track:'Bestellung verfolgen', myorders:'Meine Bestellungen', order:'Bestellung', st_new:'Eingegangen', st_preparing:'In Zubereitung', st_ready:'Fertig', st_on_way:'Unterwegs', st_delivered:'Geliefert', st_picked_up:'Abgeholt', st_cancelled:'Storniert',
  showqr:'Zeige diesen Code bei der Abholung', driver:'Fahrer', rate:'Bewerten', thanks:'Danke für deine Bewertung!', receipt:'Beleg', print:'Drucken', staff:'Personal-Login', lang:'العربية',
  impressum:'Impressum', privacy:'Datenschutz', terms:'AGB', hours:'Öffnungszeiten', days:{mo:'Montag',di:'Dienstag',mi:'Mittwoch',do:'Donnerstag',fr:'Freitag',sa:'Samstag',so:'Sonntag'},
  closedday:'Geschlossen', sent:'Bestellung gesendet ✅', err:'Fehler, bitte erneut versuchen', schedreq:'Einige Geschäfte haben gerade geschlossen – bitte eine Uhrzeit wählen', paypalnote:'PayPal öffnet sich zur Zahlung', contact:'Kontakt',
  e_zone:'Für diese PLZ liefern wir nicht', e_min:'Mindestbestellwert:', e_coupon:'Gutschein ungültig', e_coupon_min:'Gutschein gilt ab', e_stock:'Nicht genug auf Lager:', e_closed:'Geschäft geschlossen:', e_contact:'Bitte Name und Telefon angeben', e_address:'Bitte Adresse angeben', e_product:'Produkt nicht verfügbar, bitte Seite neu laden',
  cut:'Zuschnitt', items:'Artikel', estim:'ca.', yourrating:'Deine Bewertung', comment:'Kommentar (optional)', send:'Senden', back:'Zurück', install:'App installieren', welcome:'Willkommen bei Stein & Olive', sub:'Supermarkt • Restaurant • Süßigkeiten • Metzgerei • Käse & Oliven',
  noresults:'Keine Ergebnisse', vatincl:'Alle Preise inkl. MwSt.', orderno:'Bestellnummer', light:'Heller Modus', dark:'Dunkler Modus'
 }
};
const ALLERGENS = {
 gluten:['غلوتين','Gluten'], crust:['قشريات','Krebstiere'], eggs:['بيض','Eier'], fish:['سمك','Fisch'], peanut:['فول سوداني','Erdnüsse'], soy:['صويا','Soja'],
 milk:['حليب ولاكتوز','Milch/Laktose'], nuts:['مكسرات','Schalenfrüchte'], celery:['كرفس','Sellerie'], mustard:['خردل','Senf'], sesame:['سمسم','Sesam'],
 sulph:['كبريتات','Sulfite'], lupin:['ترمس','Lupinen'], mollusc:['رخويات','Weichtiere']
};
const SHOP_ICON = { supermarket:'🛒', restaurant:'🍽️', sweets:'🍰', butcher:'🥩', deli:'🫒', other:'🏪' };
const DAYS = ['so','mo','di','mi','do','fr','sa'];

const S = { lang: localStorage.getItem('so_lang') || 'ar', shops: [], cats: [], products: [], settings: {}, ratings: {}, cart: [], staff: null, user: null, loaded: false };
try { S.cart = JSON.parse(localStorage.getItem('so_cart') || '[]'); } catch (e) { S.cart = []; }
if (localStorage.getItem('so_light') === '1') document.body.classList.add('light');

const t = k => (T[S.lang][k] !== undefined ? T[S.lang][k] : (T.de[k] !== undefined ? T.de[k] : k));
const L = (o, f) => o ? (o[f + '_' + S.lang] || o[f + '_' + (S.lang === 'ar' ? 'de' : 'ar')] || '') : '';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const money = n => '\u200E' + (Math.round((+n || 0) * 100) / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €\u200E';
const fq = (q, unit) => '\u200E' + (unit === 'kg' ? ((+q >= 1 ? (+q).toLocaleString('de-DE', { maximumFractionDigits: 3 }) + ' ' + t('kg') : Math.round(+q * 1000) + ' g')) : (+q).toLocaleString('de-DE', { maximumFractionDigits: 0 }) + '×') + '\u200E';
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const uid = () => Math.random().toString(36).slice(2, 10);
const fmtDate = d => new Date(d).toLocaleString(S.lang === 'ar' ? 'ar-EG-u-nu-latn' : 'de-DE', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Berlin' });

function toast(msg, err) {
  const el = $('#toast'); el.textContent = msg; el.className = 'toast' + (err ? ' err' : ''); el.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => el.hidden = true, err ? 4500 : 2600);
}
function modal(html, onMount) {
  const m = $('#modal'); m.innerHTML = '<div class="sheet">' + html + '</div>'; m.hidden = false;
  m.onclick = e => { if (e.target === m) closeModal(); };
  $$('[data-close]', m).forEach(b => b.onclick = closeModal);
  if (onMount) onMount(m.firstChild);
  return m.firstChild;
}
function closeModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; if (closeModal.cb) { const c = closeModal.cb; closeModal.cb = null; c(); } }
function errMsg(e) {
  const m = (e && (e.message || e.error_description || e)) + '';
  const k = m.split(':')[0].trim();
  const rest = m.includes(':') ? m.slice(m.indexOf(':') + 1).trim() : '';
  const map = { zone:'e_zone', min:'e_min', coupon:'e_coupon', coupon_min:'e_coupon_min', stock:'e_stock', closed:'e_closed', contact:'e_contact', address:'e_address', product:'e_product' };
  if (map[k]) return t(map[k]) + (rest ? ' ' + (k === 'min' || k === 'coupon_min' ? money(rest) : rest) : '');
  return m || t('err');
}

/* ---------- time / opening ---------- */
function berlinNow() {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  const wd = { Sun:'so', Mon:'mo', Tue:'di', Wed:'mi', Thu:'do', Fri:'fr', Sat:'sa' }[p.find(x => x.type === 'weekday').value];
  const hh = +p.find(x => x.type === 'hour').value % 24, mm = +p.find(x => x.type === 'minute').value;
  return { day: wd, min: hh * 60 + mm };
}
function isOpenNow(shop) {
  if (!shop || !shop.is_open || !shop.active) return false;
  const h = shop.hours || {}; const n = berlinNow(); const v = (h[n.day] || '').trim();
  if (!Object.keys(h).length) return true;
  if (!v) return false;
  return v.split(',').some(r => { const m = r.trim().match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/); if (!m) return false;
    const a = +m[1] * 60 + +m[2], b = +m[3] * 60 + +m[4]; return b > a ? (n.min >= a && n.min < b) : (n.min >= a || n.min < b); });
}

/* ---------- data ---------- */
async function loadData() {
  const [sh, ca, pr, se, ra] = await Promise.all([
    sb.from('shops').select('*').order('sort'),
    sb.from('categories').select('*').order('sort'),
    fetchAll('products', 'id,shop_id,category_id,name_ar,name_de,desc_ar,desc_de,price,unit,step,min_qty,barcode,image_url,track_stock,stock,min_stock,expiry,allergens,halal,cooled,pfand,vat,kind,options,featured,active,sort'),
    sb.from('settings').select('data').eq('id', 1).maybeSingle(),
    sb.rpc('shop_ratings')
  ]);
  if (sh.error) throw sh.error;
  S.shops = sh.data || []; S.cats = ca.data || []; S.products = pr; S.settings = (se.data && se.data.data) || {};
  S.ratings = {}; (ra.data || []).forEach(r => S.ratings[r.shop_id] = r);
  S.loaded = true;
}
async function fetchAll(table, cols, mod) {
  let out = [], from = 0; const size = 1000;
  for (;;) {
    let q = sb.from(table).select(cols).order('sort').order('name_de').range(from, from + size - 1);
    if (mod) q = mod(q);
    const { data, error } = await q; if (error) throw error;
    out = out.concat(data); if (data.length < size) break; from += size;
  }
  return out;
}
const shopById = id => S.shops.find(s => s.id === id);
const prodById = id => S.products.find(p => p.id === id);
const visibleShops = () => S.shops.filter(s => s.active);
const visibleProducts = sid => S.products.filter(p => p.active && (!sid || p.shop_id === sid) && (shopById(p.shop_id) || {}).active);
const soldOut = p => p.track_stock && +p.stock < +p.min_qty;

/* ---------- cart ---------- */
function saveCart() { localStorage.setItem('so_cart', JSON.stringify(S.cart)); }
function itemPrice(ci) {
  const p = prodById(ci.product_id); if (!p) return 0;
  let ex = 0;
  (ci.options || []).forEach(g => { const grp = (p.options || [])[g.g]; if (grp) g.c.forEach(c => { const ch = grp.choices[c]; if (ch) ex += +ch.price || 0; }); });
  (ci.basket || []).forEach(b => { const bp = prodById(b.product_id); if (bp) ex += bp.price * b.qty; });
  return p.unit === 'kg' ? p.price * ci.qty + ex : (p.price + ex) * ci.qty;
}
function cartTotals() {
  let sub = 0, pf = 0, n = 0;
  S.cart.forEach(ci => { const p = prodById(ci.product_id); if (!p) return; sub += itemPrice(ci); if (p.unit === 'piece') pf += (+p.pfand || 0) * ci.qty; n += p.unit === 'kg' ? 1 : ci.qty; });
  return { sub: Math.round(sub * 100) / 100, pf: Math.round(pf * 100) / 100, n };
}
function cartShops() { return [...new Set(S.cart.map(c => (prodById(c.product_id) || {}).shop_id).filter(Boolean))]; }
function optText(ci) {
  const p = prodById(ci.product_id); const parts = [];
  (ci.options || []).forEach(g => { const grp = (p.options || [])[g.g]; if (grp) g.c.forEach(c => { const ch = grp.choices[c]; if (ch) parts.push(L({ ar: ch.ar, de: ch.de, n_ar: ch.ar, n_de: ch.de }, 'n')); }); });
  (ci.basket || []).forEach(b => { const bp = prodById(b.product_id); if (bp) parts.push(L(bp, 'name') + ' ' + fq(b.qty, bp.unit)); });
  if (ci.cake) { if (ci.cake.date) parts.push('📅 ' + ci.cake.date); if (ci.cake.text) parts.push('✍️ ' + ci.cake.text); }
  if (ci.note) parts.push('📝 ' + ci.note);
  return parts.join(' • ');
}

/* ---------- layout ---------- */
function setLang(l) {
  S.lang = l; localStorage.setItem('so_lang', l);
  document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.style.setProperty('--sx', l === 'ar' ? '40px' : '-40px');
}
function header() {
  const n = cartTotals().n;
  return `<header class="top noprint"><div class="in">
   <button class="ib" id="menuBtn" aria-label="Menü">☰</button>
   <img class="logo" src="logo.png" alt="Stein & Olive" onclick="location.hash='#/'">
   <div class="sp"></div>
   <button class="ib" id="langBtn">${esc(t('lang'))}</button>
   <button class="ib" onclick="location.hash='#/cart'" aria-label="${esc(t('cart'))}">🛍️ ${n ? '<b>' + n + '</b>' : ''}</button>
  </div></header>`;
}
function footer() {
  const s = S.settings;
  return `<footer class="foot noprint">
   <div class="serif" style="color:var(--beige);font-size:18px">STEIN &amp; OLIVE</div>
   <div>${esc(s.address || '')}${s.phone ? ' • ☎ ' + esc(s.phone) : ''}</div>
   <div style="margin-top:8px">${s.whatsapp ? `<a href="https://wa.me/${esc(String(s.whatsapp).replace(/\D/g, ''))}" target="_blank" rel="noopener">WhatsApp</a>` : ''}${s.instagram ? `<a href="${esc(s.instagram)}" target="_blank" rel="noopener">Instagram</a>` : ''}
   <a href="#/impressum">Impressum</a><a href="#/datenschutz">${esc(t('privacy'))}</a><a href="#/agb">${esc(t('terms'))}</a><a href="#/login">${esc(t('staff'))}</a></div>
   <div style="margin-top:8px;font-size:12px">${esc(t('vatincl'))}</div>
  </footer>`;
}
function cartBar() {
  const c = cartTotals(); if (!c.n) return '';
  return `<div class="cbar noprint"><a class="btn" href="#/cart"><span>🛍️ ${esc(t('cart'))} (${c.n})</span><span>${money(c.sub + c.pf)}</span></a></div>`;
}
function page(inner, opt) {
  opt = opt || {};
  $('#app').innerHTML = header() + `<main class="wrap">${inner}</main>` + footer() + (opt.noBar ? '' : cartBar());
  $('#langBtn').onclick = () => { setLang(S.lang === 'ar' ? 'de' : 'ar'); route(); };
  $('#menuBtn').onclick = drawer;
}
function drawer() {
  const d = document.createElement('div'); d.className = 'drawer';
  const light = document.body.classList.contains('light');
  d.innerHTML = `<div class="pn"><img src="logo.png" style="width:160px;margin:4px auto 12px">
   <a href="#/">🏠 ${esc(t('home'))}</a>
   ${visibleShops().map(s => `<a href="#/shop/${esc(s.id)}">${SHOP_ICON[s.type] || '🏪'} ${esc(L(s, 'name'))}</a>`).join('')}
   <hr><a href="#/cart">🛍️ ${esc(t('cart'))}</a><a href="#/orders">📦 ${esc(t('myorders'))}</a>
   <button class="m" id="dLight">${light ? '🌙 ' + esc(t('dark')) : '☀️ ' + esc(t('light'))}</button>
   <hr><a href="#/login">🔐 ${esc(t('staff'))}</a></div>`;
  d.onclick = e => { if (e.target === d || e.target.closest('a')) d.remove(); };
  document.body.appendChild(d);
  $('#dLight', d).onclick = () => { document.body.classList.toggle('light'); localStorage.setItem('so_light', document.body.classList.contains('light') ? '1' : '0'); d.remove(); };
}

/* ---------- product card ---------- */
function priceLabel(p) { return money(p.price) + (p.unit === 'kg' ? ' ' + t('perkg') : ''); }
function prodCard(p) {
  const sh = shopById(p.shop_id);
  const off = soldOut(p);
  return `<div class="pc${off ? ' off' : ''}" data-p="${p.id}">
   <div class="im" style="${p.image_url ? `background-image:url('${esc(p.image_url)}')` : ''}">${p.image_url ? '' : (SHOP_ICON[(sh || {}).type] || '🛒')}</div>
   <div class="bd"><div class="nm">${esc(L(p, 'name'))}</div>
    <div class="bg">${p.halal ? `<span class="badge h">${esc(t('halal'))}</span>` : ''}${p.cooled ? `<span class="badge c">❄ ${esc(t('cooled'))}</span>` : ''}${off ? `<span class="badge">${esc(t('outstock'))}</span>` : ''}</div>
    <div class="pr">${priceLabel(p)}</div></div></div>`;
}
function bindCards(root) { $$('.pc[data-p]', root).forEach(el => el.onclick = () => productSheet(el.dataset.p)); }

/* ---------- product sheet ---------- */
function productSheet(pid, editIdx) {
  const p = prodById(pid); if (!p) return;
  const sh = shopById(p.shop_id);
  const ex = editIdx != null ? S.cart[editIdx] : null;
  const st = { qty: ex ? ex.qty : (p.unit === 'kg' ? Math.max(+p.min_qty || 0.25, +p.step || 0.25) : Math.max(1, +p.min_qty || 1)), opts: {}, basket: {}, note: ex ? ex.note || '' : '', cake: ex && ex.cake ? Object.assign({}, ex.cake) : { date: '', text: '' } };
  (p.options || []).forEach((g, gi) => { st.opts[gi] = []; });
  if (ex) { (ex.options || []).forEach(g => st.opts[g.g] = g.c.slice()); (ex.basket || []).forEach(b => st.basket[b.product_id] = b.qty); }
  else (p.options || []).forEach((g, gi) => { if (g.required && !g.multi && g.choices.length) st.opts[gi] = [0]; });
  const step = p.unit === 'kg' ? (+p.step || 0.25) : 1;
  const minq = p.unit === 'kg' ? (+p.min_qty || step) : Math.max(1, +p.min_qty || 1);
  const algs = (p.allergens || []).map(a => `<span class="pill warn">${esc((ALLERGENS[a] || [a, a])[S.lang === 'ar' ? 0 : 1])}</span>`).join('');
  const basketItems = p.kind === 'basket' ? visibleProducts(p.shop_id).filter(x => x.kind !== 'basket' && x.id !== p.id && !soldOut(x)) : [];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const html = `<button class="ib x" data-close>✕</button>
   ${p.image_url ? `<img class="pim" src="${esc(p.image_url)}" alt="">` : ''}
   <h3>${esc(L(p, 'name'))}</h3>
   <div class="acts" style="margin-bottom:6px"><span class="pill be">${SHOP_ICON[sh.type] || ''} ${esc(L(sh, 'name'))}</span>${p.halal ? `<span class="pill ok">${esc(t('halal'))}</span>` : ''}${p.cooled ? `<span class="pill">❄ ${esc(t('cooled'))}</span>` : ''}</div>
   ${L(p, 'desc') ? `<p class="note" style="font-size:15px">${esc(L(p, 'desc'))}</p>` : ''}
   <div style="font-size:22px;font-weight:700;color:var(--beige)">${priceLabel(p)}</div>
   ${+p.pfand ? `<div class="note">+ ${money(p.pfand)} Pfand</div>` : ''}
   <div class="note" style="margin-top:8px">${esc(t('allergens'))}:</div><div class="algs">${algs || `<span class="note">${esc(t('noallerg'))}</span>`}</div>
   ${p.unit === 'kg' && (sh.type === 'butcher' || sh.type === 'deli' || sh.type === 'sweets') ? `<div class="warnbox">⚖️ ${esc(t('byweight'))}</div>` : ''}
   ${(p.options || []).map((g, gi) => `<div class="grp"><h4><span>${esc(L({ n_ar: g.name_ar, n_de: g.name_de }, 'n'))}</span>${g.required ? `<span class="pill warn">${esc(t('required'))}</span>` : ''}</h4>
     ${g.choices.map((c, ci) => `<label class="opt"><input type="${g.multi ? 'checkbox' : 'radio'}" name="g${gi}" data-g="${gi}" value="${ci}" ${st.opts[gi].includes(ci) ? 'checked' : ''}><span>${esc(L({ n_ar: c.ar, n_de: c.de }, 'n'))}</span>${+c.price ? `<small>+${money(c.price)}</small>` : ''}</label>`).join('')}</div>`).join('')}
   ${p.kind === 'cake' ? `<div class="grp"><label class="f"><span>${esc(t('cakedate'))} *</span><input type="date" id="ckD" min="${tomorrow}" value="${esc(st.cake.date)}"></label>
     <label class="f"><span>${esc(t('caketext'))}</span><input type="text" id="ckT" maxlength="80" value="${esc(st.cake.text)}"></label></div>` : ''}
   ${p.kind === 'basket' ? `<div class="grp"><h4>${esc(t('basket'))}</h4>${basketItems.map(b => `<div class="li"><div class="t">${esc(L(b, 'name'))}<small>${priceLabel(b)}</small></div>
      <div class="step sm"><button data-bm="${b.id}">−</button><span id="bq_${b.id}">${st.basket[b.id] ? fq(st.basket[b.id], b.unit) : '0'}</span><button data-bp="${b.id}">+</button></div></div>`).join('') || `<div class="note">–</div>`}</div>` : ''}
   <label class="f"><span>${esc(t('note'))}</span><input type="text" id="pNote" maxlength="150" placeholder="${esc(t('notep'))}" value="${esc(st.note)}"></label>
   <div class="acts" style="justify-content:space-between;margin-top:14px">
    <div class="step"><button id="qM">−</button><span id="qV"></span><button id="qP">+</button></div>
    <button class="btn" id="addB" ${soldOut(p) ? 'disabled' : ''}></button></div>`;
  const root = modal(html);
  const calc = () => {
    const ci = { product_id: p.id, qty: st.qty, options: Object.keys(st.opts).map(g => ({ g: +g, c: st.opts[g] })).filter(o => o.c.length), basket: Object.keys(st.basket).filter(k => st.basket[k] > 0).map(k => ({ product_id: k, qty: st.basket[k] })) };
    $('#qV', root).textContent = fq(st.qty, p.unit);
    $('#addB', root).textContent = (soldOut(p) ? t('outstock') : t('add')) + ' • ' + (p.unit === 'kg' ? t('estim') + ' ' : '') + money(itemPrice(ci));
    return ci;
  };
  $('#qM', root).onclick = () => { st.qty = Math.max(minq, Math.round((st.qty - step) * 1000) / 1000); calc(); };
  $('#qP', root).onclick = () => { const mx = p.track_stock ? +p.stock : 200; st.qty = Math.min(mx >= minq ? mx : 200, Math.round((st.qty + step) * 1000) / 1000); calc(); };
  $$('input[data-g]', root).forEach(inp => inp.onchange = () => {
    const gi = +inp.dataset.g; const g = p.options[gi];
    if (g.multi) st.opts[gi] = $$(`input[data-g="${gi}"]:checked`, root).map(i => +i.value);
    else st.opts[gi] = [+inp.value];
    calc();
  });
  $$('[data-bp],[data-bm]', root).forEach(b => b.onclick = () => {
    const id = b.dataset.bp || b.dataset.bm; const bp = prodById(id); const s = bp.unit === 'kg' ? (+bp.step || 0.25) : 1;
    st.basket[id] = Math.max(0, Math.round(((st.basket[id] || 0) + (b.dataset.bp ? s : -s)) * 1000) / 1000);
    $('#bq_' + id, root).textContent = st.basket[id] ? fq(st.basket[id], bp.unit) : '0'; calc();
  });
  calc();
  $('#addB', root).onclick = () => {
    const ci = calc();
    for (let gi = 0; gi < (p.options || []).length; gi++) if (p.options[gi].required && !st.opts[gi].length) { toast(L({ n_ar: p.options[gi].name_ar, n_de: p.options[gi].name_de }, 'n') + ' – ' + t('required'), 1); return; }
    if (p.kind === 'cake') { st.cake.date = $('#ckD', root).value; st.cake.text = $('#ckT', root).value.trim(); if (!st.cake.date) { toast(t('cakedate') + ' – ' + t('required'), 1); return; } ci.cake = st.cake; }
    if (p.kind === 'basket' && !ci.basket.length) { toast(t('basketmin'), 1); return; }
    ci.note = $('#pNote', root).value.trim(); ci.k = ex ? ex.k : uid();
    if (ex) S.cart[editIdx] = ci; else S.cart.push(ci);
    saveCart(); closeModal(); toast('✓ ' + L(p, 'name')); route();
  };
}

/* ---------- views: customer ---------- */
function vHome() {
  const s = S.settings;
  const ann = L({ a_ar: s.announce_ar, a_de: s.announce_de }, 'a');
  const feat = visibleProducts().filter(p => p.featured).slice(0, 12);
  page(`<section class="hero"><img src="logo.png" alt="بيت كرم – Stein & Olive"><p>${esc(t('sub'))}</p></section>
   ${ann ? `<div class="ann">${esc(ann)}</div>` : ''}
   <div class="search"><span class="ic">🔍</span><input type="search" id="q" placeholder="${esc(t('search'))}" autocomplete="off"></div>
   <div id="res"></div>
   <div id="homeBody"><h2 class="sec">${esc(t('shops'))}</h2>
   <div class="shops">${visibleShops().map(sh => { const o = isOpenNow(sh); const r = S.ratings[sh.id]; return `<div class="shop" onclick="location.hash='#/shop/${esc(sh.id)}'">
     <div class="im" style="${sh.image_url ? `background-image:url('${esc(sh.image_url)}')` : ''}">${sh.image_url ? '' : (SHOP_ICON[sh.type] || '🏪')}</div>
     <div class="bd"><h3>${esc(L(sh, 'name'))}</h3><small>${esc(L(sh, 'desc'))}</small>
     <div class="acts" style="margin-top:8px"><span class="pill ${o ? 'ok' : 'bad'}">● ${esc(o ? t('open') : t('closed'))}</span>${r ? `<span class="pill be">★ ${r.avg} (${r.n})</span>` : ''}</div></div></div>`; }).join('')}</div>
   ${feat.length ? `<h2 class="sec">${esc(t('featured'))}</h2><div class="grid">${feat.map(prodCard).join('')}</div>` : ''}</div>`);
  bindCards($('#homeBody'));
  const q = $('#q');
  q.oninput = () => {
    const v = q.value.trim().toLowerCase();
    if (v.length < 2) { $('#res').innerHTML = ''; $('#homeBody').hidden = false; return; }
    const r = visibleProducts().filter(p => (p.name_ar + ' ' + p.name_de + ' ' + (p.barcode || '')).toLowerCase().includes(v)).slice(0, 60);
    $('#homeBody').hidden = true;
    $('#res').innerHTML = r.length ? `<div class="grid">${r.map(prodCard).join('')}</div>` : `<div class="empty">${esc(t('noresults'))}</div>`;
    bindCards($('#res'));
  };
}
function vShop(id) {
  const sh = shopById(id); if (!sh || !sh.active) { location.hash = '#/'; return; }
  const prods = visibleProducts(id);
  const cats = S.cats.filter(c => c.shop_id === id && prods.some(p => p.category_id === c.id));
  const o = isOpenNow(sh); const r = S.ratings[id];
  const hrs = DAYS.slice(1).concat('so').map(d => `<div class="sum"><span>${esc(t('days')[d])}</span><span>${esc((sh.hours || {})[d] || t('closedday'))}</span></div>`).join('');
  page(`<div class="card" style="display:flex;gap:14px;align-items:center">
     <div class="thumb" style="width:70px;height:70px;font-size:34px;${sh.image_url ? `background:url('${esc(sh.image_url)}') center/cover` : ''}">${sh.image_url ? '' : (SHOP_ICON[sh.type] || '')}</div>
     <div style="flex:1"><h3 style="margin:0;font-size:22px">${esc(L(sh, 'name'))}</h3><div class="note">${esc(L(sh, 'desc'))}</div>
     <div class="acts" style="margin-top:6px"><span class="pill ${o ? 'ok' : 'bad'}">● ${esc(o ? t('open') : t('closed'))}</span>${r ? `<span class="pill be">★ ${r.avg} (${r.n})</span>` : ''}<button class="pill" id="hrsB" style="background:none;cursor:pointer">🕒 ${esc(t('hours'))}</button></div></div></div>
   <div class="search" style="margin:10px 0"><span class="ic">🔍</span><input type="search" id="q" placeholder="${esc(t('search'))}"></div>
   <div class="chips" id="chips"><button class="chip on" data-c="">${esc(t('all'))}</button>${cats.map(c => `<button class="chip" data-c="${c.id}">${esc(L(c, 'name'))}</button>`).join('')}</div>
   <div id="plist"></div>`);
  $('#hrsB').onclick = () => modal(`<button class="ib x" data-close>✕</button><h3>🕒 ${esc(t('hours'))}</h3>${hrs}`);
  let cat = '', qv = '';
  const draw = () => {
    let list = prods.filter(p => (!cat || p.category_id === cat) && (!qv || (p.name_ar + ' ' + p.name_de).toLowerCase().includes(qv)));
    let html = '';
    if (!cat && !qv && cats.length) {
      cats.forEach(c => { const l = list.filter(p => p.category_id === c.id); if (l.length) html += `<h2 class="sec">${esc(L(c, 'name'))}</h2><div class="grid">${l.map(prodCard).join('')}</div>`; });
      const rest = list.filter(p => !cats.some(c => c.id === p.category_id)); if (rest.length) html += `<h2 class="sec">…</h2><div class="grid">${rest.map(prodCard).join('')}</div>`;
    } else html = list.length ? `<div class="grid">${list.map(prodCard).join('')}</div>` : `<div class="empty">${esc(t('noresults'))}</div>`;
    $('#plist').innerHTML = html; bindCards($('#plist'));
  };
  $$('#chips .chip').forEach(b => b.onclick = () => { $$('#chips .chip').forEach(x => x.classList.remove('on')); b.classList.add('on'); cat = b.dataset.c; draw(); });
  $('#q').oninput = e => { qv = e.target.value.trim().toLowerCase(); draw(); };
  draw();
}
function vCart() {
  S.cart = S.cart.filter(c => prodById(c.product_id));
  if (!S.cart.length) { page(`<div class="empty"><div style="font-size:60px">🛍️</div><p>${esc(t('empty'))}</p><a class="btn" href="#/">${esc(t('toshop'))}</a></div>`, { noBar: 1 }); return; }
  const tot = cartTotals();
  const groups = cartShops().map(sid => { const sh = shopById(sid); const items = S.cart.map((c, i) => [c, i]).filter(([c]) => prodById(c.product_id).shop_id === sid);
    return `<div class="card"><h3>${SHOP_ICON[sh.type] || ''} ${esc(L(sh, 'name'))} ${isOpenNow(sh) ? '' : `<span class="pill bad">${esc(t('closed'))}</span>`}</h3>
     ${items.map(([c, i]) => { const p = prodById(c.product_id); return `<div class="li"><div class="thumb" style="${p.image_url ? `background:url('${esc(p.image_url)}') center/cover` : ''}"></div>
       <div class="t" data-edit="${i}" style="cursor:pointer"><b>${esc(L(p, 'name'))}</b><small>${esc(optText(c))}</small><small>${money(itemPrice(c))}</small></div>
       <div class="step sm"><button data-m="${i}">−</button><span>${fq(c.qty, p.unit)}</span><button data-pl="${i}">+</button></div></div>`; }).join('')}</div>`; }).join('');
  page(`<h2 class="sec">🛍️ ${esc(t('cart'))}</h2>${groups}
    <div class="card"><div class="sum"><span>${esc(t('subtotal'))}</span><span>${money(tot.sub)}</span></div>
    ${tot.pf ? `<div class="sum"><span>${esc(t('pfand'))}</span><span>${money(tot.pf)}</span></div>` : ''}
    <div class="sum tot"><span>${esc(t('total'))}</span><span>${money(tot.sub + tot.pf)}</span></div></div>
    <div class="acts"><a class="btn o" href="#/">${esc(t('toshop'))}</a><a class="btn" style="flex:1" href="#/checkout">${esc(t('checkout'))} →</a></div>`, { noBar: 1 });
  $$('[data-m],[data-pl]').forEach(b => b.onclick = () => {
    const i = +(b.dataset.m || b.dataset.pl); const c = S.cart[i]; const p = prodById(c.product_id);
    const s = p.unit === 'kg' ? (+p.step || 0.25) : 1; const mn = p.unit === 'kg' ? (+p.min_qty || s) : 1;
    let q = Math.round((c.qty + (b.dataset.pl ? s : -s)) * 1000) / 1000;
    if (q < mn) S.cart.splice(i, 1); else { if (p.track_stock && q > +p.stock) q = c.qty; c.qty = q; }
    saveCart(); vCart();
  });
  $$('[data-edit]').forEach(el => el.onclick = () => { const i = +el.dataset.edit; productSheet(S.cart[i].product_id, i); });
}
function zoneFor(plz) { return (S.settings.zones || []).find(z => String(z.plz || '').replace(/\s/g, '').split(',').includes(String(plz || '').trim())); }
function vCheckout() {
  if (!S.cart.length) { location.hash = '#/cart'; return; }
  const s = S.settings; const pay = s.payments || {};
  const canDel = s.delivery !== false, canPick = s.pickup !== false;
  const saved = JSON.parse(localStorage.getItem('so_cust') || '{}');
  const st = { mode: saved.mode && ((saved.mode === 'delivery' && canDel) || (saved.mode === 'pickup' && canPick)) ? saved.mode : (canDel ? 'delivery' : 'pickup'), when: 'asap', pay: pay.cash !== false ? 'cash' : (pay.card ? 'card' : 'paypal') };
  const allOpen = cartShops().every(id => isOpenNow(shopById(id)));
  if (!allOpen) st.when = 'later';
  const payOpts = [['cash', pay.cash !== false], ['card', !!pay.card], ['paypal', !!pay.paypal && !!pay.paypal_me]].filter(x => x[1]).map(x => x[0]);
  page(`<h2 class="sec">${esc(t('checkout'))}</h2>
   <div class="seg" id="mode">${canDel ? `<button data-v="delivery">🛵 ${esc(t('deliv'))}</button>` : ''}${canPick ? `<button data-v="pickup">🏬 ${esc(t('pickup'))}</button>` : ''}</div>
   <div class="card"><label class="f"><span>${esc(t('name'))} *</span><input type="text" id="cN" autocomplete="name" value="${esc(saved.name || '')}"></label>
    <label class="f"><span>${esc(t('phone'))} *</span><input type="tel" id="cP" autocomplete="tel" value="${esc(saved.phone || '')}"></label>
    <label class="f"><span>${esc(t('email'))}</span><input type="email" id="cE" autocomplete="email" value="${esc(saved.email || '')}"></label>
    <div id="addr"><label class="f"><span>${esc(t('street'))} *</span><input type="text" id="cS" autocomplete="street-address" value="${esc(saved.street || '')}"></label>
     <div class="row"><label class="f"><span>${esc(t('plz'))} *</span><input type="text" inputmode="numeric" id="cZ" maxlength="5" autocomplete="postal-code" value="${esc(saved.plz || '')}"></label>
     <label class="f"><span>${esc(t('city'))}</span><input type="text" id="cC" value="${esc(saved.city || 'Hamburg')}"></label></div>
     <div id="zinfo" class="note"></div>
     <label class="f"><span>${esc(t('addrnote'))}</span><input type="text" id="cAN" value="${esc(saved.address_note || '')}"></label></div></div>
   <div class="card"><h3>${esc(t('when'))}</h3>${!allOpen ? `<div class="warnbox">${esc(t('schedreq'))}</div>` : ''}
    <div class="seg" id="when">${allOpen ? `<button data-v="asap">⚡ ${esc(t('asap'))}</button>` : ''}<button data-v="later">🕒 ${esc(t('later'))}</button></div>
    <input type="datetime-local" id="cT" style="margin-top:10px" hidden></div>
   <div class="card"><h3>${esc(t('payment'))}</h3>${payOpts.map(v => `<label class="opt"><input type="radio" name="pay" value="${v}" ${v === st.pay ? 'checked' : ''}><span>${v === 'cash' ? '💶 ' : v === 'card' ? '💳 ' : '🅿️ '}${esc(t(v))}</span></label>`).join('')}
    <div class="note" id="ppn" hidden>${esc(t('paypalnote'))}</div></div>
   <div class="card"><label class="f"><span>${esc(t('coupon'))}</span><input type="text" id="cK" style="text-transform:uppercase"></label>
    <label class="f"><span>${esc(t('ordernote'))}</span><textarea id="cO" maxlength="400"></textarea></label></div>
   <div class="card" id="tots"></div>
   <label class="chk"><input type="checkbox" id="cA"><span>${S.lang === 'ar' ? 'قرأت وأوافق على <a href="#/agb">الشروط</a> و<a href="#/datenschutz">سياسة الخصوصية</a>' : 'Ich akzeptiere die <a href="#/agb">AGB</a> und die <a href="#/datenschutz">Datenschutzerklärung</a>'}</span></label>
   <button class="btn full" id="go" style="padding:16px;font-size:17px;margin-top:8px">${esc(t('place'))}</button>`, { noBar: 1 });
  if (!st.pay || !payOpts.includes(st.pay)) st.pay = payOpts[0];
  const tmin = new Date(Date.now() + 45 * 60000); const pad = n => String(n).padStart(2, '0');
  const lt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  $('#cT').min = lt(tmin); $('#cT').value = lt(tmin);
  const segSet = (id, v) => $$('#' + id + ' button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  const draw = () => {
    segSet('mode', st.mode); segSet('when', st.when);
    $('#addr').hidden = st.mode !== 'delivery'; $('#cT').hidden = st.when !== 'later'; $('#ppn').hidden = st.pay !== 'paypal';
    const tot = cartTotals(); let fee = 0; let zi = '';
    if (st.mode === 'delivery') {
      const z = zoneFor($('#cZ').value);
      if ($('#cZ').value.length >= 5) {
        if (z) { fee = +z.fee || 0; zi = `<span style="color:var(--ok)">✓ ${esc(t('zoneok'))}</span> • ${esc(t('delivery'))} ${money(fee)}${+z.min ? ` • ${esc(t('minorder'))} ${money(z.min)}` : ''}`; if (+z.min && tot.sub < +z.min) zi += `<div class="warnbox">${esc(t('e_min'))} ${money(z.min)}</div>`; }
        else zi = `<span style="color:var(--bad)">✕ ${esc(t('zonebad'))}</span>`;
      }
    }
    $('#zinfo').innerHTML = zi;
    $('#tots').innerHTML = `<div class="sum"><span>${esc(t('subtotal'))}</span><span>${money(tot.sub)}</span></div>${tot.pf ? `<div class="sum"><span>${esc(t('pfand'))}</span><span>${money(tot.pf)}</span></div>` : ''}
      ${st.mode === 'delivery' ? `<div class="sum"><span>${esc(t('delivery'))}</span><span>${money(fee)}</span></div>` : ''}<div class="sum tot"><span>${esc(t('total'))}</span><span>${money(tot.sub + tot.pf + fee)}</span></div>
      ${$('#cK').value.trim() ? `<div class="note">${esc(t('coupon'))}: ${esc($('#cK').value.trim().toUpperCase())}</div>` : ''}`;
  };
  $$('#mode button').forEach(b => b.onclick = () => { st.mode = b.dataset.v; draw(); });
  $$('#when button').forEach(b => b.onclick = () => { st.when = b.dataset.v; draw(); });
  $$('input[name=pay]').forEach(r => r.onchange = () => { st.pay = r.value; draw(); });
  $('#cZ').oninput = draw; $('#cK').oninput = draw;
  draw();
  $('#go').onclick = async () => {
    const v = id => $(id).value.trim();
    if (!v('#cN') || !v('#cP')) return toast(t('e_contact'), 1);
    if (st.mode === 'delivery' && (!v('#cS') || !v('#cZ'))) return toast(t('e_address'), 1);
    if (!$('#cA').checked) return toast(t('agree'), 1);
    let sched = '';
    if (st.when === 'later') { const d = new Date($('#cT').value); if (isNaN(d) || d < new Date(Date.now() + 20 * 60000)) return toast(t('later') + ' ?', 1); sched = d.toISOString(); }
    const cust = { name: v('#cN'), phone: v('#cP'), email: v('#cE'), street: v('#cS'), plz: v('#cZ'), city: v('#cC'), address_note: v('#cAN'), mode: st.mode };
    localStorage.setItem('so_cust', JSON.stringify(cust));
    const payload = Object.assign({}, cust, { scheduled_at: sched, payment: st.pay, coupon: v('#cK'), note: v('#cO'), lang: S.lang,
      items: S.cart.map(c => ({ product_id: c.product_id, qty: c.qty, options: c.options, basket: c.basket, note: c.note, cake: c.cake })) });
    if (st.mode !== 'delivery') { payload.street = ''; payload.plz = ''; payload.city = ''; payload.address_note = ''; }
    $('#go').disabled = true;
    const { data, error } = await sb.rpc('place_order', { p: payload });
    $('#go').disabled = false;
    if (error) { toast(errMsg(error), 1); if (/stock|product/.test(error.message)) loadData().catch(() => {}); return; }
    const mine = JSON.parse(localStorage.getItem('so_orders') || '[]'); mine.unshift({ id: data.id, token: data.token, at: Date.now() });
    localStorage.setItem('so_orders', JSON.stringify(mine.slice(0, 30)));
    S.cart = []; saveCart(); toast(t('sent'));
    if (st.pay === 'paypal' && pay.paypal_me) window.open(`https://www.paypal.me/${encodeURIComponent(String(pay.paypal_me).replace(/^.*paypal\.me\//i, ''))}/${(+data.total).toFixed(2)}EUR`, '_blank', 'noopener');
    loadData().catch(() => {});
    location.hash = '#/track/' + data.token;
  };
}
const STEPS_D = ['new', 'preparing', 'ready', 'on_way', 'delivered'], STEPS_P = ['new', 'preparing', 'ready', 'picked_up'];
const STEP_IC = { new: '📥', preparing: '👨‍🍳', ready: '✅', on_way: '🛵', delivered: '🏠', picked_up: '🛍️' };
function qrSvg(text) { const q = qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); }
let trackTimer = null;
async function vTrack(token) {
  clearInterval(trackTimer);
  const draw = async (first) => {
    const { data: o, error } = await sb.rpc('get_order', { t: token });
    if (location.hash.indexOf(token) < 0) { clearInterval(trackTimer); return; }
    if (error || !o) { if (first) page(`<div class="empty">${esc(t('err'))}</div>`); return; }
    if (!first && draw.last === JSON.stringify(o)) return; draw.last = JSON.stringify(o);
    if (!first && document.activeElement && document.activeElement.closest && document.activeElement.closest('.rv')) return;
    const steps = o.mode === 'delivery' ? STEPS_D : STEPS_P; const idx = steps.indexOf(o.status);
    const shops = [...new Set(o.items.map(i => i.shop_id))];
    const done = o.status === 'delivered' || o.status === 'picked_up';
    const dw = S.settings.whatsapp ? String(S.settings.whatsapp).replace(/\D/g, '') : '';
    page(`<div class="card" style="text-align:center"><div class="note">${esc(t('orderno'))}</div><div class="big">#${o.id}</div>
      <div class="note">${fmtDate(o.created_at)}${o.scheduled_at ? ' • 🕒 ' + fmtDate(o.scheduled_at) : ''}</div>
      ${o.status === 'cancelled' ? `<div class="warnbox">${esc(t('st_cancelled'))}</div>` : `<div class="steps">${steps.map((s, i) => `<div class="stp ${i <= idx ? 'on' : ''}"><i>${STEP_IC[s]}</i>${esc(t('st_' + s))}</div>`).join('')}</div>`}
      ${o.mode === 'pickup' && !done && o.status !== 'cancelled' ? `<div class="note">${esc(t('showqr'))}</div><div class="qr">${qrSvg('SO:' + o.token)}</div>` : ''}</div>
     ${o.mode === 'delivery' && o.driver_name ? `<div class="card"><h3>🛵 ${esc(t('driver'))}: ${esc(o.driver_name)}</h3>${o.driver_phone ? `<a class="btn o s" href="tel:${esc(o.driver_phone)}">☎ ${esc(o.driver_phone)}</a>` : ''}
       ${o.status === 'on_way' && o.driver_lat ? `<iframe class="map" style="margin-top:10px" src="https://www.openstreetmap.org/export/embed.html?bbox=${o.driver_lng - 0.01},${o.driver_lat - 0.006},${o.driver_lng + 0.01},${o.driver_lat + 0.006}&layer=mapnik&marker=${o.driver_lat},${o.driver_lng}"></iframe>` : ''}</div>` : ''}
     ${done ? shops.filter(sid => !o.reviews.includes(sid)).map(sid => `<div class="card rv" data-s="${esc(sid)}"><h3>${esc(t('rate'))}: ${esc(L(shopById(sid) || {}, 'name'))}</h3>
        <div class="stars">${[1, 2, 3, 4, 5].map(n => `<span data-n="${n}">★</span>`).join('')}</div><input type="text" placeholder="${esc(t('comment'))}" style="margin-top:8px"><button class="btn s" style="margin-top:8px">${esc(t('send'))}</button></div>`).join('') : ''}
     <div class="card" id="rcpt">${receiptHtml(o)}</div>
     <div class="acts noprint"><button class="btn o" onclick="window.print()">🖨️ ${esc(t('print'))}</button>${dw ? `<a class="btn o" target="_blank" rel="noopener" href="https://wa.me/${dw}?text=${encodeURIComponent((S.lang === 'ar' ? 'مرحبا، بخصوص طلبي رقم #' : 'Hallo, zu meiner Bestellung #') + o.id)}">💬 WhatsApp</a>` : ''}<a class="btn o" href="#/">${esc(t('home'))}</a></div>`, { noBar: 1 });
    $$('.rv').forEach(card => { let n = 0; const sp = $$('.stars span', card);
      sp.forEach(s => s.onclick = () => { n = +s.dataset.n; sp.forEach(x => x.classList.toggle('on', +x.dataset.n <= n)); });
      $('button', card).onclick = async () => { if (!n) return; const { error } = await sb.rpc('add_review', { p_token: token, p_shop: card.dataset.s, p_stars: n, p_text: $('input', card).value, p_name: o.customer_name.split(' ')[0] });
        if (error) return toast(t('err'), 1); card.innerHTML = `<div style="text-align:center">${esc(t('thanks'))} ${'★'.repeat(n)}</div>`; draw.last = ''; };
    });
    if (done || o.status === 'cancelled') clearInterval(trackTimer);
  };
  await draw(true);
  trackTimer = setInterval(() => draw(false), 12000);
}
function receiptHtml(o) {
  const s = S.settings;
  const byShop = {}; o.items.forEach(i => (byShop[i.shop_id] = byShop[i.shop_id] || []).push(i));
  const vat = {}; o.items.filter(i => i.status !== 'rejected').forEach(i => { vat[i.vat] = (vat[i.vat] || 0) + (+i.line_total); });
  return `<h3>🧾 ${esc(t('receipt'))} #${o.id}</h3>
   ${Object.keys(byShop).map(sid => `<div style="margin:8px 0"><b>${esc(L(shopById(sid) || { name_ar: sid, name_de: sid }, 'name'))}</b>
     ${byShop[sid].map(i => `<div class="li" style="padding:5px 0;${i.status === 'rejected' ? 'opacity:.4;text-decoration:line-through' : ''}"><div class="t">${fq(i.final_qty || i.qty, i.unit)} ${esc(S.lang === 'ar' ? i.name_ar : i.name_de)}
       <small>${esc((i.options || []).map(x => S.lang === 'ar' ? x.ar : x.de).join(', '))}${i.cake ? ' 📅 ' + esc(i.cake.date) + (i.cake.text ? ' ✍️ ' + esc(i.cake.text) : '') : ''}${i.note ? ' 📝 ' + esc(i.note) : ''}</small></div><span>${money(i.line_total)}</span></div>`).join('')}</div>`).join('')}
   <div class="sum"><span>${esc(t('subtotal'))}</span><span>${money(o.subtotal)}</span></div>
   ${+o.pfand ? `<div class="sum"><span>${esc(t('pfand'))}</span><span>${money(o.pfand)}</span></div>` : ''}
   ${o.mode === 'delivery' ? `<div class="sum"><span>${esc(t('delivery'))}</span><span>${money(o.delivery_fee)}</span></div>` : ''}
   ${+o.discount ? `<div class="sum"><span>${esc(t('discount'))} ${esc(o.coupon || '')}</span><span>−${money(o.discount)}</span></div>` : ''}
   <div class="sum tot"><span>${esc(t('total'))}</span><span>${money(o.total)}</span></div>
   <div class="note">${Object.keys(vat).map(v => `inkl. ${v}% MwSt: ${money(vat[v] - vat[v] / (1 + v / 100))}`).join(' • ')}</div>
   <div class="note">${esc(t('payment'))}: ${esc(t(o.payment))} • ${esc(t(o.mode === 'delivery' ? 'deliv' : 'pickup'))}</div>
   <div class="note" style="margin-top:6px">${esc(s.name || 'Stein & Olive by Karam')} • ${esc(s.address || '')}${s.vat_id ? ' • USt-IdNr. ' + esc(s.vat_id) : s.tax_id ? ' • St.-Nr. ' + esc(s.tax_id) : ''}</div>`;
}
function vOrders() {
  const mine = JSON.parse(localStorage.getItem('so_orders') || '[]');
  page(`<h2 class="sec">📦 ${esc(t('myorders'))}</h2>${mine.length ? mine.map(o => `<a class="card" style="display:flex;justify-content:space-between;text-decoration:none;color:inherit" href="#/track/${esc(o.token)}"><b>#${o.id}</b><span class="note">${fmtDate(o.at)}</span><span>→</span></a>`).join('') : `<div class="empty">–</div>`}`);
}
function vLegal(kind) {
  const s = S.settings;
  let h = '';
  if (kind === 'impressum') h = `<h2 class="sec">Impressum</h2><div class="card"><p><b>Angaben gemäß § 5 DDG</b></p><p>${esc(s.name || 'Stein & Olive by Karam')}<br>${esc(s.owner ? 'Inhaber: ' + s.owner : '')}${s.legal_form ? ' (' + esc(s.legal_form) + ')' : ''}<br>${esc(s.address || '')}</p>
     <p>${s.phone ? 'Telefon: ' + esc(s.phone) + '<br>' : ''}${s.email ? 'E-Mail: ' + esc(s.email) : ''}</p>${s.vat_id ? `<p>USt-IdNr.: ${esc(s.vat_id)}</p>` : ''}${s.tax_id ? `<p>Steuernummer: ${esc(s.tax_id)}</p>` : ''}
     <p>Verantwortlich für den Inhalt: ${esc(s.owner || '')}</p><p class="note">Verbraucherstreitbeilegung: Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p></div>`;
  else if (kind === 'datenschutz') h = `<h2 class="sec">Datenschutzerklärung</h2><div class="card">
     <p><b>1. Verantwortlicher</b><br>${esc(s.name || 'Stein & Olive by Karam')}, ${esc(s.address || '')}${s.email ? ', ' + esc(s.email) : ''}</p>
     <p><b>2. Welche Daten wir verarbeiten</b><br>Bei einer Bestellung: Name, Telefonnummer, optional E-Mail, Lieferadresse, Bestellinhalt und Zahlungsart. Zweck ist die Abwicklung der Bestellung (Art. 6 Abs. 1 lit. b DSGVO). Rechnungsdaten bewahren wir nach den gesetzlichen Fristen auf (Art. 6 Abs. 1 lit. c DSGVO).</p>
     <p><b>3. Hosting und Datenbank</b><br>Die Website wird bei Netlify (Netlify Inc., USA; Datenübermittlung auf Grundlage der EU-Standardvertragsklauseln / EU-US Data Privacy Framework) bereitgestellt. Bestelldaten werden bei Supabase in einem Rechenzentrum in Frankfurt am Main (EU) gespeichert.</p>
     <p><b>4. Lokale Speicherung</b><br>Warenkorb, Sprache und deine Kontaktdaten für die nächste Bestellung werden nur lokal in deinem Browser gespeichert (technisch notwendig). Es werden keine Tracking- oder Werbe-Cookies verwendet. Schriften werden lokal geladen.</p>
     <p><b>5. Kartenanzeige</b><br>Bei der Live-Verfolgung einer Lieferung wird eine Karte von OpenStreetMap geladen; dabei wird deine IP-Adresse an die OpenStreetMap Foundation übertragen.</p>
     <p><b>6. Zahlung mit PayPal</b><br>Wenn du PayPal wählst, wirst du zu PayPal (Europe) S.à r.l. et Cie, S.C.A., Luxemburg weitergeleitet; dort gelten deren Datenschutzbestimmungen.</p>
     <p><b>7. Deine Rechte</b><br>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch sowie auf Beschwerde bei einer Aufsichtsbehörde (z. B. Hamburgische Beauftragte für Datenschutz und Informationsfreiheit).</p></div>`;
  else h = `<h2 class="sec">AGB</h2><div class="card">
     <p><b>1. Geltungsbereich</b><br>Diese Bedingungen gelten für Bestellungen über diese Website bei den Geschäften der Passage ${esc(s.name || 'Stein & Olive by Karam')}, ${esc(s.address || '')}.</p>
     <p><b>2. Vertragsschluss</b><br>Mit dem Klick auf „Zahlungspflichtig bestellen“ gibst du ein verbindliches Angebot ab. Der Vertrag kommt zustande, wenn das Geschäft die Bestellung annimmt bzw. mit der Zubereitung beginnt.</p>
     <p><b>3. Preise</b><br>Alle Preise sind Endpreise inkl. MwSt. zzgl. Pfand und ggf. Liefergebühr. Bei Waren nach Gewicht richtet sich der Endpreis nach dem tatsächlich abgewogenen Gewicht.</p>
     <p><b>4. Lieferung und Abholung</b><br>Lieferung nur in die angegebenen Liefergebiete. Lieferzeiten sind unverbindliche Schätzungen.</p>
     <p><b>5. Zahlung</b><br>Bar oder mit Karte bei Übergabe bzw. per PayPal, soweit angeboten.</p>
     <p><b>6. Widerruf</b><br>Ein Widerrufsrecht besteht nicht bei Lieferung von Waren, die schnell verderben können oder nach Kundenspezifikation angefertigt werden (§ 312g Abs. 2 Nr. 1 und 2 BGB), insbesondere Lebensmittel, Speisen und Torten.</p>
     <p><b>7. Allergene</b><br>Angaben zu Allergenen findest du bei jedem Produkt. Spuren anderer Allergene können nicht ausgeschlossen werden.</p></div>`;
  if (S.lang === 'ar') h += `<p class="note">النص القانوني بالألماني هو النص المعتمد.</p>`;
  page(h);
}

/* ---------- TV menu screen ---------- */
let tvTimer = null;
function vScreen(id) {
  clearInterval(tvTimer);
  const sh = shopById(id); if (!sh) { $('#app').innerHTML = '<div class="empty">?</div>'; return; }
  document.body.style.cursor = 'none';
  let pageNo = 0;
  const render = () => {
    const prods = visibleProducts(id).filter(p => !soldOut(p));
    const cats = S.cats.filter(c => c.shop_id === id);
    const blocks = [];
    cats.forEach(c => { const l = prods.filter(p => p.category_id === c.id); if (l.length) { blocks.push({ cat: c }); l.forEach(p => blocks.push({ p })); } });
    prods.filter(p => !cats.some(c => c.id === p.category_id)).forEach(p => blocks.push({ p }));
    const per = 15; const pages = Math.max(1, Math.ceil(blocks.length / per)); pageNo = pageNo % pages;
    const chunk = blocks.slice(pageNo * per, pageNo * per + per);
    $('#app').innerHTML = `<div class="tv"><div class="th"><img src="logo.png" alt=""><h1>${esc(sh.name_ar)} • <span class="serif">${esc(sh.name_de)}</span></h1><div class="serif" style="font-size:3vh;color:var(--mute)">${pages > 1 ? (pageNo + 1) + '/' + pages : ''}</div></div>
      <div class="tg">${chunk.map(b => b.cat ? `<div class="cat">${esc(b.cat.name_ar)} • ${esc(b.cat.name_de)}</div>` : `<div class="ti">${b.p.image_url ? `<img src="${esc(b.p.image_url)}" alt="">` : '<div class="ph"></div>'}<div><b>${esc(b.p.name_ar)}</b><small>${esc(b.p.name_de)}</small><span class="p">${priceLabel(b.p)}</span></div></div>`).join('')}</div></div>`;
  };
  render();
  let tick = 0;
  tvTimer = setInterval(async () => { tick++; pageNo++; if (tick % 6 === 0) { try { await loadData(); } catch (e) {} } render(); }, 12000);
}

/* ---------- router ---------- */
async function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [r, a] = h.split('/');
  if (r !== 'screen') { clearInterval(tvTimer); document.body.style.cursor = ''; }
  if (r !== 'track') clearInterval(trackTimer);
  if (window.Admin && Admin.leave) Admin.leave(r);
  if (!$('#modal').hidden) { closeModal(); }
  window.scrollTo(0, 0);
  if (r === 'login' || r === 'admin' || r === 'driver') return window.Admin.route(r, a, h.split('/').slice(1));
  if (r === 'shop') return vShop(a);
  if (r === 'cart') return vCart();
  if (r === 'checkout') return vCheckout();
  if (r === 'track') return vTrack(a);
  if (r === 'orders') return vOrders();
  if (r === 'impressum' || r === 'datenschutz' || r === 'agb') return vLegal(r);
  if (r === 'screen') return vScreen(a);
  return vHome();
}

async function start() {
  setLang(S.lang);
  try { await loadData(); }
  catch (e) { $('#app').innerHTML = `<div class="empty"><img src="logo.png" style="width:200px;margin:auto"><p>${esc(t('err'))}</p><button class="btn" onclick="location.reload()">↻</button></div>`; return; }
  window.addEventListener('hashchange', route);
  route();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

window.App = { start, sb, S, t, L, esc, money, fq, $, $$, toast, modal, closeModal, errMsg, loadData, fetchAll, shopById, prodById, page, header, setLang,
  ALLERGENS, SHOP_ICON, DAYS, fmtDate, qrSvg, receiptHtml, route, isOpenNow, DOMAIN, uid, priceLabel };
})();
