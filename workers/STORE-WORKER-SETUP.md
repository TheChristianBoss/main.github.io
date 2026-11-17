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

**Fulfillment preference: automatic, after paid Stripe checkout.** The Worker
supports automatic Printful production submission only when the Cloudflare
variable `PRINTFUL_AUTO_CONFIRM` is the exact string `true`. It defaults
to off when missing or set to `false`. This guard is deliberate: confirming
an order can charge your Printful billing method.

For verified paid physical checkouts the Worker:
1. Derives a deterministic 32-character Printful external ID from the Stripe
   Checkout Session ID.
2. Looks up that external ID at Printful before creating anything. Repeated
   requests can recover orders that were accepted before an earlier timeout.
3. Creates a **draft** only if no matching Printful order exists.
4. **If auto confirmation is enabled:** submits that draft through
   `POST /orders/@{external_id}/confirm` and records success only after the
   response reports a submitted status (`pending`, `inreview`, `inprocess`,
   `partial` or `fulfilled`). Otherwise, keeps the draft.
5. Records each successful step under the Stripe Session ID in KV, so
   ordinary sequential webhook retries do not repeat completed work.

Important: Cloudflare KV is eventually consistent. The deterministic Printful
external ID and initial lookup reduce duplicate-submission risk but **do not
guarantee exactly-once execution under simultaneous requests**. Do not claim
perfect deduplication until there is a transactional lock (for example a
Durable Object) or proven provider-side atomic idempotency.

**Exceptional Printful states:** Printful documents that some orders may be held while
production costs are calculated and later return to `draft` for another
confirmation. This Worker does not yet subscribe to Printful's hold-release
webhook, so those orders require monitoring and a separate recovery flow.
Auto-confirmation is not a guarantee that every order will immediately print.

Keep `PRINTFUL_AUTO_CONFIRM=false` in **production** until shipping fees,
Printful billing, webhook subscriptions, and a test-mode Stripe checkout are
verified. After that, intentionally change it to `true` to activate
automatic, chargeable fulfillment. Do not put a live Printful token in tests.

The Worker validates the Stripe signature and checks
`session.payment_status === 'paid'` before a paid fulfillment attempt. Configure
the Stripe webhook for both `checkout.session.completed` and
`checkout.session.async_payment_succeeded` when deploying this new Worker;
the live webhook currently subscribes to only the first event.

## Exact, customer-paid Printful shipping (prepared, not live)

The owner chose **exact Printful shipping rates charged separately**.
The hosted Checkout flow cannot dynamically adjust shipping after an address
is entered. Physical checkouts now use Stripe's **embedded Checkout form**
(`ui_mode=form`) to update the Standard shipping option when the customer
completes the shipping address. Service-only checkout stays hosted.

### API flow and price authority

1. Customer adds physical products to the existing cart.
2. `POST /checkout` rebuilds trusted prices from Printful and creates a
   Stripe embedded Checkout session, initially with the **documented temporary
   zero-amount shipping option**. Do not treat zero as an accepted quote.
3. The cart mounts Stripe Checkout using `STRIPE_PUBLISHABLE_KEY` and the
   Checkout client secret. Stripe collects the full address.
4. On a complete address, `runServerUpdate()` calls `POST /shipping/options`
   with a session-bound HMAC token. The API verifies this token with the
   existing webhook secret, and retrieves the open Stripe session.
5. The Worker reconstructs the cart **from Stripe metadata**, looks up current
   synced Printful variants, and maps their `variant_id` (catalog variant ID,
   *not* `sync_variant_id`) to `POST /shipping/rates`. It supplies the full
   address and USD currency and requires an available `STANDARD` rate.
6. The Worker updates Stripe's `shipping_options` to Printful's quoted
   amount, then stores the address SHA-256 digest, quoted cents, Stripe
   shipping-rate ID and Printful method in `STORE_ORDER_KV`. Address text
   is not stored in the quote record.
