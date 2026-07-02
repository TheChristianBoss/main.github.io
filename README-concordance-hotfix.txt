Concordance hotfix
==================

Problem fixed:
- The Concordance page showed "No entries found" for valid Strong's numbers such as G26.
- The data existed at /bible/concordance/, but the deployed JS bundle was trying to use a Vite import.meta.glob map for ../data/concordance/*.json.
- In the active source tree, those concordance JSON files live in public/concordance, not src/data/concordance, so Vite built an empty map and every lookup failed.

Changed files:
- bible/index.html
- bible/assets/index-CGconcordanceFix.js
- bible/sw.js
- bible/src-code/src/utils/concordance.js
- bible/src-code/public/sw.js
- bible/bible-library/src/utils/concordance.js
- bible/bible-library/public/sw.js

Verification:
- /bible/concordance/manifest.json contains G26 -> G0-G499.
- /bible/concordance/G0-G499.json contains entries for G26.
- The deployed bundle now fetches /bible/concordance/manifest.json and then the needed shard file.

After uploading:
- Open the Bible app.
- Hard refresh the page once if your browser still has the old bundle cached.
- Search G26. It should now return verse results instead of "No entries found."
