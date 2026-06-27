const TEXT_MODES = [
  { id: 'json-pretty', label: 'JSON → Pretty JSON', ext: 'json', mime: 'application/json' },
  { id: 'json-minify', label: 'JSON → Minified JSON', ext: 'json', mime: 'application/json' },
  { id: 'csv-json', label: 'CSV → JSON', ext: 'json', mime: 'application/json' },
  { id: 'json-csv', label: 'JSON → CSV', ext: 'csv', mime: 'text/csv' },
  { id: 'csv-tsv', label: 'CSV → TSV', ext: 'tsv', mime: 'text/tab-separated-values' },
  { id: 'tsv-csv', label: 'TSV → CSV', ext: 'csv', mime: 'text/csv' },
  { id: 'json-yaml', label: 'JSON → YAML-style text', ext: 'yaml', mime: 'text/yaml' },
  { id: 'yaml-json', label: 'Simple YAML-style text → JSON', ext: 'json', mime: 'application/json' },
  { id: 'markdown-html', label: 'Markdown → HTML', ext: 'html', mime: 'text/html' },
  { id: 'html-text', label: 'HTML → Plain text', ext: 'txt', mime: 'text/plain' },
  { id: 'plain-txt', label: 'Any text → .txt', ext: 'txt', mime: 'text/plain' },
];

function parseDelimitedLine(line, delimiter = ',') {
  const out = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      out.push(cell);
      cell = '';
    } else {
      cell += char;
    }
  }
  out.push(cell);
  return out.map((value) => value.trim());
}

function delimitedToJson(text, delimiter = ',') {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((line) => line.trim());
  if (!lines.length) return '[]';
  const headers = parseDelimitedLine(lines[0], delimiter).map((h, i) => h || `column_${i + 1}`);
  const rows = lines.slice(1).map((line) => {
    const values = parseDelimitedLine(line, delimiter);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? '';
      return row;
    }, {});
  });
  return JSON.stringify(rows, null, 2);
}

function escapeDelimitedCell(value, delimiter = ',') {
  const text = value === null || value === undefined ? '' : String(value);
  const re = delimiter === '\t' ? /["\n\r\t]/ : /[",\n\r]/;
  return re.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function jsonToDelimited(text, delimiter = ',') {
  const data = JSON.parse(text);
  const rows = Array.isArray(data) ? data : [data];
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row || {})))];
  if (!headers.length) return '';
  const output = [headers.map((header) => escapeDelimitedCell(header, delimiter)).join(delimiter)];
  rows.forEach((row) => output.push(headers.map((header) => escapeDelimitedCell(row?.[header], delimiter)).join(delimiter)));
  return output.join('\n');
}

function csvToTsv(text) {
  const rows = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean).map((line) => parseDelimitedLine(line, ','));
  return rows.map((row) => row.map((cell) => escapeDelimitedCell(cell, '\t')).join('\t')).join('\n');
}

function tsvToCsv(text) {
  const rows = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean).map((line) => parseDelimitedLine(line, '\t'));
  return rows.map((row) => row.map((cell) => escapeDelimitedCell(cell, ',')).join(',')).join('\n');
}

function jsonToYaml(value, indent = 0) {
  const pad = '  '.repeat(indent);
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (item && typeof item === 'object') {
        return `${pad}-\n${jsonToYaml(item, indent + 1)}`;
      }
      return `${pad}- ${String(item ?? '')}`;
    }).join('\n');
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).map(([key, val]) => {
      if (val && typeof val === 'object') return `${pad}${key}:\n${jsonToYaml(val, indent + 1)}`;
      return `${pad}${key}: ${String(val ?? '')}`;
    }).join('\n');
  }
  return `${pad}${String(value ?? '')}`;
}

function simpleYamlToJson(text) {
  const result = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes(':')) continue;
    const index = line.indexOf(':');
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (!key) continue;
    if (/^(true|false)$/i.test(value)) result[key] = value.toLowerCase() === 'true';
    else if (/^-?\d+(\.\d+)?$/.test(value)) result[key] = Number(value);
    else result[key] = value.replace(/^['"]|['"]$/g, '');
  }
  return JSON.stringify(result, null, 2);
}

function markdownToHtml(markdown) {
  const escape = (value) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const inline = (value) => escape(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
  return markdown.replace(/\r\n/g, '\n').split('\n').map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('### ')) return `<h3>${inline(trimmed.slice(4))}</h3>`;
    if (trimmed.startsWith('## ')) return `<h2>${inline(trimmed.slice(3))}</h2>`;
    if (trimmed.startsWith('# ')) return `<h1>${inline(trimmed.slice(2))}</h1>`;
    if (trimmed.startsWith('- ')) return `<li>${inline(trimmed.slice(2))}</li>`;
    return `<p>${inline(trimmed)}</p>`;
  }).join('\n');
}

