import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const STORE_FILES = [
  'store/cart.html',
  'store/index.html',
  'store/product.html',
  'store/service.html',
  'store/success.html',
];

const CONVERTER_SUPPORT_PAGES = [
  'tools/converter/privacy.html',
  'tools/converter/test.html',
  'tools/converter-src/public/privacy.html',
  'tools/converter-src/public/test.html',
];

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeUtf8(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function requireFile(root, relativePath) {
  const filePath = path.join(root, ...relativePath.split('/'));
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file is missing: ${relativePath}`);
  }
  return filePath;
}

function replaceFile(filePath, transform) {
  const original = readUtf8(filePath);
  const updated = transform(original);
  if (updated === original) return false;
  writeUtf8(filePath, updated);
  return true;
}

function findConverterCss(root) {
  const indexPath = requireFile(root, 'tools/converter/index.html');
  const html = readUtf8(indexPath);
  const stylesheetMatches = [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+\.css(?:\?[^"']*)?)["'][^>]*>/gi)];

  for (const match of stylesheetMatches) {
    const reference = match[1].split('?')[0].split('#')[0];
    const candidate = reference.startsWith('/')
      ? path.join(root, reference.replace(/^\/+/, ''))
      : path.resolve(path.dirname(indexPath), reference);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }

  const assetsDirectory = path.join(root, 'tools', 'converter', 'assets');
  if (fs.existsSync(assetsDirectory)) {
    const candidates = fs.readdirSync(assetsDirectory)
      .filter((name) => /^index-.*\.css$/i.test(name))
      .map((name) => path.join(assetsDirectory, name));
    if (candidates.length === 1) return candidates[0];
    if (candidates.length > 1) {
      candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
      return candidates[0];
    }
  }

  throw new Error('Unable to locate the current converter stylesheet from tools/converter/index.html.');
}

export function repairFinalAuditErrors(rootDirectory) {
  const root = path.resolve(rootDirectory);
  const changed = [];
  const removed = [];

  for (const relativePath of STORE_FILES) {
    const filePath = requireFile(root, relativePath);
    if (replaceFile(filePath, (content) => content.replace(/((?:©|&copy;)\s*)2025\b/gi, '$12026'))) {
      changed.push(relativePath);
    }
  }

  const navRelativePath = 'tools/components/tools-nav.html';
  const navPath = requireFile(root, navRelativePath);
  if (replaceFile(navPath, (content) => content
    .replace(/\s*<span\s+class=["']open-beta-badge["']>\s*Open Beta\s*<\/span>/gi, '')
    .replace(/\s+aria-label=["']([^"']*?)\s*Open Beta([^"']*)["']/gi, ' aria-label="$1$2"'))) {
    changed.push(navRelativePath);
  }

  const converterCssSource = findConverterCss(root);
  const stableCss = readUtf8(converterCssSource);
  const stableCssTargets = [
    'tools/converter/converter-static.css',
    'tools/converter-src/public/converter-static.css',
  ];

  for (const relativePath of stableCssTargets) {
    const target = path.join(root, ...relativePath.split('/'));
    const previous = fs.existsSync(target) ? readUtf8(target) : null;
    if (previous !== stableCss) {
      writeUtf8(target, stableCss);
      changed.push(relativePath);
    }
  }

  for (const relativePath of CONVERTER_SUPPORT_PAGES) {
    const filePath = requireFile(root, relativePath);
    if (replaceFile(filePath, (content) => content.replace(
      /href=["']\.\/assets\/converter-app\.css["']/gi,
      'href="/tools/converter/converter-static.css"',
    ))) {
      changed.push(relativePath);
    }
  }

  const coverRelativePath = 'tools/cover-src/index.html';
  const coverPath = requireFile(root, coverRelativePath);
  if (replaceFile(coverPath, (content) => content
    .replace(/href=["']\/src\/cover\.css["']/gi, 'href="./src/cover.css"')
    .replace(/src=["']\/src\/coverMain\.js["']/gi, 'src="./src/coverMain.js"'))) {
    changed.push(coverRelativePath);
  }

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (/^Path\s*=\s*\(Resolve-Path/i.test(entry.name) || /toolsindex\.html/i.test(entry.name)) {
      fs.rmSync(path.join(root, entry.name), { force: true });
      removed.push(entry.name);
    }
  }

  return {
    root,
    converterCssSource: path.relative(root, converterCssSource).split(path.sep).join('/'),
    changed: [...new Set(changed)].sort(),
    removed: [...new Set(removed)].sort(),
  };
}

function runCli() {
  try {
    const rootArgument = process.argv.find((argument, index) => index > 1 && !argument.startsWith('--'));
    const result = repairFinalAuditErrors(rootArgument || process.cwd());
    console.log(`Final-audit repair completed in ${result.root}`);
    console.log(`Converter support stylesheet copied from ${result.converterCssSource}`);
    console.log(`Changed files: ${result.changed.length}`);
    for (const file of result.changed) console.log(`- ${file}`);
    console.log(`Removed accidental files: ${result.removed.length}`);
    for (const file of result.removed) console.log(`- ${file}`);
  } catch (error) {
    console.error(`Final-audit repair failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invokedPath === import.meta.url) runCli();
