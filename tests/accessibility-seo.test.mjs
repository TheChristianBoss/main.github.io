import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDir, "..");

async function text(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

const canonicalPages = [
  ["index.html", "https://christiangoblin.com/"],
  ["about/index.html", "https://christiangoblin.com/about/"],
  ["community/index.html", "https://christiangoblin.com/community/"],
  ["cyber/index.html", "https://christiangoblin.com/cyber/"],
  ["learn/index.html", "https://christiangoblin.com/learn/"],
  ["links/index.html", "https://christiangoblin.com/links/"],
  ["mental/index.html", "https://christiangoblin.com/mental/"],
  ["privacy.html", "https://christiangoblin.com/privacy.html"],
  ["projects/index.html", "https://christiangoblin.com/projects/"],
  ["store/index.html", "https://christiangoblin.com/store/"],
  ["store/policies.html", "https://christiangoblin.com/store/policies.html"],
  ["terms.html", "https://christiangoblin.com/terms.html"],
  ["tools/index.html", "https://christiangoblin.com/tools/"],
  ["ats-index.html", "https://christiangoblin.com/tools/ats/"],
  ["resume-index.html", "https://christiangoblin.com/tools/resume/"],
  ["tools/cover-src/index.html", "https://christiangoblin.com/tools/cover/"],
  ["tools/converter-src/index.html", "https://christiangoblin.com/tools/converter/"],
  ["tools/asset-forge-src/index.html", "https://christiangoblin.com/tools/asset-forge/"],
  ["editor/index.html", "https://christiangoblin.com/editor/"],
];

for (const [relativePath, canonical] of canonicalPages) {
  const html = await text(relativePath);
  assert.match(html, /<title>[^<]+<\/title>/i, `${relativePath} needs a title`);
  assert.match(html, /<meta\s+name=["']description["'][^>]+>/i, `${relativePath} needs a description`);
  assert.ok(
    html.includes(`<link rel="canonical" href="${canonical}">`),
    `${relativePath} needs its canonical URL`,
  );
  for (const property of ["og:title", "og:description", "og:url", "og:image"]) {
    assert.ok(html.includes(`property="${property}"`), `${relativePath} needs ${property}`);
  }
}

for (const relativePath of ["jobs/index.html", "jobs/privacy.html"]) {
  const html = await text(relativePath);
  assert.match(
    html,
    /<meta\s+name=["']robots["']\s+content=["']noindex,nofollow["']/i,
    `${relativePath} must remain private from indexing`,
  );
}


for (const relativePath of [
  "index.html",
  "about/index.html",
  "community/index.html",
  "cyber/index.html",
  "learn/index.html",
  "links/index.html",
  "mental/index.html",
  "projects/index.html",
  "tools/index.html",
]) {
  const html = await text(relativePath);
  assert.ok(html.includes('href="#main-content"'), `${relativePath} needs a skip link`);
  assert.ok(html.includes('id="main-content"'), `${relativePath} needs a main-content target`);
}

const tools = await text("tools/index.html");
assert.ok(tools.includes('href="/tools/asset-forge/"'), "Tools page must link Asset Forge");

const cyber = await text("cyber/index.html");
assert.ok(cyber.includes('<form class="contact-wrap" id="consultationForm">'));
assert.ok(cyber.includes('<label class="form-label" for="name">Name</label>'));
assert.ok(cyber.includes('<label class="form-label" for="email">Email</label>'));
assert.ok(cyber.includes('<label class="form-label" for="message">Describe your request</label>'));
assert.ok(cyber.includes('type="submit"'));
assert.ok(cyber.includes('form.addEventListener(\'submit\''));
assert.ok(cyber.includes('aria-live="polite"'));
assert.ok(cyber.includes('href="#main-content"'));

const store = await text("store/index.html");
assert.ok(store.includes('<label class="visually-hidden" for="searchInput">Search store</label>'));
assert.ok(store.includes('id="resultCount" role="status" aria-live="polite"'));
assert.ok(store.includes('href="#main-content"'));
assert.ok(store.includes('id="main-content"'));

for (const relativePath of [
  "ats-index.html",
  "resume-index.html",
  "tools/cover-src/index.html",
  "tools/converter-src/index.html",
  "tools/asset-forge-src/index.html",
  "editor/index.html",
]) {
  const html = await text(relativePath);
  assert.match(html, /<noscript>[\s\S]*<h1>/i, `${relativePath} needs a no-JavaScript heading`);
}

const sitemap = await text("sitemap.xml");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.ok(urls.length >= 15, "sitemap should include the public non-Bible site");
assert.equal(new Set(urls).size, urls.length, "sitemap URLs must be unique");
assert.equal(urls.some((url) => url.includes("/bible/")), false, "Bible must remain outside this patch");
assert.equal(urls.some((url) => url.includes("/jobs/")), false, "private jobs pages must not be in sitemap");

const robots = await text("robots.txt");
assert.ok(robots.includes("Disallow: /jobs/"));
assert.ok(robots.includes("Sitemap: https://christiangoblin.com/sitemap.xml"));

console.log("Accessibility and SEO tests passed.");
