const CACHE_NAME = 'cg-file-converter-shell-v2';
const CORE_ASSETS = [
  '/tools/converter/',
  '/tools/converter/index.html',
  '/tools/converter/privacy.html',
  '/tools/converter/test.html',
  '/tools/converter/assets/converter-app.css',
  '/tools/converter/assets/converter-app.js',
  '/tools/converter/assets/converter-icon.svg',
  '/tools/converter/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => undefined));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith('/tools/converter/')) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      if (response.ok && (url.pathname.includes('/assets/') || url.pathname.endsWith('.html') || url.pathname.endsWith('.webmanifest'))) {
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => undefined);
      }
      return response;
    }).catch(() => cached || caches.match('/tools/converter/index.html')))
  );
});
