import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../store-api-secure.js', import.meta.url), 'utf8');
const { default: worker } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

const originalFetch = globalThis.fetch;
const originalCaches = globalThis.caches;
globalThis.caches = { default: { match: async () => null, put: async () => undefined } };
let sessionCalls = 0;
let params;
const json = (data, status = 200) => new Response(JSON.stringify(data), { status });
globalThis.fetch = async (url, options = {}) => {
  const href = String(url);
  if (href === 'https://api.printful.com/store/products') {
    return json({ result: [{ id: 10, name: 'Test Shirt' }] });
  }
  if (href === 'https://api.printful.com/store/products/10') {
    return json({ result: {
      sync_product: { id: 10, name: 'Test Shirt' },
      sync_variants: [{
        id: 123, name: 'Medium', retail_price: '25.00',
        currency: 'USD', is_ignored: false, files: [],
      }],
    } });
  }
  if (href === 'https://api.stripe.com/v1/checkout/sessions') {
    sessionCalls += 1;
    params = new URLSearchParams(options.body);
    return json({ url: 'https://checkout.stripe.com/pay/cs_test_shipping' });
  }
  throw new Error(`Unexpected URL: ${href}`);
};

async function checkout(shippingCountry, shippingConfig = {}, physical = true) {
  const items = physical ? [{ type: 'physical', variant_id: 123, quantity: 2 }] :
    [{ type: 'service', id: 'cyber-security-evaluation', quantity: 1 }];
  return worker.fetch(new Request('https://store-worker.example/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items,
      shipping_country: shippingCountry,
      shipping_amount_cents: 1,
      shipping_fee: 1,
      amount_total: 1,
    }),
  }), {
    PRINTFUL_TOKEN: 'fake-token',
    STRIPE_SECRET_KEY: 'fake-secret',
    ...shippingConfig,
  }, {});
}

try {
  let r = await checkout('US');
  assert.notEqual(r.status, 200, 'Physical checkout must fail closed when shipping is not configured');
  assert.equal(sessionCalls, 0);

  r = await checkout('', { STORE_SHIPPING_US_CENTS: '900' });
  assert.notEqual(r.status, 200, 'A destination country is required');
  assert.equal(sessionCalls, 0);

  r = await checkout('FR', { STORE_SHIPPING_FR_CENTS: '700' });
  assert.notEqual(r.status, 200, 'Unsupported countries must be rejected');
  assert.equal(sessionCalls, 0);

  r = await checkout('US', { STORE_SHIPPING_US_CENTS: '0' });
  assert.notEqual(r.status, 200, 'Zero shipping is not a configured separate charge');
  assert.equal(sessionCalls, 0);

  r = await checkout('US', { STORE_SHIPPING_US_CENTS: '9.99' });
  assert.notEqual(r.status, 200, 'Only integer cents are accepted');
  assert.equal(sessionCalls, 0);

  r = await checkout('US', { STORE_SHIPPING_US_CENTS: '900' });
  assert.equal(r.status, 200);
  assert.equal(sessionCalls, 1);
  assert.equal(params.get('shipping_options[0][shipping_rate_data][fixed_amount][amount]'), '900');
  assert.equal(params.get('shipping_options[0][shipping_rate_data][fixed_amount][currency]'), 'usd');
  assert.equal(params.get('shipping_address_collection[allowed_countries][0]'), 'US');
  assert.equal(params.get('metadata[shipping_amount_cents]'), '900');
  assert.equal(params.get('metadata[shipping_country]'), 'US');
  assert.equal(params.get('line_items[0][price_data][unit_amount]'), '2500');

  r = await checkout('CA', { STORE_SHIPPING_US_CENTS: '900', STORE_SHIPPING_CA_CENTS: '1500' });
  assert.equal(r.status, 200);
  assert.equal(params.get('shipping_address_collection[allowed_countries][0]'), 'CA');
  assert.equal(params.get('shipping_options[0][shipping_rate_data][fixed_amount][amount]'), '1500');
  assert.equal(sessionCalls, 2);

  r = await checkout(undefined, {}, false);
  assert.equal(r.status, 200, 'Services do not require physical shipping');
  assert.equal(params.get('shipping_options[0][shipping_rate_data][fixed_amount][amount]'), null);
  assert.equal(params.get('shipping_address_collection[allowed_countries][0]'), null);
  assert.equal(sessionCalls, 3);

  const html = await readFile(new URL('../../store/cart.html', import.meta.url), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script, 'Cart inline JavaScript exists');
  new Function(script);
  assert.ok(script.includes('shippingCountry'), 'Cart UI includes a shipping selector');
  console.log('Separate shipping and browser-price integrity tests passed.');
} finally {
  globalThis.fetch = originalFetch;
  globalThis.caches = originalCaches;
}
