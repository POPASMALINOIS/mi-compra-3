const CACHE="mi-compra-3-v4";
importScripts('./logos1.js','./logos2a.js','./logos2b.js');
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys()){if(k!==CACHE)await caches.delete(k);}await self.clients.claim();})());});
function bytes(b64){const raw=atob(b64);const out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out;}
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  const name=u.pathname.split('/').pop();
  if(self.LOGOS&&self.LOGOS[name]){
    e.respondWith(Promise.resolve(new Response(bytes(self.LOGOS[name]),{status:200,headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=31536000, immutable'}})));
    return;
  }
  if(e.request.method!=='GET')return;
  e.respondWith((async()=>{
    try{
      const r=await fetch(e.request);
      if(r.ok){const c=await caches.open(CACHE);c.put(e.request,r.clone()).catch(()=>{});}
      return r;
    }catch(err){
      const c=await caches.open(CACHE);
      return (await c.match(e.request))||(await c.match('./index.html'))||Response.error();
    }
  })());
});