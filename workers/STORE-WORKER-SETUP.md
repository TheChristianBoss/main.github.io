# Christian Goblin Store Worker setup

`STORE_ORDER_KV` is a required binding. The Worker deliberately returns HTTP 503 for a paid fulfillment webhook if this binding is missing, so an order cannot be sent to Printful or Discord without duplicate-retry records.

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

The Printful order request also uses the Stripe Checkout Session ID as `external_id` with `update_existing=true`, adding provider-side protection against a repeated physical-order request.

Workers KV is eventually consistent, so this design protects ordinary sequential webhook retries but is not a strict global transaction lock. For strict exactly-once processing during simultaneous requests from different Cloudflare locations, migrate the lock to a Durable Object or another strongly consistent transactional store.
