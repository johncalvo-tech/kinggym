/* Service worker: permite instalar la app y abrirla rápido.
 * Solo guarda en caché los archivos de la app (nunca datos de miembros).
 * Las llamadas al servidor (Google) siempre van por internet. */
const VERSION = '__VERSION__';
const CACHE = 'gym-' + VERSION;
const ARCHIVOS = __ARCHIVOS__;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('gym-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // API y CDN: directo a internet
  if (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('config.js')) {
    // Páginas: primero internet (para recibir actualizaciones), si no hay, la copia guardada
    e.respondWith(
      fetch(req).then(r => { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); return r; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
    );
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
