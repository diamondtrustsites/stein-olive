/* Stein & Olive by Karam – Online-Bestellsystem: Kundenbereich + gemeinsamer Kern */
(function () {
'use strict';
const CFG = window.SO_CONFIG;
const sb = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'so-staff-auth' } });
// customer-only calls always go out anonymously, even when staff is logged in on the same device
let sbAnon = null;
const anon = () => sbAnon || (sbAnon = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'so-anon' } }));

/* ---------- icons (eigene Linien-Icons) ---------- */
const IC = {
  home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  bag:'<path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', minus:'<path d="M5 12h14"/>', x:'<path d="M6 6l12 12M18 6 6 18"/>',
  back:'<path d="m15 6-6 6 6 6"/>', fwd:'<path d="m9 6 6 6-6 6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', pin:'<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  phone:'<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z"/>',
  chat:'<path d="M4 5h16v11H8l-4 4Z"/>', truck:'<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  store:'<path d="M4 9h16l-1-5H5Z"/><path d="M5 9v11h14V9"/><path d="M10 20v-6h4v6"/>', check:'<path d="m5 12 5 5 9-10"/>',
  chef:'<path d="M7 14a4 4 0 1 1 1.5-7.7A4 4 0 0 1 16 6a4 4 0 1 1 1 8"/><path d="M7 14v6h10v-6"/>', star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
  snow:'<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>', leaf:'<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19 13 11"/>',
  alert:'<path d="M12 4 2.5 20h19Z"/><path d="M12 10v4M12 17v.5"/>', info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/>',
  print:'<path d="M7 9V3h10v6"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  logout:'<path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4M6 12h10"/>', globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
  moon:'<path d="M20 14A8 8 0 1 1 10 4a6.5 6.5 0 0 0 10 10Z"/>', menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6M9 12h6"/>', trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16Z"/>', camera:'<path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/>',
  box:'<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5Z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>', chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2 20c1-3.5 3.8-5.5 7-5.5s6 2 7 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .7 3.3 2.6 4 5.5"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4.9a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.5a7 7 0 0 0-2 1.2l-2.4-.9-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-.9a7 7 0 0 0 2 1.2L10 21h4l.5-2.5a7 7 0 0 0 2-1.2l2.4.9 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z"/>',
  tag:'<path d="M3 12V3h9l9 9-9 9Z"/><circle cx="7.5" cy="7.5" r="1.5"/>', tv:'<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8"/>',
  key:'<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>', scan:'<path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M7 12h10"/>',
  list:'<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>', inbox:'<path d="M3 13h5l2 3h4l2-3h5"/><path d="M5 5h14l2 8v6H3v-6Z"/>',
  scale:'<path d="M12 3v18M5 21h14"/><path d="M5 7h14"/><path d="m5 7-3 7a3 3 0 0 0 6 0Z"/><path d="m19 7-3 7a3 3 0 0 0 6 0Z"/>',
  refresh:'<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>', bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4Z"/><path d="M10 21h4"/>',
  belloff:'<path d="M6 16V11a6 6 0 0 1 9.5-4.9M18 11v5l2 2H8"/><path d="M10 21h4M3 3l18 18"/>', copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
  repeat:'<path d="M4 12a8 8 0 0 1 14-5l2 2"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-14 5l-2-2"/><path d="M4 20v-5h5"/>',
  gift:'<rect x="3" y="8" width="18" height="5"/><path d="M5 13v8h14v-8M12 8v13"/><path d="M12 8C10 4 6 4 6 6.5S10 8 12 8c2 0 6-0 6-1.5S14 4 12 8Z"/>',
  cake:'<path d="M4 21h16v-8H4Z"/><path d="M4 16c2 1.5 4 1.5 5.5 0s3.5-1.5 5 0 3.5 1.5 5.5 0"/><path d="M12 13V9M12 6v.5"/>',
  cart:'<path d="M3 4h2l2.5 11h10L20 8H7"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
  meat:'<path d="M15 4c3 0 5 2.5 5 5.5 0 4.5-4.5 9.5-9.5 9.5C7 19 4 17 4 13.5 4 8 9.5 4 15 4Z"/><circle cx="14" cy="10" r="2"/>',
  olive:'<ellipse cx="12" cy="13" rx="5" ry="7" transform="rotate(25 12 13)"/><path d="M14 5c1-1.5 3-2 4.5-1.5"/>',
  dish:'<path d="M3 15h18M5 15a7 7 0 0 1 14 0M12 8V6"/><path d="M2 19h20"/>'
};
const ic = (n, cls) => `<svg class="i${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ''}</svg>`;
const SHOP_ICON_N = { supermarket:'cart', restaurant:'dish', sweets:'cake', butcher:'meat', deli:'olive', other:'store' };
const shopIc = (type, cls) => ic(SHOP_ICON_N[type] || 'store', cls);

/* ---------- i18n ---------- */
const T = {
 ar: {
  home:'الرئيسية', shops:'المحلات', search:'ابحث', searchph:'ابحث عن منتج أو محل', cart:'السلة', account:'حسابي', checkout:'إتمام الطلب', add:'أضف للسلة', open:'مفتوح', closed:'مغلق',
  opensat:'بيفتح', closesat:'لحد', all:'الكل', popular:'الأكثر طلباً', seeall:'عرض الكل', perkg:'/كغ', kg:'كغ', outstock:'نفذت الكمية', halal:'حلال', cooled:'مبرّد', allergens:'مسببات الحساسية',
  noallerg:'ما في مسببات حساسية مسجلة', note:'ملاحظة', notep:'مثلاً بدون بصل', required:'مطلوب', byweight:'السعر النهائي حسب الوزن الفعلي. الفرق عادةً صغير.',
  cakedate:'تاريخ الاستلام', caketext:'الكتابة على القالب', basket:'اختار محتوى السلة', basketmin:'اختار منتج واحد على الأقل',
  empty:'سلتك فاضية', emptyhint:'اختار من المحلات وضيف للسلة. بتقدر تطلب من كل المحلات بطلب واحد.', subtotal:'المجموع الفرعي', pfand:'Pfand', delivery:'التوصيل', discount:'الخصم', total:'المجموع', toshop:'تصفّح المحلات',
  pickup:'استلام', deliv:'توصيل', name:'الاسم', phone:'رقم الهاتف', email:'الإيميل', emailopt:'الإيميل (اختياري)', street:'الشارع ورقم البيت', plz:'الرمز البريدي', city:'المدينة',
  addrnote:'ملاحظة للسائق (طابق، جرس…)', when:'وقت الطلب', asap:'بأسرع وقت', later:'وقت محدد', payment:'الدفع', cash:'كاش عند الاستلام', card:'بطاقة EC عند الاستلام', paypal:'PayPal', transfer:'تحويل بنكي', stripe:'بطاقة أونلاين (Visa، Mastercard، Apple Pay، Google Pay)', paynow:'ادفع هلق بالبطاقة', paytitle:'الدفع أونلاين', payopen:'طلبك لسا مش مدفوع. ادفع بالبطاقة لحتى المحلات تبلّش.', payfail:'ما زبط فتح صفحة الدفع. جرّب كمان مرة.', invoice:'الفاتورة', paid:'مدفوع', unpaid:'غير مدفوع بعد', banktitle:'ادفع بالتحويل البنكي', bankhint:'امسح الكود بتطبيق البنك (Sparkasse وغيره) وبيتعبى التحويل لحاله، أو انسخ المعلومات.', holder:'صاحب الحساب', amount:'المبلغ', purpose:'سبب التحويل', copied:'انتسخ', transferhint:'بعد ما ترسل الطلب بتطلعلك معلومات الحساب البنكي.',
  coupon:'كود الخصم', ordernote:'ملاحظة على الطلب', place:'أرسل الطلب', minorder:'الحد الأدنى', zoneok:'منوصل لعندك', zonebad:'ما منوصل لهالرمز البريدي حالياً',
  track:'تتبع الطلب', myorders:'طلباتي', st_new:'تم الاستلام', st_preparing:'قيد التحضير', st_ready:'جاهز', st_on_way:'بالطريق', st_delivered:'تم التوصيل', st_picked_up:'تم الاستلام', st_cancelled:'ملغي',
  showqr:'ورجي هالكود بالمحل وقت الاستلام', driver:'السائق', rate:'كيف كان', thanks:'شكراً، وصل تقييمك', receipt:'الفاتورة', print:'طباعة', staff:'دخول الموظفين',
  privacy:'الخصوصية', terms:'الشروط', hours:'أوقات الدوام', days:{mo:'الإثنين',di:'الثلاثاء',mi:'الأربعاء',do:'الخميس',fr:'الجمعة',sa:'السبت',so:'الأحد'},
  closedday:'مغلق', sent:'وصل طلبك', err:'ما زبطت العملية. جرّب مرة تانية.', schedreq:'في محل مسكّر هلق. اختار وقت لاحق ومنحضّر طلبك عليه.', paypalnote:'بعد ما ترسل الطلب بتنفتح صفحة PayPal للدفع.', contact:'تواصل معنا',
  e_zone:'ما منوصل لهالرمز البريدي.', e_min:'الحد الأدنى للطلب', e_coupon:'كود الخصم غير صالح.', e_coupon_min:'كود الخصم بيشتغل من', e_stock:'الكمية غير متوفرة:', e_closed:'المحل مسكّر:', e_contact:'اكتب اسمك ورقم هاتفك.', e_address:'اكتب العنوان كامل: الشارع ورقم البيت (مثلاً Steintorweg 4)، والرمز البريدي (5 أرقام) والمدينة.', e_product:'في منتج ما عاد متوفر. حدّث الصفحة.',
  e_phone:'رقم الهاتف غير صحيح.', e_payment:'طريقة الدفع غير متاحة.', e_time:'اختار وقت بعد ربع ساعة على الأقل.', e_option:'اختار:', e_cakedate:'اختار تاريخ من بكرا وطالع.', e_rate:'محاولات كتيرة. استنى شوي وجرّب مرة تانية.',
  e_email:'الإيميل غير صحيح.', e_exists:'في حساب بهالإيميل. سجّل دخول.', e_login:'الإيميل أو كلمة السر غلط.', e_session:'انتهت الجلسة. سجّل دخول مرة تانية.', e_password:'كلمة السر لازم تكون 8 أحرف على الأقل.', e_agree:'وافق على الشروط لتكمل.',
  items:'منتجات', estim:'تقريباً', comment:'تعليق (اختياري)', send:'إرسال', back:'رجوع', hero:'خمسة محلات تحت سقف واحد. اطلب من كلهم بطلب واحد وبتوصلك بمشوار واحد.',
  noresults:'ما لقينا شي بهالاسم.', vatincl:'كل الأسعار شاملة الضريبة.', orderno:'رقم الطلب', light:'الوضع الفاتح', dark:'الوضع الداكن', lang:'Deutsch', langs:'DE',
  login:'تسجيل الدخول', register:'حساب جديد', password:'كلمة السر', newpass:'كلمة سر جديدة', oldpass:'كلمة السر الحالية', logout:'تسجيل الخروج', save:'حفظ', saved:'انحفظ',
  welcome:'أهلاً', profile:'معلوماتي', address:'عنوان التوصيل', noorders:'لسا ما طلبت شي.', reorder:'اطلب نفس الطلب', added:'انضاف للسلة', loginhint:'سجّل دخول لتحفظ عنوانك وتشوف طلباتك.',
  orguest:'أو كمّل بدون حساب', haveacc:'عندك حساب؟', noacc:'ما عندك حساب؟', changepass:'تغيير كلمة السر', hx_t1:'خمس محلات', hx_t2:'تحت سقف واحد', hx_sub:'سوبرماركت، مطعم، حلويات، ملحمة، وأجبان وزيتون. اطلب من كلهن بطلب واحد، ومنوصّلك ياه بمشوار واحد.', hm_open:'{n} من {m} محلات مفتوحين هلق', hm_psg:'الباساج', hm_psg2:'اختار محل وابلّش', hm_feat:'المميز اليوم', hm_how:'كيف بتطلب', hm_s1:'اختار من أي محل', hm_s1d:'حط بالسلة من كذا محل بنفس الوقت.', hm_s2:'اطلب مرة وحدة', hm_s2d:'فاتورة وحدة ودفعة وحدة لكل الطلب.', hm_s3:'توصيل أو استلام', hm_s3d:'منوصّلك، أو بتاخدو من الباساج.', hm_fee:'التوصيل من', hm_nodeliv:'بس استلام من المحل.', hm_map:'افتح بالخريطة', settings:'الإعدادات', st_look:'اللغة والشكل', st_lang:'اللغة', st_theme:'الألوان', st_l:'فاتح', st_d:'غامق', st_auto:'تلقائي', st_big:'خط أكبر', st_big2:'أسهل للقراية', st_calm:'حركات أقل', st_calm2:'بيوقف الحركات بالموقع', st_notify:'الإشعارات', st_not:'إشعار لما يتغير وضع طلبي', st_not2:'لما تكون صفحة الطلب مفتوحة', st_vib:'اهتزاز', st_vib2:'الموبايل بيهتز مع الإشعار', st_app:'ركّب التطبيق', st_app2:'حط الموقع على الشاشة الرئيسية متل تطبيق، بيفتح أسرع.', st_ios:'بالآيفون: اكبس على زر المشاركة تحت بـ Safari، وبعدين «إلى الشاشة الرئيسية».', st_install:'ركّب على الشاشة الرئيسية', st_inst2:'من قائمة المتصفح (⋮) اختار «إضافة إلى الشاشة الرئيسية».', st_delacc:'احذف حسابي', st_del2:'حسابك ومعلوماتك الشخصية بينحذفو. الفواتير القديمة بتضل محفوظة عند المحل لأنو القانون بيطلب هيك.', st_deleted:'انحذف حسابك.', st_data:'المعلومات على هالجهاز', st_data2:'هالمعلومات محفوظة بس على موبايلك لتسهّل الطلب.', st_saved:'الاسم والعنوان المحفوظ', st_recent:'آخر عمليات البحث', st_orders:'طلباتي على هالجهاز', st_clear:'امسح', st_sure:'أكيد؟', st_done:'انمسح', st_help:'المساعدة والقانون', st_ver:'النسخة', st_nosupp:'هالمتصفح ما بيدعم الإشعارات.', st_denied:'الإشعارات مسكّرة. فتّحها من إعدادات المتصفح.', st_notok:'تمام! رح يجيك إشعار.', paused:'الطلبات موقّفة مؤقتاً', pausedhint:'رجعنا قريباً. جرّب بعد شوي.', e_paused:'الطلبات موقّفة مؤقتاً. جرّب بعد شوي.', needacc:'سجّل دخول أو اعمل حساب لتكمل الطلب.', closednow:'المحلات مسكّرة هلق. جرّب وقت الدوام.', e_locked:'الطلب خلص أو صار بالطريق، ما فيك تغيّر فيه.', e_needcode:'لازم كود التسليم من الزبون.', e_badcode:'الكود غلط.', proof:'صورة التسليم', eta_drive:'بيوصل لعندك تقريباً بعد', min:'دقيقة', eta_deliv:'التوصيل المتوقع:', eta_pick:'جاهز للاستلام تقريباً:', eta_sched:'الموعد:', eta_soon:'قرّب يجهز طلبك.', code_d:'كود التسليم: عطيه للسائق لما يوصل', code_p:'كود الاستلام: قولو بالمحل أو ورجيهن الـ QR', posat:'آخر تحديث للموقع:', posnone:'السائق بالطريق. موقعو رح يبين هون بعد شوي.', forgot:'نسيت كلمة السر؟', forgot_t:'كلمة سر جديدة', forgot_p:'اكتب الإيميل تبع حسابك. منبعتلك رابط تحط فيه كلمة سر جديدة.', forgot_send:'ابعت الرابط', forgot_ok:'إذا في حساب بهالإيميل، وصلك رابط. شوف الإيميل (وكمان مجلد Spam). الرابط شغال ساعة وحدة.', reset_t:'حط كلمة سر جديدة', newpass2:'أعد كلمة السر', e_nomatch:'كلمتين السر مش متل بعض.', e_resetbad:'الرابط مش صالح أو انتهى. اطلب رابط جديد.', reset_ok:'تغيّرت كلمة السر.',
  recent:'بحثت مؤخراً', suggest:'جرّب', deliveryfrom:'التوصيل من', pickuphere:'استلام من Steintorweg 4', orderas:'الطلب باسم', change:'تغيير', clear:'مسح',
  hmin:'دقيقة', addcart:'أضف', options:'الخيارات', orders:'طلبات', cancelnote:'لإلغاء الطلب اتصل بالمحل.', whatsapp:'واتساب', viewcart:'عرض السلة'
 },
 de: {
  home:'Start', shops:'Geschäfte', search:'Suche', searchph:'Produkt oder Geschäft suchen', cart:'Warenkorb', account:'Konto', checkout:'Zur Kasse', add:'In den Warenkorb', open:'Geöffnet', closed:'Geschlossen',
  opensat:'Öffnet', closesat:'bis', all:'Alle', popular:'Beliebt', seeall:'Alle ansehen', perkg:'/kg', kg:'kg', outstock:'Ausverkauft', halal:'Halal', cooled:'Gekühlt', allergens:'Allergene',
  noallerg:'Keine Allergene hinterlegt', note:'Anmerkung', notep:'z. B. ohne Zwiebeln', required:'Pflicht', byweight:'Der Endpreis richtet sich nach dem tatsächlichen Gewicht. Die Abweichung ist meist gering.',
  cakedate:'Abholdatum', caketext:'Aufschrift auf der Torte', basket:'Korb zusammenstellen', basketmin:'Bitte mindestens ein Produkt wählen',
  empty:'Dein Warenkorb ist leer', emptyhint:'Wähle in den Geschäften aus. Du kannst aus allen Geschäften in einer Bestellung bestellen.', subtotal:'Zwischensumme', pfand:'Pfand', delivery:'Lieferung', discount:'Rabatt', total:'Gesamt', toshop:'Geschäfte ansehen',
  pickup:'Abholung', deliv:'Lieferung', name:'Name', phone:'Telefon', email:'E-Mail', emailopt:'E-Mail (optional)', street:'Straße und Hausnummer', plz:'PLZ', city:'Ort',
  addrnote:'Hinweis für den Fahrer (Etage, Klingel …)', when:'Zeitpunkt', asap:'So schnell wie möglich', later:'Uhrzeit wählen', payment:'Zahlung', cash:'Bar bei Übergabe', card:'EC-Karte bei Übergabe', paypal:'PayPal', transfer:'Überweisung', stripe:'Karte online (Visa, Mastercard, Apple Pay, Google Pay)', paynow:'Jetzt mit Karte bezahlen', paytitle:'Online bezahlen', payopen:'Deine Bestellung ist noch nicht bezahlt. Bitte mit Karte bezahlen, dann legen die Geschäfte los.', payfail:'Die Bezahlseite konnte nicht geöffnet werden. Bitte nochmal versuchen.', invoice:'Rechnung', paid:'Bezahlt', unpaid:'Noch nicht bezahlt', banktitle:'Per Überweisung bezahlen', bankhint:'Scanne den Code mit deiner Banking-App (z. B. Sparkasse), dann ist die Überweisung schon ausgefüllt. Oder kopiere die Daten.', holder:'Empfänger', amount:'Betrag', purpose:'Verwendungszweck', copied:'Kopiert', transferhint:'Nach dem Absenden siehst du die Bankverbindung.',
  coupon:'Gutscheincode', ordernote:'Anmerkung zur Bestellung', place:'Zahlungspflichtig bestellen', minorder:'Mindestbestellwert', zoneok:'Wir liefern zu dir', zonebad:'Für diese PLZ liefern wir derzeit nicht',
  track:'Bestellung verfolgen', myorders:'Meine Bestellungen', st_new:'Eingegangen', st_preparing:'In Zubereitung', st_ready:'Fertig', st_on_way:'Unterwegs', st_delivered:'Geliefert', st_picked_up:'Abgeholt', st_cancelled:'Storniert',
  showqr:'Zeige diesen Code bei der Abholung', driver:'Fahrer', rate:'Wie war', thanks:'Danke für deine Bewertung', receipt:'Beleg', print:'Drucken', staff:'Personal-Login',
  privacy:'Datenschutz', terms:'AGB', hours:'Öffnungszeiten', days:{mo:'Montag',di:'Dienstag',mi:'Mittwoch',do:'Donnerstag',fr:'Freitag',sa:'Samstag',so:'Sonntag'},
  closedday:'Geschlossen', sent:'Bestellung eingegangen', err:'Das hat nicht geklappt. Bitte erneut versuchen.', schedreq:'Ein Geschäft hat gerade geschlossen. Wähle eine spätere Uhrzeit, dann bereiten wir alles dafür vor.', paypalnote:'Nach dem Absenden öffnet sich PayPal zur Zahlung.', contact:'Kontakt',
  e_zone:'Für diese PLZ liefern wir nicht.', e_min:'Mindestbestellwert', e_coupon:'Gutscheincode ungültig.', e_coupon_min:'Gutschein gilt ab', e_stock:'Nicht genug vorrätig:', e_closed:'Geschäft geschlossen:', e_contact:'Bitte Name und Telefon angeben.', e_address:'Bitte vollständige Adresse angeben: Straße mit Hausnummer (z. B. Steintorweg 4), PLZ (5 Ziffern) und Ort.', e_product:'Ein Produkt ist nicht mehr verfügbar. Bitte Seite neu laden.',
  e_phone:'Telefonnummer ungültig.', e_payment:'Zahlungsart nicht verfügbar.', e_time:'Bitte eine Uhrzeit mindestens 15 Minuten später wählen.', e_option:'Bitte wählen:', e_cakedate:'Bitte ein Datum ab morgen wählen.', e_rate:'Zu viele Versuche. Bitte kurz warten.',
  e_email:'E-Mail ungültig.', e_exists:'Für diese E-Mail gibt es schon ein Konto. Bitte anmelden.', e_login:'E-Mail oder Passwort falsch.', e_session:'Sitzung abgelaufen. Bitte erneut anmelden.', e_password:'Das Passwort braucht mindestens 8 Zeichen.', e_agree:'Bitte AGB und Datenschutz akzeptieren.',
  items:'Artikel', estim:'ca.', comment:'Kommentar (optional)', send:'Senden', back:'Zurück', hero:'Fünf Geschäfte unter einem Dach. Eine Bestellung, eine Lieferung.',
  noresults:'Dazu haben wir nichts gefunden.', vatincl:'Alle Preise inkl. MwSt.', orderno:'Bestellnummer', light:'Heller Modus', dark:'Dunkler Modus', lang:'العربية', langs:'ع',
  login:'Anmelden', register:'Konto erstellen', password:'Passwort', newpass:'Neues Passwort', oldpass:'Aktuelles Passwort', logout:'Abmelden', save:'Speichern', saved:'Gespeichert',
  welcome:'Hallo', profile:'Meine Daten', address:'Lieferadresse', noorders:'Du hast noch nichts bestellt.', reorder:'Erneut bestellen', added:'Im Warenkorb', loginhint:'Melde dich an, um deine Adresse zu speichern und Bestellungen zu sehen.',
  orguest:'oder ohne Konto weiter', haveacc:'Schon ein Konto?', noacc:'Noch kein Konto?', changepass:'Passwort ändern', hx_t1:'Fünf Geschäfte', hx_t2:'unter einem Dach', hx_sub:'Supermarkt, Restaurant, Süßes, Metzgerei und Käse & Oliven. Bestell bei allen mit einer Bestellung, wir liefern alles in einer Fahrt.', hm_open:'{n} von {m} Geschäften haben jetzt geöffnet', hm_psg:'Die Passage', hm_psg2:'Geschäft wählen und loslegen', hm_feat:'Heute empfohlen', hm_how:'So bestellst du', hm_s1:'Aus jedem Geschäft wählen', hm_s1d:'Leg Produkte aus mehreren Geschäften in einen Warenkorb.', hm_s2:'Einmal bestellen', hm_s2d:'Eine Rechnung und eine Zahlung für alles.', hm_s3:'Liefern oder abholen', hm_s3d:'Wir bringen es zu dir, oder du holst es in der Passage ab.', hm_fee:'Lieferung ab', hm_nodeliv:'Nur Abholung im Geschäft.', hm_map:'In Karte öffnen', settings:'Einstellungen', st_look:'Sprache & Darstellung', st_lang:'Sprache', st_theme:'Farben', st_l:'Hell', st_d:'Dunkel', st_auto:'Automatisch', st_big:'Größere Schrift', st_big2:'Leichter zu lesen', st_calm:'Weniger Bewegung', st_calm2:'Schaltet Animationen ab', st_notify:'Mitteilungen', st_not:'Mitteilung bei Statusänderung', st_not2:'Solange die Bestellseite offen ist', st_vib:'Vibration', st_vib2:'Handy vibriert bei Mitteilungen', st_app:'App installieren', st_app2:'Lege die Seite wie eine App auf den Startbildschirm, sie öffnet dann schneller.', st_ios:'iPhone: In Safari unten auf „Teilen“ tippen, dann „Zum Home-Bildschirm“.', st_install:'Auf Startbildschirm installieren', st_inst2:'Im Browser-Menü (⋮) „Zum Startbildschirm hinzufügen“ wählen.', st_delacc:'Konto löschen', st_del2:'Dein Konto und deine persönlichen Daten werden gelöscht. Alte Rechnungen bleiben beim Geschäft gespeichert, weil das Gesetz es verlangt.', st_deleted:'Dein Konto wurde gelöscht.', st_data:'Daten auf diesem Gerät', st_data2:'Diese Daten liegen nur auf deinem Handy, damit das Bestellen schneller geht.', st_saved:'Gespeicherter Name und Adresse', st_recent:'Letzte Suchen', st_orders:'Meine Bestellungen auf diesem Gerät', st_clear:'Löschen', st_sure:'Sicher?', st_done:'Gelöscht', st_help:'Hilfe & Rechtliches', st_ver:'Version', st_nosupp:'Dieser Browser unterstützt keine Mitteilungen.', st_denied:'Mitteilungen sind blockiert. Bitte in den Browser-Einstellungen erlauben.', st_notok:'Fertig! Du bekommst eine Mitteilung.', paused:'Bestellungen sind gerade pausiert', pausedhint:'Wir sind gleich wieder da. Bitte später nochmal versuchen.', e_paused:'Bestellungen sind gerade pausiert. Bitte später nochmal versuchen.', needacc:'Bitte melde dich an oder erstelle ein Konto, um zu bestellen.', closednow:'Die Geschäfte haben gerade geschlossen. Bitte während der Öffnungszeiten bestellen.', e_locked:'Die Bestellung ist abgeschlossen oder unterwegs und kann nicht mehr geändert werden.', e_needcode:'Dafür brauchst du den Übergabe-Code vom Kunden.', e_badcode:'Code falsch.', proof:'Foto der Übergabe', eta_drive:'Ankunft in etwa', min:'Min.', eta_deliv:'Voraussichtliche Lieferung:', eta_pick:'Abholbereit voraussichtlich:', eta_sched:'Termin:', eta_soon:'Deine Bestellung ist gleich fertig.', code_d:'Übergabe-Code: nenne ihn dem Fahrer bei der Ankunft', code_p:'Abhol-Code: im Geschäft nennen oder QR-Code zeigen', posat:'Standort aktualisiert:', posnone:'Der Fahrer ist unterwegs. Sein Standort erscheint hier gleich.', forgot:'Passwort vergessen?', forgot_t:'Neues Passwort', forgot_p:'Gib die E-Mail deines Kontos ein. Wir schicken dir einen Link, mit dem du ein neues Passwort festlegst.', forgot_send:'Link senden', forgot_ok:'Wenn es ein Konto mit dieser E-Mail gibt, ist ein Link unterwegs. Schau ins Postfach (auch in den Spam-Ordner). Der Link gilt eine Stunde.', reset_t:'Neues Passwort festlegen', newpass2:'Passwort wiederholen', e_nomatch:'Die Passwörter stimmen nicht überein.', e_resetbad:'Der Link ist ungültig oder abgelaufen. Fordere einen neuen an.', reset_ok:'Passwort geändert.',
  recent:'Zuletzt gesucht', suggest:'Vorschläge', deliveryfrom:'Lieferung ab', pickuphere:'Abholung am Steintorweg 4', orderas:'Bestellung als', change:'Ändern', clear:'Löschen',
  hmin:'Min.', addcart:'Hinzufügen', options:'Optionen', orders:'Bestellungen', cancelnote:'Zum Stornieren bitte das Geschäft anrufen.', whatsapp:'WhatsApp', viewcart:'Warenkorb ansehen'
 }
};
const ALLERGENS = {
 gluten:['غلوتين','Gluten'], crust:['قشريات','Krebstiere'], eggs:['بيض','Eier'], fish:['سمك','Fisch'], peanut:['فول سوداني','Erdnüsse'], soy:['صويا','Soja'],
 milk:['حليب ولاكتوز','Milch/Laktose'], nuts:['مكسرات','Schalenfrüchte'], celery:['كرفس','Sellerie'], mustard:['خردل','Senf'], sesame:['سمسم','Sesam'],
 sulph:['كبريتات','Sulfite'], lupin:['ترمس','Lupinen'], mollusc:['رخويات','Weichtiere']
};
const DAYS = ['so','mo','di','mi','do','fr','sa'];

