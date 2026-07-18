#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, rmSync, statSync, unlinkSync } from 'node:fs';
import { resolve, relative, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const NESTED_DEPLOYMENTS = [
  'editor/editor',
  'tools/ats/ats',
  'tools/resume/resume',
  'tools/cover/cover',
  'tools/converter/converter',
];

const ASSET_FORGE_BACKUPS = [
  'tools/asset-forge-src/src/App.css.backup-before-drag-layer',
  'tools/asset-forge-src/src/App.css.backup-before-image-controls',
  'tools/asset-forge-src/src/App.css.backup-before-image-handles',
  'tools/asset-forge-src/src/App.css.backup-before-multi-image-layers',
  'tools/asset-forge-src/src/App.css.backup-before-pdf',
  'tools/asset-forge-src/src/App.css.backup-before-size-presets',
  'tools/asset-forge-src/src/App.jsx.backup-before-drag-layer',
  'tools/asset-forge-src/src/App.jsx.backup-before-image-controls',
  'tools/asset-forge-src/src/App.jsx.backup-before-image-handles',
  'tools/asset-forge-src/src/App.jsx.backup-before-image-movement-fix',
  'tools/asset-forge-src/src/App.jsx.backup-before-multi-image-layers',
  'tools/asset-forge-src/src/App.jsx.backup-before-pdf',
  'tools/asset-forge-src/src/App.jsx.backup-before-size-presets',
];

function parseArguments(argv) {
  const options = { apply: false, root: process.cwd() };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--apply') {
      options.apply = true;
    } else if (argument === '--root') {
      const root = argv[index + 1];
      if (!root) throw new Error('--root requires a directory path.');
      options.root = root;
      index += 1;
    } else if (argument === '--help' || argument === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

function listFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(absolute));
    else if (entry.isFile()) files.push(absolute);
    else throw new Error(`Refusing to remove non-regular entry: ${absolute}`);
  }
  return files;
}

function digest(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function assertRepositoryRoot(root) {
  const required = [
    'package.json',
    'CNAME',
    'editor/index.html',
    'tools/asset-forge-src/src/App.jsx',
  ];
  const missing = required.filter((path) => !existsSync(join(root, path)));
  if (missing.length > 0) {
    throw new Error(
      `This does not look like the website repository root. Missing: ${missing.join(', ')}`,
    );
  }
}

function assertOutsideBible(relativePath) {
  const parts = relativePath.split(/[\\/]+/);
  if (parts.includes('bible')) {
    throw new Error(`Safety stop: cleanup target enters /bible/: ${relativePath}`);
  }
}

function inspectNestedDeployment(root, relativePath) {
  assertOutsideBible(relativePath);
  const nested = join(root, relativePath);
  if (!existsSync(nested)) return { relativePath, exists: false, removable: false, files: 0 };
  if (!statSync(nested).isDirectory()) {
    return { relativePath, exists: true, removable: false, reason: 'Target is not a directory.' };
  }

  const parent = dirname(nested);
  const nestedFiles = listFiles(nested);
  const mismatches = [];

  for (const nestedFile of nestedFiles) {
    const localRelative = relative(nested, nestedFile);
    const canonicalFile = join(parent, localRelative);
    if (!existsSync(canonicalFile) || !statSync(canonicalFile).isFile()) {
      mismatches.push(`${localRelative}: canonical file missing`);
      continue;
    }
    if (statSync(nestedFile).size !== statSync(canonicalFile).size || digest(nestedFile) !== digest(canonicalFile)) {
      mismatches.push(`${localRelative}: content differs`);
    }
  }

  return {
    relativePath,
    exists: true,
    removable: mismatches.length === 0,
    files: nestedFiles.length,
    mismatches,
  };
}

function inspectBackup(root, relativePath) {
  assertOutsideBible(relativePath);
  const absolute = join(root, relativePath);
  return {
    relativePath,
    exists: existsSync(absolute),
    removable: existsSync(absolute) && statSync(absolute).isFile(),
  };
}

function printHelp() {
  console.log(`Usage:\n  node scripts/cleanup-known-duplicates.mjs          # dry run\n  node scripts/cleanup-known-duplicates.mjs --apply  # delete verified targets`);
}

export function runCleanup({ root: inputRoot, apply }) {
  const root = resolve(inputRoot);
  assertRepositoryRoot(root);

  const nested = NESTED_DEPLOYMENTS.map((path) => inspectNestedDeployment(root, path));
  const backups = ASSET_FORGE_BACKUPS.map((path) => inspectBackup(root, path));
  const unsafe = nested.filter((item) => item.exists && !item.removable);

  console.log(apply ? 'Repository cleanup: APPLY mode' : 'Repository cleanup: DRY RUN');
  console.log(`Root: ${root}`);
  console.log('Bible directory: excluded from every cleanup target.');

  for (const item of nested) {
    if (!item.exists) console.log(`[skip] ${item.relativePath} (not present)`);
    else if (item.removable) console.log(`[ready] ${item.relativePath} (${item.files} duplicate files)`);
    else {
      console.error(`[blocked] ${item.relativePath}`);
      for (const mismatch of item.mismatches ?? [item.reason]) console.error(`  - ${mismatch}`);
    }
  }

  const existingBackups = backups.filter((item) => item.exists);
  console.log(`[ready] ${existingBackups.length} known Asset Forge backup file(s)`);

  if (unsafe.length > 0) {
    throw new Error('Cleanup stopped because at least one nested deployment is not an exact duplicate.');
  }

  if (!apply) {
    console.log('Dry run complete. No files were deleted. Re-run with --apply to perform cleanup.');
    return { nested, backups, applied: false };
  }

  for (const item of nested.filter((entry) => entry.removable)) {
    rmSync(join(root, item.relativePath), { recursive: true, force: false });
    console.log(`[removed] ${item.relativePath}`);
  }
  for (const item of existingBackups) {
    unlinkSync(join(root, item.relativePath));
    console.log(`[removed] ${item.relativePath}`);
  }

  console.log('Cleanup complete. Source files and /bible/ were not targeted.');
  return { nested, backups, applied: true };
}

const invokedScript = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';

if (import.meta.url === invokedScript) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) printHelp();
    else runCleanup(options);
  } catch (error) {
    console.error(`Cleanup failed: ${error.message}`);
    process.exitCode = 1;
  }
}
