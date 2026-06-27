Christian Goblin Cover Letter Builder public-polish patch

Adds a rebuilt cover letter tool focused on public-readiness:
- Browser-local draft autosave and restore
- Start over and clear-letter controls
- One-page live preview with modern/classic/minimal templates
- Better trust wording: no signup, no watermark, draft stays in this browser
- Job description term review without claiming a guaranteed ATS result
- Warnings for missing name, company, job title, invalid email, too-short/too-long letters
- Copy text, download TXT, download Word-compatible DOC, and print/save PDF
- Mobile-friendly layout and print styles
- Source backup under tools/cover-src plus vite.cover.config.js

After copying the patch, commit:
  git add tools/cover tools/cover-src vite.cover.config.js README-cover-public-polish.txt
  git commit -m "Polish cover letter builder before public launch"
  git push

Optional future build command:
  npx vite build --config vite.cover.config.js
