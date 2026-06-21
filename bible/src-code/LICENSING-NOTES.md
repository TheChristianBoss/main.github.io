# Licensing notes

This file documents the copyright/license research behind the `status` field
in `src/data/catalog.js`. **Read this before adding any new translation's
full text to the repo.** Bible translation copyright is genuinely
inconsistent and confusing — the same English name can refer to a public
domain 19th-century edition AND a copyrighted 21st-century revision, so the
*specific edition* in your source files always matters more than the name.

## How this catalog was built (2026 audit)

The current 90-translation catalog comes from the Bible SuperSearch JSON
export. **That export's own bundle-level license ("non-commercial
purposes") is looser than what this project requires** — it is not a
substitute for checking each translation's own terms. Likewise, the
per-file `restrict` flag embedded in that export's metadata is **not
reliable**: it was `0` (i.e. "not restricted") for all 90 files, including
several whose own `copyright_statement` field explicitly says
"non-commercial use only." Don't trust either of those signals.

What *is* reliable is each file's own `metadata.copyright_statement` (and
sometimes `metadata.description`) text — this is the actual license
language from the translation's publisher, embedded per-file. Every status
below was set by reading that text (or, for a handful of ambiguous cases,
by external research), not by the translation's name or the bundle's
blanket license.

## The two statuses currently in use

- **`verified-open`** — That translation's own copyright statement
  confirms public domain, or an open license (CC BY, CC BY-SA, or
  similarly permissive terms with no non-commercial/no-derivatives
  restriction). Full verse text is committed to
  `src/data/translations/<id>.json` and is fully readable/searchable on
  the site. **71 of 90** translations currently qualify.
- **`restricted`** — That translation's own copyright statement explicitly
  limits use to non-commercial purposes, requires written permission for
  commercial use, is CC BY-NC or CC BY-NC-ND, or otherwise doesn't clear
  the bar for unrestricted redistribution this project needs. The catalog
  shows the publisher and a short note; **no text file is shipped.**
  **19 of 90** translations are currently restricted for this reason.

(`pending-review` still exists as a status value for any *future*
translation you add without yet having checked its license — see
`catalog.js`'s `STATUS` export — but every translation in the current
90-item Bible SuperSearch batch has been individually checked, so none are
in that state right now.)

## Corrections this audit made to earlier guesses

A few translations were previously assumed restricted (or assumed open)
based on the translation's name/publisher reputation, but the actual
embedded statement said otherwise:

- **Biblica® Hausa ("Sabon Rai Don Kowa")** — previously assumed closed
  copyright based on Biblica's general reputation for tight licensing.
  This specific export (distributed via open.bible) is explicitly
  **CC BY-SA 4.0** — Biblica does open-license some translations through
  that initiative. Now `verified-open`.
- **NOWEJ BIBLII GDANSKIEJ (Polish)** — statement (translated): "Copyright
  not reserved. Reproduction, copying, and propagation of the NBG text is
  encouraged." No commercial restriction. `verified-open`.
- **Fidela (Romanian)** — statement (translated) explicitly permits
  printing, selling, and free redistribution by anyone; only restriction
  is not altering the text/title and crediting the FIDELA name.
  `verified-open`.
- **Glück 8th edition (Latvian)** — earlier notes assumed this was the
  copyrighted 2019 re-edition. This export's own statement says
  **"This Bible is in the Public Domain."** Treated as `verified-open`
  on that basis; if you ship this file, it's worth double-checking against
  Latvijas Bībeles Savienība's own materials since "8th edition" labels
  have been a known source of confusion (see "general rules of thumb"
  below) — but the embedded statement is unambiguous as written.
- **Kannada KJV, Almeida Revista e Atualizada, Almeida Revista e
  Corrigida** — these three couldn't be resolved from the embedded
  metadata alone (no statement, or a generic "public domain" claim that
  doesn't match what's independently knowable about the *specific*
  edition). External research confirmed:
  - Kannada KJV: no single authoritative rights holder could be verified;
    multiple editions circulate under this name. `restricted`.
  - Almeida RA: © 1993 Sociedade Bíblica do Brasil, all rights reserved.
    `restricted`.
  - Almeida RC: Sociedade Bíblica do Brasil holds the modern edition.
    `restricted`.

## How to graduate a new translation to verified-open

1. Find the copyright/license statement. For files from this same Bible
   SuperSearch-style export, it's in `metadata.copyright_statement` (or
   `metadata.description` if that's empty) — read the **full** text, not
   just a keyword flag. For anything else, it's almost always printed
   inside the source file itself (header/footer) or on the publisher's own
   "copyright"/"permissions" page. ebible.org's list at
   https://ebible.org/Scriptures/copyright.php and
   https://ebible.org/find/index.php (color-coded by redistribution
   status) is a good first stop.
