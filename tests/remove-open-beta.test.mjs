import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.resolve(here, '../scripts/remove-open-beta.mjs');
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'open-beta-test-'));
await fs.mkdir(path.join(temp, 'tools/components'), { recursive: true });
await fs.writeFile(path.join(temp, 'tools/index.html'), '<div class="open-beta-note">Open Beta: changing</div><h2 class="tool-title-line">ATS <span class="open-beta-badge">Open Beta</span></h2>');
await fs.writeFile(path.join(temp, 'tools/components/tools-nav.html'), '<a>Resume <span class="open-beta-badge">OPEN BETA</span></a>');

const result = spawnSync(process.execPath, [script], { cwd: temp, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr || result.stdout);
const combined = (await fs.readFile(path.join(temp, 'tools/index.html'), 'utf8')) + (await fs.readFile(path.join(temp, 'tools/components/tools-nav.html'), 'utf8'));
assert.doesNotMatch(combined, /open\s+beta|open-beta-badge|open-beta-note/i);
assert.match(combined, /ATS/);
assert.match(combined, /Resume/);
await fs.rm(temp, { recursive: true, force: true });
console.log('Open Beta removal test passed.');
