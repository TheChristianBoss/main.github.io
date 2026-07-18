# Issue 9 — Source quality and smoke tests

This patch resolves the remaining first-party ESLint errors and warnings outside `/bible/`.

## Changes

- Moves the ATS upload component outside render so React preserves component identity.
- Removes empty catch blocks while documenting best-effort browser-storage and temporary-file cleanup behavior.
- Moves `stripBrackets` into a shared utility module.
- Replaces the resume position-setting effect with explicit role/category change handlers.
- Preserves original parser errors with `Error.cause`.
- Removes dead imports, variables, assignments, and obsolete helpers.
- Corrects Worker control-character sanitization without a control-character regex.
- Adds proper Web Worker globals for the vendored FFmpeg worker.
- Prevents ESLint from traversing generated deployments, the editor bundle, and `/bible/`.
- Updates the older store webhook test to provide the now-required order KV binding.
- Adds `npm run test:smoke` and `npm run test:quality`.

## Verification completed

- `npm run lint`
- `npm run test:smoke`
- Image-to-PDF smoke test
- Resume PDF layout and binary smoke tests
- Converter service-worker simulation
- Store success-page tests
- Store payment and idempotency Worker tests
- Duplicate-cleanup tests
- Unified build-system tests
- Full production build and deployment verification for ATS, Resume, Cover, Converter, and Asset Forge