2. Confirm it's the *same edition* your source file actually contains.
   Watch out for:
   - A historic translator's name reused for a modern revision (e.g.
     "Schlachter" 1905/1911 original vs. the copyrighted "Schlachter
     2000").
   - "Nth edition"-style labels that sound historic but are modern
     re-editions.
   - Bible society translations that look generic but are tightly licensed
     (anything branded Biblica®, NIV, NET Bible® being the clearest
     examples) — though note Biblica *does* open-license some translations
     via open.bible, so check the actual statement rather than assuming
     from the brand name (see Hausa correction above).
   - Common names that cover both a PD original and a copyrighted modern
     revision under the same publisher family (e.g. "Almeida" in
     Portuguese — see above).
3. If it's public domain or openly licensed (CC BY / CC BY-SA / equally
   permissive, no NC or ND restriction):
   - Add `src/data/translations/<id>.json` with the verse data (see format
     below).
   - In `catalog.js`, set `status: "verified-open"`, fill in `license`
     (and `licenseUrl` for CC-licensed ones), and add `file: "<id>"`.
4. If it's copyrighted, non-commercial-only, or otherwise restricted:
   - Set `status: "restricted"`, fill in `license` with the rights holder,
     `note` with the specific restriction, and `licenseUrl` if there's an
     official place to read it.
   - Do not add a text file.
5. Commit and push. The UI requires no code changes — it reads `status` at
   render time.

## Text file format

Each file in `src/data/translations/` looks like:

```json
{
  "id": "kjv",
  "name": "Authorized King James Version",
  "books": {
    "Genesis": {
      "1": {
        "1": "In the beginning God created the heaven and the earth.",
        "2": "..."
      }
    }
  }
}
```

`books` is `{ BookName: { ChapterNumber: { VerseNumber: "text" } } }`. Book
names **must be the canonical English name** from the `BOOKS` array in
`src/components/BookChapterPicker.jsx`, regardless of the translation's own
language — e.g. a German file's "1 Mose" is stored under the key
`"Genesis"`. This is what lets one English-labeled book/chapter picker work
for every language without per-language UI. If converting from a source
that numbers books 1–66 in the standard Protestant canon order, map by
that number rather than by the source's own (often localized) book name
string.

## What's currently shipped

**71 verified-open** translations across ~45 languages, spanning public
domain classics (KJV, ASV, WEB, Luther, Segond, Reina Valera, Textus
Receptus, WLC, etc.) and CC BY-SA translations (the Indian Revised Version
family in 8 languages, several Chinese and Hausa editions, etc.).

**19 restricted** translations are cataloged with publisher info but no
text shipped: NET Bible®, Reina Valera Gómez (both editions), Schlachter
Bibel, Afrikaans 1953, Amharic (UBS), Tibetan (NTB), Indonesian Terjemahan
Baru, Javanese, Kannada KJV, Uwspółcześniona Biblia Gdańska (Polish), both
Almeida editions (Portuguese), Somali (SIM), Tajik, Thai KJV, Urdu Geo, and
both Wolof translations.

## Strong's dictionary (`src/data/strongs.json`)

Added alongside the Strong's-popup reading feature. Converted by
`scripts/convert_strongs.py` from `Extras/strongs_definitions.json` in the
same Bible SuperSearch-style export the translation catalog came from —
**this file's own license has not yet been individually verified** the way
each translation above was. Strong's Exhaustive Concordance itself dates to
1890 and is long public domain, but confirm the *specific digital
compilation* in that Extras file before relying on this the way the rest of
the catalog has been vetted (same caution as anywhere else in this doc:
bundle-level licensing isn't a substitute for checking the specific file).

## General rules of thumb (not a substitute for checking each one)

- Anything translated and first published **before 1929** is very likely
  public domain in the US, but always check the *specific digital edition*
  you have — modern re-typesetting or revision can reset the clock.
- Anything with a registered trademark symbol (®, ™) in its title is worth
  a closer look, but isn't an automatic disqualifier — check the actual
  statement (see Hausa/Biblica correction above).
- "Free to read on our website" and "free to redistribute the full text in
  a third-party dataset" are different permissions — a lot of Bible
  societies grant the former but not the latter. Look for explicit words
  like "non-commercial," "no derivatives," or "written permission required
  for commercial use."
- A blanket license on an entire *bundle* or *export* of multiple
  translations does not override what each individual translation's own
  statement says — always check per-file, per-translation.
- When in doubt, default to `pending-review` (or `restricted` if there's
  a specific reason to think it's closed) rather than `verified-open`. It
  costs nothing — the translation still shows up in the catalog, and
  nobody's legal risk goes up because no text shipped.
