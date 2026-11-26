/* Stein & Olive – Menü-Bildschirm als Video (Endlosschleife).
   Aufruf: menu/video.html?s=1 (nur Karte)  bzw. ?s=2 (Spezialitäten, Pizza, Süßes …)
   Klappt das Video nicht, wird die animierte Seite (manakish.html) geöffnet. */
(function () {
  'use strict';
  const s = new URLSearchParams(location.search).get('s') === '2' ? '2' : '1';
  const v = document.getElementById('v');
  const fallback = () => location.replace('manakish.html?s=' + s);
  v.addEventListener('error', fallback);
  v.src = 'video/bildschirm-' + s + '.mp4';
  const play = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  play();
  // Antippen/Taste: Vollbild + weiterspielen
  const fs = () => { const d = document.documentElement; if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen().catch(() => {}); play(); };
  addEventListener('click', fs); addEventListener('keydown', fs);
  // falls der Fernseher das Video anhält: wieder starten
  setInterval(() => { if (v.paused) play(); }, 5000);
  // einmal pro Tag neu laden (neue Version holen)
  setTimeout(() => location.reload(), 24 * 3600 * 1000);
})();
