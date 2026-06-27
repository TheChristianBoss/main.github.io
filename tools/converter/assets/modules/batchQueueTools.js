const IMAGE_FORMATS = {
  png: { mime: 'image/png', ext: 'png', quality: false },
  jpg: { mime: 'image/jpeg', ext: 'jpg', quality: true },
  webp: { mime: 'image/webp', ext: 'webp', quality: true },
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
  return out.map((value) => value.trim());
}

function csvToJson(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((line) => line.trim());
  if (!lines.length) return '[]';
  const headers = parseDelimitedLine(lines[0], ',').map((h, i) => h || `column_${i + 1}`);
  const rows = lines.slice(1).map((line) => {
    const values = parseDelimitedLine(line, ',');
    return headers.reduce((row, header, index) => { row[header] = values[index] ?? ''; return row; }, {});
  });
  return JSON.stringify(rows, null, 2);
}

function markdownToHtml(markdown) {
  const escape = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (value) => escape(value).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/`(.+?)`/g, '<code>$1</code>');
  return markdown.replace(/\r\n/g, '\n').split('\n').map((line) => {
    const t = line.trim();
    if (!t) return '';
    if (t.startsWith('# ')) return `<h1>${inline(t.slice(2))}</h1>`;
    if (t.startsWith('## ')) return `<h2>${inline(t.slice(3))}</h2>`;
    if (t.startsWith('### ')) return `<h3>${inline(t.slice(4))}</h3>`;
    if (t.startsWith('- ')) return `<li>${inline(t.slice(2))}</li>`;
    return `<p>${inline(t)}</p>`;
  }).join('\n');
}

