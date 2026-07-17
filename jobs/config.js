// Public browser configuration. These values are not secrets.
// Replace both placeholders after deploying workers/jobs-api-secure.js.
window.CG_JOBS_CONFIG = Object.freeze({
  workerUrl: 'https://REPLACE-WITH-YOUR-JOBS-WORKER.workers.dev',
  turnstileSiteKey: 'REPLACE_WITH_TURNSTILE_SITE_KEY',
});
