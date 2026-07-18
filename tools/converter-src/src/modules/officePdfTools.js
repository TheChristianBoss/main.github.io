const PDFLIB_URL = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js';
let pdfLibPromise = null;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function readU16(bytes, offset) { return bytes[offset] | (bytes[offset + 1] << 8); }
function readU32le(bytes, offset) { return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0; }

function findEocd(bytes) {
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 66000); i -= 1) {
    if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) return i;
  }
  return -1;
}

function parseZipEntries(bytes) {
  const decoder = new TextDecoder();
  const eocd = findEocd(bytes);
  if (eocd < 0) throw new Error('Could not find ZIP directory inside the file. It may be encrypted or unsupported.');
  const count = readU16(bytes, eocd + 10);
  let offset = readU32le(bytes, eocd + 16);
  const entries = new Map();
  for (let i = 0; i < count; i += 1) {
    if (readU32le(bytes, offset) !== 0x02014b50) throw new Error('Invalid ZIP directory entry.');
    const method = readU16(bytes, offset + 10);
    const compressedSize = readU32le(bytes, offset + 20);
    const uncompressedSize = readU32le(bytes, offset + 24);
    const nameLength = readU16(bytes, offset + 28);
    const extraLength = readU16(bytes, offset + 30);
    const commentLength = readU16(bytes, offset + 32);
    const localOffset = readU32le(bytes, offset + 42);
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    entries.set(name, { name, method, compressedSize, uncompressedSize, localOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

async function extractZipEntry(bytes, entry) {
  if (!entry) return null;
  const offset = entry.localOffset;
  if (readU32le(bytes, offset) !== 0x04034b50) throw new Error(`Invalid ZIP local header for ${entry.name}.`);
  const nameLength = readU16(bytes, offset + 26);
  const extraLength = readU16(bytes, offset + 28);
  const dataStart = offset + 30 + nameLength + extraLength;
  const compressed = bytes.subarray(dataStart, dataStart + entry.compressedSize);
  if (entry.method === 0) return compressed;
  if (entry.method === 8 && 'DecompressionStream' in globalThis) {
    const blob = await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).blob();
    return new Uint8Array(await blob.arrayBuffer());
  }
  throw new Error(`${entry.name} is compressed in a way this browser cannot read. Try Chrome/Edge or a smaller file.`);
}

async function getZipText(file, path) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const entries = parseZipEntries(bytes);
  const entry = entries.get(path);
  if (!entry) throw new Error(`Could not find ${path} inside ${file.name}.`);
  const raw = await extractZipEntry(bytes, entry);
  return new TextDecoder().decode(raw);
}

async function loadPdfLib(setStatus) {
  if (!pdfLibPromise) {
    setStatus?.('Loading PDF engine only for this module…', 'info');
    pdfLibPromise = import(PDFLIB_URL).catch((err) => {
      pdfLibPromise = null;
      throw new Error(`Could not load the PDF helper library. Check your connection and refresh. ${err?.message || ''}`.trim());
    });
  }
  return pdfLibPromise;
}

function wrapLines(text, maxChars = 86) {
  const lines = [];
  for (const raw of String(text || '').replace(/\r\n/g, '\n').split('\n')) {
    let line = raw.trimEnd();
    if (!line) { lines.push(''); continue; }
    while (line.length > maxChars) {
      let cut = line.lastIndexOf(' ', maxChars);
      if (cut < 30) cut = maxChars;
      lines.push(line.slice(0, cut));
      line = line.slice(cut).trimStart();
    }
    lines.push(line);
  }
  return lines;
}

async function textToPdfBlob({ title, text, filename }, helpers, setStatus) {
  const { PDFDocument, StandardFonts, rgb } = await loadPdfLib(setStatus);
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const margin = 54;
  const pageW = 612;
  const pageH = 792;
  const fontSize = 11;
  const lineHeight = 15;
  let page = pdf.addPage([pageW, pageH]);
  let y = pageH - margin;
  page.drawText(title || filename || 'Converted Document', { x: margin, y, size: 16, font: bold, color: rgb(0.92, 0.72, 0.24) });
  y -= 28;
  const lines = wrapLines(text, 88);
  for (const line of lines) {
    if (y < margin) { page = pdf.addPage([pageW, pageH]); y = pageH - margin; }
    page.drawText(line || ' ', { x: margin, y, size: fontSize, font, color: rgb(0.08, 0.08, 0.08) });
    y -= lineHeight;
  }
  pdf.setTitle(title || filename || 'Converted Document');
  pdf.setProducer('Christian Goblin File Converter');
  return new Blob([await pdf.save()], { type: 'application/pdf' });
}

async function mergePdfs(files, helpers, setStatus) {
  const { PDFDocument } = await loadPdfLib(setStatus);
  const pdfFiles = files.filter((file) => /\.pdf$/i.test(file.name) || file.type === 'application/pdf');
  if (pdfFiles.length < 2) throw new Error('Choose at least two PDF files to merge.');
  const out = await PDFDocument.create();
  for (const file of pdfFiles) {
    const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
    const pages = await out.copyPages(source, source.getPageIndices());
    pages.forEach((page) => out.addPage(page));
  }
  out.setTitle('Merged PDF');
  out.setProducer('Christian Goblin File Converter');
  const blob = new Blob([await out.save()], { type: 'application/pdf' });
  helpers.downloadBlob(blob, 'merged.pdf');
  return `Merged ${pdfFiles.length} PDFs into merged.pdf (${helpers.formatBytes(blob.size)}).`;
}

function parsePageList(input, total) {
  const result = [];
  for (const rawPart of String(input || '').split(',')) {
    const part = rawPart.trim();
    if (!part) continue;
    const match = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (match) {
      let a = Number(match[1]);
      let b = Number(match[2]);
      if (a > b) [a, b] = [b, a];
      for (let n = a; n <= b; n += 1) if (n >= 1 && n <= total) result.push(n - 1);
    } else if (/^\d+$/.test(part)) {
      const n = Number(part);
      if (n >= 1 && n <= total) result.push(n - 1);
    }
  }
  return [...new Set(result)];
}

async function splitPdf(file, helpers, setStatus) {
  const { PDFDocument } = await loadPdfLib(setStatus);
  if (!file) throw new Error('Choose a PDF first.');
  const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const outFiles = [];
  for (const pageIndex of source.getPageIndices()) {
    const doc = await PDFDocument.create();
    const [page] = await doc.copyPages(source, [pageIndex]);
    doc.addPage(page);
    const bytes = await doc.save();
    outFiles.push(new File([bytes], `${helpers.safeFileBase(file.name)}-page-${pageIndex + 1}.pdf`, { type: 'application/pdf' }));
  }
  const zip = await helpers.createZipBlob(outFiles, 'split-pdf');
  helpers.downloadBlob(zip, `${helpers.safeFileBase(file.name)}-pages.zip`);
  return `Split ${file.name} into ${outFiles.length} page PDFs and downloaded a ZIP.`;
}

async function editPdfPages(file, mode, pageInput, helpers, setStatus) {
  const { PDFDocument } = await loadPdfLib(setStatus);
  if (!file) throw new Error('Choose a PDF first.');
  const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const total = source.getPageCount();
  const requested = parsePageList(pageInput, total);
  if (!requested.length) throw new Error('Enter pages like 1,3,5-7.');
  let indexes;
  if (mode === 'remove') indexes = source.getPageIndices().filter((i) => !requested.includes(i));
  else indexes = requested;
  if (!indexes.length) throw new Error('That would create an empty PDF.');
  const out = await PDFDocument.create();
  const copied = await out.copyPages(source, indexes);
  copied.forEach((page) => out.addPage(page));
  out.setProducer('Christian Goblin File Converter');
  const name = mode === 'remove' ? `${helpers.safeFileBase(file.name)}-removed-pages.pdf` : `${helpers.safeFileBase(file.name)}-selected-pages.pdf`;
  const blob = new Blob([await out.save()], { type: 'application/pdf' });
  helpers.downloadBlob(blob, name);
  return `${mode === 'remove' ? 'Removed' : 'Kept/reordered'} pages. Downloaded ${name}.`;
}

async function imagesToPdf(files, helpers, setStatus) {
  const { PDFDocument } = await loadPdfLib(setStatus);
  const imageFiles = files.filter((file) => /^image\//.test(file.type || '') || /\.(png|jpe?g|webp|svg)$/i.test(file.name));
  if (!imageFiles.length) throw new Error('Choose at least one image file.');
  const out = await PDFDocument.create();
  for (const file of imageFiles) {
    let imageBytes;
    let embedded;
    if (/jpe?g$/i.test(file.name) || file.type === 'image/jpeg') {
      imageBytes = await file.arrayBuffer();
      embedded = await out.embedJpg(imageBytes);
    } else if (/\.png$/i.test(file.name) || file.type === 'image/png') {
      imageBytes = await file.arrayBuffer();
      embedded = await out.embedPng(imageBytes);
    } else {
      const img = await helpers.loadImageFromFile(file);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngBlob = await helpers.canvasToBlob(canvas, 'image/png');
      embedded = await out.embedPng(await pngBlob.arrayBuffer());
    }
    const maxW = 612;
    const maxH = 792;
    const scale = Math.min(maxW / embedded.width, maxH / embedded.height, 1);
    const width = embedded.width * scale;
    const height = embedded.height * scale;
    const page = out.addPage([maxW, maxH]);
    page.drawImage(embedded, { x: (maxW - width) / 2, y: (maxH - height) / 2, width, height });
  }
  out.setProducer('Christian Goblin File Converter');
  const blob = new Blob([await out.save()], { type: 'application/pdf' });
  helpers.downloadBlob(blob, imageFiles.length === 1 ? `${helpers.safeFileBase(imageFiles[0].name)}.pdf` : 'images-to-pdf.pdf');
  return `Created a PDF with ${imageFiles.length} image page${imageFiles.length === 1 ? '' : 's'}.`;
}

function xmlText(node) { return node?.textContent || ''; }

async function docxToTextOrHtml(file, outputMode, helpers) {
  const xml = await getZipText(file, 'word/document.xml');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const paragraphs = [...doc.getElementsByTagName('w:p')].map((p) => [...p.getElementsByTagName('w:t')].map((t) => t.textContent || '').join('')).filter(Boolean);
  const text = paragraphs.join('\n\n');
  if (!text.trim()) throw new Error('Could not extract readable text from that DOCX.');
  if (outputMode === 'docx-html') {
    const html = `<!doctype html>\n<html><head><meta charset="utf-8"><title>${escapeHtml(file.name)}</title></head><body>\n${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n')}\n</body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    helpers.downloadBlob(blob, `${helpers.safeFileBase(file.name)}.html`);
    return `Extracted ${paragraphs.length} paragraph${paragraphs.length === 1 ? '' : 's'} to HTML.`;
  }
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  helpers.downloadBlob(blob, `${helpers.safeFileBase(file.name)}.txt`);
  return `Extracted ${paragraphs.length} paragraph${paragraphs.length === 1 ? '' : 's'} to plain text.`;
}

function colNameToIndex(name) {
  let index = 0;
  for (const ch of String(name || '').toUpperCase()) index = index * 26 + (ch.charCodeAt(0) - 64);
  return Math.max(0, index - 1);
}

function parseDelimitedLine(line, delimiter = ',') {
  const out = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) { out.push(cell); cell = ''; }
    else cell += char;
  }
  out.push(cell);
  return out;
}

function escapeCsv(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function tableToCsv(table) { return table.map((row) => row.map(escapeCsv).join(',')).join('\n'); }
function tableToJson(table) {
  const headers = table[0]?.map((h, i) => String(h || `column_${i + 1}`)) || [];
  return JSON.stringify(table.slice(1).filter((row) => row.some((cell) => String(cell || '').trim())).map((row) => headers.reduce((obj, h, i) => { obj[h] = row[i] ?? ''; return obj; }, {})), null, 2);
}

async function xlsxToTable(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const entries = parseZipEntries(bytes);
  const sheetEntry = [...entries.keys()].find((name) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name));
  if (!sheetEntry) throw new Error('Could not find a worksheet inside the XLSX.');
  const shared = [];
  if (entries.has('xl/sharedStrings.xml')) {
    const sharedXml = new TextDecoder().decode(await extractZipEntry(bytes, entries.get('xl/sharedStrings.xml')));
    const doc = new DOMParser().parseFromString(sharedXml, 'application/xml');
    [...doc.getElementsByTagName('si')].forEach((si) => shared.push([...si.getElementsByTagName('t')].map((t) => t.textContent || '').join('')));
  }
  const sheetXml = new TextDecoder().decode(await extractZipEntry(bytes, entries.get(sheetEntry)));
  const doc = new DOMParser().parseFromString(sheetXml, 'application/xml');
  const table = [];
  [...doc.getElementsByTagName('row')].forEach((rowEl) => {
    const rowIndex = Math.max(0, Number(rowEl.getAttribute('r') || table.length + 1) - 1);
    table[rowIndex] ||= [];
    [...rowEl.getElementsByTagName('c')].forEach((cell) => {
      const ref = cell.getAttribute('r') || '';
      const col = colNameToIndex(ref.match(/[A-Z]+/i)?.[0] || 'A');
      const type = cell.getAttribute('t');
      let value;
      if (type === 'inlineStr') value = [...cell.getElementsByTagName('t')].map((t) => t.textContent || '').join('');
      else {
        value = xmlText(cell.getElementsByTagName('v')[0]);
        if (type === 's') value = shared[Number(value)] ?? value;
        if (type === 'b') value = value === '1' ? 'TRUE' : 'FALSE';
      }
      table[rowIndex][col] = value;
    });
  });
  return table.map((row) => {
    const copy = [...row];
    while (copy.length && !String(copy[copy.length - 1] ?? '').trim()) copy.pop();
    return copy;
  }).filter((row) => row.length);
}

function tableFromCsvText(text) {
  return String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((line) => line.length).map((line) => parseDelimitedLine(line, ','));
}

function tableFromJsonText(text) {
  const data = JSON.parse(text);
  const rows = Array.isArray(data) ? data : [data];
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row || {})))];
  return [headers, ...rows.map((row) => headers.map((h) => row?.[h] ?? ''))];
}

function columnName(index) {
  let name = '';
  let n = index + 1;
  while (n > 0) { const r = (n - 1) % 26; name = String.fromCharCode(65 + r) + name; n = Math.floor((n - 1) / 26); }
  return name;
}

function escapeXml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function tableToXlsx(table, helpers, filename = 'spreadsheet.xlsx') {
  const rowsXml = table.map((row, r) => `<row r="${r + 1}">${row.map((cell, c) => `<c r="${columnName(c)}${r + 1}" t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`).join('')}</row>`).join('');
  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowsXml}</sheetData></worksheet>`;
  const files = [
    new File(['<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'], '[Content_Types].xml'),
    new File(['<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'], '_rels/.rels'),
    new File(['<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>'], 'xl/workbook.xml'),
    new File(['<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'], 'xl/_rels/workbook.xml.rels'),
    new File([sheetXml], 'xl/worksheets/sheet1.xml'),
  ];
  const zip = await helpers.createZipBlob(files, 'xlsx');
  helpers.downloadBlob(zip, filename);
  return `Created ${filename} with ${Math.max(0, table.length - 1)} data row${table.length === 2 ? '' : 's'}.`;
}

async function spreadsheetConvert(file, mode, helpers) {
  if (!file) throw new Error('Choose a spreadsheet/data file first.');
  if (mode === 'xlsx-csv' || mode === 'xlsx-json') {
    const table = await xlsxToTable(file);
    if (mode === 'xlsx-csv') {
      const csv = tableToCsv(table);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      helpers.downloadBlob(blob, `${helpers.safeFileBase(file.name)}.csv`);
      return `Converted first worksheet to CSV with ${table.length} row${table.length === 1 ? '' : 's'}.`;
    }
    const json = tableToJson(table);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    helpers.downloadBlob(blob, `${helpers.safeFileBase(file.name)}.json`);
    return `Converted first worksheet to JSON.`;
  }
  const text = await helpers.readFileAsText(file);
  const table = mode === 'json-xlsx' ? tableFromJsonText(text) : tableFromCsvText(text);
  return tableToXlsx(table, helpers, `${helpers.safeFileBase(file.name)}.xlsx`);
}

async function showPdfInfo(file, setStatus) {
  const { PDFDocument } = await loadPdfLib(setStatus);
  const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  return `PDF metadata\n\nFile: ${file.name}\nPages: ${pdf.getPageCount()}\nTitle: ${pdf.getTitle?.() || '—'}\nAuthor: ${pdf.getAuthor?.() || '—'}\nSubject: ${pdf.getSubject?.() || '—'}\nCreator: ${pdf.getCreator?.() || '—'}\nProducer: ${pdf.getProducer?.() || '—'}\nCreation date: ${pdf.getCreationDate?.() || '—'}\nModification date: ${pdf.getModificationDate?.() || '—'}`;
}

export function render({ root, files, setStatus, helpers }) {
  root.innerHTML = `
    <div class="module-panel">
      <div class="notice-box">
        <strong>Document, spreadsheet, and PDF tools</strong>
        <p>These tools load document/PDF helpers only when this module is opened. Some encrypted PDFs, unusual DOCX files, or very large XLSX files may not work in browser-only mode.</p>
      </div>
      <div class="grid-controls two">
        <label class="control">
          Conversion/tool
          <select id="officeMode">
            <optgroup label="PDF">
              <option value="pdf-merge">Merge selected PDFs</option>
              <option value="pdf-split">Split first PDF into page files ZIP</option>
              <option value="pdf-keep">Keep/reorder PDF pages</option>
              <option value="pdf-remove">Remove PDF pages</option>
              <option value="pdf-info">Show PDF metadata</option>
              <option value="images-pdf">Images → PDF</option>
              <option value="text-pdf">TXT / MD / HTML → PDF</option>
            </optgroup>
            <optgroup label="DOCX">
              <option value="docx-text">DOCX → plain text</option>
              <option value="docx-html">DOCX → HTML</option>
            </optgroup>
            <optgroup label="Spreadsheets">
              <option value="xlsx-csv">XLSX → CSV</option>
              <option value="xlsx-json">XLSX → JSON</option>
              <option value="csv-xlsx">CSV → XLSX</option>
              <option value="json-xlsx">JSON → XLSX</option>
            </optgroup>
          </select>
        </label>
        <label class="control">
          PDF pages optional
          <input id="pageInput" type="text" placeholder="1,3,5-7">
        </label>
        <div class="control full">
          <label for="officeText">Text input for text-to-PDF, optional</label>
          <textarea id="officeText" placeholder="Paste text here or choose a TXT / MD / HTML file."></textarea>
        </div>
      </div>
      <div class="button-row">
        <button class="action-button" id="runOffice" type="button">Run converter</button>
        <button class="secondary-button" id="loadText" type="button" ${files[0] ? '' : 'disabled'}>Load selected file as text</button>
      </div>
      <pre class="result-box" id="officeResult">Results will appear here.</pre>
    </div>
  `;

  const mode = root.querySelector('#officeMode');
  const pageInput = root.querySelector('#pageInput');
  const textInput = root.querySelector('#officeText');
  const result = root.querySelector('#officeResult');

  root.querySelector('#loadText').addEventListener('click', async () => {
    try {
      if (!files[0]) throw new Error('Choose a text file first.');
      textInput.value = await helpers.readFileAsText(files[0]);
      result.textContent = textInput.value.slice(0, 8000);
      setStatus(`Loaded ${files[0].name} as text.`, 'success');
    } catch (err) { setStatus(err.message || 'Could not read file as text.', 'error'); }
  });

  root.querySelector('#runOffice').addEventListener('click', async () => {
    try {
      const selected = mode.value;
      const first = files[0] || null;
      setStatus('Running document conversion…', 'info');
      let message = '';
      if (selected === 'pdf-merge') message = await mergePdfs(files, helpers, setStatus);
      else if (selected === 'pdf-split') message = await splitPdf(first, helpers, setStatus);
      else if (selected === 'pdf-keep') message = await editPdfPages(first, 'keep', pageInput.value, helpers, setStatus);
      else if (selected === 'pdf-remove') message = await editPdfPages(first, 'remove', pageInput.value, helpers, setStatus);
      else if (selected === 'pdf-info') message = await showPdfInfo(first, setStatus);
      else if (selected === 'images-pdf') message = await imagesToPdf(files, helpers, setStatus);
      else if (selected === 'text-pdf') {
        const text = textInput.value.trim() || (first ? await helpers.readFileAsText(first) : '');
        if (!text.trim()) throw new Error('Paste text or choose a text file first.');
        const pdf = await textToPdfBlob({ title: first?.name || 'Converted Text', text, filename: first?.name || 'converted' }, helpers, setStatus);
        helpers.downloadBlob(pdf, `${helpers.safeFileBase(first?.name || 'converted-text')}.pdf`);
        message = `Created PDF from text (${helpers.formatBytes(pdf.size)}).`;
      } else if (selected === 'docx-text' || selected === 'docx-html') message = await docxToTextOrHtml(first, selected, helpers);
      else if (['xlsx-csv', 'xlsx-json', 'csv-xlsx', 'json-xlsx'].includes(selected)) message = await spreadsheetConvert(first, selected, helpers);
      result.textContent = message;
      setStatus(message.split('\n')[0], 'success');
    } catch (err) {
      const friendly = helpers.friendlyErrorMessage ? helpers.friendlyErrorMessage(err, 'document conversion') : (err.message || 'Document conversion failed.');
      result.textContent = friendly;
      setStatus(friendly, 'error');
    }
  });

  if (!files.length) setStatus('Choose DOCX, XLSX, PDF, CSV, JSON, text, or image files to begin.', 'info');
}
