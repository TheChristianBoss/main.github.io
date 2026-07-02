// Service worker for Open Bible Library.
//
// Strategy, deliberately simple and dependency-free (no vite-plugin-pwa,
// no Workbox -- just the Cache API):
//
//  - App shell (HTML/CSS/JS bundle, manifest, icon): cache-first, with a
//    background revalidation so updates still arrive eventually. These
//    are small and the same for every user, so caching them eagerly on
//    install costs nothing.
//
//  - Bible data (translations, concordance shards, cross-ref shards
//    under src/data/* once built, or their hashed dist equivalents):
//    cache-first, populated lazily. We deliberately do NOT precache the
//    library -- it's ~373MB uncompressed across every translation, and
//    almost nobody reads all of them. Whatever a person actually opens
//    gets cached automatically the first time, then works offline from
//    then on.
//
//  - Navigation requests (the app itself, any route): network-first so
//    people get the latest build when online, falling back to the
//    cached shell, then to offline.html, when there's no connection.

const VERSION = 'v2-concordance'
const SHELL_CACHE = `obl-shell-${VERSION}`
const DATA_CACHE = `obl-data-${VERSION}`

// Resolve the SW's own scope so this works whether the app is deployed
// at the domain root or under a sub-path (see vite.config.js `base`).
const SCOPE = self.registration ? self.registration.scope : self.location.href
const OFFLINE_URL = new URL('offline.html', SCOPE).pathname
const MANIFEST_URL = new URL('manifest.webmanifest', SCOPE).pathname
const ICON_URL = new URL('icon.svg', SCOPE).pathname

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      cache.addAll([OFFLINE_URL, MANIFEST_URL, ICON_URL]).catch(() => {
        // Best-effort -- a missing optional asset shouldn't block install.
      })
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== DATA_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

function isDataRequest(url) {
  return /\/(src\/data|assets|concordance|crossrefs|data)\/.*\.json$/.test(url.pathname)
}

function isBuildAsset(url) {
  return /\.(js|css|woff2?|svg|png|jpg|jpeg)$/.test(url.pathname)
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // let cross-origin (fonts CDN, etc.) pass through normally

  // Navigations: network-first, falling back to cache, then offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, response.clone()))
          return response
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    )
    return
  }

  // Bible data (translations, concordance shards, cross-ref shards):
  // cache-first, populated on first use. This is what makes "open a
  // translation once, read it offline forever after" work without ever
  // shipping the whole 373MB library up front.
  if (isDataRequest(url)) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        const cached = await cache.match(request)
        if (cached) return cached
        try {
          const response = await fetch(request)
          if (response.ok) cache.put(request, response.clone())
          return response
        } catch (err) {
          if (cached) return cached
          throw err
        }
      })
    )
    return
  }

  // App shell build assets (JS/CSS/fonts/images): cache-first with a
  // silent background revalidation, so repeat visits are instant and
  // offline visits still work, while updates still propagate eventually.
  if (isBuildAsset(url)) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cached = await cache.match(request)
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone())
            return response
          })
          .catch(() => null)
        return cached || (await networkFetch) || Response.error()
      })
    )
  }
})
