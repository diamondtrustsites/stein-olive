const C='so-v10';const SHELL=['./','index.html','style.css?v=10','config.js?v=10','app.js?v=10','admin.js?v=10','boot.js?v=10','logo.png','lib/supabase.js','lib/qrcode.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));}return r}).catch(()=>caches.match(e.request)))});
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(_){d={title:'Stein & Olive',body:e.data?e.data.text():''}}
e.waitUntil(self.registration.showNotification(d.title||'Stein & Olive',{body:d.body||'',tag:d.tag||'so',renotify:true,requireInteraction:true,icon:'icon-192.png',badge:'icon-192.png',vibrate:[200,100,200,100,300],data:{url:d.url||'./'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const url=(e.notification.data&&e.notification.data.url)||'./';
e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(ws=>{for(const w of ws){if(w.url.split('#')[0]===url.split('#')[0]){w.focus();return w.navigate?w.navigate(url):null}}return self.clients.openWindow(url)}))});
