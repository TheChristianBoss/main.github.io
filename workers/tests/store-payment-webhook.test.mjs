import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import fs from 'node:fs/promises';

const workerPath = new URL('../store-api-secure.js', import.meta.url);
const source = await fs.readFile(workerPath, 'utf8');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const { default: worker } = await import(moduleUrl);

const secret = 'whsec_test_payment_verification';

function signedRequest(event) {
  const body = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');
  return new Request('https://worker.example/webhook', {
    method: 'POST',
    headers: {
      Origin: 'https://christiangoblin.com',
      'Content-Type': 'application/json',
      'Stripe-Signature': `t=${timestamp},v1=${signature}`,
    },
    body,
  });
}

async function send(event) {
  const response = await worker.fetch(
    signedRequest(event),
    { STRIPE_WEBHOOK_SECRET: secret },
    {},
  );
  return { response, body: await response.json() };
}

{
  const { response, body } = await send({
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_unpaid', payment_status: 'unpaid', metadata: { cart: 'should-not-be-read' } } },
  });
  assert.equal(response.status, 200);
  assert.equal(body.pending_payment, true);
  assert.equal(body.payment_status, 'unpaid');
}

{
  const { body } = await send({
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_paid', payment_status: 'paid', metadata: {} } },
  });
  assert.equal(body.received, true);
  assert.equal(body.note, 'Empty fulfillment payload');
}

{
  const { body } = await send({
    type: 'checkout.session.async_payment_succeeded',
    data: { object: { id: 'cs_async_paid', payment_status: 'paid', metadata: {} } },
  });
  assert.equal(body.received, true);
  assert.equal(body.note, 'Empty fulfillment payload');
}

{
  const { body } = await send({
    type: 'checkout.session.async_payment_failed',
    data: { object: { id: 'cs_failed', payment_status: 'unpaid', metadata: {} } },
  });
  assert.deepEqual(body, { received: true });
}

console.log('Store webhook payment-status tests passed.');
