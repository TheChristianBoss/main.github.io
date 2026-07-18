import assert from 'node:assert/strict';

function cleanOpenBeta(text) {
  let next = text;
  next = next.replace(
    /\s*<span\b[^>]*class=(['"])[^'"]*(?:open-beta-badge|beta-badge)[^'"]*\1[^>]*>\s*open beta\s*<\/span>/gi,
    '',
  );
  next = next.replace(/\s+open beta\b/gi, '');
  next = next.replace(/\s+tool-title-line\b/g, '');
  return next;
}

const cases = [
  ['<h1>ATS Resume Checker <span class="beta-badge">Open Beta</span></h1>', '<h1>ATS Resume Checker</h1>'],
  ['<h1>File Converter Open Beta</h1>', '<h1>File Converter</h1>'],
  ['<a>Resume Builder <span class="open-beta-badge">OPEN BETA</span></a>', '<a>Resume Builder</a>'],
  ['<h2 class="tool-title-line">Cover Letter Builder Open Beta</h2>', '<h2>Cover Letter Builder</h2>'],
];

for (const [input, expected] of cases) {
  assert.equal(cleanOpenBeta(input), expected);
}

console.log('Tool Open Beta removal tests passed.');
