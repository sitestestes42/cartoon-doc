const CACHE_NAME = 'cartoon-doc-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/profiles.json',
  '/assets/intro.mp4',
  '/assets/intro-poster.jpg',
  '/assets/flavio.jpg',
  '/assets/augusto.jpg',
  '/assets/juan.jpg',
  '/assets/ricardo.jpg',
  '/assets/bg1.jpg', // Mencionou no contexto
  '/episodes.json',
  '/episodes.css',
  '/episodes-ui.js'
];

// Instalação: Cache inicial
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Cacheando assets iniciais');
        return cache.addAll(ASSETS);
      })
      .catch(err => console.error('SW falhou ao cachear:', err))
  );
  self.skipWaiting();
});

// Ativação: Limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Removendo cache antigo', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptação de Requests
self.addEventListener('fetch', (event) => {
  const isProfileJson = event.request.url.endsWith('profiles.json');

  if (isProfileJson) {
    // Network-first para o profiles.json
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clona a resposta para salvar no cache
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback para o cache se offline
          return caches.match(event.request);
        })
    );
  } else {
    // Cache-first para outros assets
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        
        return fetch(event.request).then(response => {
          // Opcional: Adicionar novos assets ao cache dinamicamente
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      }).catch(err => console.error('Fetch error:', err))
    );
  }
});