7. For paid webhooks, the Worker compares Stripe's completed address, selected
   shipping rate, charged shipping cents and currency to that quote **before
   creating or confirming a Printful order**. Missing or mismatched quotes fail
   closed. The Printful order uses `shipping: 'STANDARD'`.
8. After verified payment, optional `PRINTFUL_AUTO_CONFIRM=true` confirms
   the Printful order for production. It remains **off by default**.

### Required configuration

Keep your existing `PRINTFUL_TOKEN`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `DISCORD_WEBHOOK_URL` and `STORE_ORDER_KV`.
Add a **publishable**, not secret, Stripe key:

```text
STRIPE_PUBLISHABLE_KEY=pk_test_...    # sandbox; replace with matching live key at release
PRINTFUL_AUTO_CONFIRM=false          # keep off until production gates are satisfied
```

Never commit a live secret key; a publishable Stripe key is designed for
client use but must match the Stripe account and mode of `STRIPE_SECRET_KEY`.
The Worker sends it to the cart only when a physical Checkout session is
created. No `STORE_SHIPPING_XX_CENTS` variables are used.

### Important release limitations

- Printful explicitly warns `/shipping/rates` can differ from final
  `/orders/estimate-costs` when Printful store shipping settings are involved.
  Compare quotes and estimates for representative carts, destinations, and
  quantities before calling these amounts exact final fulfillment costs.
- Stripe's documented embedded form uses an initial zero shipping placeholder.
  If a customer somehow pays before a valid quote, **the webhook blocks
  fulfillment** rather than shipping at the wrong amount, but a charged order
  would need review/refund. Validate that the embedded flow reliably updates
  shipping before confirmation in a Stripe sandbox; add a transactional
  payment gate or redesign if it does not.
- A failed quote must be visible to the shopper; do not silently let an
  unavailable Printful quote become free shipping.
- `STORE_ORDER_KV` is eventually consistent, not a strict global
  transaction lock for simultaneous webhook events.
- Country support remains US, CA, GB and AU until reviewed.
- The full `npm run validate` suite and browser-based sandbox checkout,
  including address edits, delayed payments, and service-only carts, must
  pass before merge/deployment. Printful billing should be ready for automatic
  confirmation.
- `automatic_tax` is not enabled. Review applicable tax obligations separately.

Reference: Stripe's embedded Checkout shipping customization guide:
https://docs.stripe.com/payments/checkout/custom-shipping-options?ui=checkout-form

Workers KV is eventually consistent, so this design protects ordinary sequential webhook retries but is not a strict global transaction lock. For strict exactly-once processing during simultaneous requests from different Cloudflare locations, migrate the lock to a Durable Object or another strongly consistent transactional store.

## Pre-deployment verification

Run locally on the proposed branch:

```powershell
node workers/tests/store-payment-webhook.test.mjs
node workers/tests/store-order-kv-required.test.mjs
node workers/tests/store-checkout-price-integrity.test.mjs
node workers/tests/store-automatic-fulfillment.test.mjs
node workers/tests/store-shipping-checkout.test.mjs
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
   sends altered prices. The new
   `workers/tests/store-automatic-fulfillment.test.mjs` mocks Printful and
   tests confirmation, retries, and the draft-only fallback.
7. Configure `STRIPE_PUBLISHABLE_KEY` to match the Stripe secret key's mode.
   Test the embedded form's address-change event and quote refresh in sandbox.
8. Compare Printful `/shipping/rates` with `/orders/estimate-costs`, and
   test mixed merchandise, multi-item orders and delivery countries.
9. Review Printful billing, tax obligations, and receipt/quote accuracy.
10. After review and a controlled code deployment, **separately activate**
   `PRINTFUL_AUTO_CONFIRM=true` to allow automatic production confirmation.
   Monitor real delivery and errors; do not simulate tests with live charges.

No deployment or secret migration is performed by this document.
