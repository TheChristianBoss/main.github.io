Christian Goblin Tools Page Blank Fix

Problem fixed:
- A previous sitewide patch accidentally included an empty tools/index.html file.
- This caused /tools/ to appear blank or not load.

Changes:
- Restores a complete public-ready tools/index.html.
- Keeps the Store off the Tools page.
- Lists Resume Builder, Cover Letter Builder, ATS Checker, File Converter, Goblin Editor, and Bible App.
- Keeps Privacy and Terms links visible.

Apply:
Copy tools/index.html to ./tools/index.html and commit it.
