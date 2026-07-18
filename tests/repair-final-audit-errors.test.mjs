import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { repairFinalAuditErrors } from '../scripts/repair-final-audit-errors.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-final-audit-repair-'));

function write(relativePath, content) {
  const target = path.join(root, ...relativePath.split('/'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

for (const name of ['cart', 'index', 'product', 'service', 'success']) {
  write(`store/${name}.html`, '<footer>© 2025 ChristianGoblin</footer>');
}

write('tools/components/tools-nav.html', '<a><span class="tool-link-name">Resume</span><span class="open-beta-badge">Open Beta</span></a>');
write('tools/converter/index.html', '<link rel="stylesheet" href="/tools/converter/assets/index-abc123.css">');
write('tools/converter/assets/index-abc123.css', '.converter-shell{display:block}');
write('tools/converter/privacy.html', '<link rel="stylesheet" href="./assets/converter-app.css">');
write('tools/converter/test.html', '<link rel="stylesheet" href="./assets/converter-app.css">');
write('tools/converter-src/public/privacy.html', '<link rel="stylesheet" href="./assets/converter-app.css">');
write('tools/converter-src/public/test.html', '<link rel="stylesheet" href="./assets/converter-app.css">');
write('tools/cover-src/index.html', '<link rel="stylesheet" href="/src/cover.css"><script type="module" src="/src/coverMain.js"></script>');
write('tools/cover-src/src/cover.css', 'body{}');
write('tools/cover-src/src/coverMain.js', 'export {};');
write('Path = (Resolve-Path •.toolsindex.html•).Path', 'accidental');

const first = repairFinalAuditErrors(root);
assert.equal(first.changed.length, 13);
assert.equal(first.removed.length, 1);

for (const name of ['cart', 'index', 'product', 'service', 'success']) {
  assert.match(fs.readFileSync(path.join(root, 'store', `${name}.html`), 'utf8'), /© 2026/);
}
assert.doesNotMatch(fs.readFileSync(path.join(root, 'tools/components/tools-nav.html'), 'utf8'), /Open Beta|open-beta/i);
assert.equal(fs.readFileSync(path.join(root, 'tools/converter/converter-static.css'), 'utf8'), '.converter-shell{display:block}');
assert.equal(fs.readFileSync(path.join(root, 'tools/converter-src/public/converter-static.css'), 'utf8'), '.converter-shell{display:block}');

for (const relativePath of [
  'tools/converter/privacy.html',
  'tools/converter/test.html',
  'tools/converter-src/public/privacy.html',
  'tools/converter-src/public/test.html',
]) {
  assert.match(fs.readFileSync(path.join(root, ...relativePath.split('/')), 'utf8'), /\/tools\/converter\/converter-static\.css/);
}

const cover = fs.readFileSync(path.join(root, 'tools/cover-src/index.html'), 'utf8');
assert.match(cover, /href="\.\/src\/cover\.css"/);
assert.match(cover, /src="\.\/src\/coverMain\.js"/);
assert.equal(fs.existsSync(path.join(root, 'Path = (Resolve-Path •.toolsindex.html•).Path')), false);

const second = repairFinalAuditErrors(root);
assert.equal(second.changed.length, 0, 'repair must be idempotent');
assert.equal(second.removed.length, 0, 'second repair should have nothing to remove');

fs.rmSync(root, { recursive: true, force: true });
console.log('Final-audit repair tests passed.');
