import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const files = {
  privacy: 'privacy.html',
  terms: 'terms.html',
  jobs: 'jobs/index.html',
  applicant: 'jobs/privacy.html',
};

const content = Object.fromEntries(
  await Promise.all(
    Object.entries(files).map(async ([key, path]) => [key, await readFile(path, 'utf8')]),
  ),
);

for (const [key, html] of Object.entries(content)) {
  assert.match(html, /<!doctype html>/i, `${key} must be an HTML document`);
  assert.doesNotMatch(html, /before (the )?public launch|before launch/i, `${key} contains placeholder launch language`);
}

for (const key of ['privacy', 'terms', 'applicant']) {
  assert.match(content[key], /Effective July 18, 2026/i, `${key} needs an effective date`);
  assert.match(content[key], /hello@christiangoblin\.com/i, `${key} needs a contact address`);
}

assert.match(content.privacy, /Discord/i);
assert.match(content.privacy, /Cloudflare/i);
assert.match(content.privacy, /up to 12 months/i);

assert.match(content.terms, /Job Applicant Privacy Notice/i);
assert.match(content.jobs, /\.\/privacy\.html/);
assert.match(content.applicant, /private Discord channel/i);
assert.match(content.applicant, /up to 12 months/i);

console.log('Policy-page tests passed.');
