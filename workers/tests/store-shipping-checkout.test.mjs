import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../store-api-secure.js', import.meta.url), 'utf8');
const { default: worker } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

const originalFetch = globalThis.fetch;
const originalCaches = globalThis.caches;
globalThis.caches = { default: { match: async () => null, put: async () => undefined } };

const records = new Map();
const kv = {
  get: async key => records.get(key) ?? null,
  put: async (key, value) => { records.set(key, value); },
};
const env = {
  PRINTFUL_TOKEN: 'fake-token',
  STRIPE_SECRET_KEY: 'sk_test_example',
  STRIPE_WEBHOOK_SECRET: 'whsec_fake',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_example',
  STORE_ORDER_KV: kv,
};
const sessionId = 'cs_test_exact_shipping';
const shipping = {
  name: 'Buyer',
  address: {
    country: 'US', state: 'FL', postal_code: '33601',
    line1: '1 Main St', city: 'Tampa',
  },
};
const stripeSession = {
  id: sessionId, status: 'open', ui_mode: 'form',
  metadata: { shipping_flow: 'printful_dynamic_v1', cart: '123:2' },
};
let createCalls = 0;
let quoteCalls = 0;
let shippingUpdates = 0;
let stripeCreateForm;
let stripeUpdateForm;
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

globalThis.fetch = async (url, options = {}) => {
  const href = String(url);
  if (href === 'https://api.printful.com/store/products') {
    return json({ result: [{ id: 10, name: 'Test Shirt' }] });
  }
  if (href === 'https://api.printful.com/store/products/10') {
    return json({ result: {
      sync_product: { id: 10, name: 'Test Shirt' },
      sync_variants: [{
        id: 123, variant_id: 777, name: 'Medium',
        retail_price: '25.00', currency: 'USD', is_ignored: false, files: [],
      }],
    } });
  }
  if (href === 'https://api.printful.com/shipping/rates') {
    quoteCalls += 1;
    assert.equal(options.method, 'POST');
    const payload = JSON.parse(options.body);
    assert.deepEqual(payload.items, [{ variant_id: '777', quantity: 2 }]);
    assert.equal(payload.recipient.country_code, 'US');
    assert.equal(payload.recipient.zip, '33601');
    assert.equal(payload.currency, 'USD');
    return json({ result: [{ id: 'STANDARD', rate: '8.73', currency: 'USD' }] });
  }
  if (href === 'https://api.stripe.com/v1/checkout/sessions') {
    createCalls += 1;
    stripeCreateForm = new URLSearchParams(options.body);
    if (stripeCreateForm.get('ui_mode') === 'form') {
      return json({ id: sessionId, client_secret: 'cs_test_secret_sample' });
    }
    return json({ url: 'https://checkout.stripe.com/c/pay/service-only' });
  }
  if (href === `https://api.stripe.com/v1/checkout/sessions/${sessionId}`) {
    if (options.method === 'POST') {
      shippingUpdates += 1;
      stripeUpdateForm = new URLSearchParams(options.body);
      return json({ shipping_options: [{ shipping_rate: 'shr_quoted_123' }] });
    }
    assert.equal(options.method, 'GET');
    return json(stripeSession);
  }
  throw new Error(`Unexpected URL: ${href}`);
};

async function checkout(items = [{ type: 'physical', variant_id: 123, quantity: 2 }], overrides = {}, context = env) {
  return worker.fetch(new Request('https://store-worker.example/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items, shipping_amount_cents: 1, price: 0.01, currency: 'XXX',
      ...overrides,
    }),
  }), context, {});
}
async function updateShipping(body) {
  return worker.fetch(new Request('https://store-worker.example/shipping/options', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }), env, {});
}

try {
  const noKey = await checkout(undefined, {}, { ...env, STRIPE_PUBLISHABLE_KEY: undefined });
  assert.notEqual(noKey.status, 200, 'Missing publishable key must fail physical checkout');
  assert.equal(createCalls, 0);

  const physical = await checkout();
  assert.equal(physical.status, 200);
  const created = await physical.json();
  assert.equal(created.checkoutSessionId, sessionId);
  assert.equal(created.clientSecret, 'cs_test_secret_sample');
  assert.equal(created.publishableKey, env.STRIPE_PUBLISHABLE_KEY);
  assert.match(created.shippingUpdateToken, /^[a-f0-9]{64}$/);
  assert.equal(stripeCreateForm.get('ui_mode'), 'form');
  assert.equal(stripeCreateForm.get('line_items[0][price_data][unit_amount]'), '2500');
  assert.equal(stripeCreateForm.get('shipping_options[0][shipping_rate_data][fixed_amount][amount]'), '0');
  assert.equal(stripeCreateForm.get('metadata[shipping_flow]'), 'printful_dynamic_v1');

  const badToken = await updateShipping({
    checkout_session_id: sessionId, shipping_details: shipping,
    shipping_update_token: 'fake-token',
  });
  assert.equal(badToken.status, 403);
  assert.equal(quoteCalls, 0);
  assert.equal(shippingUpdates, 0);

  const quoted = await updateShipping({
    checkout_session_id: sessionId, shipping_details: shipping,
    shipping_update_token: created.shippingUpdateToken,
    shipping_amount_cents: 1,
    items: [{ variant_id: 999, price: 0.01 }],
  });
  assert.equal(quoted.status, 200);
  assert.deepEqual(await quoted.json(), { type: 'object', value: { succeeded: true } });
  assert.equal(quoteCalls, 1);
  assert.equal(shippingUpdates, 1);
  assert.equal(stripeUpdateForm.get('shipping_options[0][shipping_rate_data][fixed_amount][amount]'), '873');
  assert.equal(stripeUpdateForm.get('shipping_options[0][shipping_rate_data][fixed_amount][currency]'), 'usd');
  const saved = JSON.parse(records.get(`printful-shipping-quote:${sessionId}`));
  assert.equal(saved.amountCents, 873);
  assert.equal(saved.shippingRateId, 'shr_quoted_123');
  assert.equal(saved.method, 'STANDARD');
  assert.match(saved.addressHash, /^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(saved).includes('Main St'), 'Address PII must not be stored in quote');

  const badAddress = await updateShipping({
    checkout_session_id: sessionId,
    shipping_update_token: created.shippingUpdateToken,
    shipping_details: { address: { ...shipping.address, country: 'FR' } },
  });
  assert.notEqual(badAddress.status, 200);
  assert.equal(shippingUpdates, 1);

  const service = await checkout([{ type: 'service', id: 'cyber-security-evaluation', quantity: 1 }]);
  assert.equal(service.status, 200);
  assert.equal((await service.json()).url, 'https://checkout.stripe.com/c/pay/service-only');
  assert.equal(stripeCreateForm.get('ui_mode'), null);
  assert.equal(createCalls, 2);

  const cartHtml = await readFile(new URL('../../store/cart.html', import.meta.url), 'utf8');
  const script = cartHtml.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  new Function(script);
  assert.match(script, /initCheckoutFormSdk/);
  assert.match(script, /runServerUpdate/);
  assert.ok(!script.includes('STORE_SHIPPING_US_CENTS'));
  console.log('Printful exact shipping, signed quote update and embedded form tests passed.');
} finally {
  globalThis.fetch = originalFetch;
  globalThis.caches = originalCaches;
}
