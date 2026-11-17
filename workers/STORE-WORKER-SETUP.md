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

## Separate customer-paid shipping (prepared, not priced)

The owner chose **shipping separately** from the merchandise price.
The current hosted Stripe Checkout cannot dynamically calculate shipping
from an address entered on Stripe's full-page hosted checkout. This
preparation therefore supports an **explicit flat rate per destination
country** (one rate per physical order). If true item/address-specific
Printful rates are required instead, use Stripe's embedded form or Elements,
or another reviewed address-quoting flow; do not claim these country rates
are real-time Printful quotes.

The cart asks customers to select a delivery country first (US, CA, GB, AU).
The Worker reads only the country selection, rejects invalid selections,
and sets Stripe `shipping_options` with a **server-controlled fee**. Stripe
is restricted to collecting a shipping address in the selected country.

Set the following **plain-text numeric Worker variables in CENTS**, once
the business has chosen and verified the real amounts:

- `STORE_SHIPPING_US_CENTS`
- `STORE_SHIPPING_CA_CENTS`
- `STORE_SHIPPING_GB_CENTS`
- `STORE_SHIPPING_AU_CENTS`

**Do not guess shipping prices.** Zero/missing/invalid values block physical
checkout instead of silently giving away shipping. Service-only checkout
does not require shipping. A customer-submitted shipping amount is ignored.
The Worker also checks the Stripe-signed checkout event's shipping fee
and destination country before triggering Printful fulfillment.

These flat rates apply to the whole order, not each individual product.
Confirm that the rate covers the expected Printful costs for your product
mix, quantities, address regions and shipping taxes. Review real rates
using Printful's `POST /shipping/rates` and `POST /orders/estimate-costs`
API endpoints, then set suitable merchant rates. If a flat charge cannot
cover your actual costs predictably, choose dynamic shipping instead.

The checkout's `automatic_tax` setting is still off. Review your tax
registrations and applicable rules separately before enabling it.

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
7. Configure and review the four `STORE_SHIPPING_XX_CENTS` variables.
   Compare those flat charges with Printful's shipping cost for your products.
   Do not activate live physical checkout without verified values.
8. Review Printful billing, tax obligations, and the cost of the chosen
   shipping model. Automatic Stripe Tax is still disabled.
9. After review and a controlled code deployment, **separately activate**
   `PRINTFUL_AUTO_CONFIRM=true` to allow automatic production confirmation.
   Monitor real delivery and errors; do not simulate tests with live charges.

No deployment or secret migration is performed by this document.
