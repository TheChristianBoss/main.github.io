import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const SKIPPED_DIRECTORY_NAMES = new Set([
  '.git',
  'node_modules',
  '.build-staging',
  '.build-backup',
  'bible',
]);

const REQUIRED_FILES = [
  'README.md',
  'BUILDING.md',
  'DEPLOYMENT-CHECKLIST.md',
  'package.json',
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
];

const REQUIRED_DEPLOYMENTS = [
  'tools/ats/index.html',
  'tools/resume/index.html',
  'tools/cover/index.html',
  'tools/converter/index.html',
  'tools/asset-forge/index.html',
  'editor/index.html',
];

const FORBIDDEN_NESTED_DEPLOYMENTS = [
  'editor/editor',
  'tools/ats/ats',
  'tools/resume/resume',
  'tools/cover/cover',
  'tools/converter/converter',
  'tools/asset-forge/asset-forge',
];

const SECRET_PATTERNS = [
  ['Discord webhook', /https:\/\/(?:discord(?:app)?\.com)\/api\/webhooks\/\d{5,}\/[A-Za-z0-9_-]{20,}/g],
  ['Stripe secret key', /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g],
  ['GitHub token', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b/g],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/g],
  ['Private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
];

function normalizeRelative(root, absolutePath) {
  return path.relative(root, absolutePath).split(path.sep).join('/');
}

function shouldSkipDirectory(name) {
  return SKIPPED_DIRECTORY_NAMES.has(name);
}

function walkFiles(root) {
  const files = [];

  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && shouldSkipDirectory(entry.name)) continue;
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolutePath);
      else if (entry.isFile()) files.push(absolutePath);
    }
  }

  visit(root);
  return files;
}

