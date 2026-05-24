const CACHE_NAME = 'cn-doc-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/profiles.json'
];

// install
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// activate
self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// fetch
self.addEventListener('fetch', (e) => {
  const req = e.request;
  // network-first for profiles.json
  if(req.url.endsWith('profiles.json')){
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }
  // cache-first for others
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
