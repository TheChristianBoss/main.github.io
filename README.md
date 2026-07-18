# Christian Goblin Website

This repository contains the public Christian Goblin website, its browser-based tools, and the Cloudflare Worker source used by the jobs and store systems.

Live site: `https://christiangoblin.com/`

## What is in this repository

| Area | Public path | Editable source |
|---|---|---|
| Main static website | `/` and section folders | Root HTML, `assets/`, and section folders |
| ATS Checker | `/tools/ats/` | `src/` plus `ats-index.html` |
| Resume Builder | `/tools/resume/` | `src/` plus `resume-index.html` |
| Cover Letter Builder | `/tools/cover/` | `tools/cover-src/` |
| File Converter | `/tools/converter/` | `tools/converter-src/` |
| Asset Forge | `/tools/asset-forge/` | `tools/asset-forge-src/` |
| Goblin Editor | `/editor/` | Compiled deployment only; editable source is not currently present |
| Jobs portal | `/jobs/` | `jobs/` and `workers/jobs-api-secure.js` |
| Store | `/store/` | `store/` and `workers/store-api-secure.js` |

The generated application folders under `tools/` are committed because GitHub Pages serves static files directly from the repository. Edit the source folders, rebuild, verify, and then commit both source and generated output.

The `/bible/` section is separate from the application build and final-audit workflow. The repository validation script intentionally skips it.

## Requirements

- Node.js 20.19+ or 22.12+ (required by Vite 8)
- npm
- Git
- PowerShell commands below assume Windows, although the npm scripts are cross-platform

## First-time setup

From the repository root:

```powershell
npm run setup
```

This installs the root dependencies and Asset Forge's separate dependencies.

## Development servers

Run one application at a time:

```powershell
npm run dev:ats
npm run dev:resume
npm run dev:cover
npm run dev:converter
npm run dev:asset-forge
```

Static pages can be served with any local static server. Do not open application entry pages only through `file://`, because browser module and service-worker restrictions can produce misleading failures.

## Building

Build and verify all five source applications:

```powershell
npm run build
npm run build:verify
```

Build one application:

```powershell
npm run build:ats
npm run build:resume
npm run build:cover
npm run build:converter
npm run build:asset-forge
```

The build coordinator stages output, verifies referenced assets, replaces the deployed directory only after success, and removes obsolete nested deployments. See `BUILDING.md` for implementation details.

## Testing and validation

Fast source-quality check:

```powershell
npm run validate:fast
```

Full pre-deployment validation:

```powershell
npm run validate
```

The full command runs linting, functional smoke tests, PDF tests, Worker tests, policy/accessibility tests, all application builds, deployed-output verification, and the final repository audit.

Run only the non-destructive repository audit:

```powershell
npm run audit:final
```

The audit checks the non-Bible portion of the repository for:

- Missing required files and application entry pages
- Broken local HTML links and asset references
- Accidentally committed secrets matching known credential formats
- Exact placeholder files
- Obsolete nested deployment folders
- Backup files that should not be committed
- Remaining visible “Open Beta” labels
- Stale 2025 copyright notices
- Missing deployment configuration

Deployment placeholders such as an unconfigured jobs Worker URL are reported as warnings so local development remains possible. Audit errors return a nonzero exit code.

## Normal deployment workflow

```powershell
npm run validate
git status
git add -A
git commit -m "Describe the change"
git push
```

GitHub Pages serves the committed static files. There is no separate server-side build step on GitHub Pages.

## Cloudflare Jobs Worker

Source: `workers/jobs-api-secure.js`

Required private configuration:

- Secret: `DISCORD_WEBHOOK_URL`
- Secret: `TURNSTILE_SECRET_KEY`
- Secret: `JOB_CODE_MAP`
- KV binding: `JOB_APPLICATIONS_KV`
- Optional variable: `TURNSTILE_HOSTNAME`

Public browser configuration belongs in `jobs/config.js`:

- Worker URL
- Turnstile site key

Never commit the Discord webhook, Turnstile secret, or real job-code map. Complete instructions are in `jobs/README.md`.

## Cloudflare Store Worker

Source: `workers/store-api-secure.js`

The exact secrets depend on the enabled store features, including Stripe, Printful, Discord, and product-data access. The `STORE_ORDER_KV` binding is required for paid fulfillment. A paid webhook deliberately fails closed when the binding is missing.

Use:

- `workers/STORE-WORKER-SETUP.md`
- `workers/wrangler.store.example.jsonc`
- The Worker `/health` endpoint after deployment

Do not commit real secret values or a production Wrangler file containing sensitive configuration.

## Privacy and operational obligations

Public policies are located at:

- `privacy.html`
- `terms.html`
- `store/policies.html`
- `jobs/privacy.html`

Internal retention and handling commitments are summarized in `POLICY-OPERATIONS.md`. When providers, forms, retention periods, products, or workflows change, update the public policies and their effective date.

## Local and ignored files

The repository ignores:

- `node_modules/`
- Temporary build staging and backup folders
- `assetprimary.zip`
- Asset Forge patch helpers
- Editor/IDE files
- `*.backup-before-*` files

Asset Forge expects the local asset archive described by its source documentation. Do not commit licensed or private asset archives unless redistribution is permitted.

## Repository safety rules

- Keep prices, product mappings, job roles, and validation rules authoritative on the Worker side.
- Treat public job codes as invitations, not authentication credentials.
- Keep Stripe payment details inside Stripe.
- Keep duplicate-order KV protection enabled.
- Do not commit webhook URLs, private API keys, private keys, or live tokens.
- Run `npm run validate` before a production push.

## Known limitation

The Goblin Editor's editable source is not present in this repository. Its deployed bundle can be hosted, but substantial maintenance or rebuilding requires recovering or recreating the original source.

## Licensing

No repository-wide software license is currently included. Do not assume that repository code or third-party assets may be redistributed outside the permissions granted by their respective owners and licenses.
