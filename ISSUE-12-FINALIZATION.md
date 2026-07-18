# Issue 12 — Repository documentation and final audit

This patch completes the planned repository cleanup outside `/bible/`.

## Included

- A full root `README.md`
- `DEPLOYMENT-CHECKLIST.md`
- A non-destructive final repository audit
- Automated tests for the audit
- Package scripts for fast and full validation

## Intentional deletions during application

Delete these confirmed placeholder-only files:

```text
fonts/test.txt
music/test.txt
```

They contain only the word `placeholder` and are not used by the site.

## Commands

```powershell
npm run test:final-audit
npm run audit:final
npm run validate:fast
```

Before a production deployment:

```powershell
npm run validate
```

The audit deliberately excludes `/bible/`.
