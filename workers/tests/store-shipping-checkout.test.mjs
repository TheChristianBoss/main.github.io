import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../store-api-secure.js', import.meta.url), 'utf8');
const { default: worker } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

const originalFetch = globalThis.fetch;
const originalCaches = globalThis.caches;
const requestedCacheKeys = [];
globalThis.caches = { default: { match: async key => { requestedCacheKeys.push(key.url); return null; }, put: async () => {} } };

const records = new Map();
let failKvWrite = false;
const kv = {
  get: async key => records.get(key) ?? null,
  put: async (key, value, options) => {
    if (failKvWrite) throw Error('Simulated KV outage');
    assert.equal(options.expirationTtl, 60 * 60 * 24 * 120);
    records.set(key, value);
  },
};
const env = {
  PRINTFUL_TOKEN: 'test-only',
  STRIPE_SECRET_KEY: 'sk_test_example',
  STRIPE_WEBHOOK_SECRET: 'whsec_test',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_example',
  STORE_ORDER_KV: kv,
};
const sessionId = 'cs_test_prequoted_shipping';
const address = {
  name: 'Shipping Recipient',
  address: {
    country: 'US', state: 'FL', postal_code: '33601', city: 'Tampa',
    line1: '1 Main St', line2: 'Apt 2',
  },
};
let stripeCreates = 0, shippingQuotes = 0, stripeForm;
let quoteRate = '8.73', stripeAmountOverride = null;
let estimateShipping = 9.13, estimates = 0;
const json = (value, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });

globalThis.fetch = async (url, options = {}) => {
  const href = String(url);
  if (href === 'https://api.printful.com/store/products') {
    return json({ result: [{ id: 10, name: 'Test Shirt' }] });
  }
  if (href === 'https://api.printful.com/store/products/10') {
    return json({ result: {
      sync_product: { id: 10, name: 'Test Shirt' },
      sync_variants: [{ id: 123, variant_id: 777, name: 'Medium',
        retail_price: '25.00', currency: 'USD', is_ignored: false, files: [] }],
    } });
  }
  if (href === 'https://api.printful.com/shipping/rates') {
    shippingQuotes++;
    assert.equal(options.method, 'POST');
    const payload = JSON.parse(options.body);
    assert.deepEqual(payload.items, [{ variant_id: '777', quantity: 2 }]);
    assert.equal(payload.currency, 'USD');
    assert.equal(payload.recipient.country_code, 'US');
    assert.equal(payload.recipient.zip, '33601');
    assert.equal(payload.recipient.address1, '1 MAIN ST');
    return json({ result: [{ id: 'STANDARD', currency: 'USD', rate: quoteRate }] });
  }
  if (href === 'https://api.printful.com/orders/estimate-costs') {
    estimates++;
    const payload = JSON.parse(options.body);
    assert.equal(payload.shipping, 'STANDARD');
    assert.equal(payload.recipient.name, 'Shipping Recipient');
    assert.deepEqual(payload.items, [{ sync_variant_id: 123, quantity: 2, retail_price: '25.00' }]);
    return json({ result: { costs: { currency: 'USD', shipping: estimateShipping } } });
  }
  if (href === 'https://api.stripe.com/v1/checkout/sessions') {
    assert.equal(options.headers['Stripe-Version'], '2026-03-25.dahlia');
    stripeCreates++;
    stripeForm = new URLSearchParams(options.body);
    if (stripeForm.has('ui_mode')) {
      const quoted = Number(stripeForm.get('shipping_options[0][shipping_rate_data][fixed_amount][amount]'));
      return json({
        id: sessionId, client_secret: 'cs_test_secret_prequoted',
        shipping_options: [{ shipping_rate: 'shr_prequoted_123' }],
        shipping_cost: { amount_total: stripeAmountOverride ?? quoted },
        currency: 'usd',
      });
    }
    return json({ url: 'https://checkout.stripe.com/c/pay/service-only' });
  }
  throw new Error('Unexpected API call: ' + href);
};

async function checkout(overrides = {}, items = [{ type: 'physical', variant_id: 123, quantity: 2 }], context = env) {
  return worker.fetch(new Request('https://store.example/checkout', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items,
      shipping_details: address,
      price: '0.01', amount_total: 1, shipping_amount_cents: 1,
      ...overrides,
    }),
  }), context, {});
}

