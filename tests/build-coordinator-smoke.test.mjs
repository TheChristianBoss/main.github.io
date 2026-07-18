import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempRoot = await mkdtemp(path.join(os.tmpdir(), "cg-build-coordinator-"));

async function runNode(args) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: tempRoot,
      stdio: "inherit",
      shell: false,
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Child process exited with ${code}.`));
    });
  });
}

try {
  await mkdir(path.join(tempRoot, "scripts"), { recursive: true });
  await mkdir(path.join(tempRoot, "node_modules", "vite"), { recursive: true });
  await mkdir(path.join(tempRoot, "tools", "ats", "assets"), { recursive: true });
  await mkdir(path.join(tempRoot, "tools", "ats", "ats"), { recursive: true });

  await copyFile(
    path.join(sourceRoot, "scripts", "build-apps.mjs"),
    path.join(tempRoot, "scripts", "build-apps.mjs"),
  );
  await writeFile(path.join(tempRoot, "package.json"), '{"type":"module"}\n');
  await writeFile(
    path.join(tempRoot, "node_modules", "vite", "package.json"),
    '{"name":"vite","type":"module","exports":"./index.js"}\n',
  );
  await writeFile(
    path.join(tempRoot, "node_modules", "vite", "index.js"),
    `import { mkdir, writeFile } from "node:fs/promises";
     import path from "node:path";
     export async function build(options) {
       const out = options.build.outDir;
       await mkdir(path.join(out, "assets"), { recursive: true });
       await writeFile(path.join(out, "ats-index.html"), '<script type="module" src="/tools/ats/assets/new.js"></script>');
       await writeFile(path.join(out, "assets", "new.js"), 'export {};');
     }
    `,
  );

  await writeFile(path.join(tempRoot, "tools", "ats", "favicon.svg"), "favicon");
  await writeFile(path.join(tempRoot, "tools", "ats", "icons.svg"), "icons");
  await writeFile(path.join(tempRoot, "tools", "ats", "assets", "old.js"), "old");
  await writeFile(path.join(tempRoot, "tools", "ats", "ats", "index.html"), "duplicate");

  await runNode(["scripts/build-apps.mjs", "ats"]);

  const index = await readFile(path.join(tempRoot, "tools", "ats", "index.html"), "utf8");
  assert.match(index, /new\.js/);
  assert.equal(await readFile(path.join(tempRoot, "tools", "ats", "favicon.svg"), "utf8"), "favicon");
  assert.equal(await readFile(path.join(tempRoot, "tools", "ats", "icons.svg"), "utf8"), "icons");

  await assert.rejects(readFile(path.join(tempRoot, "tools", "ats", "ats-index.html")));
  await assert.rejects(readFile(path.join(tempRoot, "tools", "ats", "assets", "old.js")));
  await assert.rejects(readFile(path.join(tempRoot, "tools", "ats", "ats", "index.html")));

  console.log("Unified build coordinator smoke test passed.");
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
