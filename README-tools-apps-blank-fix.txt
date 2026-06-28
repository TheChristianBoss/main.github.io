Christian Goblin tools blank-page recovery patch

This patch restores the deployed static folders for:
- /tools/ats/
- /tools/resume/
- /tools/cover/
- /tools/converter/
- /editor/
- /tools/index.html

It intentionally does not overwrite the shared root src/ folder, because ATS and Resume currently share source paths and copying both sources over each other can cause confusion. This is a deployed-page recovery patch for blank app pages.

After applying, verify that each app's index.html references an asset file that exists inside its local assets folder.
