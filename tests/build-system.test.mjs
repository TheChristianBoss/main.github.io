import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { verifyApp } from "../scripts/build-apps.mjs";

const tempRoot = await mkdtemp(path.join(os.tmpdir(), "cg-build-test-"));

async function createValidBuild(name, htmlReference = `./assets/${name}.js`) {
  const directory = path.join(tempRoot, name);
  await mkdir(path.join(directory, "assets"), { recursive: true });
  await writeFile(
    path.join(directory, "index.html"),
    `<!doctype html><script type="module" src="${htmlReference}"></script>`,
  );
  await writeFile(path.join(directory, "assets", `${name}.js`), "export {};\n");
  return directory;
}

try {
  const validDirectory = await createValidBuild("ats");
  const result = await verifyApp("ats", validDirectory);
  assert.equal(result.assetCount, 1);

  const brokenDirectory = await createValidBuild("resume", "./assets/missing.js");
  await assert.rejects(
    verifyApp("resume", brokenDirectory),
    /references missing file/,
  );

  const temporaryEntryDirectory = await createValidBuild("ats-temp");
  await writeFile(path.join(temporaryEntryDirectory, "ats-index.html"), "temporary");
  await assert.rejects(
    verifyApp("ats", temporaryEntryDirectory),
    /temporary ats-index\.html was not removed/,
  );

  console.log("Unified build-system tests passed.");
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
