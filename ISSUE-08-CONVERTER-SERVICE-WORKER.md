# Issue 8 — Converter service worker

The converter service worker now discovers Vite-generated hashed JavaScript and CSS filenames from the built `index.html` instead of hardcoding obsolete bundle names.

It also:

- Precaches the current application shell without allowing one optional failure to cancel the entire install.
- Uses cache-first behavior for versioned static assets.
- Uses network-first behavior for pages so deployments are not hidden behind stale HTML.
- Caches lazy converter modules after first use.
- Preserves caches belonging to other applications on the same origin.
- Ignores range requests so large media requests are not incorrectly cached.
- Provides an offline navigation fallback to the converter shell.

Run the test with:

```powershell
node .\tools\converter-src\tests\service-worker.test.mjs
```