function fileExists(root, relativePath) {
  return fs.existsSync(path.join(root, ...relativePath.split('/')));
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function addFinding(collection, code, message, file = null) {
  collection.push({ code, message, file });
}

function resolveLocalReference(root, htmlFile, rawReference) {
  const reference = rawReference.trim();
  if (
    !reference ||
    reference.startsWith('#') ||
    reference.startsWith('//') ||
    /^[a-z][a-z0-9+.-]*:/i.test(reference) ||
    reference.includes('{{') ||
    reference.includes('${')
  ) {
    return null;
  }

  const cleanReference = reference.split('#')[0].split('?')[0];
  if (!cleanReference) return null;

  let target = cleanReference.startsWith('/')
    ? path.join(root, cleanReference.replace(/^\/+/, ''))
    : path.resolve(path.dirname(htmlFile), cleanReference);

  if (!target.startsWith(path.resolve(root))) return null;

  if (cleanReference.endsWith('/')) target = path.join(target, 'index.html');
  else if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');

  return target;
}

export function auditRepository(rootDirectory) {
  const root = path.resolve(rootDirectory);
  const errors = [];
  const warnings = [];
  const information = [];

  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    addFinding(errors, 'ROOT_MISSING', `Repository root does not exist: ${root}`);
    return { root, errors, warnings, information };
  }

  for (const relativePath of [...REQUIRED_FILES, ...REQUIRED_DEPLOYMENTS]) {
    if (!fileExists(root, relativePath)) {
      addFinding(errors, 'REQUIRED_FILE_MISSING', `Required file is missing: ${relativePath}`, relativePath);
    }
  }

  const readmePath = path.join(root, 'README.md');
  if (fs.existsSync(readmePath) && readUtf8(readmePath).trim().length < 500) {
    addFinding(errors, 'README_INCOMPLETE', 'README.md is empty or too short to document the repository.', 'README.md');
  }

  const packagePath = path.join(root, 'package.json');
  if (fs.existsSync(packagePath)) {
    try {
      const packageJson = JSON.parse(readUtf8(packagePath));
      for (const scriptName of ['build', 'build:verify', 'test:all', 'audit:final', 'validate', 'validate:fast']) {
        if (!packageJson.scripts?.[scriptName]) {
          addFinding(errors, 'PACKAGE_SCRIPT_MISSING', `package.json is missing the ${scriptName} script.`, 'package.json');
        }
      }
    } catch (error) {
      addFinding(errors, 'PACKAGE_JSON_INVALID', `package.json is invalid JSON: ${error.message}`, 'package.json');
    }
  }

  for (const relativeDirectory of FORBIDDEN_NESTED_DEPLOYMENTS) {
    if (fileExists(root, relativeDirectory)) {
      addFinding(errors, 'NESTED_DEPLOYMENT', `Obsolete nested deployment still exists: ${relativeDirectory}`, relativeDirectory);
    }
  }

  const files = walkFiles(root);
  const textExtensions = new Set(['.css', '.html', '.js', '.jsx', '.json', '.jsonc', '.md', '.mjs', '.txt', '.xml']);

  for (const absolutePath of files) {
    const relativePath = normalizeRelative(root, absolutePath);
    const basename = path.basename(relativePath);

    if (/\.backup-before-/i.test(basename)) {
      addFinding(errors, 'BACKUP_FILE', `Backup file should not be committed: ${relativePath}`, relativePath);
    }

    const extension = path.extname(relativePath).toLowerCase();
    if (!textExtensions.has(extension)) continue;

    let content;
    try {
      content = readUtf8(absolutePath);
    } catch {
      continue;
    }

    if (content.trim().toLowerCase() === 'placeholder') {
      addFinding(errors, 'PLACEHOLDER_FILE', `Exact placeholder file remains: ${relativePath}`, relativePath);
    }

    if (extension === '.html') {
      if (/>\s*Open Beta\s*</i.test(content) || /class=["'][^"']*open-beta-note/i.test(content)) {
        addFinding(errors, 'OPEN_BETA_VISIBLE', `Visible Open Beta content remains in ${relativePath}.`, relativePath);
      }

      if (/(?:©|&copy;)\s*2025\b/i.test(content)) {
        addFinding(errors, 'STALE_COPYRIGHT', `A 2025 copyright notice remains in ${relativePath}.`, relativePath);
      }

      const referencePattern = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;
      for (const match of content.matchAll(referencePattern)) {
        const target = resolveLocalReference(root, absolutePath, match[1]);
        if (target && !fs.existsSync(target)) {
          addFinding(errors, 'BROKEN_LOCAL_REFERENCE', `${relativePath} references missing local file ${match[1]}.`, relativePath);
        }
      }
    }

    if (!relativePath.endsWith('.md')) {
      for (const [secretType, pattern] of SECRET_PATTERNS) {
        pattern.lastIndex = 0;
        if (pattern.test(content)) {
          addFinding(errors, 'POSSIBLE_SECRET', `${secretType} pattern found in ${relativePath}.`, relativePath);
        }
      }
    }
  }

  const jobsConfigPath = path.join(root, 'jobs', 'config.js');
  if (fs.existsSync(jobsConfigPath)) {
    const jobsConfig = readUtf8(jobsConfigPath);
    if (/REPLACE[-_A-Z]|your-jobs-worker/i.test(jobsConfig)) {
      addFinding(warnings, 'JOBS_NOT_DEPLOYED', 'jobs/config.js still contains deployment placeholders.', 'jobs/config.js');
    }
  }

  const wranglerExamplePath = path.join(root, 'workers', 'wrangler.store.example.jsonc');
  if (fs.existsSync(wranglerExamplePath) && /REPLACE_WITH_YOUR_KV_NAMESPACE_ID/.test(readUtf8(wranglerExamplePath))) {
    addFinding(information, 'STORE_EXAMPLE_PLACEHOLDER', 'The example Wrangler file correctly retains its placeholder namespace ID.', 'workers/wrangler.store.example.jsonc');
  }

  const editorSourceCandidates = [
    path.join(root, 'editor-src'),
    path.join(root, 'tools', 'editor-src'),
    path.join(root, 'src', 'editor'),
  ];
  if (!editorSourceCandidates.some((candidate) => fs.existsSync(candidate))) {
    addFinding(warnings, 'EDITOR_SOURCE_MISSING', 'Goblin Editor editable source is not present; only the deployment can be validated.', 'editor/');
  }

  const biblePath = path.join(root, 'bible');
  if (fs.existsSync(biblePath)) {
    addFinding(information, 'BIBLE_SKIPPED', 'The /bible/ directory was intentionally excluded from this audit.', 'bible/');
  }

  return { root, errors, warnings, information };
}

function printFindings(label, findings) {
  if (findings.length === 0) return;
  console.log(`\n${label} (${findings.length})`);
  for (const finding of findings) {
    console.log(`- [${finding.code}] ${finding.message}`);
  }
}

function runCli() {
  const jsonMode = process.argv.includes('--json');
  const rootArgument = process.argv.find((argument, index) => index > 1 && !argument.startsWith('--'));
  const result = auditRepository(rootArgument || process.cwd());

  if (jsonMode) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Final repository audit: ${result.root}`);
    printFindings('Errors', result.errors);
    printFindings('Warnings', result.warnings);
    printFindings('Information', result.information);
    console.log(`\nResult: ${result.errors.length} error(s), ${result.warnings.length} warning(s).`);
  }

  if (result.errors.length > 0) process.exitCode = 1;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invokedPath === import.meta.url) runCli();
