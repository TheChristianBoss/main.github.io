import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workerPath = new URL('../store-api-secure.js', import.meta.url);
const source = await readFile(workerPath, 'utf8');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const { default: worker } = await import(moduleUrl);

const originalFetch = globalThis.fetch;
const originalCaches = globalThis.caches;
globalThis.caches = {
  default: {
    match: async () => null,
    put: async () => undefined,
  },
};

let checkoutRequests = 0;
let mostRecentStripeForm;
globalThis.fetch = async (url, options = {}) => {
  const href = String(url);
  if (href === 'https://api.printful.com/store/products') {
    return new Response(JSON.stringify({
      result: [{ id: 10, name: 'Trusted Shirt' }],
    }), { status: 200 });
  }
  if (href === 'https://api.printful.com/store/products/10') {
    return new Response(JSON.stringify({
      result: {
        sync_product: { id: 10, name: 'Trusted Shirt' },
        sync_variants: [{
          id: 123,
          name: 'Medium',
          retail_price: '25.00',
          currency: 'USD',
          is_ignored: false,
          files: [],
        }],
      },
    }), { status: 200 });
  }
  if (href === 'https://api.stripe.com/v1/checkout/sessions') {
    checkoutRequests += 1;
    assert.equal(options.method, 'POST');
    mostRecentStripeForm = new URLSearchParams(options.body);
    return new Response(JSON.stringify({
      id: 'cs_test_price_integrity',
      client_secret: 'cs_test_secret_price',
    }), { status: 200 });
  }
  throw new Error(`Unexpected external request: ${href}`);
};

async function checkout(items) {
  return worker.fetch(new Request('https://store-worker.example/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items,
      customer_email: 'buyer@example.com',
      // These browser-controlled values must never influence the Stripe charge.
      amount_total: 1,
      shipping: 0,
      shipping_country: 'US',
      currency: 'XXX',
    }),
  }), {
    PRINTFUL_TOKEN: 'printful-test-token',
    STRIPE_SECRET_KEY: 'sk_test_no_actual_api_call',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_example',
    STRIPE_WEBHOOK_SECRET: 'whsec_example',
    STORE_ORDER_KV: { get: async () => null, put: async () => undefined },
  }, {});
}

try {
  const response = await checkout([
    {
      type: 'physical',
      variant_id: '123',
      quantity: 1,
      price: '0.01',
      unit_amount: 1,
      currency: 'XXX',
      product_name: 'Tampered product name',
    },
    {
      type: 'service',
      id: 'cyber-security-evaluation',
      quantity: 1,
      price_cents: 1,
      unit_amount: 1,
      name: 'Tampered service name',
    },
  ]);

  assert.equal(response.status, 200);
  assert.equal((await response.json()).clientSecret, 'cs_test_secret_price');
  assert.equal(checkoutRequests, 1);
  assert.equal(mostRecentStripeForm.get('line_items[0][price_data][unit_amount]'), '2500');
  assert.equal(mostRecentStripeForm.get('line_items[0][price_data][currency]'), 'usd');
  assert.equal(mostRecentStripeForm.get('line_items[0][price_data][product_data][name]'), 'Trusted Shirt');
  assert.equal(mostRecentStripeForm.get('line_items[1][price_data][unit_amount]'), '4000');
  assert.equal(mostRecentStripeForm.get('line_items[1][price_data][product_data][name]'), 'Cyber Security Evaluation');
  assert.equal(mostRecentStripeForm.get('line_items[1][quantity]'), '1');
  assert.equal(mostRecentStripeForm.get('metadata[cart]'), '123:1');
  // Browser-supplied prices still cannot override merchant prices. The
  // initial shipping option is a placeholder, NOT a verified rate.
  assert.equal(mostRecentStripeForm.get('shipping_options[0][shipping_rate_data][fixed_amount][amount]'), '0');
  assert.equal(mostRecentStripeForm.get('ui_mode'), 'form');
  assert.equal(mostRecentStripeForm.get('metadata[shipping_flow]'), 'printful_dynamic_v1');
  assert.equal(mostRecentStripeForm.get('metadata[shipping_country]'), null);

  const invalidVariant = await checkout([{
    variant_id: '9999999',
    quantity: 1,
    unit_amount: 1,
  }]);
  assert.notEqual(invalidVariant.status, 200);
  assert.equal(checkoutRequests, 1, 'Unrecognized variants must never reach Stripe');

  const invalidService = await checkout([{
    type: 'service',
    id: 'made-up-service',
    quantity: 1,
    unit_amount: 1,
  }]);
  assert.notEqual(invalidService.status, 200);
  assert.equal(checkoutRequests, 1, 'Unrecognized services must never reach Stripe');

  console.log('Server-authoritative store checkout price tests passed.');
} finally {
  globalThis.fetch = originalFetch;
  globalThis.caches = originalCaches;
}
