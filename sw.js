/* Cache everything on install, then never touch the network again — the
   point of this app is that a pharmacy counter with no signal still works.
   Bump CACHE when you publish a new build and the old one is thrown away. */
const CACHE = 'drugfinder-aee9b4ed1f8e';
const FILES = ['./', 'index.html', 'app.bin', 'manifest.webmanifest',
               'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  // version.txt is the one file that must never come from the cache — it is
  // how the page finds out a newer build exists. Everything else is
  // cache-first, which is the whole point.
  if(e.request.url.includes('version.txt')){
    e.respondWith(fetch(e.request, {cache:'no-store'}).catch(() => new Response('')));
    return;
  }
  e.respondWith(
    caches.match(e.request, {ignoreSearch:true})
      .then(hit => hit || fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
        return res;
      }))
      .catch(() => caches.match('index.html'))
  );
});
