# Open Bible Library

A free, open-source library of Bible translations in many languages —
read, search, and switch between translations in your browser.

🔗 **Live site:** _add your GitHub Pages URL here once deployed_

## What this is

This project hosts the full text of 71 Bible translations across ~45
languages that are confirmed public domain or openly licensed (CC BY /
CC BY-SA), and catalogs (without shipping the text of) 19 translations that
are confirmed copyrighted with no compatible redistribution license. See
[`LICENSING-NOTES.md`](./LICENSING-NOTES.md) for the full audit — every
status reflects that translation's own copyright statement, individually
checked.

## Features

- Browse any passage by book, chapter, and verse range (e.g. `Genesis 1:1-9`)
- Free-text search within a translation
- Switch between translations to compare readings
- Tap any tagged word in a Strong's-numbered translation (KJV, ASV,
  Reina-Valera 1909, and both CUV editions) to see its underlying Hebrew or
  Greek definition
- A full catalog view of every translation in the project, including ones
  still pending license review

## Getting started (development)

```bash
npm install
npm run dev
```

This starts a local dev server (Vite). Open the printed `localhost` URL in
your browser.

## Building for production

```bash
npm run build
```

Output goes to `dist/`. The `base` path in `vite.config.js` is set to
`/bible-library/` — **update this to match your actual repo name** if you
name it differently, or set it to `/` if you're deploying to a
`username.github.io` root repository.

## Deploying to GitHub Pages

This repo includes a GitHub Actions workflow
(`.github/workflows/deploy.yml`) that automatically builds and deploys to
GitHub Pages on every push to `main`.

To enable it:
1. Push this repo to GitHub.
2. In your repo settings, go to **Pages** and set the source to
   **GitHub Actions**.
3. Push to `main` — the site will build and deploy automatically.
4. Your site will be live at `https://<username>.github.io/<repo-name>/`.

## Adding or updating a translation

1. Read [`LICENSING-NOTES.md`](./LICENSING-NOTES.md) first — copyright
   status depends on the *exact edition* of the text, not just its name.
2. Add the translation's verse data as
   `src/data/translations/<id>.json` (format documented in
   `LICENSING-NOTES.md`).
3. Add or update its entry in `src/data/catalog.js`, setting `status` to
   `"verified-open"` and filling in `license` / `licenseUrl`.
4. That's it — the UI reads the catalog and text files automatically, no
   other code changes needed.

## Project structure

```
src/
  data/
    catalog.js              <- master list of all translations + status
    translations/*.json      <- verse text for verified-open translations only
  components/                <- React UI components
  utils/                     <- reference parsing, search, dynamic loading
  App.jsx                    <- main app shell
  styles.css                 <- design tokens + all styling
```

## License

The code in this repository (everything outside `src/data/translations/`)
is available for reuse — add your preferred license here (MIT is a common
choice for a project like this).

Each Bible translation's text is governed by its own copyright/license as
documented in `src/data/catalog.js` and `LICENSING-NOTES.md`. Public domain
texts have no restrictions; CC-licensed texts must retain their attribution
per their license terms.
