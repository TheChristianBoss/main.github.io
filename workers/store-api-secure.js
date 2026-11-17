// Cloudflare Worker — Christian Goblin Store API, hardened checkout version
//
// Required Cloudflare secrets:
//   PRINTFUL_TOKEN        — Printful private token
//   STRIPE_SECRET_KEY     — Stripe secret key
//   STRIPE_WEBHOOK_SECRET — Stripe webhook signing secret
//   DISCORD_WEBHOOK_URL  — Discord webhook for paid service-order notifications
//
// Required binding:
//   STORE_ORDER_KV        — KV namespace used to prevent duplicate Printful/service fulfillment
//
// Routes:
//   GET  /products        → list all sync products
//   GET  /product?id=     → single product with variants
//   GET  /services        → list manual service products
//   GET  /service?id=     → single service product
//   POST /checkout        → hosted service checkout or embedded physical checkout
//   POST /shipping/options → quote exact Printful shipping into embedded Checkout
//   GET  /session?id=     → sanitized Stripe Checkout session summary for success page
//   POST /webhook         → Stripe webhook → create/reconcile/optionally confirm Printful order

const SITE = 'https://christiangoblin.com';
const ALLOWED_ORIGINS = new Set([
  'https://christiangoblin.com',
  'https://www.christiangoblin.com',
  'https://christiangoblin.github.io',
  'http://localhost:8787',
  'http://127.0.0.1:8787',
]);

// A customer supplies the delivery address before Stripe checkout is created.
// The server obtains Printful's exact rate and binds that rate to a payment-capable
// Checkout Session. No temporary $0 shipping option is ever exposed for a new cart.
// Legacy dynamically-quoted sessions are accepted only for signed webhook recovery.
const SHIPPING_COUNTRIES = new Set(['US', 'CA', 'GB', 'AU']);
const QUOTE_KEY_PREFIX = 'printful-shipping-quote:';
const SHIPPING_QUOTE_FLOW = 'printful_dynamic_v1'; // Legacy sessions only.
const SHIPPING_PREQUOTED_FLOW = 'printful_prequoted_v2';

function cleanAddressField(value, max = 140) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, max);
}

function normalizeShippingAddress(details) {
  const raw = details?.address;
  if (!raw || typeof raw !== 'object') throw new Error('Shipping address is required');
  const address = {
    country: cleanAddressField(raw.country, 2).toUpperCase(),
    state: cleanAddressField(raw.state, 80).toUpperCase(),
    postal_code: cleanAddressField(raw.postal_code, 24).toUpperCase(),
    city: cleanAddressField(raw.city, 90).toUpperCase(),
    line1: cleanAddressField(raw.line1, 140).toUpperCase(),
    line2: cleanAddressField(raw.line2, 140).toUpperCase(),
  };
  if (!SHIPPING_COUNTRIES.has(address.country) || !address.line1 || !address.city ||
      !address.postal_code ||
      (['US', 'CA', 'AU'].includes(address.country) && !address.state)) {
    throw new Error('Complete shipping address is required for a supported destination');
  }
  return address;
}

function printfulRecipientFromAddress(address) {
  return {
    country_code: address.country,
    state_code: address.state,
    zip: address.postal_code,
    city: address.city,
    address1: address.line1,
    ...(address.line2 ? { address2: address.line2 } : {}),
  };
}

async function digestHex(input) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

async function checkoutShippingToken(sessionId, env) {
  if (!env.STRIPE_WEBHOOK_SECRET) throw new Error('Missing Stripe signing secret');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('shipping-update-v1:' + sessionId));
  return Array.from(new Uint8Array(mac), b => b.toString(16).padStart(2, '0')).join('');
}

function exactDollarAmountToCents(value) {
  const match = /^([0-9]{1,6})(?:\.([0-9]{1,2}))?$/.exec(String(value));
  if (!match) throw new Error('Invalid Printful shipping rate');
  const cents = Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 1000000) throw new Error('Invalid shipping rate amount');
  return cents;
}

// Printful Shipping Rates can exclude store settings and additional fulfillment
// surcharges. Its Order Estimate includes the store's actual shipping costs.
// Fail closed if either endpoint is unavailable or the estimate is invalid.
function estimatedDollarAmountToCents(value) {
  if (typeof value !== 'number' && typeof value !== 'string') {
    throw new Error('Printful order estimate is missing a shipping cost');
  }
  const amount = Number(value);
  const cents = Math.round(amount * 100);
  // The Printful estimate sometimes serializes doubles as 11.290000000000001.
  if (!Number.isFinite(amount) || !Number.isSafeInteger(cents) || cents <= 0 ||
      cents > 1000000 || Math.abs(amount * 100 - cents) > 0.001) {
    throw new Error('Invalid Printful estimated shipping cost');
  }
  return cents;
}

