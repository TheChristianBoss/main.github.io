import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../store-api-secure.js', import.meta.url), 'utf8');
const { default: worker } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

const signatureSecret = 'whsec_prequoted_payment_test';
const originalFetch = globalThis.fetch;
const originalCaches = globalThis.caches;
globalThis.caches = { default: { match: async () => null, put: async () => {} } };

const records = new Map();
const env = {
  PRINTFUL_TOKEN: 'test_printful_secret',
  STRIPE_SECRET_KEY: 'sk_test_not_really_called',
  STRIPE_WEBHOOK_SECRET: signatureSecret,
  PRINTFUL_AUTO_CONFIRM: 'false',
  STORE_ORDER_KV: {
    get: async key => records.get(key) ?? null,
    put: async (key, value) => { records.set(key, value); },
  },
};
const recipientAddress = {
  country: 'US', state: 'FL', postal_code: '33601',
  city: 'TAMPA', line1: '1 MAIN ST', line2: '',
};
const addressHash = createHash('sha256').update(JSON.stringify(recipientAddress)).digest('hex');
let paymentIntentCalls = 0;
let ordersCreated = 0;
let printfulReadCalls = 0;
let intentStatus = 'succeeded';
let intentShipping = {
  name: 'Buyer',
  address: { line1: '1 MAIN ST', city: 'TAMPA', state: 'FL', country: 'US', postal_code: '33601' },
};
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json' },
});

globalThis.fetch = async (url, options = {}) => {
  const href = String(url);
  if (href === 'https://api.stripe.com/v1/payment_intents/pi_test_shipping_paid') {
    paymentIntentCalls++;
    assert.equal(options.headers['Stripe-Version'], '2026-03-25.dahlia');
    return json({ id: 'pi_test_shipping_paid', status: intentStatus, shipping: intentShipping });
  }
  if (href === 'https://api.printful.com/store/products') {
    return json({ result: [{ id: 10, name: 'Trusted Shirt' }] });
  }
  if (href === 'https://api.printful.com/store/products/10') {
    return json({ result: { sync_product: { id: 10, name: 'Trusted Shirt' }, sync_variants: [{
      id: 123, variant_id: 777, name: 'Medium', retail_price: '25.00',
      currency: 'USD', is_ignored: false, files: [],
    }] } });
  }
  if (href.startsWith('https://api.printful.com/orders/@') && options.method !== 'POST') {
    printfulReadCalls++;
    return json({ error: { message: 'Not Found' } }, 404);
  }
  if (href === 'https://api.printful.com/orders?update_existing=true') {
    ordersCreated++;
    const payload = JSON.parse(options.body);
    assert.equal(payload.shipping, 'STANDARD');
    assert.equal(payload.items[0].sync_variant_id, 123);
    assert.equal(payload.recipient.name, 'Buyer');
    assert.equal(payload.recipient.address1, '1 MAIN ST');
    assert.equal(payload.recipient.zip, '33601');
    assert.equal(payload.recipient.country_code, 'US');
    assert.equal(payload.recipient.email, 'buyer@example.com');
    return json({ result: { id: 4000 + ordersCreated, status: 'draft' } });
  }
  throw Error('Unexpected upstream API: ' + href);
};

function request(id, opts = {}) {
  const session = {
    id,
    payment_status: opts.paid === false ? 'unpaid' : 'paid',
    payment_intent: opts.paymentIntent === undefined ? 'pi_test_shipping_paid' : opts.paymentIntent,
    currency: 'usd',
    metadata: {
      cart: '123:1',
      fulfillment_types: 'physical',
      shipping_flow: opts.shippingFlow || 'printful_prequoted_v2',
    },
    shipping_cost: {
      amount_total: opts.shippingAmount ?? 873,
      shipping_rate: opts.shippingRate ?? 'shr_prequoted_paid',
    },
    customer_details: { name: 'Buyer', email: 'buyer@example.com' },
  };
  const event = JSON.stringify({
    id: 'evt_' + id,
    type: opts.eventType || 'checkout.session.completed',
    data: { object: session },
  });
  const stamp = Math.floor(Date.now() / 1000);
  const sig = createHmac('sha256', signatureSecret).update(stamp + '.' + event).digest('hex');
  return new Request('https://store.example/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Stripe-Signature': 't=' + stamp + ',v1=' + sig },
    body: event,
  });
}

