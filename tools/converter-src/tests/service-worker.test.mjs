import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const workerPath = path.resolve(here, '../public/sw.js');
const source = await fs.readFile(workerPath, 'utf8');

assert.doesNotMatch(source, /converter-app\.(?:css|js)/, 'must not hardcode obsolete bundle names');
assert.match(source, /discoverBuiltAssets/, 'must discover hashed Vite assets from index.html');
assert.match(source, /key\.startsWith\(CACHE_PREFIX\)/, 'must only delete this converter’s caches');

const scope = 'https://example.test/tools/converter/';
const handlers = new Map();
const deletedCaches = [];
const cacheBuckets = new Map();
const network = new Map();
let networkOffline = false;
let skippedWaiting = false;
let claimedClients = false;

function requestUrl(value) {
  return typeof value === 'string' ? value : value.url;
}

function bucket(name) {
  if (!cacheBuckets.has(name)) cacheBuckets.set(name, new Map());
  const entries = cacheBuckets.get(name);
  return {
    async put(request, response) {
      entries.set(requestUrl(request), response.clone());
    },
    async match(request) {
      const response = entries.get(requestUrl(request));
      return response ? response.clone() : undefined;
    },
  };
}

const caches = {
  async open(name) {
    return bucket(name);
  },
  async keys() {
    return ['cg-file-converter-v5', 'bible-shell-v12', 'unrelated-app-cache'];
  },
  async delete(name) {
    deletedCaches.push(name);
    cacheBuckets.delete(name);
    return true;
  },
};

function addNetwork(url, body, init = {}) {
  network.set(url, new Response(body, { status: 200, ...init }));
}

addNetwork(`${scope}index.html`, `<!doctype html>
  <link rel="stylesheet" href="/tools/converter/assets/index-ABC123.css">
  <script type="module" src="/tools/converter/assets/index-XYZ789.js"></script>`);
addNetwork(`${scope}privacy.html`, '<h1>Privacy</h1>');
addNetwork(`${scope}test.html`, '<h1>Tests</h1>');
addNetwork(`${scope}manifest.webmanifest`, '{}', { headers: { 'content-type': 'application/manifest+json' } });
addNetwork(`${scope}assets/converter-icon.svg`, '<svg/>', { headers: { 'content-type': 'image/svg+xml' } });
addNetwork(`${scope}assets/index-ABC123.css`, 'body{}', { headers: { 'content-type': 'text/css' } });
addNetwork(`${scope}assets/index-XYZ789.js`, 'console.log("ok")', { headers: { 'content-type': 'text/javascript' } });

async function fetchMock(input) {
  if (networkOffline) throw new TypeError('offline');
  const url = requestUrl(input);
  const response = network.get(url);
  if (!response) return new Response('not found', { status: 404 });
  return response.clone();
}

const self = {
  registration: { scope },
  location: new URL(`${scope}sw.js`),
  clients: {
    async claim() {
      claimedClients = true;
    },
  },
  addEventListener(type, handler) {
    handlers.set(type, handler);
  },
  async skipWaiting() {
    skippedWaiting = true;
  },
};

vm.runInNewContext(source, {
  self,
  caches,
  fetch: fetchMock,
  URL,
  Request,
  Response,
  Headers,
  Promise,
  console,
  setTimeout,
  clearTimeout,
});

async function runWaitable(type, event = {}) {
  let promise;
  handlers.get(type)({
    ...event,
    waitUntil(value) {
      promise = Promise.resolve(value);
    },
  });
  await promise;
}

await runWaitable('install');
assert.equal(skippedWaiting, true, 'install should activate the new worker promptly');

const converterCache = cacheBuckets.get('cg-file-converter-v6');
assert.ok(converterCache, 'current converter cache should be created');
for (const expected of [
  scope,
  `${scope}index.html`,
  `${scope}assets/index-ABC123.css`,
  `${scope}assets/index-XYZ789.js`,
]) {
  assert.ok(converterCache.has(expected), `precache should contain ${expected}`);
}

await runWaitable('activate');
assert.deepEqual(deletedCaches, ['cg-file-converter-v5'], 'activation must preserve unrelated application caches');
assert.equal(claimedClients, true, 'activation should claim open converter pages');

networkOffline = true;
let responsePromise;
handlers.get('fetch')({
  request: new Request(`${scope}assets/index-XYZ789.js`, { mode: 'cors' }),
  respondWith(value) {
    responsePromise = Promise.resolve(value);
  },
});
assert.equal(await (await responsePromise).text(), 'console.log("ok")', 'hashed assets should work offline from cache');

handlers.get('fetch')({
  request: {
    url: `${scope}some/deep/link`,
    method: 'GET',
    mode: 'navigate',
    destination: 'document',
    headers: new Headers(),
  },
  respondWith(value) {
    responsePromise = Promise.resolve(value);
  },
});
assert.match(await (await responsePromise).text(), /index-XYZ789\.js/, 'offline navigation should fall back to the cached app shell');

console.log('Converter service-worker tests passed.');
