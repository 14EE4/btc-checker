const CACHE_NAME = 'btc-checker-v1';
const CORE_ASSETS = [
  './',
  'index.html',
  'widget.html',
  'script.js',
  'bitcoin_qr_8x.png',
  'manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  
  // 외부 API는 네트워크 우선으로 (캐싱 하지 않음)
  if (url.origin !== location.origin) {
    event.respondWith(fetch(event.request).catch(() => null));
    return;
  }

  // 로컬 자산은 캐시 우선
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
