# Deployment checklist

Use this checklist before treating the site as production-ready.

## Repository

- [ ] `git status` shows only intended changes.
- [ ] `npm run validate` passes.
- [ ] Generated application output is included in the commit.
- [ ] No secret or private configuration is staged.
- [ ] `git push` succeeds and GitHub Pages finishes deployment.

## Jobs Worker

- [ ] `workers/jobs-api-secure.js` is deployed.
- [ ] `JOB_APPLICATIONS_KV` is bound.
- [ ] `DISCORD_WEBHOOK_URL`, `TURNSTILE_SECRET_KEY`, and `JOB_CODE_MAP` are secrets.
- [ ] `jobs/config.js` contains the deployed Worker URL and public Turnstile site key.
- [ ] Allowed origins match the production domains.
- [ ] Invalid, closed, valid, duplicate, and CAPTCHA-failure cases were tested.
- [ ] A complete application appears once in the private Discord channel.

## Store Worker

- [ ] `workers/store-api-secure.js` is deployed.
- [ ] `STORE_ORDER_KV` is bound and `/health` returns HTTP 200.
- [ ] Stripe webhook signing secret is configured.
- [ ] Stripe webhook events include the events documented by the Worker.
- [ ] Printful and Discord secrets are configured only when those features are enabled.
- [ ] A Stripe test-mode physical order was completed without duplicate fulfillment.
- [ ] A Stripe test-mode service order was completed without duplicate notification.
- [ ] Unpaid and unverifiable Checkout Sessions do not clear the browser cart.

## Browser applications

- [ ] ATS accepts representative PDF and DOCX resumes.
- [ ] Resume Builder exports a readable PDF and DOCX.
- [ ] Cover Letter Builder exports its supported formats.
- [ ] Converter image-to-PDF works with multiple images and special characters in filenames.
- [ ] Converter loads once online and then opens its shell offline.
- [ ] Asset Forge loads the local asset archive and exports a project.
- [ ] Mobile navigation and keyboard focus were checked.

## Content and policy

- [ ] Contact addresses are current.
- [ ] Privacy, terms, store policies, and applicant notice match actual operations.
- [ ] Retention/deletion routines in `POLICY-OPERATIONS.md` are being followed.
- [ ] Mental-health resources and verification date are current.
- [ ] `sitemap.xml` and `robots.txt` match the intended public/private routes.

## After deployment

- [ ] Open the production homepage and each primary section.
- [ ] Check browser developer tools for failed network requests.
- [ ] Verify the deployed commit hash is the intended commit.
- [ ] Perform one jobs test and one Stripe test-mode checkout after Worker changes.
