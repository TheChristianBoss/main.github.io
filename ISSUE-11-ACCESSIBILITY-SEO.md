# Issue 11 — Accessibility and Search Metadata

Implemented July 18, 2026.

## Accessibility changes

- Converted the cybersecurity contact controls into a semantic form.
- Added explicit labels, autocomplete hints, native validation, and a polite live status region.
- Added skip links and visible keyboard focus treatment to the cybersecurity and store pages.
- Added an accessible label and live result count to store search.
- Added JavaScript-disabled fallback headings to browser-app entry pages.

## Search and sharing changes

- Added canonical URLs and Open Graph metadata to public non-Bible pages.
- Added useful descriptions to browser-app source entry pages.
- Marked the private jobs portal and applicant notice as `noindex,nofollow`.
- Added `sitemap.xml` and `robots.txt`.
- Omitted `/bible/` from this patch and sitemap per the project-owner request.

## Deployment note

Run `npm run build` after applying this patch so ATS, Resume, Cover, Converter,
and Asset Forge public entry pages are regenerated from the updated source HTML.
