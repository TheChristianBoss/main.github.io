# Christian Goblin Jobs — Secure Worker Version

This version removes the public submit token and stops the browser from constructing Discord webhook payloads.

## Security model

- Private job codes are stored in the Cloudflare Worker secret `JOB_CODE_MAP`, not in GitHub or browser JavaScript.
- Role details and questions are returned only after the Worker validates a code.
- The Worker validates every submitted field and builds the Discord embed itself.
- The Discord webhook URL and Turnstile secret remain in Cloudflare secrets.
- Cloudflare Turnstile blocks automated submissions.
- `JOB_APPLICATIONS_KV` provides rate limiting and short duplicate-submission protection.
- Allowed browser origins are restricted in `workers/jobs-api-secure.js`.
- Discord mentions are disabled.

A private job code is an invitation code, not an account password. Generate long random codes and share them only with intended applicants.

## Files

```text
jobs/index.html
jobs/app.js
jobs/config.js
jobs/config.example.js
workers/jobs-api-secure.js
workers/job-code-map.example.json
```

## 1. Generate private codes

Generate at least 18 random bytes per code. From PowerShell with Node installed:

```powershell
node -e "console.log(require('crypto').randomBytes(18).toString('base64url').toUpperCase())"
```

Run it once for each open role. Do not commit the generated codes.

Supported role IDs are:

```text
sales-representative
pixel-artist
game-writer
godot-programmer
music-sound-designer
qa-game-tester
ui-ux-designer
video-editor
community-helper
```

Closed roles remain rejected even if a code maps to them. Open/closed status is controlled in `workers/jobs-api-secure.js`.

Create a local JSON object like this, using your generated codes:

```json
{
  "YOUR-LONG-SALES-CODE": "sales-representative",
  "YOUR-LONG-PIXEL-CODE": "pixel-artist",
  "YOUR-LONG-WRITER-CODE": "game-writer",
  "YOUR-LONG-GODOT-CODE": "godot-programmer"
}
```

## 2. Create Cloudflare resources

Create a new Worker for `workers/jobs-api-secure.js`.

Create a KV namespace and bind it to the Worker as:

```text
JOB_APPLICATIONS_KV
```

Create a Cloudflare Turnstile widget for these hostnames:

```text
christiangoblin.com
www.christiangoblin.com
christiangoblin.github.io
```

## 3. Add Worker secrets

Add these secrets in the Cloudflare dashboard or with Wrangler:

```text
DISCORD_WEBHOOK_URL
TURNSTILE_SECRET_KEY
JOB_CODE_MAP
```

`JOB_CODE_MAP` must contain the JSON object from step 1 as a single secret value.

Optionally set this ordinary Worker variable to reject Turnstile tokens issued for another hostname:

```text
TURNSTILE_HOSTNAME=christiangoblin.com
```

Only set that variable when applications are submitted exclusively from that hostname. Omit it while testing through the GitHub Pages hostname.

## 4. Configure the public page

Edit `jobs/config.js`:

```js
window.CG_JOBS_CONFIG = Object.freeze({
  workerUrl: 'https://your-jobs-worker.your-subdomain.workers.dev',
  turnstileSiteKey: 'YOUR_PUBLIC_TURNSTILE_SITE_KEY',
});
```

The Worker URL and Turnstile site key are public configuration, not secrets.

## 5. Test before publishing

Test all of these cases:

1. Invalid code receives a generic rejection.
2. A valid open-role code displays the correct questions.
3. A closed-role code is rejected.
4. Submitting without Turnstile is rejected.
5. Invalid email and portfolio values are rejected.
6. A complete application appears once in Discord.
7. A second immediate application using the same email and role is rejected as a duplicate.
8. Requests from an unapproved origin are rejected.
9. No Discord webhook, Turnstile secret, or job-code map appears in browser source or network request headers.

## Data handling

Applications are forwarded to the configured private Discord channel. Update the public privacy policy with the retention period, who can access applications, and how applicants can request deletion before opening the portal publicly.