const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
const S = { lang: ls.get('so_lang2', 'ar'), shops: [], cats: [], products: [], settings: {}, ratings: {}, cart: ls.get('so_cart', []), staff: null, cust: null, ctoken: ls.get('so_ct', null), loaded: false };
if (!Array.isArray(S.cart)) S.cart = [];
/* device preferences: theme, text size, motion */
function applyPrefs() {
  const th = ls.get('so_theme', ls.get('so_dark', false) ? 'dark' : 'light');
  const dark = th === 'dark' || (th === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  document.body.classList.toggle('dark', !!dark);
  document.documentElement.classList.toggle('bigtext', ls.get('so_big', false));
  document.documentElement.classList.toggle('calm', ls.get('so_calm', false));
}
applyPrefs();
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyPrefs); } catch (_) {}
let installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });

const t = k => (T[S.lang][k] !== undefined ? T[S.lang][k] : (T.de[k] !== undefined ? T.de[k] : k));
const L = (o, f) => o ? (o[f + '_' + S.lang] || o[f + '_' + (S.lang === 'ar' ? 'de' : 'ar')] || '') : '';
const LL = (ar, de) => S.lang === 'ar' ? (ar || de || '') : (de || ar || '');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const safeUrl = u => /^https:\/\//i.test(String(u || '')) ? String(u).replace(/["'()\\\s]/g, encodeURIComponent) : '';
const bgImg = u => safeUrl(u) ? `background-image:url('${safeUrl(u)}')` : '';
const money = n => '‎' + (Math.round((+n || 0) * 100) / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €‎';
const fq = (q, unit) => '‎' + (unit === 'kg' ? ((+q >= 1 ? (+q).toLocaleString('de-DE', { maximumFractionDigits: 3 }) + ' kg' : Math.round(+q * 1000) + ' g')) : (+q).toLocaleString('de-DE', { maximumFractionDigits: 0 }) + '×') + '‎';
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const uid = () => Math.random().toString(36).slice(2, 10);
const fmtDate = d => new Date(d).toLocaleString(S.lang === 'ar' ? 'ar-EG-u-nu-latn' : 'de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' });
const waNum = n => String(n || '').replace(/\D/g, '').replace(/^00/, '').replace(/^0/, '49');
const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‪-‮⁦-⁩]/g;
const clean = (v, max) => String(v || '').replace(CTRL, '').trim().slice(0, max || 200);

/* simple client-side throttle (the server has its own limits) */
const _hits = {};
function allow(kind, max, sec) { const now = Date.now(); const l = (_hits[kind] || []).filter(x => now - x < sec * 1000); if (l.length >= max) { toast(t('e_rate'), 1); return false; } l.push(now); _hits[kind] = l; return true; }

function toast(msg, err) {
  const el = $('#toast'); el.innerHTML = `<span>${esc(msg)}</span><button type="button" aria-label="OK">${ic('x', 's')}</button>`; el.className = 'toast' + (err ? ' err' : ''); el.hidden = false;
  $('button', el).onclick = () => { el.hidden = true; };
  clearTimeout(toast._t); toast._t = setTimeout(() => el.hidden = true, err ? 4500 : 2400);
}
function modal(html, onMount) {
  const m = $('#modal'); m.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">' + html + '</div>'; m.hidden = false;
  m.onclick = e => { if (e.target === m) closeModal(); };
  $$('[data-close]', m).forEach(b => b.onclick = closeModal);
  document.addEventListener('keydown', modal._esc = e => { if (e.key === 'Escape') closeModal(); }, { once: true });
  if (onMount) onMount(m.firstChild);
  return m.firstChild;
}
function closeModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; if (closeModal.cb) { const c = closeModal.cb; closeModal.cb = null; c(); } }
function errMsg(e) {
  const m = (e && (e.message || e.error_description || e)) + '';
  const k = m.split(':')[0].trim();
  const rest = m.includes(':') ? m.slice(m.indexOf(':') + 1).trim() : '';
  const map = { zone:'e_zone', min:'e_min', coupon:'e_coupon', coupon_min:'e_coupon_min', stock:'e_stock', closed:'e_closed', contact:'e_contact', address:'e_address', product:'e_product',
    phone:'e_phone', payment:'e_payment', time:'e_time', option:'e_option', cakedate:'e_cakedate', rate_limited:'e_rate', email:'e_email', exists:'e_exists', login:'e_login', session:'e_session', password:'e_password', resetbad:'e_resetbad', paused:'e_paused', needaccount:'needacc', locked:'e_locked', needcode:'e_needcode', badcode:'e_badcode' };
  if (map[k]) return t(map[k]) + (rest ? ' ' + (k === 'min' || k === 'coupon_min' ? money(rest) : rest) : '');
  if (/fetch|network/i.test(m)) return S.lang === 'ar' ? 'ما في اتصال بالإنترنت.' : 'Keine Internetverbindung.';
  return t('err');
}

