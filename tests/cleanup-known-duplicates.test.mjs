import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const script = resolve('scripts/cleanup-known-duplicates.mjs');

function write(root, relativePath, contents = relativePath) {
  const absolute = join(root, relativePath);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, contents);
}

function createFixture({ mismatch = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'cg-cleanup-test-'));
  write(root, 'package.json', '{}');
  write(root, 'CNAME', 'example.test');
  write(root, 'editor/index.html', 'editor');
  write(root, 'tools/asset-forge-src/src/App.jsx', 'current app');
  write(root, 'bible/do-not-touch.txt', 'sacred fixture');

  write(root, 'editor/assets/app.js', 'canonical');
  write(root, 'editor/editor/assets/app.js', mismatch ? 'different' : 'canonical');

  write(root, 'tools/asset-forge-src/src/App.jsx.backup-before-pdf', 'old app');
  return root;
}

{
  const root = createFixture();
  const bibleBefore = readFileSync(join(root, 'bible/do-not-touch.txt'), 'utf8');

  execFileSync(process.execPath, [script, '--root', root], { stdio: 'pipe' });
  assert.equal(existsSync(join(root, 'editor/editor')), true, 'dry run must not delete duplicate directory');
  assert.equal(existsSync(join(root, 'tools/asset-forge-src/src/App.jsx.backup-before-pdf')), true, 'dry run must not delete backup');

  execFileSync(process.execPath, [script, '--root', root, '--apply'], { stdio: 'pipe' });
  assert.equal(existsSync(join(root, 'editor/editor')), false, 'apply must delete exact nested duplicate');
  assert.equal(existsSync(join(root, 'tools/asset-forge-src/src/App.jsx.backup-before-pdf')), false, 'apply must delete listed backup');
  assert.equal(readFileSync(join(root, 'bible/do-not-touch.txt'), 'utf8'), bibleBefore, 'Bible fixture must remain unchanged');
  assert.equal(existsSync(join(root, 'editor/index.html')), true, 'canonical editor must remain');
  rmSync(root, { recursive: true, force: true });
}

{
  const root = createFixture({ mismatch: true });
  const result = spawnSync(process.execPath, [script, '--root', root, '--apply'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0, 'mismatched nested deployment must block cleanup');
  assert.equal(existsSync(join(root, 'editor/editor')), true, 'mismatched directory must remain');
  assert.equal(existsSync(join(root, 'tools/asset-forge-src/src/App.jsx.backup-before-pdf')), true, 'no cleanup should occur after safety stop');
  rmSync(root, { recursive: true, force: true });
}

console.log('Known-duplicate cleanup tests passed.');
