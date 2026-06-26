// Cloudflare Worker — Christian Goblin Store API, hardened checkout version
//
// Required Cloudflare secrets:
//   PRINTFUL_TOKEN        — Printful private token
//   STRIPE_SECRET_KEY     — Stripe secret key
//   STRIPE_WEBHOOK_SECRET — Stripe webhook signing secret
//
// Optional binding:
//   STORE_ORDER_KV        — KV namespace used to avoid duplicate Printful fulfillment
//
// Routes:
//   GET  /products        → list all sync products
//   GET  /product?id=     → single product with variants
//   POST /checkout        → create Stripe Checkout session using server-trusted prices
//   POST /webhook         → Stripe webhook → create Printful order

const SITE = 'https://christiangoblin.com';
const ALLOWED_ORIGINS = new Set([
  'https://christiangoblin.com',
  'https://www.christiangoblin.com',
  'https://christiangoblin.github.io',
  'http://localhost:8787',
  'http://127.0.0.1:8787',
]);

const MAX_CART_ITEMS = 20;
const MAX_QTY_PER_ITEM = 10;
const STRIPE_SIGNATURE_TOLERANCE_SECONDS = 5 * 60;
const PRODUCT_CACHE_SECONDS = 5 * 60;

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
    throw new Error(message);
  }

  return data;
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
    currency: (v.currency || 'USD').toUpperCase(),
    size: v.size || '',
    color: v.color || '',
    in_stock: v.is_ignored === false,
    image: safeHttpsUrl(preview),
  };
}

async function getAllProductsWithDetails(env, ctx) {
  const cacheKey = new Request(`${SITE}/__worker_cache/store-products-v3`);
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

function normalizeCartItems(rawItems) {
  if (!Array.isArray(rawItems)) throw new Error('Cart items must be an array');
  if (rawItems.length === 0) throw new Error('Cart is empty');
  if (rawItems.length > MAX_CART_ITEMS) throw new Error(`Cart cannot contain more than ${MAX_CART_ITEMS} line items`);

  const merged = new Map();
  for (const raw of rawItems) {
    const variantId = String(raw?.variant_id || '').replace(/[^0-9]/g, '');
    if (!variantId) throw new Error('Invalid variant id');
    const qty = clampInt(raw?.quantity, 1, MAX_QTY_PER_ITEM);
    merged.set(variantId, Math.min(MAX_QTY_PER_ITEM, (merged.get(variantId) || 0) + qty));
  }

  return [...merged.entries()].map(([variant_id, quantity]) => ({ variant_id, quantity }));
}

async function buildTrustedCheckoutItems(rawItems, env, ctx) {
  const normalized = normalizeCartItems(rawItems);
  const variantIndex = await buildVariantIndex(env, ctx);

  return normalized.map((item) => {
    const variant = variantIndex.get(String(item.variant_id));
    if (!variant) throw new Error(`Variant ${item.variant_id} is no longer available`);
    if (!variant.in_stock) throw new Error(`${variant.variant_name} is not currently available`);
    const cents = moneyToCents(variant.price);
    if (cents < 50) throw new Error('Invalid checkout price');
    return {
      ...variant,
      quantity: item.quantity,
      unit_amount: cents,
      currency: (variant.currency || 'USD').toLowerCase(),
    };
  });
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
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
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

async function alreadyProcessed(env, key) {
  if (!env.STORE_ORDER_KV) return false;
  return Boolean(await env.STORE_ORDER_KV.get(key));
}

async function markProcessed(env, key, value = '1') {
  if (!env.STORE_ORDER_KV) return;
  await env.STORE_ORDER_KV.put(key, value, { expirationTtl: 60 * 60 * 24 * 120 });
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
        const trustedItems = await buildTrustedCheckoutItems(body.items, env, ctx);

        const line_items = trustedItems.map((item) => ({
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

        const params = {
          mode: 'payment',
          line_items,
          success_url: `${SITE}/store/success.html?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${SITE}/store/cart.html`,
          'metadata[cart]': encodeCartMetadata(trustedItems),
          'shipping_address_collection[allowed_countries][0]': 'US',
          'shipping_address_collection[allowed_countries][1]': 'CA',
          'shipping_address_collection[allowed_countries][2]': 'GB',
          'shipping_address_collection[allowed_countries][3]': 'AU',
          'phone_number_collection[enabled]': 'true',
          ...(body.customer_email ? { customer_email: String(body.customer_email).slice(0, 254) } : {}),
        };

        const session = await stripePost('/checkout/sessions', env, params);
        return json({ url: session.url }, 200, request);
      }

      // ── POST /webhook ──────────────────────────────────────────────────────
      if (request.method === 'POST' && path === '/webhook') {
        const rawBody = await request.text();
        const sigHeader = request.headers.get('Stripe-Signature') || '';
        const valid = await verifyStripeSignature(rawBody, sigHeader, env.STRIPE_WEBHOOK_SECRET);
        if (!valid) return error(request, 'Invalid signature', 401);

        let event;
        try { event = JSON.parse(rawBody); } catch { return error(request, 'Invalid JSON'); }

        if (event.type !== 'checkout.session.completed') {
          return json({ received: true }, 200, request);
        }

        const session = event.data.object;
        const idempotencyKey = `stripe-session:${session.id}`;
        if (await alreadyProcessed(env, idempotencyKey)) {
          return json({ received: true, duplicate: true }, 200, request);
        }

        const cartItems = decodeCartMetadata(session.metadata?.cart || '');
        if (!cartItems.length) return json({ received: true, note: 'Empty cart' }, 200, request);

        // Rebuild fulfillment items from trusted Printful data again. Do not trust Stripe metadata for price/name.
        const trustedItems = await buildTrustedCheckoutItems(cartItems, env, ctx);

        const shipping = session.shipping_details;
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

        const orderPayload = {
          recipient,
          items: trustedItems.map((item) => ({
            sync_variant_id: item.id,
            quantity: item.quantity,
            retail_price: String(item.price),
          })),
          retail_costs: { currency: 'USD' },
          external_id: session.id,
        };

        const orderData = await printful('/orders', env, {
          method: 'POST',
          body: JSON.stringify(orderPayload),
        });

        if (!orderData.result) {
          console.error('Printful order error:', JSON.stringify(orderData));
          return json({ received: true, printful_error: orderData.error?.message || 'Unknown Printful error' }, 200, request);
        }

        await markProcessed(env, idempotencyKey, String(orderData.result.id));
        console.log('Printful order created:', orderData.result.id);
        return json({ received: true, order_id: orderData.result.id }, 200, request);
      }

      return error(request, 'Not found', 404);
    } catch (err) {
      console.error('Store worker error:', err);
      return error(request, 'Store API error', 500, err?.message || String(err));
    }
  },
};