async function imageToCanvas(file, helpers, maxWidth, quality, background = '') {
  const img = await helpers.loadImageFromFile(file);
  const limit = Number.parseInt(maxWidth, 10);
  const scale = Number.isFinite(limit) && limit > 0 && img.width > limit ? limit / img.width : 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d', { alpha: !background });
  if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function convertFile(file, mode, helpers, opts) {
  if (mode.startsWith('image-')) {
    if (!/^image\//.test(file.type || '') && !/\.(png|jpe?g|webp|svg)$/i.test(file.name)) throw new Error('Skipped: not an image');
    const target = mode.replace('image-', '');
    const format = IMAGE_FORMATS[target] || IMAGE_FORMATS.webp;
    const canvas = await imageToCanvas(file, helpers, opts.maxWidth, opts.quality, format.mime === 'image/jpeg' ? '#ffffff' : '');
    const blob = await helpers.canvasToBlob(canvas, format.mime, format.quality ? opts.quality : undefined);
    return new File([blob], `${helpers.safeFileBase(file.name)}.${format.ext}`, { type: format.mime });
  }

  const text = await helpers.readFileAsText(file);
  let output = text;
  let ext = 'txt';
  let mime = 'text/plain';
  if (mode === 'json-pretty') { output = JSON.stringify(JSON.parse(text), null, 2); ext = 'json'; mime = 'application/json'; }
  if (mode === 'json-minify') { output = JSON.stringify(JSON.parse(text)); ext = 'json'; mime = 'application/json'; }
  if (mode === 'csv-json') { output = csvToJson(text); ext = 'json'; mime = 'application/json'; }
  if (mode === 'md-html') { output = markdownToHtml(text); ext = 'html'; mime = 'text/html'; }
  return new File([output], `${helpers.safeFileBase(file.name)}.${ext}`, { type: `${mime};charset=utf-8` });
}

export function render({ root, files, setStatus, helpers }) {
  let outputs = [];
  root.innerHTML = `
    <div class="module-panel">
      <div class="notice-box">
        <strong>Batch queue</strong>
        <p>Drop several files, choose a preset, convert them one by one, then download everything as one ZIP.</p>
      </div>
      <div class="grid-controls two">
        <label class="control">
          Batch preset
          <select id="batchMode">
            <optgroup label="Images">
              <option value="image-webp">Images → WEBP</option>
              <option value="image-jpg">Images → JPEG</option>
              <option value="image-png">Images → PNG</option>
            </optgroup>
            <optgroup label="Text/Data">
              <option value="json-pretty">JSON files → pretty JSON</option>
              <option value="json-minify">JSON files → minified JSON</option>
              <option value="csv-json">CSV files → JSON</option>
              <option value="md-html">Markdown files → HTML</option>
            </optgroup>
          </select>
        </label>
        <label class="control">
          Image max width, optional
          <input id="batchMaxWidth" type="number" min="1" placeholder="1280">
        </label>
        <label class="control">
          Image quality
          <input id="batchQuality" type="range" min="40" max="100" value="86">
        </label>
        <div class="control">
          <label>Output</label>
          <div class="badge-list"><span class="badge">Queue status</span><span class="badge">Download all as ZIP</span><span class="badge">Skips incompatible files</span></div>
        </div>
      </div>
      <div class="button-row">
        <button class="action-button" id="runBatch" type="button" ${files.length ? '' : 'disabled'}>Run batch queue</button>
        <button class="secondary-button" id="downloadBatch" type="button" disabled>Download all as ZIP</button>
        <button class="secondary-button" id="clearBatch" type="button">Clear results</button>
      </div>
      <div class="queue-list" id="queueList">${files.length ? files.map((file, index) => `<div class="queue-item"><span>${escapeHtml(file.name)}</span><small>Waiting • #${index + 1} • ${helpers.formatBytes(file.size)}</small></div>`).join('') : '<div class="queue-item"><span>No files selected.</span><small>Choose files above.</small></div>'}</div>
      <pre class="result-box" id="batchLog">Batch log will appear here.</pre>
    </div>
  `;

  const mode = root.querySelector('#batchMode');
  const maxWidth = root.querySelector('#batchMaxWidth');
  const quality = root.querySelector('#batchQuality');
  const run = root.querySelector('#runBatch');
  const download = root.querySelector('#downloadBatch');
  const clear = root.querySelector('#clearBatch');
  const queueList = root.querySelector('#queueList');
  const log = root.querySelector('#batchLog');

  function renderQueue(statuses = new Map()) {
    queueList.innerHTML = files.length ? files.map((file, index) => {
      const s = statuses.get(index) || 'Waiting';
      return `<div class="queue-item"><span>${escapeHtml(file.name)}</span><small>${escapeHtml(s)} • #${index + 1} • ${helpers.formatBytes(file.size)}</small></div>`;
    }).join('') : '<div class="queue-item"><span>No files selected.</span><small>Choose files above.</small></div>';
  }

  run.addEventListener('click', async () => {
    outputs = [];
    const statuses = new Map();
    try {
      if (!files.length) throw new Error('Choose files first.');
      run.disabled = true;
      download.disabled = true;
      log.textContent = '';
      const opts = { maxWidth: maxWidth.value, quality: Number(quality.value) / 100 };
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        statuses.set(index, 'Converting');
        renderQueue(statuses);
        try {
          const output = await convertFile(file, mode.value, helpers, opts);
          outputs.push(output);
          statuses.set(index, `Done → ${output.name}`);
          log.textContent += `✓ ${file.name} → ${output.name} (${helpers.formatBytes(output.size)})\n`;
        } catch (err) {
          const friendly = helpers.friendlyErrorMessage ? helpers.friendlyErrorMessage(err, 'batch conversion') : (err.message || 'Failed');
          statuses.set(index, friendly);
          log.textContent += `✗ ${file.name}: ${friendly}\n`;
        }
      }
      renderQueue(statuses);
      if (!outputs.length) throw new Error('No files converted. Check that the files match the selected preset.');
      download.disabled = false;
      setStatus(`Batch complete. ${outputs.length} file${outputs.length === 1 ? '' : 's'} ready.`, 'success');
    } catch (err) {
      setStatus(helpers.friendlyErrorMessage ? helpers.friendlyErrorMessage(err, 'batch conversion') : (err.message || 'Batch conversion failed.'), 'error');
    } finally {
      run.disabled = false;
    }
  });

  download.addEventListener('click', async () => {
    if (!outputs.length) return;
    const zip = await helpers.createZipBlob(outputs, 'converted-batch');
    helpers.downloadBlob(zip, 'converted-batch.zip');
    setStatus(`Downloaded batch ZIP (${helpers.formatBytes(zip.size)}).`, 'success');
  });

  clear.addEventListener('click', () => {
    outputs = [];
    renderQueue();
    log.textContent = 'Batch log cleared.';
    download.disabled = true;
  });
}
