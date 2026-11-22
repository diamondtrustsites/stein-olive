/* Start + Schutz gegen Einbetten in fremde Seiten (Clickjacking) */
(function () {
  try { if (window.top !== window.self) { document.documentElement.style.display = 'none'; window.top.location = window.self.location.href; return; } }
  catch (e) { document.documentElement.style.display = 'none'; return; }
  var appKind = document.documentElement.getAttribute('data-app'); // 'team' | 'fahrer' | null (Kunden-Seite)
  try {
    if (!appKind && /\/$/.test(location.pathname)) {
      // Kunden-App liegt unter /index.html, damit Team- und Fahrer-App eigene Apps auf dem Handy sein können.
      history.replaceState(null, '', location.pathname + 'index.html' + location.search + location.hash);
    }
    if (appKind && !/^#\/./.test(location.hash)) history.replaceState(null, '', location.pathname + location.search + (appKind === 'fahrer' ? '#/driver' : '#/team'));
  } catch (_) {}
  if (appKind) {
    // Team-/Fahrer-Seite nutzt <base href="../">: Links wie "#/admin/orders" sollen auf dieser Seite bleiben.
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a || a.target === '_blank' || a.hasAttribute('data-search') || e.defaultPrevented || e.ctrlKey || e.metaKey) return;
      e.preventDefault(); location.hash = a.getAttribute('href');
    }, true);
  }
  window.App.start();
})();
