CG ATS missing-assets hotfix

Problem seen in browser console:
  /tools/ats/assets/ats-BSC48ioj.js 404
  /tools/ats/assets/index-DnwHvBBn.css 404

Cause:
  The deployed ATS HTML and deployed assets are out of sync. The page is loading, but it points at JS/CSS filenames that are not currently present in tools/ats/assets.

Fix:
  This patch includes the current ATS deployed app files and also adds compatibility copies using the exact missing filenames:
    tools/ats/assets/ats-BSC48ioj.js
    tools/ats/assets/index-DnwHvBBn.css

That means the app should work whether the browser/server is still seeing the older HTML references or the corrected index.html references.

Apply by copying tools/ats into your repo, then commit and push.
