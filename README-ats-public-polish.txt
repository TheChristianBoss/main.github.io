Christian Goblin ATS Checker public-polish patch

What changed:
- Corrected ATS branding so the tool header says CG ATS Checker.
- Reworked customer-facing wording from ATS guarantee language to heuristic match guidance.
- Added a Start over workflow that clears current resume inputs, comparison inputs, job description, analysis, and autosaved draft.
- Added browser-local autosave for current inputs.
- Added file controls for Resume A/B: remove selected file, clear resume text, and drag-and-drop upload.
- Removed unsupported .doc acceptance and added a clear message telling users to save as DOCX/PDF.
- Added image/screenshot OCR upload support with progress messaging.
- Improved PDF worker path handling through Vite asset URLs.
- Switched DOCX parsing to mammoth for more reliable extraction.
- Added file-size warnings before parsing large resumes.
- Added clearer result wording, print/save PDF, download report, and copy report.
- Added clearer ATS parse preview guidance.
- Added history clearing and capped localStorage history growth.
- Added an error boundary to catch browser crashes gracefully.
- Added editor actions for copy text and clear editor.
- Rebuilt deployed /tools/ats/ files and removed stale assets.

Notes:
- This remains a guidance tool. It does not guarantee employer ATS results.
- OCR needs internet access because the OCR engine is loaded lazily from a CDN.
- File contents are parsed in the browser; no custom server upload is used by this static tool.