function saveQuote(id, overrides = {}) {
  records.set('printful-shipping-quote:' + id, JSON.stringify({
    addressHash, amountCents: 873, currency: 'usd',
    method: 'STANDARD', shippingRateId: 'shr_prequoted_paid',
    ...overrides,
  }));
}

async function webhook(id, opts = {}) {
  const response = await worker.fetch(request(id, opts), env, {});
  return { status: response.status, result: await response.json() };
}

try {
  saveQuote('cs_test_prequote_unpaid');
  let r = await webhook('cs_test_prequote_unpaid', { paid: false });
  assert.equal(r.status, 200);
  assert.equal(r.result.pending_payment, true);
  assert.equal(ordersCreated, 0);
  assert.equal(paymentIntentCalls, 0);

  r = await webhook('cs_test_prequote_no_quote');
  assert.equal(r.status, 500, 'Missing server quote blocks paid fulfillment');
  assert.equal(ordersCreated, 0);

  saveQuote('cs_test_prequote_wrong_amount');
  r = await webhook('cs_test_prequote_wrong_amount', { shippingAmount: 0 });
  assert.equal(r.status, 500, 'Zero-dollar charge cannot use recorded positive shipping');
  assert.equal(ordersCreated, 0);

  saveQuote('cs_test_prequote_bad_rate');
  r = await webhook('cs_test_prequote_bad_rate', { shippingRate: 'shr_unverified' });
  assert.equal(r.status, 500);
  assert.equal(ordersCreated, 0);

  saveQuote('cs_test_prequote_old_flow');
  r = await webhook('cs_test_prequote_old_flow', { shippingFlow: 'untrusted_v1' });
  assert.equal(r.status, 500);
  assert.equal(ordersCreated, 0);

  saveQuote('cs_test_prequote_missing_pi');
  r = await webhook('cs_test_prequote_missing_pi', { paymentIntent: null });
  assert.equal(r.status, 500);
  assert.equal(ordersCreated, 0);

  saveQuote('cs_test_prequote_wrong_intent_status');
  intentStatus = 'requires_payment_method';
  r = await webhook('cs_test_prequote_wrong_intent_status');
  assert.equal(r.status, 500);
  assert.equal(ordersCreated, 0);
  intentStatus = 'succeeded';

  saveQuote('cs_test_prequote_wrong_address');
  intentShipping = {
    name: 'Buyer',
    address: { line1: '999 DIFFERENT ROAD', city: 'TAMPA', state: 'FL', postal_code: '33601', country: 'US' },
  };
  r = await webhook('cs_test_prequote_wrong_address');
  assert.equal(r.status, 500);
  assert.equal(ordersCreated, 0);
  intentShipping = {
    name: 'Buyer',
    address: { line1: '1 MAIN ST', city: 'TAMPA', state: 'FL', postal_code: '33601', country: 'US' },
  };

  saveQuote('cs_test_prequote_good');
  r = await webhook('cs_test_prequote_good');
  assert.equal(r.status, 200);
  assert.equal(r.result.printful_order_status, 'draft');
  assert.equal(r.result.printful_auto_confirmed, false);
  assert.equal(ordersCreated, 1);
  assert.ok(paymentIntentCalls >= 1);
  assert.equal(records.get('stripe-session:cs_test_prequote_good'), 'processed');
  assert.equal(printfulReadCalls, 1);

  r = await webhook('cs_test_prequote_good');
  assert.equal(r.status, 200);
  assert.equal(r.result.duplicate, true);
  assert.equal(ordersCreated, 1, 'Retry must not duplicate a Printful order');

  console.log('Prequoted paid-webhook address, charge, receipt, and idempotency checks passed.');
} finally {
  globalThis.fetch = originalFetch;
  globalThis.caches = originalCaches;
}
