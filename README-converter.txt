Christian Goblin File Converter — Full Modular Upgrade

Live built app:
  tools/converter/

Editable Vite source:
  tools/converter-src/

Build config:
  vite.converter.config.js

Tools hub card:
  tools/index.html

Current modules:
  1. Images
     - PNG / JPEG / WEBP conversion
     - SVG to image
     - Images to PDF
     - ICO favicon output
     - Resize by max width/height or percentage
     - Rotate 90/180/270
     - Quality presets: smallest, best quality, web, email, social, favicon
     - Batch image ZIP
     - Before/after preview and size comparison

  2. Docs / Sheets / PDF
     - Merge PDFs
     - Split PDF into page files ZIP
     - Keep/reorder PDF pages
     - Remove PDF pages
     - PDF metadata view
     - Images to PDF
     - TXT / MD / HTML to PDF
     - DOCX to plain text
     - DOCX to HTML
     - XLSX to CSV
     - XLSX to JSON
     - CSV to XLSX
     - JSON to XLSX

  3. Text / Data
     - JSON pretty/minify
     - CSV to JSON
     - JSON to CSV
     - CSV/TSV conversion
     - JSON to simple YAML
     - simple YAML to JSON
     - Markdown to HTML
     - HTML to text

  4. Batch Queue
     - Batch image conversion
     - Batch JSON/CSV/Markdown conversion
     - Per-file status
     - Download all outputs as one ZIP

  5. Utilities
     - SHA-256 hashing
     - Base64 encode/decode
     - URL encode/decode
     - File details

  6. ZIP
     - Create ZIP
     - List ZIP contents
     - Extract simple ZIPs where browser support allows

  7. Audio / Video
     - MP3/WAV/OGG audio export
     - MP4/WEBM video export
     - Video to MP3
     - Video to GIF
     - Trim, resize, bitrate options
     - Cancel/unload media engine

  8. OCR / Advanced planning
     - Future OCR, ebook, font, advanced PDF, and cloud mode planning

Privacy model:
  Most conversion happens locally in the browser. The static site does not upload files.
  The PDF and media modules lazy-load browser libraries only when those modules are opened.

Notes:
  - Large media/PDF/Office files can still fail due to browser memory limits.
  - Encrypted/password-protected PDFs or unusual DOCX/XLSX files may not work.
  - The device-size warning is an estimate based on limited browser hints.

Rebuild command:
  npx vite build --config vite.converter.config.js

Local dev command:
  npx vite --config vite.converter.config.js

QA / stability upgrade:
- Added /tools/converter/privacy.html with customer-facing privacy and conversion-limit notes.
- Added /tools/converter/test.html for local module/browser/PWA checks. No public failed-conversion report form is included.
- Added manifest.webmanifest, sw.js, and an SVG app icon so the converter can be installable/offline-capable for its shell assets.
- Added friendlier module-loading/conversion error wording in the main app shell.
- Changed vite.converter.config.js publicDir to tools/converter-src/public so these static support files are included on future rebuilds.


Media worker note: the @ffmpeg/ffmpeg ESM wrapper files are vendored locally under assets/vendor/ffmpeg so the browser can create same-origin media workers. The large ffmpeg-core wasm is still loaded lazily only when the Audio / Video module is used.
