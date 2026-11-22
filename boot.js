/* Start + Schutz gegen Einbetten in fremde Seiten (Clickjacking) */
(function () {
  try { if (window.top !== window.self) { document.documentElement.style.display = 'none'; window.top.location = window.self.location.href; return; } }
  catch (e) { document.documentElement.style.display = 'none'; return; }
  window.App.start();
})();
