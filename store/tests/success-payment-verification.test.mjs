import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const htmlUrl = new URL('../success.html', import.meta.url);
const html = await fs.readFile(htmlUrl, 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length, 1, 'Expected one inline script');
const script = scripts[0][1];

async function runScenario({ search = '?session_id=cs_test_123456789012', response, fetchError } = {}) {
  const elements = Object.fromEntries([
    'statusIcon', 'pageHeading', 'orderSummary', 'serviceSummary', 'sessionRef', 'orderStatus',
  ].map((id) => [id, { textContent: '' }]));
  const removed = [];
  const document = {
    title: 'Verifying Order — Christian Goblin',
    getElementById(id) {
      assert.ok(elements[id], `Unknown element ${id}`);
      return elements[id];
    },
  };

  const context = vm.createContext({
    console: { error() {} },
    document,
    window: { location: { search } },
    localStorage: { removeItem(key) { removed.push(key); } },
    URLSearchParams,
    Intl,
    Number,
    String,
    encodeURIComponent,
    fetch: async () => {
      if (fetchError) throw fetchError;
      return {
        ok: response?.ok ?? true,
        async json() { return response?.body ?? {}; },
      };
    },
    setTimeout,
    clearTimeout,
  });

  vm.runInContext(script, context, { filename: 'success.html:inline-script' });
  await new Promise((resolve) => setTimeout(resolve, 10));
  return { elements, removed, title: document.title };
}

{
  const result = await runScenario({
    response: {
      body: {
        session: {
          status: 'complete',
          payment_status: 'paid',
          amount_total: 4000,
          currency: 'usd',
          service_count: 1,
        },
      },
    },
  });
  assert.deepEqual(result.removed, ['cg_cart']);
  assert.equal(result.elements.pageHeading.textContent, 'Order Confirmed');
  assert.match(result.elements.orderStatus.textContent, /Payment verified/);
  assert.equal(result.title, 'Order Confirmed — Christian Goblin');
}

{
  const result = await runScenario({
    response: {
      body: {
        session: {
          status: 'open',
          payment_status: 'unpaid',
          amount_total: 4000,
          currency: 'usd',
          service_count: 0,
        },
      },
    },
  });
  assert.deepEqual(result.removed, []);
  assert.equal(result.elements.pageHeading.textContent, 'Payment Processing');
  assert.match(result.elements.serviceSummary.textContent, /cart has not been changed/i);
}

{
  const result = await runScenario({ fetchError: new Error('network down') });
  assert.deepEqual(result.removed, []);
  assert.equal(result.elements.pageHeading.textContent, 'Unable to Verify Payment');
  assert.doesNotMatch(result.elements.orderStatus.textContent, /payment was received/i);
}

{
  const result = await runScenario({ search: '' });
  assert.deepEqual(result.removed, []);
  assert.equal(result.elements.pageHeading.textContent, 'Checkout Not Verified');
}

console.log('Store success-page payment verification tests passed.');
