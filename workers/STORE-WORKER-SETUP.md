# Christian Goblin Store Worker setup

`STORE_ORDER_KV` is a required binding. The Worker deliberately returns HTTP 503 for a paid fulfillment webhook if this binding is missing, so an order cannot be sent to Printful or Discord without duplicate-retry records.

## Deployment target and safety

The live storefront and Stripe webhook currently point to
`https://site.michaelthechristiangoblin.workers.dev`. Deploy this code to the
**existing `site` Worker**, not to a new `christian-goblin-store-api` Worker.
The `workers/wrangler.store.example.jsonc` file is an example only; confirm all
bindings, routes and compatibility settings before deployment. Never commit or
print real token values.

**Do not deploy directly from the main branch.** Review the change, run tests in
sandbox, and back up the currently deployed `site` Worker first.

### Pricing integrity (must not regress)

- The browser may send variant IDs, quantities, service IDs and customer email.
- The browser **must not set the Stripe unit price, currency, product name or
  fulfillment cost**. `buildTrustedCheckoutItems()` resolves physical prices
  from Printful data, and service prices from the Worker-owned `SERVICE_PRODUCTS`.
- The test `node workers/tests/store-checkout-price-integrity.test.mjs` sends
  forged prices and checks that Stripe receives the trusted values.
- Keep `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PRINTFUL_TOKEN` and
  `DISCORD_WEBHOOK_URL` server-side only.

## Create and bind the namespace

From the repository root in PowerShell:

```powershell
npx wrangler kv namespace create STORE_ORDER_KV
```

Copy the namespace ID printed by Wrangler. Either bind it in the Cloudflare dashboard under **Workers & Pages → your store Worker → Settings → Bindings → Add → KV namespace**, using the variable name `STORE_ORDER_KV`, or copy `workers/wrangler.store.example.jsonc` to your actual Wrangler configuration and replace the placeholder ID.

The binding name must be exactly:

```text
STORE_ORDER_KV
```

## Verify the binding

After deployment, request the Worker's `/health` endpoint. A correctly bound Worker returns HTTP 200 with:

```json
{
  "ok": true,
  "service": "christian-goblin-store-api",
  "required_bindings": {
    "STORE_ORDER_KV": true
  }
}
```

A missing binding returns HTTP 503 and `STORE_ORDER_KV: false`.

## Retry behavior

The Worker stores fulfillment records for 120 days. It records separate Printful and service-notification steps, then records the whole Stripe Checkout Session only after all requested steps finish. This allows a mixed order to resume after a partial failure without deliberately repeating a completed step.

Printful limits the `external_id` to 32 characters. The Worker now maps the
66-character Stripe Checkout Session ID to a deterministic `cg_`-prefixed
SHA-256-derived 32-character ID, then calls Printful with
`update_existing=true`. Both repeated deliveries and retries use the same
external ID. The full session ID remains in the KV record.

**Order creation is draft-only.** The Worker calls `POST /orders?update_existing=true`
without `confirm=1`; this does not submit the order to production or charge
the Printful billing method. An explicit approval and tested confirmation flow
are required before automatic fulfillment is enabled. Creating a paid Stripe
Checkout Session does not by itself mean the goods will ship.

The Worker validates the Stripe signature and checks
`session.payment_status === 'paid'` before a paid fulfillment attempt. Configure
the Stripe webhook for both `checkout.session.completed` and
`checkout.session.async_payment_succeeded` when deploying this new Worker;
the live webhook currently subscribes to only the first event.

Shipping options/rates are not yet configured in Checkout, and
`automatic_tax` is not enabled. Confirm your shipping pricing and tax
obligations before live fulfillment.

Workers KV is eventually consistent, so this design protects ordinary sequential webhook retries but is not a strict global transaction lock. For strict exactly-once processing during simultaneous requests from different Cloudflare locations, migrate the lock to a Durable Object or another strongly consistent transactional store.

## Pre-deployment verification

Run locally on the proposed branch:

```powershell
node workers/tests/store-payment-webhook.test.mjs
node workers/tests/store-order-kv-required.test.mjs
node workers/tests/store-checkout-price-integrity.test.mjs
npm run validate
```

Then prepare Cloudflare's existing `site` Worker:
1. Create an account KV namespace and bind it as `STORE_ORDER_KV`.
2. Verify `PRINTFUL_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   and `DISCORD_WEBHOOK_URL` bindings exist without exposing values.
3. Deploy only after the PR and full test suite have been reviewed.
4. Check `/health` returns HTTP 200 and `STORE_ORDER_KV: true`.
5. In Stripe live mode, add `checkout.session.async_payment_succeeded` to
   the existing webhook; do not create a duplicate destination.
6. Test unpaid, delayed-payment, malformed, repeated, and paid webhook deliveries
   in a sandbox. Verify product and service totals do not change when a client
   sends altered prices. Do not test with a real charge or Printful order.

No deployment or secret migration is performed by this document.