async function getPrintfulStandardShipping(physicalItems, address, env, recipientName = 'Shipping Estimate') {
  const items = physicalItems.map(item => {
    const catalogVariantId = Number(item.catalog_variant_id);
    if (!Number.isSafeInteger(catalogVariantId) || catalogVariantId <= 0) {
      throw new Error('This variant is missing its Printful catalog shipping identifier');
    }
    return { variant_id: String(catalogVariantId), quantity: item.quantity };
  });
  const recipient = printfulRecipientFromAddress(address);
  const rateResponse = await printful('/shipping/rates', env, {
    method: 'POST',
    body: JSON.stringify({ recipient, items, currency: 'USD' }),
  });
  const rates = Array.isArray(rateResponse.result) ? rateResponse.result : [];
  const selected = rates.find(rate => rate.id === 'STANDARD' && rate.currency === 'USD');
  if (!selected) throw new Error('Printful Standard shipping is unavailable for this address and cart');
  // The rate lookup is for method availability, not the final amount:
  // Printful's real order estimate may include additional shipping surcharges.
  exactDollarAmountToCents(selected.rate);

  const estimate = await printful('/orders/estimate-costs', env, {
    method: 'POST',
    body: JSON.stringify({
      shipping: 'STANDARD',
      recipient: { name: cleanAddressField(recipientName, 110) || 'Shipping Estimate', ...recipient },
      items: physicalItems.map(item => ({
        sync_variant_id: Number(item.id),
        quantity: item.quantity,
        retail_price: String(item.price),
      })),
    }),
  });
  if (String(estimate.result?.costs?.currency || '').toUpperCase() !== 'USD') {
    throw new Error('Printful order estimate currency is not USD');
  }
  return {
    method: 'STANDARD',
    amountCents: estimatedDollarAmountToCents(estimate.result?.costs?.shipping),
  };
}

const MAX_CART_ITEMS = 20;
const MAX_QTY_PER_ITEM = 10;
const STRIPE_SIGNATURE_TOLERANCE_SECONDS = 5 * 60;
const PRODUCT_CACHE_SECONDS = 5 * 60;
const MAX_SERVICE_ITEMS = 5;
const MAX_SERVICE_QTY = 1;
const MAX_SERVICE_NOTES = 700;
const ORDER_RECORD_TTL_SECONDS = 60 * 60 * 24 * 120;

// Manual service catalog. Safe to commit: prices are server-trusted here, not in the browser.
// Edit this object when you want to add/remove services. Amounts are in cents.
const SERVICE_PRODUCTS = {
  'cyber-security-evaluation': {
    id: 'cyber-security-evaluation',
    type: 'service',
    name: 'Cyber Security Evaluation',
    category: 'Cyber Security',
    price_cents: 4000,
    max_qty: 1,
    currency: 'usd',
    short: 'A practical review of basic website and online-security risks.',
    description: 'I will review your website, public-facing setup, or general digital security posture and send practical recommendations. This is a basic evaluation, not a formal penetration test or guaranteed security certification.',
    turnaround: 'Usually 2–5 business days',
  },
  'custom-portfolio-website': {
    id: 'custom-portfolio-website',
    type: 'service',
    name: 'Custom Portfolio Website',
    category: 'Web Design',
    price_cents: 4000,
    max_qty: 1,
    currency: 'usd',
    short: 'A simple custom portfolio website for your work, resume, project, or personal brand.',
    description: 'I will build or set up a simple custom portfolio website for your personal brand, resume, ministry, project, or small business. Custom domain purchase/renewal is a separate add-on.',
    turnaround: 'Usually 5–10 business days after content is received',
  },
  'custom-domain-one-year': {
    id: 'custom-domain-one-year',
    type: 'service',
    name: 'Custom Domain — 1 Year',
    category: 'Web Design',
    price_cents: 1200,
    max_qty: 1,
    currency: 'usd',
    short: 'One year of custom domain setup/management as a website add-on.',
    description: 'One year of custom domain setup or management for your website. This is handled as a one-time purchase in this store, not an automatic yearly subscription.',
    turnaround: 'Usually 1–3 business days after domain details are confirmed',
  },
  'three-month-life-coaching': {
    id: 'three-month-life-coaching',
    type: 'service',
    name: '3 Month Life Coaching',
    category: 'Coaching',
    price_cents: 11200,
    max_qty: 1,
    currency: 'usd',
    short: 'A three-month coaching package for goals, planning, and accountability.',
    description: 'A three-month life coaching package focused on goals, accountability, planning, habit-building, and practical personal development. This is coaching, not therapy, medical care, legal advice, or financial advising.',
    turnaround: 'I will contact you after purchase to schedule the first session',
  },
};

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : SITE;
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
  };
}

function json(data, status = 200, request = new Request(SITE)) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders(request),
    },
  });
}

function error(request, msg, status = 400, details) {
  const body = details ? { error: msg, details } : { error: msg };
  return json(body, status, request);
}

function clampInt(value, min, max) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function moneyToCents(value) {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n) || n < 0) throw new Error('Invalid product price');
  return Math.round(n * 100);
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}