/* ---------- time / opening ---------- */
function berlinNow() {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  const wd = { Sun:'so', Mon:'mo', Tue:'di', Wed:'mi', Thu:'do', Fri:'fr', Sat:'sa' }[p.find(x => x.type === 'weekday').value];
  const hh = +p.find(x => x.type === 'hour').value % 24, mm = +p.find(x => x.type === 'minute').value;
  return { day: wd, min: hh * 60 + mm };
}
const ranges = v => String(v || '').split(',').map(r => r.trim().match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/)).filter(Boolean).map(m => [+m[1] * 60 + +m[2], +m[3] * 60 + +m[4], m]);
function isOpenNow(shop) {
  if (!shop || !shop.is_open || !shop.active) return false;
  const h = shop.hours || {}; if (!Object.keys(h).some(k => h[k])) return true;
  const n = berlinNow();
  return ranges(h[n.day]).some(([a, b]) => b > a ? (n.min >= a && n.min < b) : (n.min >= a || n.min < b));
}
function openLabel(shop) {
  const h = shop.hours || {}; const n = berlinNow();
  if (isOpenNow(shop)) { const r = ranges(h[n.day]).find(([a, b]) => n.min >= a && n.min < b); return { on: true, txt: t('open') + (r ? ' · ' + t('closesat') + ' ' + r[2][3].padStart(2, '0') + ':' + r[2][4] : '') }; }
  if (!shop.is_open) return { on: false, txt: t('closed') };
  const later = ranges(h[n.day]).find(([a]) => a > n.min);
  if (later) return { on: false, txt: t('opensat') + ' ' + later[2][1].padStart(2, '0') + ':' + later[2][2] };
  for (let i = 1; i < 7; i++) { const d = DAYS[(DAYS.indexOf(n.day) + i) % 7]; const r = ranges(h[d])[0]; if (r) return { on: false, txt: t('opensat') + ' ' + t('days')[d] + ' ' + r[2][1].padStart(2, '0') + ':' + r[2][2] }; }
  return { on: false, txt: t('closed') };
}

