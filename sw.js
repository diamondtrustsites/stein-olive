const C='so-v25';const SHELL=['./','index.html','style.css?v=25','config.js?v=25','app.js?v=25','admin.js?v=25','boot.js?v=25','logo.png','logo-dark.png','lib/supabase.js','lib/qrcode.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));}return r}).catch(()=>caches.match(e.request)))});
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(_){d={title:'Stein & Olive',body:e.data?e.data.text():''}}
e.waitUntil(self.registration.showNotification(d.title||'Stein & Olive',{body:d.body||'',tag:d.tag||'so',renotify:true,requireInteraction:true,icon:'icon-192.png',badge:'icon-192.png',vibrate:[200,100,200,100,300],data:{url:d.url||'./'}}))});
/* Fahrer-Mitteilungen öffnen die Fahrer-App, Team-Mitteilungen die Team-App */
function appUrl(u){try{const x=new URL(u,self.registration.scope);if(x.origin!==location.origin)return x.href;const root=self.registration.scope;
if(/^#\/driver/.test(x.hash))return root+'fahrer/'+x.hash;if(/^#\/(admin|team|login)/.test(x.hash))return root+'team/'+x.hash;return x.href}catch(_){return u}}
const base=u=>u.split('#')[0].replace(/index\.html$/,'');
self.addEventListener('notificationclick',e=>{e.notification.close();const url=appUrl((e.notification.data&&e.notification.data.url)||'./');const h='#'+(url.split('#')[1]||'');
e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(ws=>{
const w=ws.find(x=>base(x.url)===base(url));if(w){w.focus();return w.navigate?w.navigate(url):null}
const r=h.split('/').slice(0,2).join('/');const w2=h.length>2&&ws.find(x=>x.url.indexOf(r)>0);if(w2){w2.focus();return w2.navigate?w2.navigate(w2.url.split('#')[0]+h):null}
return self.clients.openWindow(url)}))});
