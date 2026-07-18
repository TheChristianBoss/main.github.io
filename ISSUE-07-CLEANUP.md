# Issue 7 — Known duplicate cleanup

This cleanup intentionally targets only:

- Nested deployment copies that are byte-for-byte duplicates of their canonical parent files.
- Thirteen explicitly named Asset Forge backup files.

The script never targets any path inside `/bible/`. It runs as a dry run unless `--apply` is supplied. A mismatched nested deployment causes a safety stop before any deletion.

## Commands

```powershell
node .\scripts\cleanup-known-duplicates.mjs
node .\tests\cleanup-known-duplicates.test.mjs
node .\scripts\cleanup-known-duplicates.mjs --apply
git status
```