/* ---------- data ---------- */
async function loadData() {
  const [sh, ca, pr, se, ra] = await Promise.all([
    sb.from('shops').select('*').order('sort'),
    sb.from('categories').select('*').order('sort'),
    fetchAll('products', 'id,shop_id,category_id,name_ar,name_de,desc_ar,desc_de,price,unit,step,min_qty,barcode,image_url,track_stock,stock,min_stock,expiry,allergens,halal,cooled,pfand,vat,kind,options,featured,active,sort,demo'),
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
const shopCover = sh => sh.image_url || ((visibleProducts(sh.id).find(p => p.featured && p.image_url) || visibleProducts(sh.id).find(p => p.image_url) || {}).image_url) || '';

/* ---------- customer session ---------- */
async function loadCustomer() {
  if (!S.ctoken) { S.cust = null; return null; }
  const { data, error } = await sb.rpc('customer_me', { p_token: S.ctoken });
  if (error) { S.cust = null; if (/session/.test(error.message)) { S.ctoken = null; ls.set('so_ct', null); } return null; }
  S.cust = data; return data;
}
function setCustToken(tok) { S.ctoken = tok; ls.set('so_ct', tok); }

/* ---------- cart ---------- */
function saveCart() { ls.set('so_cart', S.cart); }
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
  (ci.options || []).forEach(g => { const grp = (p.options || [])[g.g]; if (grp) g.c.forEach(c => { const ch = grp.choices[c]; if (ch) parts.push(LL(ch.ar, ch.de)); }); });
  (ci.basket || []).forEach(b => { const bp = prodById(b.product_id); if (bp) parts.push(L(bp, 'name') + ' ' + fq(b.qty, bp.unit)); });
  if (ci.cake) { if (ci.cake.date) parts.push(ci.cake.date); if (ci.cake.text) parts.push('«' + ci.cake.text + '»'); }
  if (ci.note) parts.push(ci.note);
  return parts.join(' · ');
}
function quickAdd(p) {
  const q = p.unit === 'kg' ? Math.max(+p.min_qty || 0.25, +p.step || 0.25) : 1;
  const ex = S.cart.find(c => c.product_id === p.id && !(c.options || []).length && !c.note && !c.basket && !c.cake);
  if (ex) { if (!p.track_stock || ex.qty + q <= +p.stock) ex.qty = Math.round((ex.qty + q) * 1000) / 1000; }
  else S.cart.push({ product_id: p.id, qty: q, options: [], k: uid() });
  saveCart(); toast(t('added') + ': ' + L(p, 'name')); refreshCounts();
}
const needsSheet = p => (p.options || []).length || p.kind !== 'normal';

/* ---------- layout ---------- */
function setLang(l) {
  S.lang = l; ls.set('so_lang2', l);
  document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.style.setProperty('--sx', l === 'ar' ? '40px' : '-40px');
}
function header() {
  const n = cartTotals().n;
  return `<header class="top glass noprint" id="top"><div class="in">
   <button class="ib" id="menuBtn" aria-label="Menü">${ic('menu')}</button>
   <a href="#/" aria-label="Start"><img class="logo l-on-dark" src="logo.png" alt="بيت كرم – Stein & Olive"><img class="logo l-on-lite" src="logo-dark.png" alt="" aria-hidden="true"></a>
   <div class="hsearch"><div class="sbox">${ic('search')}<input type="search" id="hq" placeholder="${esc(t('searchph'))}" autocomplete="off" readonly></div></div>
   <div class="sp"></div>
   <button class="ib msearch" id="msBtn" aria-label="${esc(t('search'))}">${ic('search')}</button>
   <button class="ib" id="langBtn" aria-label="${esc(t('lang'))}">${esc(t('langs'))}</button>
   <a class="ib" href="#/cart" aria-label="${esc(t('cart'))}">${ic('bag')}<span class="cnt" id="hcnt" ${n ? '' : 'hidden'}>${n}</span></a>
  </div></header>`;
}
function topTone() {
  const tp = $('#top'); if (!tp) return;
  const band = $('#main > .hero:first-child, #main > .shead:first-child');
  tp.classList.toggle('lite', !(band && band.getBoundingClientRect().bottom > 78));
}
window.addEventListener('scroll', () => { if (!topTone.f) { topTone.f = 1; requestAnimationFrame(() => { topTone.f = 0; topTone(); }); } }, { passive: true });
function tabbar(active) {
  const n = cartTotals().n;
  const it = (h, i, k, a) => `<a href="${h}" class="${active === a ? 'on' : ''}">${ic(i)}<span>${esc(t(k))}</span>${a === 'cart' ? `<span class="cnt" id="tcnt" ${n ? '' : 'hidden'}>${n}</span>` : ''}</a>`;
  return `<nav class="tabbar noprint" aria-label="Navigation">${it('#/', 'home', 'home', 'home')}<a href="#/" data-search>${ic('search')}<span>${esc(t('search'))}</span></a>${it('#/cart', 'bag', 'cart', 'cart')}${it('#/account', 'user', 'account', 'account')}</nav>`;
}
function refreshCounts() { const n = cartTotals().n; ['#hcnt', '#tcnt'].forEach(id => { const el = $(id); if (el) { const up = +el.textContent < n; el.textContent = n; el.hidden = !n; if (up) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); } } }); const cb = $('#cbar'); if (cb) cb.outerHTML = cartBar(); }
function footer() {
  const s = S.settings;
  return `<footer class="foot noprint"><div class="in">
   <div><img src="logo.png" alt="Stein & Olive"><p style="margin:10px 0 0">${esc(s.address || 'Steintorweg 4, 20099 Hamburg')}</p>${s.phone ? `<a href="tel:${esc(s.phone)}">${esc(s.phone)}</a>` : ''}</div>
   <div><h4>${esc(t('shops'))}</h4>${visibleShops().map(sh => `<a href="#/shop/${encodeURIComponent(sh.id)}">${esc(L(sh, 'name'))}</a>`).join('')}</div>
   <div><h4>${esc(t('contact'))}</h4>${s.whatsapp ? `<a href="https://wa.me/${esc(waNum(s.whatsapp))}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : ''}${safeUrl(s.instagram) ? `<a href="${esc(safeUrl(s.instagram))}" target="_blank" rel="noopener noreferrer">Instagram</a>` : ''}${s.email ? `<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>` : ''}
    <a href="#/impressum">Impressum</a><a href="#/datenschutz">${esc(t('privacy'))}</a><a href="#/agb">${esc(t('terms'))}</a></div>
  </div><div class="cp">© ${new Date().getFullYear()} ${esc(s.name || 'Stein & Olive by Karam')}. ${esc(t('vatincl'))}</div></footer>`;
}
function cartBar() {
  const c = cartTotals(); const h = location.hash;
  if (!c.n || /cart|checkout|track|account/.test(h)) return '<div id="cbar"></div>';
  return `<div class="cbar noprint" id="cbar"><a class="btn" href="#/cart"><span>${esc(t('viewcart'))} · ${c.n}</span><span>${money(c.sub + c.pf)}</span></a></div>`;
}
function page(inner, opt) {
  opt = opt || {};
  document.body.classList.remove('staff', 'tvmode');
  const enter = page.nav; page.nav = false;
  $('#app').innerHTML = header() + `<main class="wrap gl${enter ? ' enter' : ''}" id="main">${inner}</main>` + footer() + (opt.noBar ? '' : cartBar()) + tabbar(opt.tab);
  topTone();
  $('#langBtn').onclick = () => { setLang(S.lang === 'ar' ? 'de' : 'ar'); route(); };
  $('#menuBtn').onclick = drawer;
  $('#msBtn').onclick = () => searchSheet();
  $('#hq').onfocus = $('#hq').onclick = () => searchSheet();
  $$('[data-search]').forEach(a => a.onclick = e => { e.preventDefault(); searchSheet(); });
}
function drawer() {
  const d = document.createElement('div'); d.className = 'drawer';
  const dark = document.body.classList.contains('dark');
  d.innerHTML = `<div class="pn"><div class="who"><img src="logo.png" alt=""></div>
   <a href="#/">${ic('home')} ${esc(t('home'))}</a>
   ${visibleShops().map(s => `<a href="#/shop/${encodeURIComponent(s.id)}">${shopIc(s.type)} ${esc(L(s, 'name'))}</a>`).join('')}
   <hr><a href="#/cart">${ic('bag')} ${esc(t('cart'))}</a><a href="#/account">${ic('user')} ${esc(t('account'))}</a><a href="#/settings">${ic('settings')} ${esc(t('settings'))}</a>
   <button class="m" id="dTheme">${dark ? ic('sun') + ' ' + esc(t('light')) : ic('moon') + ' ' + esc(t('dark'))}</button>
</div>`;
  d.onclick = e => { if (e.target === d || e.target.closest('a')) d.remove(); };
  document.body.appendChild(d);
  $('#dTheme', d).onclick = () => { ls.set('so_theme', document.body.classList.contains('dark') ? 'light' : 'dark'); applyPrefs(); d.remove(); };
}

/* ---------- product card ---------- */
function priceLabel(p) { return money(p.price) + (p.unit === 'kg' ? ` <small>${t('perkg')}</small>` : ''); }
function priceText(p) { return money(p.price) + (p.unit === 'kg' ? ' ' + t('perkg') : ''); }
function prodCard(p) {
  const off = soldOut(p); const sh = shopById(p.shop_id) || {};
  return `<div class="pc${off ? ' off' : ''}" data-p="${esc(p.id)}" role="button" tabindex="0" aria-label="${esc(L(p, 'name'))}">
   <div class="im" style="${bgImg(p.image_url)}">${p.image_url ? '' : shopIc(sh.type)}</div>
   <div class="tags">${off ? `<span class="tag x">${esc(t('outstock'))}</span>` : ''}${p.halal ? `<span class="tag h">${esc(t('halal'))}</span>` : ''}${p.cooled ? `<span class="tag c">${ic('snow', 's')}</span>` : ''}</div>
   <button class="qa" data-qa="${esc(p.id)}" aria-label="${esc(t('addcart'))}">${ic('plus')}</button>
   <div class="bd"><div class="nm">${esc(L(p, 'name'))}</div><div class="pr">${priceLabel(p)}</div></div></div>`;
}
function bindCards(root) {
  $$('.pc[data-p]', root).forEach(el => { el.onclick = () => productSheet(el.dataset.p); el.onkeydown = e => { if (e.key === 'Enter') productSheet(el.dataset.p); }; });
  $$('[data-qa]', root).forEach(b => b.onclick = e => { e.stopPropagation(); const p = prodById(b.dataset.qa); if (!p) return; if (needsSheet(p)) productSheet(p.id); else quickAdd(p); });
}

/* ---------- product sheet ---------- */
function productSheet(pid, editIdx) {
  const p = prodById(pid); if (!p) return;
  const sh = shopById(p.shop_id);
  const ex = editIdx != null ? S.cart[editIdx] : null;
  const step = p.unit === 'kg' ? (+p.step || 0.25) : 1;
  const minq = p.unit === 'kg' ? (+p.min_qty || step) : Math.max(1, +p.min_qty || 1);
  const st = { qty: ex ? ex.qty : (p.unit === 'kg' ? Math.max(minq, step) : minq), opts: {}, basket: {}, note: ex ? ex.note || '' : '', cake: ex && ex.cake ? Object.assign({}, ex.cake) : { date: '', text: '' } };
  (p.options || []).forEach((g, gi) => { st.opts[gi] = []; });
  if (ex) { (ex.options || []).forEach(g => st.opts[g.g] = g.c.slice()); (ex.basket || []).forEach(b => st.basket[b.product_id] = b.qty); }
  else (p.options || []).forEach((g, gi) => { if (g.required && !g.multi && g.choices.length) st.opts[gi] = [0]; });
  const algs = (p.allergens || []).map(a => `<span class="pill warn">${esc((ALLERGENS[a] || [a, a])[S.lang === 'ar' ? 0 : 1])}</span>`).join('');
  const basketItems = p.kind === 'basket' ? visibleProducts(p.shop_id).filter(x => x.kind !== 'basket' && x.id !== p.id && !soldOut(x)) : [];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const showWeight = p.unit === 'kg' && ['butcher', 'deli', 'sweets'].includes(sh.type);
  const html = `<button class="ib x" data-close aria-label="${esc(t('back'))}">${ic('x')}</button>
   ${safeUrl(p.image_url) ? `<img class="pim" src="${esc(safeUrl(p.image_url))}" alt="">` : ''}
   <div class="note">${esc(L(sh, 'name'))}</div>
   <h3>${esc(L(p, 'name'))}</h3>
   ${L(p, 'desc') ? `<p style="margin:4px 0 8px;color:var(--ink2)">${esc(L(p, 'desc'))}</p>` : ''}
   <div class="acts" style="margin:6px 0"><span class="price-l">${priceLabel(p)}</span>${+p.pfand ? `<span class="note">+ ${money(p.pfand)} Pfand</span>` : ''}
    ${p.halal ? `<span class="pill ok">${ic('check', 's')} ${esc(t('halal'))}</span>` : ''}${p.cooled ? `<span class="pill">${ic('snow', 's')} ${esc(t('cooled'))}</span>` : ''}</div>
   <div class="note" style="margin-top:10px">${esc(t('allergens'))}</div><div class="algs">${algs || `<span class="note">${esc(t('noallerg'))}</span>`}</div>
   ${showWeight ? `<div class="infobox">${ic('scale', 's')}<span>${esc(t('byweight'))}</span></div>` : ''}
   ${(p.options || []).map((g, gi) => `<div class="grp"><h4><span>${esc(LL(g.name_ar, g.name_de))}</span>${g.required ? `<span class="pill">${esc(t('required'))}</span>` : ''}</h4>
     ${g.choices.map((c, ci) => `<label class="opt"><input type="${g.multi ? 'checkbox' : 'radio'}" name="g${gi}" data-g="${gi}" value="${ci}" ${st.opts[gi].includes(ci) ? 'checked' : ''}><span>${esc(LL(c.ar, c.de))}</span>${+c.price ? `<small>+${money(c.price)}</small>` : ''}</label>`).join('')}</div>`).join('')}
   ${p.kind === 'cake' ? `<div class="grp"><label class="f" style="margin-top:0"><span>${esc(t('cakedate'))}</span><input type="date" id="ckD" min="${tomorrow}" value="${esc(st.cake.date)}"></label>
     <label class="f" style="margin-bottom:0"><span>${esc(t('caketext'))}</span><input type="text" id="ckT" maxlength="80" value="${esc(st.cake.text)}"></label></div>` : ''}
   ${p.kind === 'basket' ? `<div class="grp"><h4>${esc(t('basket'))}</h4>${basketItems.map(b => `<div class="li"><div class="thumb" style="${bgImg(b.image_url)}"></div><div class="t">${esc(L(b, 'name'))}<small>${priceText(b)}</small></div>
      <div class="step sm"><button data-bm="${esc(b.id)}" aria-label="-">${ic('minus', 's')}</button><span id="bq_${esc(b.id)}">${st.basket[b.id] ? fq(st.basket[b.id], b.unit) : '0'}</span><button data-bp="${esc(b.id)}" aria-label="+">${ic('plus', 's')}</button></div></div>`).join('') || `<div class="note">–</div>`}</div>` : ''}
   <label class="f"><span>${esc(t('note'))}</span><input type="text" id="pNote" maxlength="150" placeholder="${esc(t('notep'))}" value="${esc(st.note)}"></label>
   <div class="acts" style="justify-content:space-between;margin-top:16px;flex-wrap:nowrap">
    <div class="step"><button id="qM" aria-label="-">${ic('minus')}</button><span id="qV"></span><button id="qP" aria-label="+">${ic('plus')}</button></div>
    <button class="btn" id="addB" style="flex:1" ${soldOut(p) ? 'disabled' : ''}></button></div>`;
  const root = modal(html);
  const calc = () => {
    const ci = { product_id: p.id, qty: st.qty, options: Object.keys(st.opts).map(g => ({ g: +g, c: st.opts[g] })).filter(o => o.c.length), basket: Object.keys(st.basket).filter(k => st.basket[k] > 0).map(k => ({ product_id: k, qty: st.basket[k] })) };
    $('#qV', root).textContent = fq(st.qty, p.unit);
    $('#addB', root).textContent = soldOut(p) ? t('outstock') : (ex ? t('save') : t('add')) + ' · ' + (p.unit === 'kg' ? t('estim') + ' ' : '') + money(itemPrice(ci)).trim();
    return ci;
  };
  $('#qM', root).onclick = () => { st.qty = Math.max(minq, Math.round((st.qty - step) * 1000) / 1000); calc(); };
  $('#qP', root).onclick = () => { const mx = p.track_stock ? +p.stock : 200; const nq = Math.round((st.qty + step) * 1000) / 1000; if (nq <= mx) st.qty = nq; calc(); };
  $$('input[data-g]', root).forEach(inp => inp.onchange = () => {
    const gi = +inp.dataset.g; const g = p.options[gi];
    st.opts[gi] = g.multi ? $$(`input[data-g="${gi}"]:checked`, root).map(i => +i.value) : [+inp.value];
    calc();
  });
  $$('[data-bp],[data-bm]', root).forEach(b => b.onclick = () => {
    const id = b.dataset.bp || b.dataset.bm; const bp = prodById(id); const s = bp.unit === 'kg' ? (+bp.step || 0.25) : 1;
    st.basket[id] = Math.max(0, Math.round(((st.basket[id] || 0) + (b.dataset.bp ? s : -s)) * 1000) / 1000);
    $('#bq_' + CSS.escape(id), root).textContent = st.basket[id] ? fq(st.basket[id], bp.unit) : '0'; calc();
  });
  calc();
  $('#addB', root).onclick = () => {
    const ci = calc();
    for (let gi = 0; gi < (p.options || []).length; gi++) if (p.options[gi].required && !st.opts[gi].length) { toast(t('e_option') + ' ' + LL(p.options[gi].name_ar, p.options[gi].name_de), 1); return; }
    if (p.kind === 'cake') { st.cake.date = $('#ckD', root).value; st.cake.text = clean($('#ckT', root).value, 80); if (!st.cake.date || st.cake.date < tomorrow) { toast(t('e_cakedate'), 1); return; } ci.cake = st.cake; }
    if (p.kind === 'basket' && !ci.basket.length) { toast(t('basketmin'), 1); return; }
    ci.note = clean($('#pNote', root).value, 150); ci.k = ex ? ex.k : uid();
    if (ex) S.cart[editIdx] = ci; else S.cart.push(ci);
    saveCart(); closeModal(); toast(t('added') + ': ' + L(p, 'name'));
    if (/cart/.test(location.hash)) route(); else refreshCounts();
  };
}

/* ---------- search sheet ---------- */
function searchSheet(initial) {
  if ($('.ssheet')) return;
  const el = document.createElement('div'); el.className = 'ssheet';
  el.innerHTML = `<div class="hd"><button class="ib" id="ssX" aria-label="${esc(t('back'))}">${ic(S.lang === 'ar' ? 'fwd' : 'back')}</button><div class="sbox">${ic('search')}<input type="search" id="ssQ" placeholder="${esc(t('searchph'))}" autocomplete="off" enterkeyhint="search"></div></div><div class="bd" id="ssB"></div>`;
  document.body.appendChild(el); document.body.style.overflow = 'hidden';
  const close = () => { el.remove(); document.body.style.overflow = ''; };
  $('#ssX', el).onclick = close;
  document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', k); } });
  const q = $('#ssQ', el); const body = $('#ssB', el);
  const norm = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[ً-ٰٟ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[̀-ͯ]/g, '');
  const mark = (txt, v) => { const i = norm(txt).indexOf(v); if (i < 0 || !v) return esc(txt); return esc(txt.slice(0, i)) + '<mark class="hl">' + esc(txt.slice(i, i + v.length)) + '</mark>' + esc(txt.slice(i + v.length)); };
  const draw = () => {
    const v = norm(q.value.trim());
    if (v.length < 1) {
      const rec = ls.get('so_recent', []);
      const pop = visibleProducts().filter(p => p.featured).slice(0, 8);
      body.innerHTML = (rec.length ? `<div class="sgrp">${esc(t('recent'))} <button class="btn s o" id="ssC" style="min-height:28px;padding:2px 10px;margin-inline-start:8px">${esc(t('clear'))}</button></div><div class="acts">${rec.map(r => `<button class="chip" data-rq="${esc(r)}">${esc(r)}</button>`).join('')}</div>` : '')
        + `<div class="sgrp">${esc(t('shops'))}</div><div class="acts">${visibleShops().map(s => `<a class="chip" href="#/shop/${encodeURIComponent(s.id)}" data-go>${esc(L(s, 'name'))}</a>`).join('')}</div>`
        + (pop.length ? `<div class="sgrp">${esc(t('popular'))}</div>` + pop.map(p => `<button class="srow" data-sp="${esc(p.id)}"><div class="thumb" style="${bgImg(p.image_url)}"></div><b>${esc(L(p, 'name'))}</b><span class="p">${priceText(p)}</span></button>`).join('') : '');
      if ($('#ssC', body)) $('#ssC', body).onclick = () => { ls.set('so_recent', []); draw(); };
    } else {
      const shops = visibleShops().filter(s => norm(s.name_ar + ' ' + s.name_de + ' ' + s.desc_ar + ' ' + s.desc_de).includes(v));
      const res = visibleProducts().filter(p => norm(p.name_ar + ' ' + p.name_de + ' ' + p.desc_ar + ' ' + p.desc_de + ' ' + (p.barcode || '') + ' ' + ((S.cats.find(c => c.id === p.category_id) || {}).name_ar || '') + ' ' + ((S.cats.find(c => c.id === p.category_id) || {}).name_de || '')).includes(v));
      const byShop = {}; res.forEach(p => (byShop[p.shop_id] = byShop[p.shop_id] || []).push(p));
      body.innerHTML = (shops.length ? `<div class="sgrp">${esc(t('shops'))}</div>` + shops.map(s => `<a class="srow" href="#/shop/${encodeURIComponent(s.id)}" data-go style="color:inherit;text-decoration:none"><div class="thumb" style="${bgImg(shopCover(s))}">${shopCover(s) ? '' : shopIc(s.type)}</div><b>${mark(L(s, 'name'), v)}</b></a>`).join('') : '')
        + Object.keys(byShop).map(sid => `<div class="sgrp">${esc(L(shopById(sid), 'name'))}</div>` + byShop[sid].slice(0, 30).map(p => `<button class="srow" data-sp="${esc(p.id)}"><div class="thumb" style="${bgImg(p.image_url)}"></div><div><b>${mark(L(p, 'name'), v)}</b>${soldOut(p) ? `<div class="note">${esc(t('outstock'))}</div>` : ''}</div><span class="p">${priceText(p)}</span></button>`).join('')).join('')
        || `<div class="empty">${ic('search')}<p>${esc(t('noresults'))}</p></div>`;
    }
    $$('[data-rq]', body).forEach(b => b.onclick = () => { q.value = b.dataset.rq; draw(); });
    $$('[data-go]', body).forEach(a => a.addEventListener('click', close));
    $$('[data-sp]', body).forEach(b => b.onclick = () => { remember(); productSheet(b.dataset.sp); });
  };
  const remember = () => { const v = clean(q.value, 40); if (v.length < 2) return; const r = ls.get('so_recent', []).filter(x => x !== v); r.unshift(v); ls.set('so_recent', r.slice(0, 8)); };
  q.oninput = draw; q.onkeydown = e => { if (e.key === 'Enter') { remember(); q.blur(); } };
  if (initial) q.value = initial;
  draw(); setTimeout(() => q.focus(), 60);
}

/* ---------- views: customer ---------- */
const ARCH_SVG = '<svg class="hx-arc" viewBox="0 0 1000 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.4">' + [0, 1, 2, 3, 4].map(i => { const x = 20 + i * 196; return `<path d="M${x} 220V110a78 78 0 0 1 156 0v110"/><path d="M${x + 18} 220V114a60 60 0 0 1 120 0v106" opacity=".55"/>`; }).join('') + '<path d="M0 219.3h1000"/></g></svg>';
function vHome() {
  const s = S.settings;
  const ann = LL(s.announce_ar, s.announce_de);
  const fees = (s.zones || []).map(z => +z.fee).filter(x => !isNaN(x));
  const mins = (s.zones || []).map(z => +z.min).filter(x => !isNaN(x));
  const shops = visibleShops();
  const openN = shops.filter(isOpenNow).length;
  const arches = shops.map(sh => { const o = openLabel(sh); const r = S.ratings[sh.id]; const cv = shopCover(sh);
    return `<a class="arch" href="#/shop/${encodeURIComponent(sh.id)}"><div class="arch-door"><div class="arch-ph" style="${bgImg(cv)}">${cv ? '' : shopIc(sh.type)}</div></div>
      <div class="arch-bd"><h3>${esc(L(sh, 'name'))}</h3><p>${esc(L(sh, 'desc'))}</p>
      <div class="arch-meta"><span class="dot ${o.on ? 'on' : ''}"></span><span>${esc(o.on ? t('open') : o.txt)}</span>${r ? `<span class="rt">${ic('star', 's')} ${r.avg}</span>` : ''}</div></div></a>`; }).join('');
  const all = shops.flatMap(sh => visibleProducts(sh.id).filter(p => !soldOut(p)));
  const feat = all.filter(p => p.featured && p.image_url).slice(0, 5);
  const hero = feat[0];
  const featHtml = hero ? `<section class="hm-feat"><div class="hm-h"><h2>${esc(t('hm_feat'))}</h2></div>
     <div class="feat-grid"><div class="feat-big" data-p="${esc(hero.id)}" role="button" tabindex="0"><div class="feat-im" style="${bgImg(hero.image_url)}"></div>
       <div class="feat-cap"><span class="feat-shop">${esc(L(shopById(hero.shop_id) || {}, 'name'))}</span><h3>${esc(L(hero, 'name'))}</h3><div class="feat-row"><b>${priceLabel(hero)}</b><button class="btn s" data-qa="${esc(hero.id)}">${ic('plus', 's')} ${esc(t('addcart'))}</button></div></div></div>
       <div class="feat-list">${feat.slice(1).map(p => `<div class="frow" data-p="${esc(p.id)}" role="button" tabindex="0"><div class="thumb" style="${bgImg(p.image_url)}"></div><div class="t"><b>${esc(L(p, 'name'))}</b><small>${esc(L(shopById(p.shop_id) || {}, 'name'))}</small></div><span class="pr">${priceLabel(p)}</span><button class="qa2" data-qa="${esc(p.id)}" aria-label="${esc(t('addcart'))}">${ic('plus', 's')}</button></div>`).join('')}</div></div></section>` : '';
  const rails = shops.map(sh => { const ps = visibleProducts(sh.id).filter(p => !soldOut(p)); const list = ps.filter(p => p.featured).concat(ps.filter(p => !p.featured)).slice(0, 8); if (!list.length) return '';
    const o = openLabel(sh);
    return `<section class="hm-rail"><div class="hm-h"><a class="hm-shop" href="#/shop/${encodeURIComponent(sh.id)}"><span class="mini-arch">${shopIc(sh.type, 's')}</span><span><h2>${esc(L(sh, 'name'))}</h2><small><span class="dot ${o.on ? 'on' : ''}"></span> ${esc(o.txt)}</small></span></a><a class="more" href="#/shop/${encodeURIComponent(sh.id)}">${esc(t('seeall'))} ${ic(S.lang === 'ar' ? 'back' : 'fwd', 's')}</a></div><div class="rail">${list.map(prodCard).join('')}</div></section>`; }).join('');
  const steps = [['store', t('hm_s1'), t('hm_s1d')], ['bag', t('hm_s2'), t('hm_s2d')], ['truck', t('hm_s3'), t('hm_s3d')]];
  const artImgs = (feat.length >= 3 ? feat : all.filter(p => p.image_url)).slice(0, 3).map(p => p.image_url);
  page(`<section class="hx">${ARCH_SVG}${artImgs.length === 3 ? `<div class="hx-art" aria-hidden="true">${artImgs.map((u, i) => `<span class="hx-w w${i}"><i style="${bgImg(u)}"></i></span>`).join('')}</div>` : ''}<div class="hx-in">
      <p class="hx-kick">${esc(s.address || 'Steintorweg 4, 20099 Hamburg')}</p>
      <h1>${esc(t('hx_t1'))}<br><span>${esc(t('hx_t2'))}</span></h1>
      <p class="hx-sub">${esc(t('hx_sub'))}</p>
      <div class="sbox hx-search">${ic('search')}<input type="search" id="heroQ" placeholder="${esc(t('searchph'))}" autocomplete="off" readonly></div>
      <div class="hx-facts">${s.delivery !== false && fees.length ? `<span>${ic('truck', 's')} ${esc(t('deliveryfrom'))} ${money(Math.min(...fees))}</span>` : ''}${s.pickup !== false ? `<span>${ic('store', 's')} ${esc(t('pickuphere'))}</span>` : ''}<span><i class="dot ${openN ? 'on' : ''}"></i> ${esc(openN ? t('hm_open').replace('{n}', openN).replace('{m}', shops.length) : t('closed'))}</span></div>
    </div></section>
   ${s.orders_paused ? `<div class="ann warn">${ic('clock', 's')} ${esc(LL(s.pause_ar, s.pause_de) || t('paused'))}</div>` : ann ? `<div class="ann">${esc(ann)}</div>` : ''}
   <section class="hm-psg"><div class="hm-h"><h2>${esc(t('hm_psg'))}</h2><small>${esc(t('hm_psg2'))}</small></div><div class="arches">${arches}</div></section>
   ${featHtml}
   ${rails}
   <section class="hm-how"><div class="hm-h"><h2>${esc(t('hm_how'))}</h2></div><ol class="how">${steps.map(x => `<li><span class="how-ic">${ic(x[0])}</span><b>${esc(x[1])}</b><p>${esc(x[2])}</p></li>`).join('')}</ol></section>
   <section class="hm-info"><div class="info-c"><h3>${ic('truck', 's')} ${esc(t('deliv'))}</h3><p>${fees.length ? `${esc(t('hm_fee'))} ${money(Math.min(...fees))}${mins.length ? ` · ${esc(t('minorder'))} ${money(Math.min(...mins))}` : ''}` : esc(t('hm_nodeliv'))}</p><p class="note">${esc((s.zones || []).map(z => z.plz).join(', ').replace(/,\s*/g, ', '))}</p></div>
     <div class="info-c"><h3>${ic('pin', 's')} ${esc(t('pickup'))}</h3><p>${esc(s.address || '')}</p><a class="lnk" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address || 'Steintorweg 4 Hamburg')}">${esc(t('hm_map'))}</a></div>
     <div class="info-c"><h3>${ic('chat', 's')} ${esc(t('contact'))}</h3>${s.phone ? `<p><a href="tel:${esc(s.phone)}">${esc(s.phone)}</a></p>` : ''}${s.whatsapp ? `<p><a target="_blank" rel="noopener noreferrer" href="https://wa.me/${esc(waNum(s.whatsapp))}">WhatsApp</a></p>` : ''}${s.email ? `<p><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></p>` : ''}</div></section>`, { tab: 'home' });
  $('#heroQ').onfocus = $('#heroQ').onclick = () => searchSheet();
  bindCards($('#main'));
  $$('.feat-big[data-p],.frow[data-p]').forEach(el => { el.onclick = e => { if (e.target.closest('[data-qa]')) return; productSheet(el.dataset.p); }; el.onkeydown = e => { if (e.key === 'Enter') productSheet(el.dataset.p); }; });
}
function vShop(id) {
  const sh = shopById(id); if (!sh || !sh.active) { location.hash = '#/'; return; }
  const prods = visibleProducts(id);
  const cats = S.cats.filter(c => c.shop_id === id && prods.some(p => p.category_id === c.id));
  const o = openLabel(sh); const r = S.ratings[id];
  const hrs = DAYS.slice(1).concat('so').map(d => `<div class="sum"><span>${esc(t('days')[d])}</span><span>${esc((sh.hours || {})[d] || t('closedday'))}</span></div>`).join('');
  page(`<section class="shead"><div class="cv" style="${bgImg(shopCover(sh))}"></div><div class="in">
     <h1>${esc(L(sh, 'name'))}</h1><div class="ds">${esc(L(sh, 'desc'))}</div>
     <div class="acts"><span class="state ${o.on ? '' : 'off'}">${esc(o.txt)}</span>${r ? `<span class="pill be">${ic('star', 's')} ${r.avg} · ${r.n}</span>` : ''}
     <button class="btn s o" id="hrsB">${ic('clock', 's')} ${esc(t('hours'))}</button>${sh.phone ? `<a class="btn s o" href="tel:${esc(sh.phone)}">${ic('phone', 's')}</a>` : ''}</div></div></section>
   <div class="chips" id="chips"><button class="chip on" data-c="">${esc(t('all'))}</button>${cats.map(c => `<button class="chip" data-c="${esc(c.id)}">${esc(L(c, 'name'))}</button>`).join('')}</div>
   <div id="plist"></div>`);
  $('#hrsB').onclick = () => modal(`<button class="ib x" data-close>${ic('x')}</button><h3>${esc(t('hours'))}</h3><div class="note" style="margin-bottom:8px">${esc(L(sh, 'name'))}</div>${hrs}`);
  let cat = '';
  const draw = () => {
    const list = prods.filter(p => !cat || p.category_id === cat);
    let html = '';
    if (!cat && cats.length) {
      cats.forEach(c => { const l = list.filter(p => p.category_id === c.id); if (l.length) html += `<h2 class="cat">${esc(L(c, 'name'))}</h2><div class="grid">${l.map(prodCard).join('')}</div>`; });
      const rest = list.filter(p => !cats.some(c => c.id === p.category_id)); if (rest.length) html += `<h2 class="cat">${esc(S.lang === 'ar' ? 'منتجات أخرى' : 'Weitere Produkte')}</h2><div class="grid">${rest.map(prodCard).join('')}</div>`;
    } else html = list.length ? `<div class="grid" style="margin-top:8px">${list.map(prodCard).join('')}</div>` : `<div class="empty">${shopIc(sh.type)}<p>${esc(S.lang === 'ar' ? 'لسا ما في منتجات بهالمحل.' : 'Hier gibt es noch keine Produkte.')}</p></div>`;
    $('#plist').innerHTML = html; bindCards($('#plist'));
  };
  $$('#chips .chip').forEach(b => b.onclick = () => { $$('#chips .chip').forEach(x => x.classList.remove('on')); b.classList.add('on'); cat = b.dataset.c; draw(); });
  draw();
}
function vCart() {
  S.cart = S.cart.filter(c => prodById(c.product_id)); saveCart();
  if (!S.cart.length) { page(`<div class="empty">${ic('bag')}<h2 style="color:var(--ink);font-size:20px">${esc(t('empty'))}</h2><p>${esc(t('emptyhint'))}</p><a class="btn" href="#/">${esc(t('toshop'))}</a></div>`, { noBar: 1, tab: 'cart' }); return; }
  const tot = cartTotals();
  const groups = cartShops().map(sid => { const sh = shopById(sid); const items = S.cart.map((c, i) => [c, i]).filter(([c]) => prodById(c.product_id).shop_id === sid);
    return `<div class="card"><h3>${shopIc(sh.type)} ${esc(L(sh, 'name'))} ${isOpenNow(sh) ? '' : `<span class="pill bad">${esc(openLabel(sh).txt)}</span>`}</h3>
     ${items.map(([c, i]) => { const p = prodById(c.product_id); return `<div class="li"><div class="thumb" style="${bgImg(p.image_url)}">${p.image_url ? '' : shopIc(sh.type, 's')}</div>
       <div class="t" data-edit="${i}" style="cursor:pointer"><b>${esc(L(p, 'name'))}</b>${optText(c) ? `<small>${esc(optText(c))}</small>` : ''}<small>${money(itemPrice(c))}</small></div>
       <div class="step sm"><button data-m="${i}" aria-label="-">${ic(c.qty <= (p.unit === 'kg' ? (+p.min_qty || +p.step || .25) : 1) ? 'trash' : 'minus', 's')}</button><span>${fq(c.qty, p.unit)}</span><button data-pl="${i}" aria-label="+">${ic('plus', 's')}</button></div></div>`; }).join('')}</div>`; }).join('');
  page(`<div class="sec" style="margin-top:6px"><h2>${esc(t('cart'))}</h2><span class="note">${tot.n} ${esc(t('items'))}</span></div>${groups}
    <div class="card"><div class="sum"><span>${esc(t('subtotal'))}</span><span>${money(tot.sub)}</span></div>
    ${tot.pf ? `<div class="sum"><span>${esc(t('pfand'))}</span><span>${money(tot.pf)}</span></div>` : ''}
    <div class="sum tot"><span>${esc(t('total'))}</span><span>${money(tot.sub + tot.pf)}</span></div><div class="note">${esc(S.lang === 'ar' ? 'رسوم التوصيل بتنحسب بالخطوة الجاية.' : 'Liefergebühr wird im nächsten Schritt berechnet.')}</div></div>
    <a class="btn full" href="#/checkout" style="margin-top:4px">${esc(t('checkout'))}</a>`, { noBar: 1, tab: 'cart' });
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
async function vCheckout() {
  if (!S.cart.length) { location.hash = '#/cart'; return; }
  await loadCustomer();
  if ((S.settings.payments || {}).stripe && S.stripeReady == null) { try { S.stripeReady = !!(await anon().rpc('stripe_ready')).data; } catch (_) { S.stripeReady = false; } }
  const s = S.settings; const pay = s.payments || {}; const c = S.cust;
  const canDel = s.delivery !== false, canPick = s.pickup !== false;
  const saved = Object.assign({}, ls.get('so_cust', {}), c ? { name: c.name, phone: c.phone, email: c.email, street: c.street || (ls.get('so_cust', {}).street || ''), plz: c.plz || (ls.get('so_cust', {}).plz || ''), city: c.city, address_note: c.address_note } : {});
  const st = { mode: saved.mode && ((saved.mode === 'delivery' && canDel) || (saved.mode === 'pickup' && canPick)) ? saved.mode : (canDel ? 'delivery' : 'pickup'), when: 'asap', pay: 'cash' };
  const allOpen = cartShops().every(id => isOpenNow(shopById(id)));
  if (!allOpen) st.when = 'later';
  const canSched = s.allow_scheduled !== false;
  if (s.orders_paused) { page(`<div class="empty">${ic('clock')}<h2 style="color:var(--ink);font-size:20px">${esc(t('paused'))}</h2><p>${esc(LL(s.pause_ar, s.pause_de) || t('pausedhint'))}</p><a class="btn o" href="#/cart">${esc(t('back'))}</a></div>`, { noBar: 1 }); return; }
  if (s.require_account && !c) { location.hash = '#/account?next=checkout'; toast(t('needacc')); return; }
  if (!allOpen && !canSched) { page(`<div class="empty">${ic('clock')}<h2 style="color:var(--ink);font-size:20px">${esc(t('e_closed'))}</h2><p>${esc(t('closednow'))}</p><a class="btn o" href="#/cart">${esc(t('back'))}</a></div>`, { noBar: 1 }); return; }
  const payOpts = [['stripe', !!pay.stripe && S.stripeReady], ['cash', pay.cash !== false], ['card', !!pay.card], ['transfer', !!pay.transfer && !!s.bank_iban], ['paypal', !!pay.paypal && !!pay.paypal_me]].filter(x => x[1]).map(x => x[0]);
  if (!payOpts.includes(st.pay)) st.pay = payOpts[0];
  const payIc = { cash: 'receipt', card: 'tag', paypal: 'globe', transfer: 'store', stripe: 'tag' };
  page(`<div class="sec" style="margin-top:6px"><h2>${esc(t('checkout'))}</h2></div>
   ${c ? `<div class="infobox">${ic('user', 's')}<span>${esc(t('orderas'))} <b>${esc(c.name || c.email)}</b></span></div>` : `<div class="card" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:200px">${esc(t('loginhint'))}</span><a class="btn s o" href="#/account?next=checkout">${esc(t('login'))}</a></div>`}
   ${canDel && canPick ? `<div class="seg" id="mode"><button data-v="delivery">${ic('truck', 's')} ${esc(t('deliv'))}</button><button data-v="pickup">${ic('store', 's')} ${esc(t('pickup'))}</button></div>` : ''}
   <div class="card"><h3>${esc(t('profile'))}</h3>
    <div class="row"><label class="f"><span>${esc(t('name'))}</span><input type="text" id="cN" autocomplete="name" maxlength="80" value="${esc(saved.name || '')}"></label>
    <label class="f"><span>${esc(t('phone'))}</span><input type="tel" id="cP" autocomplete="tel" maxlength="40" value="${esc(saved.phone || '')}"></label></div>
    <label class="f"><span>${esc(t('emailopt'))}</span><input type="email" id="cE" autocomplete="email" maxlength="120" value="${esc(saved.email || '')}"></label></div>
   <div class="card" id="addr"><h3>${esc(t('address'))}</h3><label class="f"><span>${esc(t('street'))}</span><input type="text" id="cS" autocomplete="address-line1" maxlength="160" placeholder="Steintorweg 4" value="${esc(saved.street || '')}"></label>
     <div class="row"><label class="f"><span>${esc(t('plz'))}</span><input type="text" inputmode="numeric" id="cZ" maxlength="5" autocomplete="postal-code" value="${esc(saved.plz || '')}"></label>
     <label class="f"><span>${esc(t('city'))}</span><input type="text" id="cC" autocomplete="address-level2" maxlength="80" value="${esc(saved.city || 'Hamburg')}"></label></div>
     <div id="zinfo"></div>
     <label class="f"><span>${esc(t('addrnote'))}</span><input type="text" id="cAN" maxlength="200" value="${esc(saved.address_note || '')}"></label></div>
   <div class="card"><h3>${esc(t('when'))}</h3>${!allOpen ? `<div class="warnbox">${ic('clock', 's')}<span>${esc(t('schedreq'))}</span></div>` : ''}
    ${allOpen && canSched ? `<div class="seg" id="when"><button data-v="asap">${esc(t('asap'))}</button><button data-v="later">${esc(t('later'))}</button></div>` : allOpen ? `<div class="note">${esc(t('asap'))}</div>` : ''}
    <input type="datetime-local" id="cT" style="margin-top:10px" hidden></div>
   <div class="card"><h3>${esc(t('payment'))}</h3>${payOpts.map(v => `<label class="opt"><input type="radio" name="pay" value="${v}" ${v === st.pay ? 'checked' : ''}>${ic(payIc[v])}<span>${esc(t(v))}</span></label>`).join('')}
    <div class="note" id="ppn" hidden>${esc(t('paypalnote'))}</div><div class="note" id="trn" hidden>${esc(t('transferhint'))}</div></div>
   <div class="card"><div class="row"><label class="f" style="margin-top:0"><span>${esc(t('coupon'))}</span><input type="text" id="cK" maxlength="40" style="text-transform:uppercase"></label><span></span></div>
    <label class="f" style="margin-bottom:0"><span>${esc(t('ordernote'))}</span><textarea id="cO" maxlength="400"></textarea></label></div>
   <div class="card" id="tots"></div>
   <label class="chk"><input type="checkbox" id="cA"><span>${S.lang === 'ar' ? 'قرأت <a href="#/agb">الشروط</a> و<a href="#/datenschutz">سياسة الخصوصية</a> وبوافق عليهم.' : 'Ich habe die <a href="#/agb">AGB</a> und die <a href="#/datenschutz">Datenschutzerklärung</a> gelesen und akzeptiere sie.'}</span></label>
   <button class="btn full" id="go" style="margin-top:8px;min-height:54px;font-size:16px">${esc(t('place'))}</button>`, { noBar: 1, tab: 'cart' });
  const tmin = new Date(Date.now() + 45 * 60000); const pad = n => String(n).padStart(2, '0');
  const lt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  $('#cT').min = lt(tmin); $('#cT').value = lt(tmin);
  const segSet = (id, v) => $$('#' + id + ' button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  const draw = () => {
    segSet('mode', st.mode); segSet('when', st.when);
    $('#addr').hidden = st.mode !== 'delivery'; $('#cT').hidden = st.when !== 'later'; $('#ppn').hidden = st.pay !== 'paypal'; $('#trn').hidden = st.pay !== 'transfer';
    const tot = cartTotals(); let fee = 0; let zi = '';
    if (st.mode === 'delivery' && $('#cZ').value.length >= 5) {
      const z = zoneFor($('#cZ').value);
      if (z) { fee = +z.fee || 0; zi = `<div class="infobox">${ic('check', 's')}<span>${esc(t('zoneok'))} · ${esc(t('delivery'))} ${money(fee)}${+z.min ? ` · ${esc(t('minorder'))} ${money(z.min)}` : ''}</span></div>`; if (+z.min && tot.sub < +z.min) zi += `<div class="warnbox">${ic('alert', 's')}<span>${esc(t('e_min'))} ${money(z.min)}</span></div>`; }
      else zi = `<div class="warnbox">${ic('alert', 's')}<span>${esc(t('zonebad'))}</span></div>`;
    }
    $('#zinfo').innerHTML = zi;
    $('#tots').innerHTML = `<div class="sum"><span>${esc(t('subtotal'))}</span><span>${money(tot.sub)}</span></div>${tot.pf ? `<div class="sum"><span>${esc(t('pfand'))}</span><span>${money(tot.pf)}</span></div>` : ''}
      ${st.mode === 'delivery' ? `<div class="sum"><span>${esc(t('delivery'))}</span><span>${money(fee)}</span></div>` : ''}<div class="sum tot"><span>${esc(t('total'))}</span><span>${money(tot.sub + tot.pf + fee)}</span></div>
      ${$('#cK').value.trim() ? `<div class="note">${esc(S.lang === 'ar' ? 'كود الخصم بينحسب عند الإرسال.' : 'Der Gutschein wird beim Absenden verrechnet.')}</div>` : ''}`;
  };
  $$('#mode button').forEach(b => b.onclick = () => { st.mode = b.dataset.v; draw(); });
  $$('#when button').forEach(b => b.onclick = () => { st.when = b.dataset.v; draw(); });
  $$('input[name=pay]').forEach(r => r.onchange = () => { st.pay = r.value; draw(); });
  $('#cZ').oninput = draw; $('#cK').oninput = draw;
  draw();
  $('#go').onclick = async () => {
    const v = (id, m) => clean($(id).value, m);
    if (!v('#cN', 80) || !v('#cP', 40)) return toast(t('e_contact'), 1);
    if (!/^[0-9+ ()/-]{6,40}$/.test(v('#cP', 40))) return toast(t('e_phone'), 1);
    if (st.mode === 'delivery') {
      const bad = [];
      const str = v('#cS', 160);
      if (str.length < 5 || !/\p{L}/u.test(str) || !/\d/.test(str)) bad.push('#cS');
      if (!/^\d{5}$/.test(v('#cZ', 10))) bad.push('#cZ');
      if (v('#cC', 80).length < 2) bad.push('#cC');
      $$('#addr input').forEach(i => i.classList.remove('bad'));
      if (bad.length) { bad.forEach(id => $(id).classList.add('bad')); $(bad[0]).focus(); return toast(t('e_address'), 1); }
    }
    if (!$('#cA').checked) return toast(t('e_agree'), 1);
    if (+s.min_total && cartTotals().sub < +s.min_total) return toast(t('e_min') + ' ' + money(s.min_total), 1);
    if (!allow('order', 4, 120)) return;
    let sched = '';
    if (st.when === 'later') { const d = new Date($('#cT').value); if (isNaN(d) || d < new Date(Date.now() + 20 * 60000)) return toast(t('e_time'), 1); sched = d.toISOString(); }
    const cust = { name: v('#cN', 80), phone: v('#cP', 40), email: v('#cE', 120), street: v('#cS', 160), plz: v('#cZ', 10), city: v('#cC', 80), address_note: v('#cAN', 200), mode: st.mode };
    ls.set('so_cust', cust);
    const payload = Object.assign({}, cust, { scheduled_at: sched, payment: st.pay, coupon: v('#cK', 40), note: v('#cO', 400), lang: S.lang, ctoken: S.ctoken || '',
      items: S.cart.map(c => ({ product_id: c.product_id, qty: c.qty, options: c.options, basket: c.basket, note: c.note, cake: c.cake })) });
    $('#go').disabled = true;
    const { data, error } = await sb.rpc('place_order', { p: payload });
    $('#go').disabled = false;
    if (error) { toast(errMsg(error), 1); if (/stock|product/.test(error.message)) loadData().catch(() => {}); return; }
    const mine = ls.get('so_orders', []); mine.unshift({ id: data.id, token: data.token, at: Date.now() }); ls.set('so_orders', mine.slice(0, 30));
    S.cart = []; saveCart(); toast(t('sent'));
    if (st.pay === 'stripe') { location.hash = '#/track/' + data.token; return payStripe(data.token); }
    if (st.pay === 'paypal' && pay.paypal_me) { const me = String(pay.paypal_me).replace(/^.*paypal\.me\//i, '').replace(/[^A-Za-z0-9._-]/g, ''); if (me) window.open(`https://www.paypal.me/${me}/${(+data.total).toFixed(2)}EUR`, '_blank', 'noopener'); }
    loadData().catch(() => {});
    location.hash = '#/track/' + data.token;
  };
}
const STEPS_D = ['new', 'preparing', 'ready', 'on_way', 'delivered'], STEPS_P = ['new', 'preparing', 'ready', 'picked_up'];
const STEP_IC = { new: 'inbox', preparing: 'chef', ready: 'check', on_way: 'truck', delivered: 'home', picked_up: 'bag' };
function qrSvg(text) { const q = qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); }
async function payStripe(token, btn) {
  if (btn) btn.disabled = true;
  try {
    const r = await fetch(CFG.url + '/functions/v1/stripe', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: CFG.key }, body: JSON.stringify({ token }) });
    const j = await r.json();
    if (j && j.url && /^https:\/\/checkout\.stripe\.com\//.test(j.url)) { location.href = j.url; return; }
    toast(j && j.error === 'paid' ? t('paid') : t('payfail'), 1);
  } catch (_) { toast(t('payfail'), 1); }
  if (btn) btn.disabled = false;
}
function notifyStatus(o) {
  if (ls.get('so_cvib', true) && navigator.vibrate) navigator.vibrate([180, 90, 180]);
  if (!ls.get('so_cnotify', false) || !('Notification' in window) || Notification.permission !== 'granted') return;
  const opt = { body: t('st_' + o.status) + ' · #' + o.id, icon: 'icon-192.png', tag: 'so-track-' + o.id };
  navigator.serviceWorker && navigator.serviceWorker.getRegistration().then(r => r ? r.showNotification('Stein & Olive', opt) : new Notification('Stein & Olive', opt)).catch(() => {});
}
let trackTimer = null;
/* ---------- live map (Leaflet, OpenStreetMap, OSRM) ---------- */
const TM = { token: null, el: null, map: null, drv: null, dst: null, line: null, dest: null, routeAt: 0, routeFrom: null, eta: null };
function loadLeaflet() {
  if (window.L && window.L.map) return Promise.resolve();
  if (loadLeaflet.p) return loadLeaflet.p;
  loadLeaflet.p = new Promise((ok, no) => {
    const c = document.createElement('link'); c.rel = 'stylesheet'; c.href = 'lib/leaflet.css'; document.head.appendChild(c);
    const sc = document.createElement('script'); sc.src = 'lib/leaflet.js'; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc);
  });
  return loadLeaflet.p;
}
async function geocode(o) {
  const key = 'so_geo_' + o.token; const c = ls.get(key, null); if (c) return c;
  const q = `${o.street}, ${o.plz} ${o.city}, Deutschland`;
  try {
    const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=de&q=' + encodeURIComponent(q), { headers: { 'Accept-Language': 'de' } });
    const j = await r.json(); if (!j || !j[0]) return null;
    const g = { lat: +j[0].lat, lng: +j[0].lon }; ls.set(key, g); return g;
  } catch (_) { return null; }
}
async function osrmRoute(from, to) {
  try {
    const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`);
    const j = await r.json(); const rt = j && j.routes && j.routes[0]; if (!rt) return null;
    return { pts: rt.geometry.coordinates.map(c => [c[1], c[0]]), sec: rt.duration, m: rt.distance };
  } catch (_) { return null; }
}
const DRV_IC = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>';
const HOME_IC = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z"/></svg>';
async function liveMap(slot, o) {
  if (!slot) return;
  await loadLeaflet().catch(() => {}); if (!window.L || !window.L.map) { slot.innerHTML = ''; return; }
  const Lf = window.L;
  if (TM.token !== o.token || !TM.el) {
    if (TM.map) TM.map.remove();
    Object.assign(TM, { token: o.token, el: document.createElement('div'), map: null, drv: null, dst: null, line: null, dest: null, routeAt: 0, routeFrom: null, eta: null });
    TM.el.className = 'lmap';
  }
  slot.replaceWith(TM.el); TM.el.id = 'mapSlot';
  const drvPos = [+o.driver_lat, +o.driver_lng];
  if (!TM.map) {
    TM.map = Lf.map(TM.el, { zoomControl: true, attributionControl: true, scrollWheelZoom: false, tap: true }).setView(drvPos, 15);
    Lf.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(TM.map);
  }
  setTimeout(() => TM.map && TM.map.invalidateSize(), 50);
  const drvIcon = Lf.divIcon({ className: 'mk-drv', html: `<span>${DRV_IC}</span>`, iconSize: [44, 44], iconAnchor: [22, 22] });
  if (!TM.drv) TM.drv = Lf.marker(drvPos, { icon: drvIcon, zIndexOffset: 1000, title: t('driver') }).addTo(TM.map); else TM.drv.setLatLng(drvPos);
  if (!TM.dest) TM.dest = await geocode(o);
  if (TM.dest && !TM.dst) TM.dst = Lf.marker([TM.dest.lat, TM.dest.lng], { icon: Lf.divIcon({ className: 'mk-home', html: `<span>${HOME_IC}</span>`, iconSize: [36, 44], iconAnchor: [18, 42] }), title: t('address') }).addTo(TM.map);
  if (TM.dest) {
    const moved = !TM.routeFrom || Math.hypot(TM.routeFrom[0] - drvPos[0], TM.routeFrom[1] - drvPos[1]) > 0.0007;
    if (moved && Date.now() - TM.routeAt > 40000) {
      TM.routeAt = Date.now(); TM.routeFrom = drvPos;
      const r = await osrmRoute({ lat: drvPos[0], lng: drvPos[1] }, TM.dest);
      const pts = r ? r.pts : [drvPos, [TM.dest.lat, TM.dest.lng]];
      if (TM.line) TM.line.setLatLngs(pts); else TM.line = Lf.polyline(pts, { color: '#4F5B2E', weight: 6, opacity: .85, lineCap: 'round', dashArray: r ? null : '8 10' }).addTo(TM.map);
      TM.eta = r ? { sec: r.sec, m: r.m, at: Date.now() } : null;
      TM.map.fitBounds(Lf.latLngBounds([drvPos, [TM.dest.lat, TM.dest.lng]]).pad(0.25), { maxZoom: 16 });
    }
  }
  const e = $('#etaLine');
  if (e) e.innerHTML = TM.eta ? `${ic('clock', 's')} ${esc(t('eta_drive'))} <b>${Math.max(1, Math.round((TM.eta.sec - (Date.now() - TM.eta.at) / 1000) / 60))} ${esc(t('min'))}</b> · ${(TM.eta.m / 1000).toLocaleString(S.lang === 'ar' ? 'ar' : 'de-DE', { maximumFractionDigits: 1 })} km` : '';
}
function etaText(o) {
  const prep = +(S.settings.prep_min || 25), drive = +(S.settings.drive_min || 15);
  if (['delivered', 'picked_up', 'cancelled', 'on_way'].includes(o.status)) return '';
  const base = o.scheduled_at ? new Date(o.scheduled_at) : new Date(new Date(o.created_at).getTime() + (prep + (+o.queue || 0) * 4 + (o.mode === 'delivery' ? drive : 0)) * 60000);
  if (o.scheduled_at) return `${t('eta_sched')} ${fmtTime(base)}`;
  if (base < new Date()) return t('eta_soon');
  const a = new Date(base.getTime() - 5 * 60000), b = new Date(base.getTime() + 10 * 60000);
  return `${o.mode === 'delivery' ? t('eta_deliv') : t('eta_pick')} ${fmtTime(a)} – ${fmtTime(b)}`;
}
const fmtTime = d => d.toLocaleTimeString(S.lang === 'ar' ? 'ar-SY' : 'de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' });
function ago(ts) {
  const m = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 60000));
  if (!ts || isNaN(m)) return '';
  if (m < 1) return S.lang === 'ar' ? 'هلق' : 'gerade eben';
  return S.lang === 'ar' ? `قبل ${m} دقيقة` : `vor ${m} Min.`;
}
async function vTrack(token) {
  clearInterval(trackTimer);
  if (!/^[0-9a-f-]{36}$/i.test(token || '')) { location.hash = '#/'; return; }
  const draw = async (first) => {
    const { data: o, error } = await anon().rpc('track_order', { t: token });
    if (location.hash.indexOf(token) < 0) { clearInterval(trackTimer); return; }
    if (error || !o) { if (first) page(`<div class="empty">${ic('alert')}<p>${esc(error ? errMsg(error) : t('err'))}</p></div>`, { noBar: 1 }); return; }
    if (!first && draw.last === JSON.stringify(o)) return; draw.last = JSON.stringify(o);
    if (!first && draw.st && draw.st !== o.status) notifyStatus(o);
    draw.st = o.status;
    if (!first && document.activeElement && document.activeElement.closest && document.activeElement.closest('.rv')) return;
    const steps = o.mode === 'delivery' ? STEPS_D : STEPS_P; const idx = steps.indexOf(o.status);
    const shops = [...new Set(o.items.map(i => i.shop_id))];
    const done = o.status === 'delivered' || o.status === 'picked_up';
    const dw = S.settings.whatsapp ? waNum(S.settings.whatsapp) : '';
    const lat = +o.driver_lat, lng = +o.driver_lng;
    page(`<div class="card" style="text-align:center"><div class="note">${esc(t('orderno'))}</div><div class="big">#${+o.id}</div>
      <div class="note">${fmtDate(o.created_at)}${o.scheduled_at ? ' · ' + ic('clock', 's') + ' ' + fmtDate(o.scheduled_at) : ''}</div>
      ${o.status === 'cancelled' ? `<div class="warnbox" style="justify-content:center">${esc(t('st_cancelled'))}</div>` : `<div class="steps">${steps.map((s, i) => `<div class="stp ${i <= idx ? 'on' : ''}"><i>${ic(STEP_IC[s], 's')}</i>${esc(t('st_' + s))}</div>`).join('')}</div>`}
      ${o.handover_code && !done && o.status !== 'cancelled' ? `<div class="hcode"><div class="note">${esc(o.mode === 'delivery' ? t('code_d') : t('code_p'))}</div><b dir="ltr">${esc(String(o.handover_code).split('').join(' '))}</b></div>` : ''}
      ${o.mode === 'pickup' && !done && o.status !== 'cancelled' ? `<div class="note" style="margin-top:12px">${esc(t('showqr'))}</div><div class="qr">${qrSvg('SO:' + o.token)}</div>` : ''}
      ${etaText(o) ? `<div class="etabox">${ic('clock', 's')} ${esc(etaText(o))}</div>` : ''}
      ${!done && o.status !== 'cancelled' ? `<div class="note">${esc(t('cancelnote'))}</div>` : ''}</div>
     ${o.mode === 'delivery' && o.driver_name ? `<div class="card"><h3>${ic('truck')} ${esc(t('driver'))}: ${esc(o.driver_name)}</h3>${o.driver_phone ? `<a class="btn s o" href="tel:${esc(o.driver_phone)}">${ic('phone', 's')} ${esc(o.driver_phone)}</a>` : ''}
       ${o.status === 'on_way' ? (isFinite(lat) && isFinite(lng) && lat ? `<div id="mapSlot" class="lmap"></div><div class="maplegend"><span><i class="lg-d"></i>${esc(t('driver'))}</span><span><i class="lg-h"></i>${esc(t('address'))}</span></div><div class="etaline" id="etaLine"></div><div class="note" style="margin-top:4px">${esc(t('posat'))} ${esc(ago(o.driver_pos_at))}</div>` : `<div class="note" style="margin-top:10px">${ic('clock', 's')} ${esc(t('posnone'))}</div>`) : ''}</div>` : ''}
     ${done ? shops.filter(sid => !o.reviews.includes(sid)).map(sid => `<div class="card rv" data-s="${esc(sid)}"><h3>${esc(t('rate'))} ${esc(L(shopById(sid) || {}, 'name'))}?</h3>
        <div class="stars">${[1, 2, 3, 4, 5].map(n => `<span data-n="${n}" role="button" aria-label="${n}">${ic('star')}</span>`).join('')}</div><input type="text" maxlength="300" placeholder="${esc(t('comment'))}" style="margin-top:10px"><button class="btn s" style="margin-top:10px">${esc(t('send'))}</button></div>`).join('') : ''}
     ${o.status === 'delivered' && safeUrl(o.proof_url) ? `<div class="card"><h3>${ic('camera')} ${esc(t('proof'))}</h3><img class="proofimg" src="${esc(safeUrl(o.proof_url))}" alt="${esc(t('proof'))}" loading="lazy"></div>` : ''}
     ${o.payment === 'transfer' && !o.paid && o.status !== 'cancelled' ? bankBox(o) : ''}
     ${o.payment === 'stripe' && !o.paid && o.status !== 'cancelled' ? `<div class="card paycard"><h3>${ic('tag')} ${esc(t('paytitle'))}</h3><p class="note">${esc(t('payopen'))}</p><button class="btn full" id="payNow">${esc(t('paynow'))} · ${money(o.total)}</button></div>` : ''}
     <div class="card" id="rcpt">${receiptHtml(o)}</div>
     <div class="acts noprint"><a class="btn" href="#/invoice/${esc(o.token)}">${ic('receipt', 's')} ${esc(t('invoice'))}</a>${dw ? `<a class="btn o" target="_blank" rel="noopener noreferrer" href="https://wa.me/${esc(dw)}?text=${encodeURIComponent((S.lang === 'ar' ? 'مرحبا، بخصوص طلبي رقم #' : 'Hallo, zu meiner Bestellung #') + o.id)}">${ic('chat', 's')} ${esc(t('whatsapp'))}</a>` : ''}<a class="btn o" href="#/">${esc(t('home'))}</a></div>`, { noBar: 1 });
    if ($('#mapSlot')) liveMap($('#mapSlot'), o);
    if ($('#payNow')) $('#payNow').onclick = () => payStripe(o.token, $('#payNow'));
    $$('[data-copy]').forEach(b => b.onclick = () => navigator.clipboard.writeText(b.dataset.copy).then(() => toast(t('copied'))));
    $$('.rv').forEach(card => { let n = 0; const sp = $$('.stars span', card);
      sp.forEach(s => s.onclick = () => { n = +s.dataset.n; sp.forEach(x => x.classList.toggle('on', +x.dataset.n <= n)); });
      $('button', card).onclick = async () => { if (!n) return; const { error } = await sb.rpc('add_review', { p_token: token, p_shop: card.dataset.s, p_stars: n, p_text: clean($('input', card).value, 300), p_name: String(o.customer_name || '').split(' ')[0] });
        if (error) return toast(errMsg(error), 1); card.innerHTML = `<div style="text-align:center">${esc(t('thanks'))}</div>`; draw.last = ''; };
    });
    if (done || o.status === 'cancelled') clearInterval(trackTimer);
  };
  await draw(true);
  trackTimer = setInterval(() => draw(false), 15000);
}
function receiptHtml(o) {
  const s = S.settings;
  const byShop = {}; o.items.forEach(i => (byShop[i.shop_id] = byShop[i.shop_id] || []).push(i));
  const vat = {}; o.items.filter(i => i.status !== 'rejected').forEach(i => { vat[i.vat] = (vat[i.vat] || 0) + (+i.line_total); });
  return `<h3>${ic('receipt')} ${esc(t('receipt'))} #${+o.id}</h3>
   ${Object.keys(byShop).map(sid => `<div style="margin:10px 0"><b>${esc(L(shopById(sid) || { name_ar: sid, name_de: sid }, 'name'))}</b>
     ${byShop[sid].map(i => `<div class="li" style="padding:6px 0;${i.status === 'rejected' ? 'opacity:.45;text-decoration:line-through' : ''}"><div class="t">${fq(i.final_qty || i.qty, i.unit)} ${esc(LL(i.name_ar, i.name_de))}
       <small>${esc((i.options || []).map(x => LL(x.ar, x.de)).join(', '))}${i.cake ? ' · ' + esc(i.cake.date) + (i.cake.text ? ' «' + esc(i.cake.text) + '»' : '') : ''}${i.note ? ' · ' + esc(i.note) : ''}</small></div><span>${money(i.line_total)}</span></div>`).join('')}</div>`).join('')}
   <div class="sum"><span>${esc(t('subtotal'))}</span><span>${money(o.subtotal)}</span></div>
   ${+o.pfand ? `<div class="sum"><span>${esc(t('pfand'))}</span><span>${money(o.pfand)}</span></div>` : ''}
   ${o.mode === 'delivery' ? `<div class="sum"><span>${esc(t('delivery'))}</span><span>${money(o.delivery_fee)}</span></div>` : ''}
   ${+o.discount ? `<div class="sum"><span>${esc(t('discount'))} ${esc(o.coupon || '')}</span><span>−${money(o.discount)}</span></div>` : ''}
   <div class="sum tot"><span>${esc(t('total'))}</span><span>${money(o.total)}</span></div>
   <div class="note">${Object.keys(vat).map(v => `inkl. ${+v}% MwSt: ${money(vat[v] - vat[v] / (1 + v / 100))}`).join(' · ')}</div>
   <div class="note">${esc(t('payment'))}: ${esc(t(o.payment))}${o.paid ? ' · ' + esc(t('paid')) : o.payment === 'transfer' ? ' · ' + esc(t('unpaid')) : ''} · ${esc(t(o.mode === 'delivery' ? 'deliv' : 'pickup'))}</div>
   <div class="note" style="margin-top:6px">${esc(s.name || 'Stein & Olive by Karam')}, ${esc(s.address || '')}${s.vat_id ? ' · USt-IdNr. ' + esc(s.vat_id) : s.tax_id ? ' · St.-Nr. ' + esc(s.tax_id) : ''}</div>`;
}


/* ---------- bank transfer (GiroCode / EPC-QR) ---------- */
function epcPayload(s, o) {
  const clip = (v, n) => String(v || '').replace(/[\r\n]/g, ' ').slice(0, n);
  return ['BCD', '002', '1', 'SCT', clip(s.bank_bic, 11), clip(s.bank_holder || s.name, 70), clip(String(s.bank_iban || '').replace(/\s/g, ''), 34), 'EUR' + (+o.total).toFixed(2), '', '', 'SO-' + o.id, ''].join('\n');
}
function bankBox(o) {
  const s = S.settings; if (!s.bank_iban) return '';
  const iban = String(s.bank_iban).replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  const cp = (v) => `<button class="btn s o" data-copy="${esc(v)}" aria-label="copy">${ic('copy', 's')}</button>`;
  return `<div class="card"><h3>${ic('store')} ${esc(t('banktitle'))}</h3><p class="note" style="margin-top:0">${esc(t('bankhint'))}</p>
    <div class="qr" style="width:190px">${qrSvg(epcPayload(s, o))}</div>
    <div class="li"><div class="t"><small>${esc(t('holder'))}</small><b>${esc(s.bank_holder || s.name)}</b></div></div>
    <div class="li"><div class="t"><small>IBAN</small><b dir="ltr">${esc(iban)}</b></div>${cp(String(s.bank_iban).replace(/\s/g, ''))}</div>
    ${s.bank_bic ? `<div class="li"><div class="t"><small>BIC</small><b dir="ltr">${esc(s.bank_bic)}</b></div></div>` : ''}
    <div class="li"><div class="t"><small>${esc(t('amount'))}</small><b>${money(o.total)}</b></div></div>
    <div class="li"><div class="t"><small>${esc(t('purpose'))}</small><b dir="ltr">SO-${+o.id}</b></div>${cp('SO-' + o.id)}</div></div>`;
}

/* ---------- invoice (Rechnung) ---------- */
function invoiceHtml(o) {
  const s = S.settings; const ku = !!s.kleinunternehmer;
  const r2 = n => Math.round(n * 100) / 100;
  const de = n => (Math.round((+n || 0) * 100) / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const items = (o.items || []).filter(i => i.status !== 'rejected');
  const byShop = {}; items.forEach(i => (byShop[i.shop_id] = byShop[i.shop_id] || []).push(i));
  const gross = {}; const add = (v, amt) => { if (amt) gross[v] = (gross[v] || 0) + amt; };
  items.forEach(i => add(+i.vat, +i.line_total));
  add(19, +o.pfand || 0);
  if (o.mode === 'delivery') add(+(s.delivery_vat || 7), +o.delivery_fee || 0);
  const gsum = Object.values(gross).reduce((a, b) => a + b, 0);
  if (+o.discount && gsum) Object.keys(gross).forEach(v => { gross[v] -= (+o.discount) * gross[v] / gsum; });
  let pos = 0;
  const rows = Object.keys(byShop).map(sid => `<tr class="grp"><td colspan="6"><span class="bi"><span>${esc((shopById(sid) || {}).name_de || sid)}</span><span class="ar" dir="rtl">${esc((shopById(sid) || {}).name_ar || '')}</span></span></td></tr>` + byShop[sid].map(i => {
    pos++; const q = +(i.final_qty || i.qty);
    const unit = i.unit === 'kg' ? de(i.unit_price) + ' /kg' : de(+i.line_total / (q || 1));
    const opts = (i.options || []).map(x => x.de || x.ar).join(', ');
    return `<tr><td>${pos}</td><td><b>${esc(i.name_de)}</b><div class="ar" dir="rtl">${esc(i.name_ar)}</div>${opts ? `<div class="sm">${esc(opts)}</div>` : ''}${i.cake ? `<div class="sm">Termin ${esc(i.cake.date)}${i.cake.text ? ' · „' + esc(i.cake.text) + '“' : ''}</div>` : ''}</td>
      <td class="n">${i.unit === 'kg' ? q.toLocaleString('de-DE', { maximumFractionDigits: 3 }) + ' kg' : q}</td><td class="n">${unit}</td>${ku ? '' : `<td class="n">${+i.vat} %</td>`}<td class="n">${de(i.line_total)}</td></tr>`;
  }).join('')).join('');
  const vatRows = Object.keys(gross).sort().map(v => { const g = r2(gross[v]); const net = r2(g / (1 + v / 100)); return `<tr><td>${+v} %</td><td class="n">${de(net)}</td><td class="n">${de(r2(g - net))}</td><td class="n">${de(g)}</td></tr>`; }).join('');
  const PAYDE = { cash: 'Barzahlung bei Übergabe', card: 'EC-Karte bei Übergabe', paypal: 'PayPal', transfer: 'Überweisung', stripe: 'Kartenzahlung online' };
  return `<article class="inv">
   <header class="inv-h"><img src="logo-dark.png" alt="Stein & Olive"><div class="inv-t"><h1 class="bi"><span>Rechnung</span><span class="ar" dir="rtl">فاتورة</span></h1>
     <table class="kv"><tr><td>Rechnungs-Nr.</td><td>SO-${+o.id}</td></tr><tr><td>Datum</td><td>${new Date(o.created_at).toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' })}</td></tr>
     <tr><td>Leistungsdatum</td><td>${new Date(o.scheduled_at || o.created_at).toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' })}</td></tr><tr><td>Art</td><td>${o.mode === 'delivery' ? 'Lieferung' : 'Abholung'}</td></tr></table></div></header>
   <section class="inv-p"><div><div class="lb"><span class="bi"><span>Verkäufer</span><span class="ar" dir="rtl">البائع</span></span></div><b>${esc(s.name || 'Stein & Olive by Karam')}</b><br>${s.owner ? 'Inh. ' + esc(s.owner) + '<br>' : ''}${esc(s.address || '')}${s.phone ? '<br>Tel. ' + esc(s.phone) : ''}${s.email ? '<br>' + esc(s.email) : ''}
       ${s.vat_id ? '<br>USt-IdNr. ' + esc(s.vat_id) : ''}${s.tax_id ? '<br>St.-Nr. ' + esc(s.tax_id) : ''}</div>
     <div><div class="lb"><span class="bi"><span>Kunde</span><span class="ar" dir="rtl">الزبون</span></span></div><b>${esc(o.customer_name)}</b>${o.mode === 'delivery' ? '<br>' + esc(o.street) + '<br>' + esc(o.plz) + ' ' + esc(o.city) : ''}${o.phone ? '<br>Tel. ' + esc(o.phone) : ''}</div></section>
   <table class="inv-i"><thead><tr><th>Pos.</th><th><span class="bi"><span>Artikel</span><span class="ar" dir="rtl">المنتج</span></span></th><th class="n">Menge</th><th class="n">Einzelpreis</th>${ku ? '' : '<th class="n">MwSt</th>'}<th class="n">Betrag</th></tr></thead><tbody>${rows}</tbody></table>
   <div class="inv-s"><table>
     <tr><td>Zwischensumme</td><td class="n">${de(o.subtotal)}</td></tr>${+o.pfand ? `<tr><td>Pfand</td><td class="n">${de(o.pfand)}</td></tr>` : ''}
     ${o.mode === 'delivery' ? `<tr><td>Liefergebühr</td><td class="n">${de(o.delivery_fee)}</td></tr>` : ''}${+o.discount ? `<tr><td>Rabatt ${esc(o.coupon || '')}</td><td class="n">−${de(o.discount)}</td></tr>` : ''}
     <tr class="tot"><td><span class="bi"><span>Gesamtbetrag</span><span class="ar" dir="rtl">المجموع</span></span></td><td class="n">${de(o.total)}</td></tr></table></div>
   ${ku ? '<p class="sm">Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.</p>' : `<table class="inv-v"><thead><tr><th>MwSt-Satz</th><th class="n">Netto</th><th class="n">MwSt</th><th class="n">Brutto</th></tr></thead><tbody>${vatRows}</tbody></table><p class="sm">Alle Preise enthalten die gesetzliche Mehrwertsteuer.</p>`}
   <section class="inv-f"><div><div class="lb"><span class="bi"><span>Zahlung</span><span class="ar" dir="rtl">الدفع</span></span></div>${esc(PAYDE[o.payment] || o.payment)} · <b>${o.paid ? 'bezahlt' : 'offen'}</b>
     ${o.payment === 'transfer' && !o.paid && s.bank_iban ? `<br>${esc(s.bank_holder || s.name)} · IBAN ${esc(s.bank_iban)}${s.bank_bic ? ' · BIC ' + esc(s.bank_bic) : ''}<br>Verwendungszweck: SO-${+o.id}` : ''}</div>
     <div class="thanks"><div>Vielen Dank für deinen Einkauf.</div><div class="ar" dir="rtl">شكراً لأنك طلبت من بيت كرم</div></div></section>
  </article>`;
}
async function vInvoice(token) {
  if (!/^[0-9a-f-]{36}$/i.test(token || '')) { location.hash = '#/'; return; }
  const { data: o, error } = await sb.rpc('track_order', { t: token });
  if (error || !o) { page(`<div class="empty">${esc(error ? errMsg(error) : t('err'))}</div>`, { noBar: 1 }); return; }
  page(`<div class="acts noprint" style="margin-bottom:12px"><a class="btn o s" href="#/track/${esc(token)}">${ic(S.lang === 'ar' ? 'fwd' : 'back', 's')} ${esc(t('back'))}</a><button class="btn s" id="pr">${ic('print', 's')} ${esc(t('print'))}</button></div>${invoiceHtml(o)}`, { noBar: 1 });
  $('#pr').onclick = () => window.print();
}

/* ---------- customer settings ---------- */
function vSettings() {
  const s = S.settings; const c = S.cust;
  const th = ls.get('so_theme', ls.get('so_dark', false) ? 'dark' : 'light');
  const seg = (id, val, opts) => `<div class="seg" id="${id}">${opts.map(o => `<button data-v="${o[0]}" class="${o[0] === val ? 'on' : ''}">${o[1]}</button>`).join('')}</div>`;
  const tg = (id, on, lab, sub) => `<label class="tgl"><span><b>${esc(lab)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><i></i></label>`;
  const sv = ls.get('so_cust', {}); const nOrders = ls.get('so_orders', []).length; const nRec = ls.get('so_recent', []).length;
  const ios = /iPhone|iPad/.test(navigator.userAgent); const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const dw = s.whatsapp ? waNum(s.whatsapp) : '';
  page(`<div class="sec" style="margin-top:6px"><h2>${esc(t('settings'))}</h2></div>
   <div class="card setg"><h3>${ic('globe', 's')} ${esc(t('st_look'))}</h3>
     <div class="f"><span>${esc(t('st_lang'))}</span>${seg('sLang', S.lang, [['ar', 'العربية'], ['de', 'Deutsch']])}</div>
     <div class="f"><span>${esc(t('st_theme'))}</span>${seg('sTheme', th, [['light', ic('sun', 's') + ' ' + esc(t('st_l'))], ['dark', ic('moon', 's') + ' ' + esc(t('st_d'))], ['auto', esc(t('st_auto'))]])}</div>
     ${tg('sBig', ls.get('so_big', false), t('st_big'), t('st_big2'))}
     ${tg('sCalm', ls.get('so_calm', false), t('st_calm'), t('st_calm2'))}</div>
   <div class="card setg"><h3>${ic('bell', 's')} ${esc(t('st_notify'))}</h3>
     ${tg('sNot', ls.get('so_cnotify', false) && 'Notification' in window && Notification.permission === 'granted', t('st_not'), t('st_not2'))}
     ${tg('sVib', ls.get('so_cvib', true), t('st_vib'), t('st_vib2'))}</div>
   ${standalone ? '' : `<div class="card setg"><h3>${ic('home', 's')} ${esc(t('st_app'))}</h3><p class="note">${esc(t('st_app2'))}</p>
     ${ios ? `<p class="note">${esc(t('st_ios'))}</p>` : `<button class="btn s" id="sInst">${esc(t('st_install'))}</button>`}</div>`}
   <div class="card setg"><h3>${ic('user', 's')} ${esc(t('account'))}</h3>
     ${c ? `<div class="sum"><span>${esc(c.name || '')}</span><span dir="ltr">${esc(c.email)}</span></div><div class="acts" style="margin-top:8px"><a class="btn s o" href="#/account">${esc(t('profile'))}</a><button class="btn s r" id="sDel">${esc(t('st_delacc'))}</button></div>`
          : `<p class="note">${esc(t('loginhint'))}</p><a class="btn s" href="#/account">${esc(t('login'))}</a>`}</div>
   <div class="card setg"><h3>${ic('box', 's')} ${esc(t('st_data'))}</h3><p class="note">${esc(t('st_data2'))}</p>
     <div class="li"><div class="t"><b>${esc(t('st_saved'))}</b><small>${esc([sv.name, sv.street, sv.plz].filter(Boolean).join(', ') || '—')}</small></div><button class="btn s o" data-clr="so_cust" ${sv.name || sv.street ? '' : 'disabled'}>${esc(t('st_clear'))}</button></div>
     <div class="li"><div class="t"><b>${esc(t('st_recent'))}</b><small>${nRec}</small></div><button class="btn s o" data-clr="so_recent" ${nRec ? '' : 'disabled'}>${esc(t('st_clear'))}</button></div>
     <div class="li"><div class="t"><b>${esc(t('st_orders'))}</b><small>${nOrders}</small></div><button class="btn s o" data-clr="so_orders" ${nOrders ? '' : 'disabled'}>${esc(t('st_clear'))}</button></div></div>
   <div class="card setg"><h3>${ic('chat', 's')} ${esc(t('st_help'))}</h3>
     <div class="acts">${dw ? `<a class="btn s o" target="_blank" rel="noopener noreferrer" href="https://wa.me/${esc(dw)}">${ic('chat', 's')} WhatsApp</a>` : ''}${s.phone ? `<a class="btn s o" href="tel:${esc(s.phone)}">${ic('phone', 's')} ${esc(s.phone)}</a>` : ''}${s.email ? `<a class="btn s o" href="mailto:${esc(s.email)}">${esc(s.email)}</a>` : ''}</div>
     <div class="acts" style="margin-top:10px"><a class="lnk" href="#/impressum">Impressum</a><a class="lnk" href="#/datenschutz">${esc(t('privacy'))}</a><a class="lnk" href="#/agb">${esc(t('terms'))}</a></div></div>
   <p class="note" style="text-align:center">Stein & Olive · ${esc(t('st_ver'))} 2026.11.22</p>`, { tab: 'account' });
  $$('#sLang button').forEach(b => b.onclick = () => { setLang(b.dataset.v); route(); });
  $$('#sTheme button').forEach(b => b.onclick = () => { ls.set('so_theme', b.dataset.v); applyPrefs(); $$('#sTheme button').forEach(x => x.classList.toggle('on', x === b)); });
  $('#sBig').onchange = e => { ls.set('so_big', e.target.checked); applyPrefs(); };
  $('#sCalm').onchange = e => { ls.set('so_calm', e.target.checked); applyPrefs(); };
  $('#sVib').onchange = e => ls.set('so_cvib', e.target.checked);
  $('#sNot').onchange = async e => {
    if (!e.target.checked) { ls.set('so_cnotify', false); return; }
    if (!('Notification' in window)) { e.target.checked = false; return toast(t('st_nosupp'), 1); }
    const p = await Notification.requestPermission();
    if (p !== 'granted') { e.target.checked = false; return toast(t('st_denied'), 1); }
    ls.set('so_cnotify', true); toast(t('st_notok'));
  };
  if ($('#sInst')) $('#sInst').onclick = async () => { if (!installEvt) return toast(t('st_inst2')); installEvt.prompt(); try { await installEvt.userChoice; } catch (_) {} installEvt = null; };
  $$('[data-clr]').forEach(b => b.onclick = () => { if (!confirm(t('st_sure'))) return; ls.set(b.dataset.clr, b.dataset.clr === 'so_cust' ? {} : []); toast(t('st_done')); vSettings(); });
  if ($('#sDel')) $('#sDel').onclick = () => modal(`<button class="ib x" data-close>${ic('x')}</button><h3>${esc(t('st_delacc'))}</h3><p class="note">${esc(t('st_del2'))}</p>
      <label class="f"><span>${esc(t('password'))}</span><input type="password" id="dPw" autocomplete="current-password"></label><button class="btn r full" id="dGo">${esc(t('st_delacc'))}</button>`, m => {
    $('#dGo', m).onclick = async () => {
      const { data, error } = await sb.rpc('customer_delete', { p_token: S.ctoken, p_password: $('#dPw', m).value });
      if (error || !data) return toast(errMsg(error || 'login'), 1);
      setCustToken(null); S.cust = null; closeModal(); toast(t('st_deleted')); location.hash = '#/';
    };
  });
}

/* ---------- password reset ---------- */
function forgotSheet(pre) {
  modal(`<button class="ib x" data-close aria-label="${esc(t('back'))}">${ic('x')}</button><h3>${esc(t('forgot_t'))}</h3>
    <div id="fgBody"><p class="note">${esc(t('forgot_p'))}</p>
    <form id="fgF" novalidate><label class="f"><span>${esc(t('email'))}</span><input type="email" id="fgE" autocomplete="email" maxlength="120" value="${esc(pre || '')}"></label>
    <button class="btn full" type="submit">${esc(t('forgot_send'))}</button></form></div>`, el => {
    const f = $('#fgF', el); setTimeout(() => $('#fgE', el).focus(), 50);
    f.onsubmit = async e => {
      e.preventDefault();
      const email = clean($('#fgE', el).value, 120).toLowerCase();
      if (!/^[^\s@<>"']+@[^\s@<>"']+\.[a-z]{2,}$/i.test(email)) return toast(t('e_email'), 1);
      if (!allow('reset', 3, 300)) return;
      const b = $('button[type=submit]', f); b.disabled = true;
      const { error } = await sb.rpc('customer_reset_request', { p_email: email, p_lang: S.lang });
      b.disabled = false;
      if (error) return toast(errMsg(error), 1);
      $('#fgBody', el).innerHTML = `<div class="infobox">${ic('check', 's')}<span>${esc(t('forgot_ok'))}</span></div><button class="btn o full" data-close>OK</button>`;
      $$('[data-close]', el).forEach(x => x.onclick = closeModal);
    };
  });
}
function vReset(token) {
  if (!/^[0-9a-f]{64}$/.test(token || '')) { location.hash = '#/account'; return; }
  page(`<div style="max-width:440px;margin:10px auto"><div class="card"><h2 style="font-size:20px;margin-bottom:10px">${esc(t('reset_t'))}</h2>
    <form id="rsF" novalidate><label class="f"><span>${esc(t('newpass'))}</span><input type="password" id="r1" autocomplete="new-password" minlength="8" maxlength="200" required></label>
    <label class="f"><span>${esc(t('newpass2'))}</span><input type="password" id="r2" autocomplete="new-password" minlength="8" maxlength="200" required></label>
    <button class="btn full" type="submit">${esc(t('save'))}</button></form></div></div>`, { tab: 'account', noBar: 1 });
  $('#rsF').onsubmit = async e => {
    e.preventDefault();
    const a = $('#r1').value, b = $('#r2').value;
    if (a.length < 8) return toast(t('e_password'), 1);
    if (a !== b) return toast(t('e_nomatch'), 1);
    if (!allow('resetok', 5, 60)) return;
    const btn = $('#rsF button'); btn.disabled = true;
    const { data, error } = await sb.rpc('customer_reset_confirm', { p_token: token, p_new: a });
    btn.disabled = false;
    if (error) return toast(errMsg(error), 1);
    try { history.replaceState(null, '', location.pathname + '#/account'); } catch (_) {}
    setCustToken(data); await loadCustomer(); toast(t('reset_ok')); route();
  };
}

/* ---------- account ---------- */
async function vAccount(sub) {
  const next = (location.hash.split('?')[1] || '').replace('next=', '');
  await loadCustomer();
  if (!S.cust) {
    const mode = sub === 'register' ? 'register' : 'login';
    page(`<div style="max-width:440px;margin:10px auto">
      <div class="seg" style="margin-bottom:12px"><button data-m="login" class="${mode === 'login' ? 'on' : ''}">${esc(t('login'))}</button><button data-m="register" class="${mode === 'register' ? 'on' : ''}">${esc(t('register'))}</button></div>
      <div class="card"><form id="af" novalidate>
        ${mode === 'register' ? `<label class="f"><span>${esc(t('name'))}</span><input type="text" id="aN" autocomplete="name" maxlength="80" required></label><label class="f"><span>${esc(t('phone'))}</span><input type="tel" id="aP" autocomplete="tel" maxlength="40"></label>` : ''}
        <label class="f"><span>${esc(t('email'))}</span><input type="email" id="aE" autocomplete="email" maxlength="120" required></label>
        <label class="f"><span>${esc(t('password'))}</span><input type="password" id="aW" autocomplete="${mode === 'register' ? 'new-password' : 'current-password'}" minlength="8" maxlength="200" required></label>
        <button class="btn full" type="submit" style="margin-top:6px">${esc(mode === 'register' ? t('register') : t('login'))}</button></form>
        ${mode === 'login' ? `<button type="button" class="lnk" id="fgBtn">${esc(t('forgot'))}</button>` : ''}</div>
      ${next === 'checkout' ? `<a class="btn o full" href="#/checkout">${esc(t('orguest'))}</a>` : ''}
      ${ls.get('so_orders', []).length ? `<div class="card"><h3>${esc(t('myorders'))}</h3>${ls.get('so_orders', []).slice(0, 10).map(o => `<a class="li" style="color:inherit;text-decoration:none" href="#/track/${esc(o.token)}"><div class="t"><b>#${+o.id}</b><small>${fmtDate(o.at)}</small></div>${ic(S.lang === 'ar' ? 'back' : 'fwd', 's')}</a>`).join('')}</div>` : ''}
    </div>`, { tab: 'account' });
    $$('[data-m]').forEach(b => b.onclick = () => { location.hash = '#/account' + (b.dataset.m === 'register' ? '/register' : '') + (next ? '?next=' + next : ''); });
    if ($('#fgBtn')) $('#fgBtn').onclick = () => forgotSheet(($('#aE').value || '').trim());
    $('#af').onsubmit = async e => {
      e.preventDefault();
      const email = clean($('#aE').value, 120).toLowerCase(), pw = $('#aW').value;
      if (!/^[^\s@<>"']+@[^\s@<>"']+\.[a-z]{2,}$/i.test(email)) return toast(t('e_email'), 1);
      if (pw.length < 8) return toast(t('e_password'), 1);
      if (!allow('auth', 5, 60)) return;
      const btn = $('#af button'); btn.disabled = true;
      const r = mode === 'register' ? await sb.rpc('customer_register', { p_email: email, p_password: pw, p_name: clean($('#aN').value, 80), p_phone: clean($('#aP').value, 40) })
                                    : await sb.rpc('customer_login', { p_email: email, p_password: pw });
      btn.disabled = false;
      if (r.error) return toast(errMsg(r.error), 1);
      if (!r.data) return toast(t('e_login'), 1);
      setCustToken(r.data); await loadCustomer(); toast(t('welcome') + (S.cust && S.cust.name ? ' ' + S.cust.name : ''));
      const target = next === 'checkout' ? '#/checkout' : '#/account'; if (location.hash === target) route(); else location.hash = target;
    };
    return;
  }
  const c = S.cust;
  page(`<div class="card acc-h"><div class="avatar">${esc((c.name || c.email || '?').trim().charAt(0).toUpperCase())}</div><div style="flex:1;min-width:0"><h2 style="font-size:20px">${esc(t('welcome'))} ${esc(c.name || '')}</h2><div class="note">${esc(c.email)}</div></div>
     <button class="btn s o" id="lo">${ic('logout', 's')} ${esc(t('logout'))}</button></div>
    <div class="sec"><h2>${esc(t('myorders'))}</h2></div><div id="olist"><div class="empty">…</div></div>
    <div class="sec"><h2>${esc(t('profile'))}</h2></div>
    <div class="card"><div class="row"><label class="f"><span>${esc(t('name'))}</span><input type="text" id="pN" maxlength="80" value="${esc(c.name)}"></label><label class="f"><span>${esc(t('phone'))}</span><input type="tel" id="pP" maxlength="40" value="${esc(c.phone)}"></label></div>
     <label class="f"><span>${esc(t('street'))}</span><input type="text" id="pS" maxlength="160" value="${esc(c.street)}"></label>
     <div class="row"><label class="f"><span>${esc(t('plz'))}</span><input type="text" inputmode="numeric" id="pZ" maxlength="5" value="${esc(c.plz)}"></label><label class="f"><span>${esc(t('city'))}</span><input type="text" id="pC" maxlength="80" value="${esc(c.city)}"></label></div>
     <label class="f"><span>${esc(t('addrnote'))}</span><input type="text" id="pA" maxlength="200" value="${esc(c.address_note)}"></label>
     <button class="btn" id="pSave">${esc(t('save'))}</button></div>
    <div class="card"><h3>${ic('key', 's')} ${esc(t('changepass'))}</h3><div class="row"><label class="f"><span>${esc(t('oldpass'))}</span><input type="password" id="w1" autocomplete="current-password"></label><label class="f"><span>${esc(t('newpass'))}</span><input type="password" id="w2" autocomplete="new-password" minlength="8"></label></div>
     <button class="btn o" id="wGo">${esc(t('save'))}</button></div>`, { tab: 'account' });
  $('#lo').onclick = async () => { await sb.rpc('customer_logout', { p_token: S.ctoken }); setCustToken(null); S.cust = null; route(); };
  $('#pSave').onclick = async () => { const p = { name: clean($('#pN').value, 80), phone: clean($('#pP').value, 40), street: clean($('#pS').value, 160), plz: clean($('#pZ').value, 10), city: clean($('#pC').value, 80), address_note: clean($('#pA').value, 200) };
    const { error } = await sb.rpc('customer_update', { p_token: S.ctoken, p }); if (error) return toast(errMsg(error), 1); toast(t('saved')); };
  $('#wGo').onclick = async () => { if ($('#w2').value.length < 8) return toast(t('e_password'), 1); const { error } = await sb.rpc('customer_password', { p_token: S.ctoken, p_old: $('#w1').value, p_new: $('#w2').value }); if (error) return toast(errMsg(error), 1); $('#w1').value = $('#w2').value = ''; toast(t('saved')); };
  const { data: orders, error } = await sb.rpc('customer_orders', { p_token: S.ctoken });
  const ol = $('#olist'); if (!ol) return;
  if (error) { ol.innerHTML = `<div class="empty">${esc(errMsg(error))}</div>`; return; }
  ol.innerHTML = orders.length ? orders.map(o => `<div class="card"><div class="sum"><b>#${+o.id}</b><span class="pill ${['delivered', 'picked_up'].includes(o.status) ? 'ok' : o.status === 'cancelled' ? 'bad' : 'warn'}">${esc(t('st_' + o.status))}</span></div>
     <div class="note">${fmtDate(o.created_at)} · ${esc(t(o.mode === 'delivery' ? 'deliv' : 'pickup'))} · ${money(o.total)}</div>
     <div class="note" style="margin-top:4px">${esc(o.items.map(i => LL(i.name_ar, i.name_de)).slice(0, 4).join('، '))}${o.items.length > 4 ? ' …' : ''}</div>
     <div class="acts" style="margin-top:10px"><a class="btn s o" href="#/track/${esc(o.token)}">${esc(t('track'))}</a><button class="btn s o" data-re="${+o.id}">${ic('repeat', 's')} ${esc(t('reorder'))}</button></div></div>`).join('')
    : `<div class="empty">${ic('bag')}<p>${esc(t('noorders'))}</p><a class="btn" href="#/">${esc(t('toshop'))}</a></div>`;
  $$('[data-re]', ol).forEach(b => b.onclick = () => { const o = orders.find(x => x.id === +b.dataset.re); let n = 0;
    o.items.forEach(i => { const p = prodById(i.product_id); if (p && p.active && !soldOut(p) && !needsSheet(p)) { S.cart.push({ product_id: p.id, qty: +i.qty, options: [], k: uid() }); n++; } });
    saveCart(); toast(n ? t('added') : t('e_product'), !n); if (n) location.hash = '#/cart'; });
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
     <p><b>3. Kundenkonto</b><br>Wenn du ein Konto anlegst, speichern wir E-Mail, Name, Telefon, Adresse und ein verschlüsseltes Passwort (bcrypt), damit du Bestellungen und Adresse wiedersehen kannst. Du kannst die Löschung jederzeit verlangen.</p>
     <p><b>4. Hosting und Datenbank</b><br>Die Website wird über GitHub Pages (GitHub Inc., USA; EU-Standardvertragsklauseln / EU-US Data Privacy Framework) ausgeliefert. Bestell- und Kontodaten werden bei Supabase in einem Rechenzentrum in Frankfurt am Main (EU) gespeichert.</p>
     <p><b>5. Lokale Speicherung</b><br>Warenkorb, Sprache, Darstellung und deine Anmeldung werden nur lokal in deinem Browser gespeichert (technisch notwendig). Es gibt keine Tracking- oder Werbe-Cookies. Schriften werden lokal geladen.</p>
     <p><b>6. Kartenanzeige und Bilder</b><br>Bei der Live-Verfolgung einer Lieferung wird eine Karte von OpenStreetMap geladen; dabei wird deine IP-Adresse an die OpenStreetMap Foundation übertragen. Einige Produktbilder werden von Wikimedia Commons geladen.</p>
     <p><b>7. Zahlung mit PayPal</b><br>Wenn du PayPal wählst, wirst du zu PayPal (Europe) S.à r.l. et Cie, S.C.A., Luxemburg weitergeleitet; dort gelten deren Datenschutzbestimmungen.</p>
     <p><b>8. Deine Rechte</b><br>Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch und Beschwerde bei einer Aufsichtsbehörde (z. B. Hamburgische Beauftragte für Datenschutz und Informationsfreiheit).</p></div>`;
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
  document.body.classList.add('tvmode'); document.body.style.cursor = 'none';
  let pageNo = 0;
  const render = () => {
    const prods = visibleProducts(id).filter(p => !soldOut(p));
    const cats = S.cats.filter(c => c.shop_id === id);
    const blocks = [];
    cats.forEach(c => { const l = prods.filter(p => p.category_id === c.id); if (l.length) { blocks.push({ cat: c }); l.forEach(p => blocks.push({ p })); } });
    prods.filter(p => !cats.some(c => c.id === p.category_id)).forEach(p => blocks.push({ p }));
    const per = 15; const pages = Math.max(1, Math.ceil(blocks.length / per)); pageNo = pageNo % pages;
    const chunk = blocks.slice(pageNo * per, pageNo * per + per);
    $('#app').innerHTML = `<div class="tv"><div class="th"><img src="logo.png" alt=""><h1>${esc(sh.name_ar)} · ${esc(sh.name_de)}</h1><div style="font-size:3vh;color:#99978A">${pages > 1 ? (pageNo + 1) + ' / ' + pages : ''}</div></div>
      <div class="tg">${chunk.map(b => b.cat ? `<div class="cat">${esc(b.cat.name_ar)} · ${esc(b.cat.name_de)}</div>` : `<div class="ti">${safeUrl(b.p.image_url) ? `<img src="${esc(safeUrl(b.p.image_url))}" alt="">` : '<div class="ph"></div>'}<div><b>${esc(b.p.name_ar)}</b><small>${esc(b.p.name_de)}</small><span class="p">${priceText(b.p)}</span></div></div>`).join('')}</div></div>`;
  };
  render();
  let tick = 0;
  tvTimer = setInterval(async () => { tick++; pageNo++; if (tick % 5 === 0) { try { await loadData(); } catch (e) {} } render(); }, 12000);
}

/* ---------- router ---------- */
async function route() {
  const h = location.hash.replace(/^#\/?/, '').split('?')[0];
  const [r, a] = h.split('/');
  if (r !== 'screen') { clearInterval(tvTimer); document.body.style.cursor = ''; }
  if (r !== 'track') clearInterval(trackTimer);
  if (!$('#modal').hidden) closeModal();
  const ss = $('.ssheet'); if (ss) { ss.remove(); document.body.style.overflow = ''; }
  if (window.Admin && Admin.leave) Admin.leave(r);
  window.scrollTo(0, 0);
  page.nav = true;
  if (r === 'login' || r === 'team' || r === 'admin' || r === 'driver') return window.Admin.route(r, a, h.split('/').slice(1));
  if (r === 'shop') return vShop(decodeURIComponent(a || ''));
  if (r === 'cart') return vCart();
  if (r === 'checkout') return vCheckout();
  if (r === 'track') return vTrack(a);
  if (r === 'invoice') return vInvoice(a);
  if (r === 'orders') { location.hash = '#/account'; return; }
  if (r === 'account') return vAccount(a);
  if (r === 'reset') return vReset(a);
  if (r === 'settings') return vSettings();
  if (r === 'impressum' || r === 'datenschutz' || r === 'agb') return vLegal(r);
  if (r === 'screen') return vScreen(decodeURIComponent(a || ''));
  return vHome();
}

async function start() {
  setLang(S.lang);
  try { await loadData(); }
  catch (e) { $('#app').innerHTML = `<div class="boot" style="flex-direction:column;display:flex;align-items:center;justify-content:center;gap:16px;color:#EFEBE2"><img src="logo.png" alt=""><p>${esc(errMsg(e))}</p><button class="btn" id="rl">${ic('refresh', 's')}</button></div>`; $('#rl').onclick = () => location.reload(); return; }
  window.addEventListener('hashchange', route);
  route();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

window.App = { start, sb, S, CFG, t, L, LL, esc, money, fq, $, $$, toast, modal, closeModal, errMsg, loadData, fetchAll, shopById, prodById, page, setLang,
  ALLERGENS, DAYS, fmtDate, qrSvg, receiptHtml, invoiceHtml, route, isOpenNow, uid, priceLabel, priceText, ic, shopIc, bgImg, safeUrl, clean, allow, waNum, DOMAIN: CFG.loginDomain };
})();