function cleanText(value, max = 500) {
  return String(value ?? '')
    .replace(/\p{Cc}/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function serviceList() {
  return Object.values(SERVICE_PRODUCTS).map((service) => ({ ...service }));
}

function getService(id) {
  const key = String(id || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  return SERVICE_PRODUCTS[key] || null;
}

function normalizeServiceItems(rawItems) {
  if (!Array.isArray(rawItems)) throw new Error('Cart items must be an array');
  const serviceRaw = rawItems.filter((item) => item?.type === 'service' || item?.service_id || item?.id);
  if (serviceRaw.length > MAX_SERVICE_ITEMS) throw new Error(`Cart cannot contain more than ${MAX_SERVICE_ITEMS} service line items`);

  const out = [];
  for (const raw of serviceRaw) {
    const id = String(raw?.id || raw?.service_id || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
    const service = getService(id);
    if (!service) throw new Error('Invalid service item');
    const quantity = clampInt(raw?.quantity, 1, Number(service.max_qty || MAX_SERVICE_QTY));
    out.push({
      ...service,
      quantity,
      unit_amount: Number(service.price_cents),
      notes: cleanText(raw?.notes, MAX_SERVICE_NOTES),
      deadline: cleanText(raw?.deadline, 120),
      contact_preference: cleanText(raw?.contact_preference, 80),
    });
  }
  return out;
}

function normalizePhysicalCartItems(rawItems) {
  const physical = (Array.isArray(rawItems) ? rawItems : []).filter((item) => item?.type !== 'service' && (item?.variant_id || item?.sync_variant_id));
  if (!physical.length) return [];
  if (physical.length > MAX_CART_ITEMS) throw new Error(`Cart cannot contain more than ${MAX_CART_ITEMS} physical line items`);

  const merged = new Map();
  for (const raw of physical) {
    const variantId = String(raw?.variant_id || raw?.sync_variant_id || '').replace(/[^0-9]/g, '');
    if (!variantId) throw new Error('Invalid variant id');
    const qty = clampInt(raw?.quantity, 1, MAX_QTY_PER_ITEM);
    merged.set(variantId, Math.min(MAX_QTY_PER_ITEM, (merged.get(variantId) || 0) + qty));
  }
  return [...merged.entries()].map(([variant_id, quantity]) => ({ variant_id, quantity }));
}

// ── Printful helper ──────────────────────────────────────────────────────────
async function printful(path, env, options = {}) {
  if (!env.PRINTFUL_TOKEN) throw new Error('Missing PRINTFUL_TOKEN');
  const res = await fetch(`https://api.printful.com${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${env.PRINTFUL_TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

  if (!res.ok) {
    const message = data?.error?.message || data?.error || `Printful request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
}

const SUBMITTED_PRINTFUL_STATUSES = new Set([
  'pending', 'inreview', 'inprocess', 'partial', 'fulfilled',
]);

async function findPrintfulOrderByExternalId(externalId, env) {
  try {
    const data = await printful(`/orders/@${encodeURIComponent(externalId)}`, env);
    if (!data.result) throw new Error('Printful returned no order details');
    return data.result;
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

function isPrintfulAutoConfirmEnabled(env) {
  // Require deliberate activation: auto confirmation may charge Printful billing.
  return env.PRINTFUL_AUTO_CONFIRM === 'true';
}

function normalizeVariant(v, productName, productId) {
  const preview = v.files?.find((f) => f.type === 'preview')?.preview_url
               || v.files?.find((f) => f.type === 'mockup')?.preview_url
               || null;
  return {
    id: Number(v.id),
    product_id: Number(productId),
    product_name: productName || 'Christian Goblin Product',
    variant_name: v.name || 'Default',
    sku: v.sku || '',
    price: String(v.retail_price || '0'),
    catalog_variant_id: Number(v.variant_id || v.product?.variant_id || 0),
    currency: (v.currency || 'USD').toUpperCase(),
    size: v.size || '',
    color: v.color || '',
    in_stock: v.is_ignored === false,
    image: safeHttpsUrl(preview),
  };
}

async function getAllProductsWithDetails(env, ctx) {
  const cacheKey = new Request(`${SITE}/__worker_cache/store-products-v4`);
  const cache = caches.default;

  const cached = await cache.match(cacheKey);
  if (cached) return cached.json();

  const list = await printful('/store/products', env);
  const syncProducts = Array.isArray(list.result) ? list.result : [];

  const details = await Promise.all(syncProducts.map(async (p) => {
    const detail = await printful(`/store/products/${encodeURIComponent(p.id)}`, env);
    const syncProduct = detail.result?.sync_product || p;
    const syncVariants = Array.isArray(detail.result?.sync_variants) ? detail.result.sync_variants : [];
    const variants = syncVariants.map((v) => normalizeVariant(v, syncProduct.name || p.name, syncProduct.id || p.id));
    const first = variants.find((v) => v.in_stock) || variants[0] || {};
    return {
      id: Number(syncProduct.id || p.id),
      name: syncProduct.name || p.name || 'Christian Goblin Product',
      thumbnail: first.image || safeHttpsUrl(syncProduct.thumbnail_url || p.thumbnail_url),
      price: first.price || null,
      currency: first.currency || 'USD',
      variants,
    };
  }));

  const payload = { products: details };
  const cacheResponse = new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=${PRODUCT_CACHE_SECONDS}`,
    },
  });
  ctx?.waitUntil?.(cache.put(cacheKey, cacheResponse.clone()));
  return payload;
}

async function getProductDetail(productId, env) {
  const data = await printful(`/store/products/${encodeURIComponent(productId)}`, env);
  if (!data.result) return null;

  const { sync_product, sync_variants = [] } = data.result;
  const productName = sync_product?.name || 'Christian Goblin Product';
  const variants = sync_variants.map((v) => normalizeVariant(v, productName, sync_product?.id || productId));
  const images = [...new Set(variants.map((v) => v.image).filter(Boolean))];

  let description = '';
  try {
    const firstVariant = sync_variants[0];
    if (firstVariant?.product?.product_id) {
      const catalog = await printful(`/products/${firstVariant.product.product_id}`, env);
      description = catalog.result?.product?.description || '';
    }
  } catch {
    description = '';
  }

  return {
    id: Number(sync_product?.id || productId),
    name: productName,
    thumbnail: safeHttpsUrl(sync_product?.thumbnail_url) || images[0] || null,
    description,
    images,
    variants,
  };
}

async function buildVariantIndex(env, ctx) {
  const { products } = await getAllProductsWithDetails(env, ctx);
  const variants = new Map();
  for (const product of products) {
    for (const variant of product.variants || []) {
      variants.set(String(variant.id), variant);
    }
  }
  return variants;
}


async function buildTrustedCheckoutItems(rawItems, env, ctx) {
  const physicalRaw = normalizePhysicalCartItems(rawItems);
  const serviceItems = normalizeServiceItems(rawItems);

  const variantIndex = physicalRaw.length ? await buildVariantIndex(env, ctx) : new Map();
  const physicalItems = physicalRaw.map((item) => {
    const variant = variantIndex.get(String(item.variant_id));
    if (!variant) throw new Error(`Variant ${item.variant_id} is no longer available`);
    if (!variant.in_stock) throw new Error(`${variant.variant_name} is not currently available`);
    const cents = moneyToCents(variant.price);
    if (cents < 50) throw new Error('Invalid checkout price');
    return {
      type: 'physical',
      ...variant,
      quantity: item.quantity,
      unit_amount: cents,
      currency: (variant.currency || 'USD').toLowerCase(),
    };
  });

  if (!physicalItems.length && !serviceItems.length) throw new Error('Cart is empty');
  return { physicalItems, serviceItems, allItems: [...physicalItems, ...serviceItems] };
}

function encodeCartMetadata(items) {
  return items.map((item) => `${item.id}:${item.quantity}`).join(',');
}

function decodeCartMetadata(value) {
  if (!value) return [];
  return value.split(',').filter(Boolean).map((pair) => {
    const [variant_id, quantity] = pair.split(':');
    return { variant_id, quantity: clampInt(quantity, 1, MAX_QTY_PER_ITEM) };
  });
}

function applyServiceMetadata(params, serviceItems) {
  params['metadata[service_count]'] = String(serviceItems.length);
  serviceItems.slice(0, MAX_SERVICE_ITEMS).forEach((item, index) => {
    params[`metadata[service_${index}_id]`] = item.id;
    params[`metadata[service_${index}_qty]`] = String(item.quantity);
    if (item.notes) params[`metadata[service_${index}_notes]`] = item.notes.slice(0, 500);
    if (item.deadline) params[`metadata[service_${index}_deadline]`] = item.deadline.slice(0, 120);
    if (item.contact_preference) params[`metadata[service_${index}_contact]`] = item.contact_preference.slice(0, 80);
  });
}

function decodeServiceMetadata(metadata = {}) {
  const count = clampInt(metadata.service_count || 0, 0, MAX_SERVICE_ITEMS);
  const out = [];
  for (let i = 0; i < count; i++) {
    const id = String(metadata[`service_${i}_id`] || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
    const service = getService(id);
    if (!service) continue;
    out.push({
      ...service,
      quantity: clampInt(metadata[`service_${i}_qty`], 1, Number(service.max_qty || MAX_SERVICE_QTY)),
      notes: cleanText(metadata[`service_${i}_notes`], MAX_SERVICE_NOTES),
      deadline: cleanText(metadata[`service_${i}_deadline`], 120),
      contact_preference: cleanText(metadata[`service_${i}_contact`], 80),
    });
  }
  return out;
}

// Stripe embedded Checkout form requires API 2026-03-25.dahlia or newer.
// Pin this per request rather than relying on the account's dashboard default.
// ── Stripe form encoding ─────────────────────────────────────────────────────
function toFormEncoded(obj, prefix) {
  const parts = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item !== null && typeof item === 'object') {
          parts.push(...toFormEncoded(item, `${key}[${i}]`));
        } else {
          parts.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(item)}`);
        }
      });
    } else if (typeof v === 'object') {
      parts.push(...toFormEncoded(v, key));
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
    }
  }
  return parts;
}

async function stripePost(path, env, params) {
  if (!env.STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY');
  const body = toFormEncoded(params).join('&');
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Stripe-Version': '2026-03-25.dahlia',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Stripe request failed');
  return data;
}

async function stripeGet(path, env) {
  if (!env.STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY');
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`, 'Stripe-Version': '2026-03-25.dahlia' },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Stripe request failed');
  return data;
}

// ── Stripe webhook signature verification ────────────────────────────────────
function parseStripeSignature(sigHeader) {
  const out = { t: '', v1: [] };
  for (const part of String(sigHeader || '').split(',')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key === 't') out.t = value;
    if (key === 'v1') out.v1.push(value);
  }
  return out;
}

function timingSafeEqualHex(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function verifyStripeSignature(payload, sigHeader, secret) {
  if (!secret) return false;
  const parts = parseStripeSignature(sigHeader);
  const timestamp = Number.parseInt(parts.t, 10);
  if (!timestamp || !parts.v1.length) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - timestamp);
  if (age > STRIPE_SIGNATURE_TOLERANCE_SECONDS) return false;

  const signed = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signed));
  const expected = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, '0')).join('');

  return parts.v1.some((sig) => timingSafeEqualHex(expected, sig));
}

function requireOrderStore(env) {
  const store = env?.STORE_ORDER_KV;
  if (!store || typeof store.get !== 'function' || typeof store.put !== 'function') {
    const err = new Error('Missing required STORE_ORDER_KV binding. Fulfillment is disabled until the KV namespace is bound.');
    err.code = 'STORE_ORDER_KV_MISSING';
    err.status = 503;
    throw err;
  }
  return store;
}

async function alreadyProcessed(env, key) {
  const store = requireOrderStore(env);
  return Boolean(await store.get(key));
}

async function markProcessed(env, key, value = '1') {
  const store = requireOrderStore(env);
  await store.put(key, value, { expirationTtl: ORDER_RECORD_TTL_SECONDS });
}


function moneyDisplayFromCents(cents, currency = 'usd') {
  const amount = Number(cents || 0) / 100;
  return `${amount.toFixed(2)} ${String(currency || 'usd').toUpperCase()}`;
}

function discordField(name, value, inline = false) {
  const clean = cleanText(value || '—', 1000);
  return { name: cleanText(name, 256), value: clean || '—', inline };
}

async function sendServiceDiscordNotification(env, session, serviceItems) {
  if (!serviceItems.length) return { skipped: true };
  if (!env.DISCORD_WEBHOOK_URL) throw new Error('Missing DISCORD_WEBHOOK_URL');

  const customer = session.customer_details || {};
  const fields = [
    discordField('Customer', customer.name || 'Unknown', true),
    discordField('Email', customer.email || session.customer_email || 'Missing', true),
    discordField('Phone', customer.phone || 'Not provided', true),
    discordField('Stripe Session', session.id || 'Unknown', false),
  ];

  serviceItems.forEach((item, index) => {
    fields.push(discordField(
      `Service ${index + 1}: ${item.name}`,
      [
        `Quantity: ${item.quantity}`,
        `Price: ${moneyDisplayFromCents(item.price_cents, item.currency)}`,
        item.deadline ? `Deadline: ${item.deadline}` : '',
        item.contact_preference ? `Preferred contact: ${item.contact_preference}` : '',
        item.notes ? `Notes: ${item.notes}` : 'Notes: none provided',
      ].filter(Boolean).join('\n'),
      false,
    ));
  });

  const res = await fetch(env.DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: '🛎️ New paid Christian Goblin service order',
      allowed_mentions: { parse: [] },
      embeds: [{
        title: 'Paid Service Order',
        color: 13215820,
        description: 'A customer paid for a manual service. Contact them and fulfill the request.',
        fields,
        timestamp: new Date().toISOString(),
        footer: { text: 'Christian Goblin Store' },
      }],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Discord webhook failed (${res.status}): ${txt.slice(0, 300)}`);
  }

  return { ok: true };
}

