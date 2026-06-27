Christian Goblin Store public-readiness patch

Changes included:
- Added Store Policies page at /store/policies.html
- Added clear-cart button and safer cart cleanup
- Fixed stale/old service cart items by validating against the current service catalog
- Made service requests one-per-cart-line so the request details stay clear
- Required basic request details before adding a service request to cart
- Moved success-page cart clearing so a random visit does not erase the cart
- Kept customer-facing wording away from backend details such as Printful/Discord
- Updated Worker service quantity handling to match the frontend

Manual checks before public launch:
1. /store/ shows Shop Items and Services separately.
2. Service pages require request details before adding to cart.
3. Cart can remove individual items and clear the whole cart.
4. Checkout works for physical-only, service-only, and mixed carts.
5. Cloudflare Worker is updated with the new workers/store-api-secure.js file.
6. DISCORD_WEBHOOK_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and PRINTFUL_TOKEN are set in Cloudflare.