try {
  let result = await checkout({ shipping_details: undefined });
  assert.equal(result.status, 500, 'No delivery address must block Checkout');
  assert.equal(stripeCreates, 0);
  assert.equal(shippingQuotes, 0);

  result = await checkout({ shipping_details: { ...address, name: ' ' } });
  assert.equal(result.status, 500, 'No recipient name must block Checkout');
  assert.equal(stripeCreates, 0);

  result = await checkout({ shipping_details: { ...address, address: { ...address.address, country: 'FR' } } });
  assert.equal(result.status, 500, 'Unsupported destination must block Checkout');
  assert.equal(stripeCreates, 0);

  result = await checkout({}, undefined, { ...env, STRIPE_PUBLISHABLE_KEY: undefined });
  assert.notEqual(result.status, 200, 'Missing publishable key must block Checkout');
  assert.equal(stripeCreates, 0);

  result = await checkout({}, undefined, { ...env, STORE_ORDER_KV: undefined });
  assert.equal(result.status, 503, 'Missing idempotency store must block Checkout');
  assert.equal(stripeCreates, 0);

  const physical = await checkout();
  assert.equal(physical.status, 200, await physical.clone().text().catch(() => ''));
  const created = await physical.json();
  assert.equal(created.checkoutSessionId, sessionId);
  assert.equal(created.clientSecret, 'cs_test_secret_prequoted');
  assert.equal(created.publishableKey, env.STRIPE_PUBLISHABLE_KEY);
  assert.equal(created.shippingAmountCents, 913);
  assert.equal(created.shippingUpdateToken, undefined, 'No delayed shipping quote token in new Checkout');
  assert.equal(stripeCreates, 1);
  assert.equal(shippingQuotes, 1, 'Printful is quoted before Stripe Checkout exists');
  assert.equal(estimates, 1, 'Printful full order estimate is required before Stripe Checkout');
  assert.equal(stripeForm.get('shipping_options[0][shipping_rate_data][fixed_amount][amount]'), '913');
  assert.ok(requestedCacheKeys.length > 0);
  assert.ok(requestedCacheKeys.every(key => key.includes('/__worker_cache/store-products-v4')));
  assert.equal(stripeForm.get('ui_mode'), 'form');
  assert.equal(stripeForm.get('metadata[shipping_flow]'), 'printful_prequoted_v2');
  assert.equal(stripeForm.get('line_items[0][price_data][unit_amount]'), '2500');
  assert.equal(stripeForm.get('shipping_options[0][shipping_rate_data][fixed_amount][amount]'), '913');
  assert.equal(stripeForm.get('shipping_options[0][shipping_rate_data][fixed_amount][currency]'), 'usd');
  assert.equal(stripeForm.get('shipping_options[0][shipping_rate_data][display_name]'), 'Printful Standard shipping');
  assert.equal(stripeForm.get('shipping_address_collection[allowed_countries][0]'), null,
    'Shipping address is locked before creating Checkout, not editable in Stripe');
  assert.equal(stripeForm.get('payment_intent_data[shipping][name]'), 'Shipping Recipient');
  assert.equal(stripeForm.get('payment_intent_data[shipping][address][line1]'), '1 MAIN ST');
  assert.equal(stripeForm.get('payment_intent_data[shipping][address][line2]'), 'APT 2');
  assert.equal(stripeForm.get('payment_intent_data[shipping][address][postal_code]'), '33601');
  assert.equal(stripeForm.get('payment_intent_data[shipping][address][country]'), 'US');
  const saved = JSON.parse(records.get(`printful-shipping-quote:${sessionId}`));
  assert.equal(saved.amountCents, 913);
  assert.equal(saved.currency, 'usd');
  assert.equal(saved.method, 'STANDARD');
  assert.equal(saved.shippingRateId, 'shr_prequoted_123');
  const normalized = { country: 'US', state: 'FL', postal_code: '33601', city: 'TAMPA',
    line1: '1 MAIN ST', line2: 'APT 2' };
  assert.equal(saved.addressHash, createHash('sha256').update(JSON.stringify(normalized)).digest('hex'));
  assert.ok(!JSON.stringify(saved).includes('MAIN ST'), 'No street address in KV quote');

  // A Printful error must never create a payable Stripe session.
  quoteRate = '0.00';
  result = await checkout();
  assert.equal(result.status, 500);
  assert.equal(stripeCreates, 1);
  quoteRate = '8.73';

  // If the full order estimate is absent or invalid, fail closed even when
  // the shipping/rates endpoint returns a valid rate.
  const beforeMissingEstimate = stripeCreates;
  estimateShipping = undefined;
  result = await checkout();
  assert.equal(result.status, 500);
  assert.equal(stripeCreates, beforeMissingEstimate);
  estimateShipping = 9.13;

  // A Stripe misconfiguration that returns the wrong shipping charge fails closed.
  stripeAmountOverride = 0;
  result = await checkout();
  assert.equal(result.status, 500);
  assert.equal(stripeCreates, 2);
  stripeAmountOverride = null;

  // A KV outage must never release a payment-enabled client secret.
  failKvWrite = true;
  result = await checkout();
  assert.equal(result.status, 500);
  assert.equal((await result.json()).clientSecret, undefined);
  failKvWrite = false;

  // Services without physical merchandise still use hosted Stripe Checkout.
  result = await checkout({ shipping_details: undefined }, [{ type: 'service', id: 'cyber-security-evaluation', quantity: 1 }]);
  assert.equal(result.status, 200);
  assert.equal((await result.json()).url, 'https://checkout.stripe.com/c/pay/service-only');
  assert.equal(stripeForm.has('shipping_options[0][shipping_rate_data][fixed_amount][amount]'), false);

  const cartHtml = await readFile(new URL('../../store/cart.html', import.meta.url), 'utf8');
  const cartScript = cartHtml.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(cartScript);
  new Function(cartScript);
  assert.ok(cartHtml.includes('id="shippingRecipientName"'));
  assert.ok(cartHtml.includes('id="shippingPostal"'));
  assert.ok(cartScript.includes('shipping_details'));
  assert.ok(cartScript.includes('shippingAmountCents'));
  assert.ok(!cartScript.includes('shippingUpdateToken'));
  assert.ok(!cartScript.includes('runServerUpdate'));
  console.log('Prequoted exact Printful shipping Checkout and placeholder prevention tests passed.');
} finally {
  globalThis.fetch = originalFetch;
  globalThis.caches = originalCaches;
}
