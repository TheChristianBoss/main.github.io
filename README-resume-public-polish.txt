Christian Goblin Resume Builder — Public Polish Patch

What changed:
- Restores and autosaves the active resume draft in localStorage.
- Adds Start over, Copy text, Download TXT, and Print / Save PDF controls.
- Adds export warnings for missing contact info, missing sections, remaining bracket placeholders, and likely-too-short/too-long resumes.
- Confirms before exporting when serious issues remain.
- Adds an ErrorBoundary so crashes show a recovery screen instead of a blank page.
- Keeps DOCX download URLs alive longer to avoid failed downloads on some browsers.
- Rebuilds the live /tools/resume/ deployment with fresh assets.
- Removes the temporary resume-index.html from the deployed folder so /tools/resume/ is the canonical live route.

Notes:
- PDF export is still the built-in jsPDF export.
- Print / Save PDF uses the browser print dialog and the resume preview print stylesheet.
- Drafts are stored only in the visitor's browser.
- To rebuild later, run: npm run build:resume, then copy tools/resume/resume-index.html to tools/resume/index.html and delete tools/resume/resume-index.html.
