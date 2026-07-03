# Christian Goblin Jobs — Old Worker Version

This version is compatible with the old Cloudflare Worker you pasted earlier.

## How it works

- Job codes and questions live in `jobs/app.js`.
- The page builds a Discord embed in the browser.
- The page sends `_jobCode`, `_formType`, and `embeds` to your old Worker.
- The Worker checks `X-Submit-Token`, checks whether the code is in `VALID_CODES`, then forwards to Discord.

## Sales role

Sales Representative uses old valid code:

```txt
9432
```

That means you should not need to edit Cloudflare just to add sales, as long as the old Worker still has `9432` in `VALID_CODES`.

## Important config

Open:

```txt
jobs/app.js
```

Replace:

```js
const WORKER_URL = 'PASTE_YOUR_CLOUDFLARE_WORKER_URL_HERE';
const SUBMIT_TOKEN = 'PASTE_YOUR_SUBMIT_TOKEN_HERE';
```

with your real Worker URL and the same submit token stored in Cloudflare.

## Git commands

From your repo root:

```powershell
cd C:\Users\michael\source\repos\christiangoblin.github.io

Expand-Archive -Path "$env:USERPROFILE\Downloads\cg-jobs-old-worker-site.zip" -DestinationPath . -Force

git add jobs
git commit -m "Replace jobs page with old worker version"
git push
```

## Page URL

```txt
https://christiangoblin.github.io/jobs/
```

## Note about security

The submit token is visible to anyone who inspects the browser request. This was already true in the old setup. The Worker still protects your Discord webhook URL, but the token is not a true secret once used by public HTML.
