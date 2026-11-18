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
Physical checkouts use Stripe's embedded Checkout Form (`ui_mode=form`), but
unlike Stripe's dynamically updated shipping example, the Worker now obtains
the Printful quote **before creating the Stripe Checkout Session**. A payment-
enabled session with a temporary $0 shipping option is never created for new
physical carts. Service-only checkout stays on Stripe's hosted page.

### API flow and price authority

1. Customer adds products to the cart and enters the delivery recipient/name,
   street, city, region where required, postal code, and supported country.
   These fields are **not persisted to localStorage**.
2. `POST /checkout` rebuilds product prices and quantities from Printful
   server-owned data; the browser cannot override product or shipping prices.
3. Before contacting Stripe, the Worker validates the address and requests
   an available `STANDARD` rate through Printful `POST /shipping/rates`
   using the **catalog** `variant_id`. It then requests Printful
   `POST /orders/estimate-costs` with the matching **sync** variant IDs.
   **The shipping amount charged to the buyer comes from the fuller order
   estimate's `costs.shipping`, not the lower rate lookup**; it includes
   the store's applicable fulfillment shipping adjustments. Missing or
   invalid USD estimates block Checkout completely.
4. Stripe receives an **already quoted, positive** shipping rate through
   `shipping_options`, with the verified recipient and address attached to
   `payment_intent_data[shipping]`. The Worker deliberately omits
   `shipping_address_collection`, so the buyer cannot modify this delivery
   address on Stripe's payment form. To change an address, start a new checkout.
5. The Worker verifies Stripe's newly created shipping amount, currency and
   rate ID, then saves only the address hash, quoted cents, rate ID and method
   in `STORE_ORDER_KV`. **Only after the KV write succeeds** does it return
   the Stripe client secret to the browser. A KV outage fails closed.
6. On a Stripe-signed **paid** webhook, the Worker fetches the successful
   PaymentIntent and verifies its shipping address SHA-256 digest against the
   saved quote, plus the charged shipping amount, selected shipping rate,
   currency and Printful method. Missing or mismatched data blocks Printful.
   Shipping name and address are read from Stripe, not browser metadata/KV.
7. Once payment and shipping are verified, the Worker can create a Printful
   draft. Setting `PRINTFUL_AUTO_CONFIRM=true` deliberately enables chargeable
   Printful production confirmation; it is off by default.
8. Existing `printful_dynamic_v1` sessions remain supported for signed
   webhook recovery only. New sessions use `printful_prequoted_v2`.
   Do not rely on the legacy `/shipping/options` dynamic update endpoint for
   newly created carts.

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

- We observed a real difference for one bottle to sample Tampa, Florida:
  `/shipping/rates` returned **$10.89**, while `/orders/estimate-costs`
  returned **$11.29** (including an apparent $0.40 US surcharge).
  The Worker therefore charges the order-estimate shipping amount.
  **This remains an estimate**, not a guaranteed future Printful invoice;
  validate more destinations, products, quantities and shipping settings.
  The customer-approved Stripe charge itself is fixed at checkout.
- The earlier dynamic form relied on a temporary $0 shipping placeholder.
  New physical sessions no longer have a placeholder: if Printful quoting
  fails, Stripe never receives a Checkout create request. Before release,
  test the new address-before-Checkout experience in a browser.
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

Reference: Stripe Checkout Session creation and PaymentIntent shipping:
https://docs.stripe.com/api/checkout/sessions/create
https://docs.stripe.com/api/payment_intents/object

When `PRINTFUL_AUTO_CONFIRM=true`, the Worker **requires**
`STORE_FULFILLMENT_COORDINATOR` (a Durable Object binding to the
`FulfillmentCoordinator` class). The class uses SQLite-backed strongly
consistent storage and a per-Stripe-session, time-limited processing lease
to serialize concurrent paid webhooks. Each delivery rechecks Printful by
a deterministic external order ID before creating or confirming anything.
If a Worker crashes or Printful times out, Stripe retries the failed
webhook after the lease expires. The Worker then reconciles with Printful.

Create the Durable Object migration and binding on the same Worker before
enabling `PRINTFUL_AUTO_CONFIRM=true`:
- class export `FulfillmentCoordinator`
- binding name `STORE_FULFILLMENT_COORDINATOR`
- binding type `durable_object_namespace`
- SQLite migration `new_sqlite_classes: ["FulfillmentCoordinator"]`

If this binding is missing, paid automatic fulfillment fails closed;
**do not enable auto-confirm without it**. KV remains the shipping quote
store and records partial fulfillment steps; DO coordinates chargeable
Printful confirmation. Completing an order while auto-confirm was off
does not automatically upgrade historical manual drafts when the switch
is later enabled. Review old drafts separately.

Printful billing must be funded before auto-confirm: Printful charges
the store's Wallet or saved billing method separately after Stripe has
charged the customer. Failed Printful billing or held orders need manual
attention. Do not infer successful production solely from a Stripe payment.

Cloudflare source: https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/
Printful source: https://help.printful.com/hc/en-us/articles/50264607936785-How-does-the-Printful-billing-system-work

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
