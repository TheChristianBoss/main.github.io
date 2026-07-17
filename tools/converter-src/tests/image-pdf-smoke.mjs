import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildPdfFromJpegs } from '../src/modules/imageTools.js';

const jpegBytes = Uint8Array.from(Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAADAAIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD6pooooA//2Q==',
  'base64',
));

const blob = buildPdfFromJpegs([
  { name: 'report (draft) \\ copy.jpg', width: 2, height: 3, jpegBytes },
  { name: 'second.jpg', width: 2, height: 3, jpegBytes },
]);

assert.equal(blob.type, 'application/pdf');
const bytes = new Uint8Array(await blob.arrayBuffer());
const text = new TextDecoder('latin1').decode(bytes);
assert.ok(text.startsWith('%PDF-1.4\n'));
assert.match(text, /\/Count 2\b/);
assert.ok(text.includes('/Title (report \\(draft\\) \\\\ copy.jpg)'));
assert.match(text, /\/Info \d+ 0 R/);

const startXrefMatch = text.match(/startxref\n(\d+)\n%%EOF$/);
assert.ok(startXrefMatch, 'PDF must end with a startxref pointer.');
const xrefOffset = Number(startXrefMatch[1]);
assert.equal(text.slice(xrefOffset, xrefOffset + 4), 'xref');

const unicodeBlob = buildPdfFromJpegs([
  { name: 'résumé-日本語.jpg', width: 2, height: 3, jpegBytes },
]);
const unicodeText = new TextDecoder('latin1').decode(new Uint8Array(await unicodeBlob.arrayBuffer()));
assert.match(unicodeText, /\/Title <FEFF[0-9A-F]+>/);

const outputPath = join(tmpdir(), 'converter-image-pdf-smoke.pdf');
await writeFile(outputPath, bytes);
console.log(`Image PDF smoke test passed: ${outputPath}`);
