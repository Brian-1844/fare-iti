/* Fare Iti service worker: keeps the game playable offline.
   Change VERSION whenever you upload new game files, so phones fetch the update. */
const VERSION='fare-iti-v11';
const FILES=['./','index.html','style.css','data.js','fr.js','lang.js','game.js','lib/three.min.js','manifest.webmanifest',
  'icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
/* network first for the game files (so updates arrive), cache as fallback when offline */
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==location.origin){e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{const c=res.clone();caches.open(VERSION).then(ca=>ca.put(req,c)).catch(()=>{});return res;}).catch(()=>r)));return;}
  e.respondWith(fetch(req).then(res=>{if(res.ok){const c=res.clone();caches.open(VERSION).then(ca=>ca.put(req,c));}return res;}).catch(()=>caches.match(req).then(r=>r||caches.match('index.html'))));});
