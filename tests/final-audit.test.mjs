import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { auditRepository } from '../scripts/final-audit.mjs';

function write(root, relativePath, content = '') {
  const filePath = path.join(root, ...relativePath.split('/'));
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function createValidFixture(root) {
  const html = '<!doctype html><html><body><main><a href="/privacy.html">Privacy</a></main></body></html>';
  const required = [
    'BUILDING.md',
    'DEPLOYMENT-CHECKLIST.md',
    'CNAME',
    'robots.txt',
    'sitemap.xml',
    'privacy.html',
    'terms.html',
    'POLICY-OPERATIONS.md',
    'jobs/README.md',
    'jobs/privacy.html',
    'workers/jobs-api-secure.js',
    'workers/store-api-secure.js',
    'workers/STORE-WORKER-SETUP.md',
    'tools/ats/index.html',
    'tools/resume/index.html',
    'tools/cover/index.html',
    'tools/converter/index.html',
    'tools/asset-forge/index.html',
    'editor/index.html',
  ];

  write(root, 'README.md', '# Test repository\n' + 'Repository documentation. '.repeat(30));
  write(root, 'package.json', JSON.stringify({
    scripts: {
      build: 'echo build',
      'build:verify': 'echo verify',
      'test:all': 'echo tests',
      'audit:final': 'echo audit',
      validate: 'echo validate',
      'validate:fast': 'echo fast',
    },
  }));

  for (const relativePath of required) {
    if (relativePath.endsWith('.html')) write(root, relativePath, html);
    else write(root, relativePath, relativePath === 'CNAME' ? 'christiangoblin.com\n' : 'documented\n');
  }

  write(root, 'jobs/config.js', "window.CG_JOBS_CONFIG = { workerUrl: 'https://jobs.example.workers.dev', turnstileSiteKey: 'public-key' };\n");
}

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-final-audit-'));
try {
  createValidFixture(fixture);

  const validResult = auditRepository(fixture);
  assert.equal(validResult.errors.length, 0, JSON.stringify(validResult.errors, null, 2));

  write(fixture, 'fonts/test.txt', 'placeholder\n');
  write(fixture, 'broken.html', '<a href="missing-file.html">Missing</a>');
  write(fixture, 'secret.js', "const secret = '" + 'sk_' + 'live_1234567890abcdefghijklmnop' + "';\n");
  write(fixture, 'tools/ats/ats/index.html', '<p>duplicate</p>');
  write(fixture, 'open-beta.html', '<span>Open Beta</span>');

  const failingResult = auditRepository(fixture);
  const codes = new Set(failingResult.errors.map((finding) => finding.code));

  assert(codes.has('PLACEHOLDER_FILE'));
  assert(codes.has('BROKEN_LOCAL_REFERENCE'));
  assert(codes.has('POSSIBLE_SECRET'));
  assert(codes.has('NESTED_DEPLOYMENT'));
  assert(codes.has('OPEN_BETA_VISIBLE'));

  console.log('Final repository audit tests passed.');
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}
