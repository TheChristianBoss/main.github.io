import { access, cp, mkdir, readFile, readdir, rename, rm } from "node:fs/promises";
import { constants } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STAGING_ROOT = path.join(ROOT, ".build-staging");
const BACKUP_ROOT = path.join(ROOT, ".build-backup");

const APPS = {
  ats: {
    config: "vite.ats.config.js",
    output: "tools/ats",
    emittedEntry: "ats-index.html",
    preserve: ["favicon.svg", "icons.svg"],
  },
  resume: {
    config: "vite.resume.config.js",
    output: "tools/resume",
    emittedEntry: "resume-index.html",
    preserve: ["favicon.svg", "icons.svg"],
  },
  cover: {
    config: "vite.cover.config.js",
    output: "tools/cover",
  },
  converter: {
    config: "vite.converter.config.js",
    output: "tools/converter",
  },
  "asset-forge": {
    output: "tools/asset-forge",
    nestedPackage: "tools/asset-forge-src",
  },
};

const APP_ORDER = Object.keys(APPS);

function log(message) {
  console.log(`[build] ${message}`);
}

async function exists(target) {
  try {
    await access(target, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function run(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      env: process.env,
      stdio: "inherit",
      shell: false,
      ...options,
    });

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with ${code ?? signal}`));
    });
  });
}

async function buildRootViteApp(app, stagingDir) {
  const viteModule = await import("vite");
  await viteModule.build({
    configFile: path.join(ROOT, app.config),
    mode: "production",
    build: {
      outDir: stagingDir,
      emptyOutDir: true,
    },
  });
}

async function buildNestedApp(name, app, stagingDir) {
  const packageDir = path.join(ROOT, app.nestedPackage);
  const packageNodeModules = path.join(packageDir, "node_modules");
  const viteCli = path.join(packageNodeModules, "vite", "bin", "vite.js");

  if (!(await exists(packageNodeModules)) || !(await exists(viteCli))) {
    throw new Error(
      `${name} dependencies are missing. Run "npm run setup" once, then build again.`,
    );
  }

  // Launch Vite through the current Node executable instead of npm.cmd.
  // .cmd files require a shell on Windows and can throw spawn EINVAL when
  // launched directly, especially from paths containing spaces.
  await run(process.execPath, [viteCli, "build"], {
    cwd: packageDir,
    env: {
      ...process.env,
      CG_BUILD_OUT_DIR: stagingDir,
    },
  });
}

async function copyPreservedFiles(app, currentDir, stagingDir) {
  for (const relativePath of app.preserve ?? []) {
    const source = path.join(currentDir, relativePath);
    if (!(await exists(source))) continue;

    const destination = path.join(stagingDir, relativePath);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(source, destination, { recursive: true });
  }
}

async function canonicalizeEntry(app, stagingDir) {
  if (!app.emittedEntry) return;

  const emitted = path.join(stagingDir, app.emittedEntry);
  const canonical = path.join(stagingDir, "index.html");

  if (!(await exists(emitted))) {
    throw new Error(`Expected Vite to create ${app.emittedEntry}, but it did not.`);
  }

  await rm(canonical, { force: true });
  await rename(emitted, canonical);
}

async function swapDirectory(stagingDir, targetDir, name) {
  const backupDir = path.join(BACKUP_ROOT, name);
  await mkdir(path.dirname(targetDir), { recursive: true });
  await mkdir(BACKUP_ROOT, { recursive: true });
  await rm(backupDir, { recursive: true, force: true });

  const hadTarget = await exists(targetDir);
  if (hadTarget) await rename(targetDir, backupDir);

  try {
    await rename(stagingDir, targetDir);
    await rm(backupDir, { recursive: true, force: true });
  } catch (error) {
    await rm(targetDir, { recursive: true, force: true });
    if (hadTarget && (await exists(backupDir))) {
      await rename(backupDir, targetDir);
    }
    throw error;
  }
}

async function getFilesRecursive(directory) {
  if (!(await exists(directory))) return [];

  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await getFilesRecursive(fullPath)));
    else files.push(fullPath);
  }
  return files;
}

function localReferenceToPath(reference, appName, outputDir) {
  const clean = reference.split(/[?#]/, 1)[0];
  if (!clean || clean.startsWith("#") || clean.startsWith("data:")) return null;
  if (/^(?:https?:|mailto:|tel:|javascript:)/i.test(clean)) return null;

  const appPrefix = `/tools/${appName}/`;
  if (clean.startsWith(appPrefix)) {
    return path.join(outputDir, clean.slice(appPrefix.length));
  }

  if (clean.startsWith("/")) return null; // Shared site asset outside this app.
  return path.resolve(outputDir, clean);
}

export async function verifyApp(name, directory = path.join(ROOT, APPS[name].output)) {
  const app = APPS[name];
  if (!app) throw new Error(`Unknown app: ${name}`);

  const failures = [];
  const indexPath = path.join(directory, "index.html");
  if (!(await exists(indexPath))) failures.push("missing index.html");

  if (app.emittedEntry && (await exists(path.join(directory, app.emittedEntry)))) {
    failures.push(`temporary ${app.emittedEntry} was not removed`);
  }

  if (await exists(path.join(directory, name))) {
    failures.push(`obsolete nested ${name}/ deployment still exists`);
  }

  const assetsDir = path.join(directory, "assets");
  const assetFiles = await getFilesRecursive(assetsDir);
  if (!assetFiles.some((file) => file.endsWith(".js"))) {
    failures.push("no generated JavaScript bundle found in assets/");
  }

  if (await exists(indexPath)) {
    const html = await readFile(indexPath, "utf8");
    const references = [
      ...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi),
    ].map((match) => match[1]);

    for (const reference of references) {
      const target = localReferenceToPath(reference, name, directory);
      if (target && !(await exists(target))) {
        failures.push(`index.html references missing file: ${reference}`);
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(`${name} verification failed:\n- ${failures.join("\n- ")}`);
  }

  return {
    name,
    directory,
    assetCount: assetFiles.length,
  };
}

async function buildApp(name) {
  const app = APPS[name];
  if (!app) throw new Error(`Unknown app: ${name}`);

  const stagingDir = path.join(STAGING_ROOT, name);
  const targetDir = path.join(ROOT, app.output);

  log(`Building ${name}...`);
  await rm(stagingDir, { recursive: true, force: true });
  await mkdir(stagingDir, { recursive: true });

  if (app.nestedPackage) await buildNestedApp(name, app, stagingDir);
  else await buildRootViteApp(app, stagingDir);

  await canonicalizeEntry(app, stagingDir);
  await copyPreservedFiles(app, targetDir, stagingDir);
  await verifyApp(name, stagingDir);
  await swapDirectory(stagingDir, targetDir, name);
  await verifyApp(name, targetDir);

  log(`${name} deployed to ${app.output}/`);
}

async function cleanGeneratedBuilds() {
  await rm(STAGING_ROOT, { recursive: true, force: true });
  await rm(BACKUP_ROOT, { recursive: true, force: true });

  for (const [name, app] of Object.entries(APPS)) {
    const targetDir = path.join(ROOT, app.output);
    await rm(path.join(targetDir, "assets"), { recursive: true, force: true });
    await rm(path.join(targetDir, name), { recursive: true, force: true });
    if (app.emittedEntry) await rm(path.join(targetDir, app.emittedEntry), { force: true });
  }

  log("Generated bundles and temporary build folders removed.");
}

async function verifySelected(names) {
  for (const name of names) {
    const result = await verifyApp(name);
    log(`${result.name} verified (${result.assetCount} generated asset files).`);
  }
}

function usage() {
  console.log(`Usage: node scripts/build-apps.mjs <command>\n\nCommands:\n  all\n  ${APP_ORDER.join("\n  ")}\n  verify\n  clean\n  list`);
}

async function main() {
  const command = process.argv[2] ?? "all";

  if (command === "list") {
    console.log(APP_ORDER.join("\n"));
    return;
  }

  if (command === "clean") {
    await cleanGeneratedBuilds();
    return;
  }

  if (command === "verify") {
    await verifySelected(APP_ORDER);
    return;
  }

  if (command !== "all" && !APP_ORDER.includes(command)) {
    usage();
    throw new Error(`Unknown build command: ${command}`);
  }

  const selected = command === "all" ? APP_ORDER : [command];
  for (const name of selected) await buildApp(name);
  await verifySelected(selected);
  await rm(STAGING_ROOT, { recursive: true, force: true });
  await rm(BACKUP_ROOT, { recursive: true, force: true });
}

const isDirectExecution = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  main().catch((error) => {
    console.error(`\nBuild failed: ${error.message}`);
    process.exitCode = 1;
  });
}
