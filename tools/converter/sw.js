const CACHE_PREFIX = 'cg-file-converter-';
const CACHE_VERSION = 'v6';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
const SCOPE_URL = new URL(self.registration.scope);
const APP_PATH = SCOPE_URL.pathname.endsWith('/') ? SCOPE_URL.pathname : `${SCOPE_URL.pathname}/`;
const INDEX_URL = new URL('index.html', SCOPE_URL).href;

const STABLE_SHELL_PATHS = [
  'privacy.html',
  'test.html',
  'manifest.webmanifest',
  'assets/converter-icon.svg',
];

function isInsideConverter(url) {
  return url.origin === SCOPE_URL.origin && url.pathname.startsWith(APP_PATH);
}

function isCacheableResponse(response) {
  return Boolean(
    response
    && response.ok
    && response.type !== 'opaque'
    && !response.headers.has('content-range')
  );
}

function isRuntimeAsset(request, url) {
  if (!isInsideConverter(url)) return false;

  const destination = request.destination || '';
  if (['script', 'style', 'worker', 'font', 'image', 'manifest'].includes(destination)) return true;

  return /\.(?:css|gif|ico|jpe?g|js|mjs|png|svg|webmanifest|wasm|woff2?)$/i.test(url.pathname);
}

function discoverBuiltAssets(html) {
  const assets = new Set();
  const attributePattern = /(?:src|href)\s*=\s*["']([^"']+)["']/gi;

  for (const match of html.matchAll(attributePattern)) {
    try {
      const url = new URL(match[1], SCOPE_URL);
      if (isInsideConverter(url) && url.pathname.includes(`${APP_PATH}assets/`)) {
        assets.add(url.href);
      }
    } catch {
      // Ignore malformed or non-URL attributes.
    }
  }

  return [...assets];
}

async function fetchForCache(url, { required = false } = {}) {
  try {
    const response = await fetch(new Request(url, { cache: 'reload' }));
    if (!isCacheableResponse(response)) {
      if (required) throw new Error(`Required converter shell asset failed: ${url}`);
      return null;
    }
    return response;
  } catch (error) {
    if (required) throw error;
    return null;
  }
}

async function precacheShell() {
  const cache = await caches.open(CACHE_NAME);
  const indexResponse = await fetchForCache(INDEX_URL, { required: true });
  const indexHtml = await indexResponse.clone().text();

  await Promise.all([
    cache.put(INDEX_URL, indexResponse.clone()),
    cache.put(SCOPE_URL.href, indexResponse.clone()),
  ]);

  const optionalUrls = [
    ...STABLE_SHELL_PATHS.map((path) => new URL(path, SCOPE_URL).href),
    ...discoverBuiltAssets(indexHtml),
  ];

  await Promise.all(optionalUrls.map(async (url) => {
    const response = await fetchForCache(url);
    if (response) await cache.put(url, response);
  }));
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    await precacheShell();
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheableResponse(response)) await cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, { navigationFallback = false } = {}) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;

    if (navigationFallback) {
      const shell = await cache.match(INDEX_URL) || await cache.match(SCOPE_URL.href);
      if (shell) return shell;
    }

    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (request.headers.has('range')) return;

  const url = new URL(request.url);
  if (!isInsideConverter(url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, { navigationFallback: true }));
    return;
  }

  if (isRuntimeAsset(request, url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
