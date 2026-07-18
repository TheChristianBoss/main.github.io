import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHmac } from 'node:crypto';

const workerPath = new URL('../store-api-secure.js', import.meta.url);
const source = await readFile(workerPath, 'utf8');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const { default: worker } = await import(moduleUrl);

const secret = 'whsec_test_store_order_kv';
const originalFetch = globalThis.fetch;
const originalCaches = globalThis.caches;
globalThis.caches = {
  default: {
    match: async () => null,
    put: async () => undefined,
  },
};

function signedRequest(event) {
  const body = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');
  return new Request('https://store-worker.example/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Stripe-Signature': `t=${timestamp},v1=${signature}`,
    },
    body,
  });
}

function paidPhysicalEvent(id = 'cs_test_kv_1') {
  return {
    id: `evt_${id}`,
    type: 'checkout.session.completed',
    data: {
      object: {
        id,
        payment_status: 'paid',
        metadata: { cart: '123:1', fulfillment_types: 'physical' },
        customer_details: { email: 'buyer@example.com', name: 'Buyer' },
        shipping_details: {
          name: 'Buyer',
          address: {
            line1: '1 Main St', city: 'Tampa', state: 'FL',
            country: 'US', postal_code: '33601',
          },
        },
      },
    },
  };
}

const baseEnv = {
  STRIPE_WEBHOOK_SECRET: secret,
  PRINTFUL_TOKEN: 'printful-test-token',
};

try {
  // Health endpoint reports a missing required binding.
  const unhealthy = await worker.fetch(new Request('https://store-worker.example/health'), baseEnv, {});
  assert.equal(unhealthy.status, 503);
  assert.deepEqual(await unhealthy.json(), {
    ok: false,
    service: 'christian-goblin-store-api',
    required_bindings: { STORE_ORDER_KV: false },
  });

  // A paid event must fail closed before any provider call when KV is absent.
  let providerCalls = 0;
  globalThis.fetch = async () => {
    providerCalls += 1;
    throw new Error('Provider must not be contacted without STORE_ORDER_KV');
  };
  const missingKvResponse = await worker.fetch(signedRequest(paidPhysicalEvent()), baseEnv, {});
  assert.equal(missingKvResponse.status, 503);
  assert.equal(providerCalls, 0);
  const missingKvBody = await missingKvResponse.json();
  assert.equal(missingKvBody.error, 'Store API configuration error');

  // Sequential webhook retries are stopped by the session-level record.
  const records = new Map();
  const kv = {
    get: async (key) => records.get(key) ?? null,
    put: async (key, value, options) => {
      assert.equal(options.expirationTtl, 60 * 60 * 24 * 120);
      records.set(key, value);
    },
  };
  const env = { ...baseEnv, STORE_ORDER_KV: kv };
  const healthy = await worker.fetch(new Request('https://store-worker.example/health'), env, {});
  assert.equal(healthy.status, 200);

  let printfulOrderCalls = 0;
  globalThis.fetch = async (url) => {
    const href = String(url);
    if (href.includes('/store/products/10')) {
      return new Response(JSON.stringify({
        result: {
          sync_product: { id: 10, name: 'Test Shirt' },
          sync_variants: [{
            id: 123, name: 'Medium', retail_price: '20.00', currency: 'USD',
            is_ignored: false, files: [],
          }],
        },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (href.endsWith('/store/products')) {
      return new Response(JSON.stringify({
        result: [{ id: 10, name: 'Test Shirt' }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (href.includes('/orders?update_existing=true')) {
      printfulOrderCalls += 1;
      return new Response(JSON.stringify({ result: { id: 9876 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw new Error(`Unexpected fetch: ${href}`);
  };

  const event = paidPhysicalEvent('cs_test_kv_retry');
  const first = await worker.fetch(signedRequest(event), env, {});
  assert.equal(first.status, 200);
  const firstBody = await first.json();
  assert.equal(firstBody.order_id, 9876);
  assert.equal(records.get('stripe-session:cs_test_kv_retry'), 'fulfilled');
  assert.equal(printfulOrderCalls, 1);

  const retry = await worker.fetch(signedRequest(event), env, {});
  assert.equal(retry.status, 200);
  assert.deepEqual(await retry.json(), { received: true, duplicate: true });
  assert.equal(printfulOrderCalls, 1);

  console.log('Mandatory store order KV tests passed.');
} finally {
  globalThis.fetch = originalFetch;
  globalThis.caches = originalCaches;
}
