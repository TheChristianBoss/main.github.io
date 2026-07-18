import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const toolsRoot = path.join(root, 'tools');
const skipped = new Set(['node_modules', '.git']);

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (skipped.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) out.push(full);
  }
  return out;
}

function removeOpenBeta(html) {
  let next = html;

  // Remove complete badge elements wherever they appear.
  next = next.replace(
    /\s*<([a-z][a-z0-9-]*)\b[^>]*class=(['"])[^'">]*\bopen-beta-badge\b[^'">]*\2[^>]*>[\s\S]*?<\/\1>\s*/gi,
    ' '
  );

  // Remove the explanatory Open Beta notice from the tools listing.
  next = next.replace(
    /\s*<([a-z][a-z0-9-]*)\b[^>]*class=(['"])[^'">]*\bopen-beta-note\b[^'">]*\2[^>]*>[\s\S]*?<\/\1>\s*/gi,
    '\n'
  );

  // Remove any remaining visible label text in public Tools HTML.
  next = next.replace(/\bOpen\s+Beta\b/gi, '');

  // Remove classes that existed only to align the badge.
  next = next.replace(/\s+tool-title-line(?=[\s"'])/g, '');

  // Tidy whitespace left inside links/headings without rewriting the document.
  next = next.replace(/[ \t]+<\/a>/g, '</a>');
  next = next.replace(/[ \t]+<\/h([1-6])>/g, '</h$1>');

  return next;
}

if (!(await fs.stat(toolsRoot).catch(() => null))?.isDirectory()) {
  throw new Error(`Tools directory not found: ${toolsRoot}`);
}

const files = await walk(toolsRoot);
const changed = [];

for (const file of files) {
  const original = await fs.readFile(file, 'utf8');
  const updated = removeOpenBeta(original);
  if (updated !== original) {
    await fs.writeFile(file, updated, 'utf8');
    changed.push(path.relative(root, file));
  }
}

const remaining = [];
for (const file of files) {
  const text = await fs.readFile(file, 'utf8');
  if (/Open\s+Beta|open-beta-badge|open-beta-note/i.test(text)) {
    remaining.push(path.relative(root, file));
  }
}

if (remaining.length) {
  throw new Error(`Open Beta references remain in: ${remaining.join(', ')}`);
}

console.log(`Removed Open Beta labels from ${changed.length} file(s).`);
for (const file of changed) console.log(`- ${file}`);
console.log('No Open Beta references remain in Tools HTML.');