// Printful external order IDs are limited to 32 ASCII characters. Stripe Checkout
// Session IDs are longer. Hashing is deterministic, so retries identify the same
// Printful order while the original Stripe ID stays in KV and Stripe.
async function printfulExternalId(sessionId) {
  const value = String(sessionId || '');
  if (!/^cs_(?:live|test)_[A-Za-z0-9_]+$/.test(value)) {
    throw new Error('Invalid Stripe Checkout Session ID');
  }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  return `cg_${hex.slice(0, 29)}`;
}

// ── Main handler ─────────────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';

    try {
      // ── GET /health ───────────────────────────────────────────────────────────
      if (request.method === 'GET' && path === '/health') {
        const kvReady = Boolean(
          env?.STORE_ORDER_KV
          && typeof env.STORE_ORDER_KV.get === 'function'
          && typeof env.STORE_ORDER_KV.put === 'function'
        );
        return json({
          ok: kvReady,
          service: 'christian-goblin-store-api',
          required_bindings: { STORE_ORDER_KV: kvReady },
        }, kvReady ? 200 : 503, request);
      }

      // ── GET /session?id= ─────────────────────────────────────────────────────
      if (request.method === 'GET' && path === '/session') {
        const sessionId = String(url.searchParams.get('id') || '').replace(/[^A-Za-z0-9_]/g, '');
        if (!sessionId || !sessionId.startsWith('cs_')) return error(request, 'Missing or invalid session id');
        const session = await stripeGet(`/checkout/sessions/${encodeURIComponent(sessionId)}`, env);
        return json({
          session: {
            id: session.id,
            status: session.status,
            payment_status: session.payment_status,
            amount_total: session.amount_total,
            currency: session.currency,
            customer_email: session.customer_details?.email || session.customer_email || '',
            customer_name: session.customer_details?.name || '',
            fulfillment_types: session.metadata?.fulfillment_types || '',
            service_count: Number(session.metadata?.service_count || 0),
          },
        }, 200, request);
      }


      // ── GET /services ─────────────────────────────────────────────────────
      if (request.method === 'GET' && path === '/services') {
        return json({ services: serviceList().map((s) => ({
          id: s.id,
          type: 'service',
          name: s.name,
          category: s.category,
          short: s.short,
          price_cents: s.price_cents,
          max_qty: s.max_qty || MAX_SERVICE_QTY,
          currency: s.currency,
          turnaround: s.turnaround,
        })) }, 200, request);
      }

      // ── GET /service?id= ──────────────────────────────────────────────────
      if (request.method === 'GET' && path === '/service') {
        const id = String(url.searchParams.get('id') || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
        const service = getService(id);
        if (!service) return error(request, 'Service not found', 404);
        return json({ service }, 200, request);
      }

      // ── GET /products ──────────────────────────────────────────────────────
      if (request.method === 'GET' && (path === '/' || path === '/products')) {
        const { products } = await getAllProductsWithDetails(env, ctx);
        return json({
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            thumbnail: p.thumbnail,
            price: p.price,
            currency: p.currency,
          })),
        }, 200, request);
      }

      // ── GET /product?id= ───────────────────────────────────────────────────
      if (request.method === 'GET' && path === '/product') {
        const id = String(url.searchParams.get('id') || '').replace(/[^0-9]/g, '');
        if (!id) return error(request, 'Missing id parameter');
        const product = await getProductDetail(id, env);
        if (!product) return error(request, 'Product not found', 404);
        return json({ product }, 200, request);
      }

      // ── POST /checkout ─────────────────────────────────────────────────────
      if (request.method === 'POST' && path === '/checkout') {
        const len = Number(request.headers.get('Content-Length') || 0);
        if (len > 50_000) return error(request, 'Checkout request is too large', 413);

        let body;
        try { body = await request.json(); } catch { return error(request, 'Invalid JSON'); }
        const { physicalItems, serviceItems } = await buildTrustedCheckoutItems(body.items, env, ctx);
        const physicalCheckout = physicalItems.length > 0;
        let quotedShipping = null;
        let verifiedAddress = null;
        let recipientName = '';
        if (physicalCheckout) {
          // Fail closed BEFORE Stripe creates a payable session. Never reveal a
          // client secret while delivery costs are unknown or storage is absent.
          requireOrderStore(env);
          if (!/^pk_(test|live)_[A-Za-z0-9]+$/.test(String(env.STRIPE_PUBLISHABLE_KEY || ''))) {
            throw new Error('Embedded Checkout publishable key is missing or invalid');
          }
          recipientName = cleanAddressField(body.shipping_details?.name, 110);
          if (recipientName.length < 2) throw new Error('Delivery recipient name is required');
          verifiedAddress = normalizeShippingAddress(body.shipping_details);
          quotedShipping = await getPrintfulStandardShipping(physicalItems, verifiedAddress, env, recipientName);
        }

        const physicalLineItems = physicalItems.map((item) => ({
          price_data: {
            currency: item.currency,
            product_data: {
              name: item.product_name,
              description: item.variant_name,
              ...(item.image ? { images: [item.image] } : {}),
              metadata: {
                printful_sync_variant_id: String(item.id),
                printful_sync_product_id: String(item.product_id),
              },
            },
            unit_amount: item.unit_amount,
          },
          quantity: item.quantity,
        }));

        const serviceLineItems = serviceItems.map((item) => ({
          price_data: {
            currency: item.currency,
            product_data: {
              name: item.name,
              description: item.short || item.description,
              metadata: { service_id: item.id },
            },
            unit_amount: item.unit_amount,
          },
          quantity: item.quantity,
        }));

        const line_items = [...physicalLineItems, ...serviceLineItems];

        const params = {
          mode: 'payment',
          line_items,
          ...(physicalCheckout ? {
            ui_mode: 'form',
            return_url: `${SITE}/store/success.html?session_id={CHECKOUT_SESSION_ID}`,
            'metadata[shipping_flow]': SHIPPING_PREQUOTED_FLOW,
          } : {
            success_url: `${SITE}/store/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${SITE}/store/cart.html`,
          }),
          'metadata[cart]': encodeCartMetadata(physicalItems),
          'metadata[fulfillment_types]': physicalItems.length && serviceItems.length ? 'mixed' : (serviceItems.length ? 'service' : 'physical'),
          'phone_number_collection[enabled]': 'true',
          ...(physicalCheckout ? {
            // Printful shipping must be quoted before any Stripe client secret
            // exists. Stripe cannot offer an address change in the payment form:
            // shipping_address_collection is deliberately omitted. The address
            // is attached to the PaymentIntent for signed webhook verification.
            'shipping_options[0][shipping_rate_data][type]': 'fixed_amount',
            'shipping_options[0][shipping_rate_data][display_name]': 'Printful Standard shipping',
            'shipping_options[0][shipping_rate_data][fixed_amount][amount]': String(quotedShipping.amountCents),
            'shipping_options[0][shipping_rate_data][fixed_amount][currency]': 'usd',
            'payment_intent_data[shipping][name]': recipientName,
            'payment_intent_data[shipping][address][line1]': verifiedAddress.line1,
            ...(verifiedAddress.line2 ? { 'payment_intent_data[shipping][address][line2]': verifiedAddress.line2 } : {}),
            'payment_intent_data[shipping][address][city]': verifiedAddress.city,
            'payment_intent_data[shipping][address][state]': verifiedAddress.state,
            'payment_intent_data[shipping][address][postal_code]': verifiedAddress.postal_code,
            'payment_intent_data[shipping][address][country]': verifiedAddress.country,
          } : {}),
          ...(body.customer_email ? { customer_email: String(body.customer_email).slice(0, 254) } : {}),
        };

        applyServiceMetadata(params, serviceItems);

        const session = await stripePost('/checkout/sessions', env, params);
        if (!physicalCheckout) return json({ url: session.url }, 200, request);
        if (!/^cs_(test|live)_[A-Za-z0-9_]+$/.test(String(session.id || '')) ||
            !session.client_secret) {
          throw new Error('Stripe did not return an embedded Checkout Session');
        }
        const shippingRateId = session.shipping_options?.[0]?.shipping_rate;
        if (!/^shr_[A-Za-z0-9_]+$/.test(String(shippingRateId || '')) ||
            session.shipping_cost?.amount_total !== quotedShipping.amountCents ||
            String(session.currency || '').toLowerCase() !== 'usd') {
          throw new Error('Stripe did not confirm the exact Printful shipping amount');
        }
        const addressHash = await digestHex(JSON.stringify(verifiedAddress));
        // Only hash, rate and amount are stored in KV. The full address resides
        // on Stripe's PaymentIntent shipping object, not in KV or metadata.
        await requireOrderStore(env).put(QUOTE_KEY_PREFIX + session.id, JSON.stringify({
          addressHash,
          amountCents: quotedShipping.amountCents,
          currency: 'usd',
          method: quotedShipping.method,
          shippingRateId,
        }), { expirationTtl: ORDER_RECORD_TTL_SECONDS });
        return json({
          clientSecret: session.client_secret,
          publishableKey: env.STRIPE_PUBLISHABLE_KEY,
          checkoutSessionId: session.id,
          shippingAmountCents: quotedShipping.amountCents,
        }, 200, request);
      }

      // ── POST /shipping/options ────────────────────────────────────────────
      // Called from Stripe's embedded form after a complete shipping address.
      // A signed, session-bound token prevents arbitrary Checkout updates.
      if (request.method === 'POST' && path === '/shipping/options') {
        requireOrderStore(env);
        const payload = await request.text();
        if (payload.length > 10000) return error(request, 'Shipping request too large', 413);
        let body;
        try { body = JSON.parse(payload); } catch { return error(request, 'Invalid shipping request'); }
        const sessionId = String(body.checkout_session_id || '');
        if (!/^cs_(test|live)_[A-Za-z0-9_]+$/.test(sessionId)) {
          return error(request, 'Invalid checkout session');
        }
        const expectedToken = await checkoutShippingToken(sessionId, env);
        if (!timingSafeEqualHex(expectedToken, String(body.shipping_update_token || ''))) {
          return error(request, 'Unauthorized shipping update', 403);
        }

        const session = await stripeGet(`/checkout/sessions/${encodeURIComponent(sessionId)}`, env);
        if (session.status !== 'open' || session.ui_mode !== 'form' ||
            session.metadata?.shipping_flow !== SHIPPING_QUOTE_FLOW ||
            !session.metadata?.cart) {
          return error(request, 'Checkout session is not eligible for shipping quotes', 409);
        }
        const address = normalizeShippingAddress(body.shipping_details);
        // Server-trusted cart IDs and current Printful catalog pricing; never
        // trust a caller's items, variants, quantities, shipping price or currency.
        const cart = decodeCartMetadata(session.metadata.cart);
        const { physicalItems } = await buildTrustedCheckoutItems(cart, env, ctx);
        if (!physicalItems.length) return error(request, 'No physical items in checkout');

        const quoted = await getPrintfulStandardShipping(physicalItems, address, env, body.shipping_details?.name);
        const updated = await stripePost(`/checkout/sessions/${encodeURIComponent(sessionId)}`, env, {
          shipping_options: [{
            shipping_rate_data: {
              type: 'fixed_amount',
              display_name: 'Printful Standard shipping',
              fixed_amount: { amount: quoted.amountCents, currency: 'usd' },
            },
          }],
        });
        const shippingRateId = updated.shipping_options?.[0]?.shipping_rate;
        if (typeof shippingRateId !== 'string' || !shippingRateId.startsWith('shr_')) {
          throw new Error('Stripe did not return the updated shipping rate');
        }
        const addressHash = await digestHex(JSON.stringify(address));
        await requireOrderStore(env).put(QUOTE_KEY_PREFIX + sessionId, JSON.stringify({
          addressHash,
          amountCents: quoted.amountCents,
          currency: 'usd',
          method: quoted.method,
          shippingRateId,
        }), { expirationTtl: ORDER_RECORD_TTL_SECONDS });

        return json({ type: 'object', value: { succeeded: true } }, 200, request);
      }

      // ── POST /webhook ──────────────────────────────────────────────────────
      if (request.method === 'POST' && path === '/webhook') {
        const rawBody = await request.text();
        const sigHeader = request.headers.get('Stripe-Signature') || '';
        const valid = await verifyStripeSignature(rawBody, sigHeader, env.STRIPE_WEBHOOK_SECRET);
        if (!valid) return error(request, 'Invalid signature', 401);

        let event;
        try { event = JSON.parse(rawBody); } catch { return error(request, 'Invalid JSON'); }

        const fulfillmentEvents = new Set([
          'checkout.session.completed',
          'checkout.session.async_payment_succeeded',
        ]);
        if (!fulfillmentEvents.has(event.type)) {
          return json({ received: true }, 200, request);
        }

        const session = event.data?.object || {};
        if (session.payment_status !== 'paid') {
          // Delayed payment methods can complete Checkout before funds are confirmed.
          // Do not fulfill until Stripe later sends async_payment_succeeded.
          return json({
            received: true,
            pending_payment: true,
            payment_status: session.payment_status || 'unknown',
          }, 200, request);
        }

        // Refuse paid fulfillment when the required idempotency store is absent.
        // This check happens before Printful or Discord is contacted.
        requireOrderStore(env);

        const idempotencyKey = `stripe-session:${session.id}`;
        if (await alreadyProcessed(env, idempotencyKey)) {
          return json({ received: true, duplicate: true }, 200, request);
        }

        const cartItems = decodeCartMetadata(session.metadata?.cart || '');
        const serviceItems = decodeServiceMetadata(session.metadata || {});
        if (!cartItems.length && !serviceItems.length) {
          return json({ received: true, note: 'Empty fulfillment payload' }, 200, request);
        }

        // A Stripe-signed successful payment alone does not authorize
        // fulfillment: an address-matched Printful quote must be on record.
        let verifiedQuote = null;
        let verifiedShippingDetails = null;
        if (cartItems.length) {
          const flow = session.metadata?.shipping_flow;
          if (flow !== SHIPPING_PREQUOTED_FLOW && flow !== SHIPPING_QUOTE_FLOW) {
            throw new Error('Paid physical checkout lacks a recognized verified shipping flow');
          }
          const stored = await requireOrderStore(env).get(QUOTE_KEY_PREFIX + session.id);
          if (!stored) throw new Error('No verified Printful shipping quote for paid checkout');
          try { verifiedQuote = JSON.parse(stored); } catch { throw new Error('Invalid saved shipping quote'); }
          if (flow === SHIPPING_PREQUOTED_FLOW) {
            // The customer cannot change delivery details in Checkout.
            // Retrieve the address Stripe stored on the resulting PaymentIntent.
            const paymentIntentId = session.payment_intent;
            if (!/^pi_[A-Za-z0-9_]+$/.test(String(paymentIntentId || ''))) {
              throw new Error('Paid checkout is missing its PaymentIntent');
            }
            const paymentIntent = await stripeGet(`/payment_intents/${encodeURIComponent(paymentIntentId)}`, env);
            if (paymentIntent.id !== paymentIntentId || paymentIntent.status !== 'succeeded' ||
                !paymentIntent.shipping?.name || !paymentIntent.shipping?.address) {
              throw new Error('Stripe did not verify the expected delivery details');
            }
            verifiedShippingDetails = paymentIntent.shipping;
          } else {
            // Legacy dynamic sessions remain recoverable only if paid and
            // matched against the signed, recorded Printful shipping quote.
            verifiedShippingDetails = session.collected_information?.shipping_details || session.shipping_details;
          }
          const address = normalizeShippingAddress(verifiedShippingDetails);
          if (await digestHex(JSON.stringify(address)) !== verifiedQuote.addressHash ||
              session.shipping_cost?.amount_total !== verifiedQuote.amountCents ||
              session.shipping_cost?.shipping_rate !== verifiedQuote.shippingRateId ||
              String(session.currency || '').toLowerCase() !== 'usd' ||
              verifiedQuote.currency !== 'usd' ||
              verifiedQuote.method !== 'STANDARD') {
            throw new Error('Shipping address, price or method differs from confirmed Printful quote');
          }
        }

        const result = { received: true };

        // Physical fulfillment through Printful. Rebuild from trusted Printful data again.
        if (cartItems.length) {
          const printfulKey = `${idempotencyKey}:printful`;
          if (await alreadyProcessed(env, printfulKey)) {
            result.printful_duplicate = true;
          } else {
            const externalId = await printfulExternalId(session.id);
            // An earlier delivery may have succeeded before its KV write, or
            // confirmation may have timed out. Reconcile by external ID first.
            let order = await findPrintfulOrderByExternalId(externalId, env);
            if (!order) {
              const { physicalItems } = await buildTrustedCheckoutItems(cartItems, env, ctx);
              // Verified either from the PaymentIntent (new flow) or the
              // recorded Stripe shipping form details (legacy flow).
              const shipping = verifiedShippingDetails;
              const recipient = {
                name: shipping?.name || session.customer_details?.name || 'Customer',
                address1: shipping?.address?.line1 || '',
                address2: shipping?.address?.line2 || '',
                city: shipping?.address?.city || '',
                state_code: shipping?.address?.state || '',
                country_code: shipping?.address?.country || 'US',
                zip: shipping?.address?.postal_code || '',
                email: session.customer_details?.email || '',
                phone: session.customer_details?.phone || '',
              };
              // Never allow a paid physical order to use an incomplete address.
              if (!recipient.address1 || !recipient.city || !recipient.country_code
                  || !recipient.zip || !recipient.email
                  || (['US', 'CA', 'AU'].includes(recipient.country_code) && !recipient.state_code)) {
                throw new Error('Paid checkout is missing required Printful shipping details');
              }

              const orderPayload = {
                recipient,
                items: physicalItems.map((item) => ({
                  sync_variant_id: item.id,
                  quantity: item.quantity,
                  retail_price: String(item.price),
                })),
                retail_costs: { currency: 'USD' },
                shipping: verifiedQuote.method,
                external_id: externalId,
              };

              // Draft first. Only a successful, paid webhook with deliberate
              // auto-confirm configuration can trigger the chargeable next step.
              const orderData = await printful('/orders?update_existing=true', env, {
                method: 'POST',
                body: JSON.stringify(orderPayload),
              });
              if (!orderData.result) throw new Error('Printful returned no order result');
              order = orderData.result;
            }

            if (isPrintfulAutoConfirmEnabled(env)) {
              if (order.status === 'draft') {
                // This API request submits an order to production and may
                // charge the Printful billing method.
                const confirmed = await printful(`/orders/@${encodeURIComponent(externalId)}/confirm`, env, {
                  method: 'POST',
                });
                if (!confirmed.result) throw new Error('Printful confirmation returned no order result');
                order = confirmed.result;
              }
              if (!SUBMITTED_PRINTFUL_STATUSES.has(order.status)) {
                throw new Error(`Printful order not accepted for production (status: ${order.status || 'unknown'})`);
              }
            } else if (order.status !== 'draft' && !SUBMITTED_PRINTFUL_STATUSES.has(order.status)) {
              throw new Error(`Printful order needs review (status: ${order.status || 'unknown'})`);
            }

            // Record completion only once the desired production/draft status
            // has been reached. Retry after a timeout will query Printful.
            await markProcessed(env, printfulKey, String(order.id));
            result.order_id = order.id;
            result.printful_order_status = order.status;
            result.printful_auto_confirmed = isPrintfulAutoConfirmEnabled(env) && SUBMITTED_PRINTFUL_STATUSES.has(order.status);
            console.log('Printful order synchronized:', order.id, order.status);
          }
        }

        // Manual service fulfillment through Discord notification.
        if (serviceItems.length) {
          const serviceKey = `${idempotencyKey}:services`;
          if (await alreadyProcessed(env, serviceKey)) {
            result.service_duplicate = true;
          } else {
            await sendServiceDiscordNotification(env, session, serviceItems);
            await markProcessed(env, serviceKey, 'notified');
            result.service_notified = true;
          }
        }

        // Record the whole session only after every requested fulfillment step succeeds.
        // Sub-keys above allow a partially completed mixed order to resume safely on retry.
        await markProcessed(env, idempotencyKey, 'processed');

        return json(result, 200, request);
      }

      return error(request, 'Not found', 404);
    } catch (err) {
      console.error('Store worker error:', err);
      if (err?.code === 'STORE_ORDER_KV_MISSING') {
        return error(request, 'Store API configuration error', 503, err.message);
      }
      return error(request, 'Store API error', 500, err?.message || String(err));
    }
  },
};
