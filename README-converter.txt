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
  - Heavy modules roadmap: audio, video, OCR, DOCX, XLSX, advanced PDF

Design note:
  The app is modular. The main page loads quickly, and individual converter modules are imported only when a user selects them.

Rebuild:
  npx vite build --config vite.converter.config.js

Local dev:
  npx vite --config vite.converter.config.js


Media module notes:
- Audio/video conversion loads FFmpeg WebAssembly from a CDN only when opened.
- Supported presets include MP3, WAV, OGG, MP4, WEBM, video-to-MP3, and video-to-GIF.
- Large files can be slow or fail on low-memory devices because conversion happens in the browser.