function htmlToText(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent.replace(/\n{3,}/g, '\n\n').trim();
}

function convertText(text, mode) {
  switch (mode) {
    case 'json-pretty': return { text: JSON.stringify(JSON.parse(text), null, 2), ext: 'json', mime: 'application/json' };
    case 'json-minify': return { text: JSON.stringify(JSON.parse(text)), ext: 'json', mime: 'application/json' };
    case 'csv-json': return { text: delimitedToJson(text, ','), ext: 'json', mime: 'application/json' };
    case 'json-csv': return { text: jsonToDelimited(text, ','), ext: 'csv', mime: 'text/csv' };
    case 'csv-tsv': return { text: csvToTsv(text), ext: 'tsv', mime: 'text/tab-separated-values' };
    case 'tsv-csv': return { text: tsvToCsv(text), ext: 'csv', mime: 'text/csv' };
    case 'json-yaml': return { text: jsonToYaml(JSON.parse(text)), ext: 'yaml', mime: 'text/yaml' };
    case 'yaml-json': return { text: simpleYamlToJson(text), ext: 'json', mime: 'application/json' };
    case 'markdown-html': return { text: markdownToHtml(text), ext: 'html', mime: 'text/html' };
    case 'html-text': return { text: htmlToText(text), ext: 'txt', mime: 'text/plain' };
    default: return { text, ext: 'txt', mime: 'text/plain' };
  }
}

export function render({ root, files, setStatus, helpers }) {
  root.innerHTML = `
    <div class="module-panel">
      <div class="grid-controls two">
        <div class="control">
          <label for="textMode">Conversion</label>
          <select id="textMode">
            ${TEXT_MODES.map((mode) => `<option value="${mode.id}">${mode.label}</option>`).join('')}
          </select>
        </div>
        <div class="control">
          <label>Supported now</label>
          <div class="badge-list">
            <span class="badge">JSON</span>
            <span class="badge">CSV</span>
            <span class="badge">TSV</span>
            <span class="badge">Markdown</span>
            <span class="badge">HTML</span>
            <span class="badge">simple YAML</span>
          </div>
        </div>
        <div class="control full">
          <label for="textInput">Text input</label>
          <textarea id="textInput" placeholder="Drop a text-like file above or paste text here."></textarea>
        </div>
      </div>
      <div class="button-row">
        <button class="action-button" id="convertText" type="button">Convert & download</button>
        <button class="secondary-button" id="loadFileText" type="button" ${files[0] ? '' : 'disabled'}>Load selected file text</button>
      </div>
      <pre class="result-box" id="textResult">Converted preview will appear here.</pre>
    </div>
  `;

  const textInput = root.querySelector('#textInput');
  const textMode = root.querySelector('#textMode');
  const result = root.querySelector('#textResult');

  async function loadFileText() {
    if (!files[0]) return;
    const text = await helpers.readFileAsText(files[0]);
    textInput.value = text;
    result.textContent = text.slice(0, 5000);
    setStatus(`Loaded ${files[0].name} as text.`, 'success');
  }

  root.querySelector('#loadFileText').addEventListener('click', async () => {
    try { await loadFileText(); } catch (err) { setStatus(helpers.friendlyErrorMessage ? helpers.friendlyErrorMessage(err, 'text loading') : (err.message || 'Could not load file.'), 'error'); }
  });

  if (files[0]) loadFileText().catch(() => {});

  root.querySelector('#convertText').addEventListener('click', () => {
    try {
      const input = textInput.value;
      if (!input.trim()) throw new Error('Paste text or choose a text-like file first.');
      const converted = convertText(input, textMode.value);
      const blob = new Blob([converted.text], { type: `${converted.mime};charset=utf-8` });
      helpers.downloadBlob(blob, `${helpers.safeFileBase(files[0]?.name || 'converted')}.${converted.ext}`);
      result.textContent = converted.text.slice(0, 10000);
      setStatus(`Done. Downloaded .${converted.ext} file (${helpers.formatBytes(blob.size)}).`, 'success');
    } catch (err) {
      const friendly = helpers.friendlyErrorMessage ? helpers.friendlyErrorMessage(err, 'text/data conversion') : (err.message || 'Text conversion failed.');
      result.textContent = friendly;
      setStatus(friendly, 'error');
    }
  });
}
