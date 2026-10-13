const CACHE='clearstudy-workspace-v2';
const ASSETS=['./','./index.html','./style.css','./app.mjs','./core.mjs','./review.mjs','./review-ui.mjs','./icon.svg','./manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('clearstudy-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 const url=new URL(e.request.url),scope=new URL('./',self.location.href);
 const asset=ASSETS.some(a=>new URL(a,scope).pathname===url.pathname);
 if(!asset&&e.request.mode!=='navigate')return;
 e.respondWith(caches.open(CACHE).then(async cache=>{
  try{const response=await fetch(e.request);if(response.ok&&(asset||e.request.mode==='navigate'))await cache.put(e.request,response.clone());return response;}
  catch{const saved=await cache.match(e.request,{ignoreSearch:true});return saved||(e.request.mode==='navigate'?await cache.match(new URL('./',scope).href):null)||Response.error();}
 }));
});
