const CACHE_NAME = 'solar-exec-ui-v10';
const APP_SHELL = ['/', '/manifest.webmanifest', '/offline.html', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png', '/logo.png', '/home-main-bg.jpg', '/method-bg.jpg', '/final-bg.jpg'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => {
    const fresh = fetch(event.request).then((response) => {
      if (response && response.status === 200 && event.request.url.startsWith(self.location.origin)) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => event.request.mode === 'navigate' ? caches.match('/offline.html') : cached);
    return cached || fresh;
  }));
});
