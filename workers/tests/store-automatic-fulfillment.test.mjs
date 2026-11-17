import assert from 'node:assert/strict';
import { createHmac, createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const code = await readFile(new URL('../store-api-secure.js', import.meta.url), 'utf8');
const { default: worker } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

const secret = 'whsec_test_automatic_fulfillment';
const originalFetch = globalThis.fetch;
const originalCaches = globalThis.caches;
globalThis.caches = {
  default: {
    match: async () => null,
    put: async () => undefined,
  },
};

const records = new Map();
const kv = {
  get: async (key) => records.get(key) ?? null,
  put: async (key, value) => { records.set(key, value); },
};
const env = {
  STRIPE_WEBHOOK_SECRET: secret,
  PRINTFUL_TOKEN: 'test-printful-token',
  PRINTFUL_AUTO_CONFIRM: 'true',
  STORE_ORDER_KV: kv,
};

const orders = new Map();
let createCalls = 0;
let confirmationCalls = 0;
let readCalls = 0;
let failNextConfirmation = false;

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

function signedRequest(sessionId, paid = true, eventType = 'checkout.session.completed', withAddress = true, shippingAmount = 700) {
  const session = {
    id: sessionId,
    payment_status: paid ? 'paid' : 'unpaid',
    metadata: {
      cart: '123:1', fulfillment_types: 'physical',
      shipping_flow: 'printful_dynamic_v1',
    },
    shipping_cost: { amount_total: shippingAmount, shipping_rate: 'shr_auto_test' },
    currency: 'usd',
    customer_details: { name: 'Buyer', email: 'buyer@example.com' },
    ...(withAddress ? {
      collected_information: {
        shipping_details: {
          name: 'Buyer',
          address: { line1: '1 Main St', city: 'Tampa', state: 'FL', country: 'US', postal_code: '33601' },
        },
      },
    } : {}),
  };
  const data = JSON.stringify({
    id: `evt_${sessionId}`,
    type: eventType,
    data: { object: session },
  });
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac('sha256', secret).update(`${t}.${data}`).digest('hex');
  return new Request('https://store-worker.example/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Stripe-Signature': `t=${t},v1=${v1}` },
    body: data,
  });
}

async function send(sessionId, paid = true, eventType = 'checkout.session.completed', withAddress = true, shippingAmount = 700) {
  if (paid && withAddress) {
    const address = {
      country: 'US', state: 'FL', postal_code: '33601',
      city: 'TAMPA', line1: '1 MAIN ST', line2: '',
    };
    const addressHash = createHash('sha256').update(JSON.stringify(address)).digest('hex');
    if (!records.has(`printful-shipping-quote:${sessionId}`)) {
      records.set(`printful-shipping-quote:${sessionId}`, JSON.stringify({
        addressHash, amountCents: 700, currency: 'usd',
        method: 'STANDARD', shippingRateId: 'shr_auto_test',
      }));
    }
  }
  const response = await worker.fetch(signedRequest(sessionId, paid, eventType, withAddress, shippingAmount), env, {});
  return { status: response.status, body: await response.json() };
}

globalThis.fetch = async (url, options = {}) => {
  const href = String(url);
  const target = new URL(href);
  if (href === 'https://api.printful.com/store/products') {
    return json({ result: [{ id: 10, name: 'Safe Shirt' }] });
  }
  if (href === 'https://api.printful.com/store/products/10') {
    return json({ result: {
      sync_product: { id: 10, name: 'Safe Shirt' },
      sync_variants: [{
        id: 123, name: 'Medium', retail_price: '25.00',
        currency: 'USD', is_ignored: false, files: [],
      }],
    } });
  }
  if (target.origin === 'https://api.printful.com' && target.pathname.startsWith('/orders/@')) {
    const externalId = decodeURIComponent(target.pathname.slice('/orders/@'.length).replace(/\/confirm$/, ''));
    const order = orders.get(externalId);
    if (target.pathname.endsWith('/confirm')) {
      assert.equal(options.method, 'POST');
      confirmationCalls += 1;
      assert.ok(order, 'Confirm only existing draft orders');
      if (failNextConfirmation) {
        failNextConfirmation = false;
        return json({ error: { message: 'Simulated temporary provider outage' } }, 503);
      }
      assert.equal(order.status, 'draft', 'Do not reconfirm an already submitted order');
      order.status = 'pending';
      return json({ result: { ...order } });
    }
    readCalls += 1;
    return order ? json({ result: { ...order } }) : json({ error: { message: 'Not Found' } }, 404);
  }
  if (href === 'https://api.printful.com/orders?update_existing=true') {
    assert.equal(options.method, 'POST');
    const payload = JSON.parse(options.body);
    assert.match(payload.external_id, /^cg_[a-f0-9]{29}$/);
    assert.equal(payload.items[0].sync_variant_id, 123);
    assert.equal(payload.items[0].retail_price, '25.00');
    assert.equal(payload.shipping, 'STANDARD');
    assert.equal(payload.recipient.country_code, 'US');
    assert.equal(payload.recipient.name, 'Buyer');
    assert.equal(payload.recipient.address1, '1 Main St');
    assert.equal(payload.recipient.zip, '33601');
    if (!orders.has(payload.external_id)) {
      createCalls += 1;
      orders.set(payload.external_id, {
        id: 1000 + createCalls,
        external_id: payload.external_id,
        status: 'draft',
      });
    }
    return json({ result: { ...orders.get(payload.external_id) } });
  }
  throw new Error(`Unexpected external API call: ${href}`);
};

