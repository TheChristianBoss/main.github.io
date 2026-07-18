import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const allowedExtensions = new Set(['.html', '.js', '.jsx', '.mjs', '.css']);
const explicitFiles = [
  'tools/components/tools-nav.html',
  'tools/index.html',
  'src/App.jsx',
  'src/ResumeBuilder.jsx',
  'tools/cover-src/src/coverMain.js',
  'tools/converter-src/src/converterMain.js',
];
const deployedDirectories = [
  'tools/ats',
  'tools/resume',
  'tools/cover',
  'tools/converter',
  'tools/asset-forge',
];

function cleanOpenBeta(text) {
  let next = text;

  // Remove source HTML/JSX badges completely.
  next = next.replace(
    /\s*<span\b[^>]*class=(['"])[^'"]*(?:open-beta-badge|beta-badge)[^'"]*\1[^>]*>\s*open beta\s*<\/span>/gi,
    '',
  );

  // Remove any remaining visible phrase from headings or compiled string literals.
  next = next.replace(/\s+open beta\b/gi, '');

  // Remove now-unused title-layout class from source markup.
  next = next.replace(/\s+tool-title-line\b/g, '');

  return next;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(directory) {
  const result = [];
  if (!(await exists(directory))) return result;
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      result.push(...await listFiles(full));
    } else if (allowedExtensions.has(path.extname(entry.name).toLowerCase())) {
      result.push(full);
    }
  }
  return result;
}

const targets = new Set();
for (const relative of explicitFiles) {
  const full = path.join(root, relative);
  if (await exists(full)) targets.add(full);
}
for (const relative of deployedDirectories) {
  for (const file of await listFiles(path.join(root, relative))) targets.add(file);
}

let changed = 0;
for (const file of targets) {
  const original = await fs.readFile(file, 'utf8');
  const updated = cleanOpenBeta(original);
  if (updated !== original) {
    await fs.writeFile(file, updated, 'utf8');
    changed += 1;
    console.log(`[updated] ${path.relative(root, file)}`);
  }
}

const remaining = [];
for (const file of targets) {
  const text = await fs.readFile(file, 'utf8');
  if (/open beta|open-beta-badge|open-beta-note/i.test(text)) {
    remaining.push(path.relative(root, file));
  }
}

if (remaining.length) {
  console.error('\nOpen Beta references remain in:');
  for (const file of remaining) console.error(`- ${file}`);
  process.exitCode = 1;
} else {
  console.log(`\nRemoved tool Open Beta copy from ${changed} file(s).`);
  console.log('No visible Open Beta references remain in the targeted tool files.');
}
