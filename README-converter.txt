Christian Goblin File Converter

Live deployed folder:
  tools/converter/

Editable Vite source:
  tools/converter-src/

Build config:
  vite.converter.config.js

Current browser-local modules:
  - Images: PNG, JPEG, WEBP, SVG to raster formats, batch images to ZIP, images to PDF
  - Text/Data: JSON pretty/minify, CSV/JSON, CSV/TSV, simple JSON/YAML, Markdown/HTML/Text
  - Utilities: SHA-256 file hashes, Base64 encode/decode, URL encode/decode
  - ZIP: create ZIP, list ZIP contents, extract simple ZIP files when browser support allows
  - Audio/Video: MP3, WAV, OGG, MP4, WEBM, video-to-MP3, video-to-GIF
  - Heavy modules roadmap: OCR, DOCX, XLSX, advanced PDF

Design notes:
  The app is modular. The main page loads quickly, and individual converter modules are imported only when a user selects them.
  The app estimates device capacity using browser hints like CPU threads, approximate memory, mobile/tablet indicators, and save-data/network hints. It then recommends safer file sizes per module. The estimate is not exact, but it helps users avoid oversized browser conversions.

Rebuild:
  npx vite build --config vite.converter.config.js

Local dev:
  npx vite --config vite.converter.config.js


Media module notes:
- Audio/video conversion loads FFmpeg WebAssembly from a CDN only when opened.
- Supported presets include MP3, WAV, OGG, MP4, WEBM, video-to-MP3, and video-to-GIF.
- Large files can be slow or fail on low-memory devices because conversion happens in the browser.

Device-aware recommendations:
- Images: about 25 MB on low/unknown devices, 90 MB on medium devices, 250 MB on high-capacity devices.
- Text/Data: about 10 MB, 35 MB, or 100 MB depending on device estimate.
- ZIP: about 50 MB, 200 MB, or 500 MB depending on device estimate.
- Audio/Video: about 80 MB, 250 MB, or 750 MB depending on device estimate.