try {
  const unpaid = await send('cs_test_unpaid_auto', false);
  assert.equal(unpaid.status, 200);
  assert.equal(unpaid.body.pending_payment, true);
  assert.equal(createCalls, 0);
  assert.equal(confirmationCalls, 0);

  const first = await send('cs_test_auto_1');
  assert.equal(first.status, 200);
  assert.equal(first.body.printful_auto_confirmed, true);
  assert.equal(first.body.printful_order_status, 'pending');
  assert.equal(createCalls, 1);
  assert.equal(confirmationCalls, 1);
  assert.equal(records.get('stripe-session:cs_test_auto_1'), 'processed');

  const again = await send('cs_test_auto_1');
  assert.equal(again.body.duplicate, true);
  assert.equal(createCalls, 1);
  assert.equal(confirmationCalls, 1);

  // Simulate the KV write missing after Printful successfully confirmed.
  records.clear();
  const reconciled = await send('cs_test_auto_1');
  assert.equal(reconciled.status, 200);
  assert.equal(reconciled.body.printful_order_status, 'pending');
  assert.equal(createCalls, 1, 'No duplicate order on lost KV write');
  assert.equal(confirmationCalls, 1, 'No duplicate confirmation on lost KV write');
  assert.ok(readCalls >= 2);

  // A provider outage during confirmation must leave the session retryable.
  failNextConfirmation = true;
  const failed = await send('cs_test_retry_auto', true, 'checkout.session.async_payment_succeeded');
  assert.equal(failed.status, 500);
  assert.equal(records.has('stripe-session:cs_test_retry_auto:printful'), false);
  assert.equal(records.has('stripe-session:cs_test_retry_auto'), false);
  assert.equal(createCalls, 2);
  assert.equal(confirmationCalls, 2);

  const recovered = await send('cs_test_retry_auto', true, 'checkout.session.async_payment_succeeded');
  assert.equal(recovered.status, 200);
  assert.equal(recovered.body.printful_auto_confirmed, true);
  assert.equal(recovered.body.printful_order_status, 'pending');
  assert.equal(createCalls, 2, 'Existing Printful draft reused on retry');
  assert.equal(confirmationCalls, 3);

  const invalidShipping = await send('cs_test_no_shipping', true, 'checkout.session.completed', false);
  assert.equal(invalidShipping.status, 500);
  assert.equal(createCalls, 2, 'Missing shipping details must block order creation');
  assert.equal(confirmationCalls, 3);

  // A forged or unpaid shipping charge must never start Printful fulfillment.
  const underpaidShipping = await send('cs_test_underpaid_shipping', true, 'checkout.session.completed', true, 1);
  assert.equal(underpaidShipping.status, 500);
  assert.equal(createCalls, 2);
  assert.equal(confirmationCalls, 3);

  // Turning auto-confirm off reverts to non-chargeable draft creation.
  env.PRINTFUL_AUTO_CONFIRM = 'false';
  const manual = await send('cs_test_manual_draft');
  assert.equal(manual.status, 200);
  assert.equal(manual.body.printful_order_status, 'draft');
  assert.equal(manual.body.printful_auto_confirmed, false);
  assert.equal(createCalls, 3);
  assert.equal(confirmationCalls, 3);

  console.log('Safe automatic Printful fulfillment tests passed.');
} finally {
  globalThis.fetch = originalFetch;
  globalThis.caches = originalCaches;
}
