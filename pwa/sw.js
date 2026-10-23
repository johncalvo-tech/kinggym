/* Service worker: actualizaciones con aviso; no almacena datos de miembros. */
const VERSION = '__VERSION__';
const CACHE = 'gym-' + VERSION;
const ARCHIVOS = __ARCHIVOS__;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ARCHIVOS)));
});
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'ACTIVATE_UPDATE') self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith('gym-') && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('config.js')) {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(url.origin + url.pathname, copy));
      return response;
    }).catch(() => caches.match(request, { ignoreSearch: true }).then(response => response || caches.match('index.html'))));
    return;
  }
  event.respondWith(caches.match(request).then(response => response || fetch(request)));
});
