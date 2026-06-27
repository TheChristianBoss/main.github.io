import { useEffect, useMemo, useRef, useState } from 'react';

const IMAGE_OUTPUTS = [
  { label: 'PNG', mime: 'image/png', ext: 'png', quality: false },
  { label: 'JPEG', mime: 'image/jpeg', ext: 'jpg', quality: true },
  { label: 'WEBP', mime: 'image/webp', ext: 'webp', quality: true },
];

const TEXT_OUTPUTS = [
  { value: 'json-pretty', label: 'JSON → Pretty JSON' },
  { value: 'json-minify', label: 'JSON → Minified JSON' },
  { value: 'csv-json', label: 'CSV → JSON' },
  { value: 'json-csv', label: 'JSON → CSV' },
  { value: 'markdown-html', label: 'Markdown → HTML' },
  { value: 'plain-txt', label: 'Any text → .txt' },
];

function formatBytes(bytes = 0) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function safeFileBase(name = 'converted') {
  return name.replace(/\.[^/.]+$/, '').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '') || 'converted';
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read that file as text.'));
    reader.readAsText(file);
  });
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load that image.'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('Your browser could not create that output format.'));
      else resolve(blob);
    }, mime, quality);
  });
}

function parseCsvLine(line) {
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
    } else if (char === ',' && !quoted) {
      out.push(cell);
      cell = '';
    } else {
      cell += char;
    }
  }
  out.push(cell);
  return out.map((value) => value.trim());
}

function csvToJson(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((line) => line.trim());
  if (!lines.length) return '[]';
  const headers = parseCsvLine(lines[0]).map((h, i) => h || `column_${i + 1}`);
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? '';
      return row;
    }, {});
  });
  return JSON.stringify(rows, null, 2);
}

function escapeCsvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function jsonToCsv(text) {
  const data = JSON.parse(text);
  const rows = Array.isArray(data) ? data : [data];
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row || {})))];
  if (!headers.length) return '';
  const csvRows = [headers.map(escapeCsvCell).join(',')];
  rows.forEach((row) => {
    csvRows.push(headers.map((header) => escapeCsvCell(row?.[header])).join(','));
  });
  return csvRows.join('\n');
}

function markdownToHtml(markdown) {
  const escapeHtml = (value) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return markdown
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => {
      const safe = escapeHtml(line.trim());
      if (!safe) return '';
      if (safe.startsWith('### ')) return `<h3>${safe.slice(4)}</h3>`;
      if (safe.startsWith('## ')) return `<h2>${safe.slice(3)}</h2>`;
      if (safe.startsWith('# ')) return `<h1>${safe.slice(2)}</h1>`;
      if (safe.startsWith('- ')) return `<p>• ${safe.slice(2)}</p>`;
      return `<p>${safe}</p>`;
    })
    .join('\n');
}

function convertText(text, mode) {
  switch (mode) {
    case 'json-pretty':
      return { text: JSON.stringify(JSON.parse(text), null, 2), ext: 'json', mime: 'application/json' };
    case 'json-minify':
      return { text: JSON.stringify(JSON.parse(text)), ext: 'json', mime: 'application/json' };
    case 'csv-json':
      return { text: csvToJson(text), ext: 'json', mime: 'application/json' };
    case 'json-csv':
      return { text: jsonToCsv(text), ext: 'csv', mime: 'text/csv' };
    case 'markdown-html':
      return { text: markdownToHtml(text), ext: 'html', mime: 'text/html' };
    default:
      return { text, ext: 'txt', mime: 'text/plain' };
  }
}

function FileDropZone({ file, onFile }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) onFile(dropped);
  }

  return (
    <div
      className={`drop-zone${dragging ? ' is-dragging' : ''}`}
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click(); }}
    >
      <input ref={inputRef} type="file" hidden onChange={(event) => onFile(event.target.files?.[0] || null)} />
      <div className="drop-icon">⇪</div>
      <h2>{file ? file.name : 'Drop a file here'}</h2>
      <p>{file ? `${file.type || 'Unknown type'} • ${formatBytes(file.size)}` : 'Or click to choose a file from your computer.'}</p>
    </div>
  );
}

function ConverterApp() {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('image');
  const [imageOutput, setImageOutput] = useState(IMAGE_OUTPUTS[0]);
  const [quality, setQuality] = useState(0.92);
  const [maxWidth, setMaxWidth] = useState('');
  const [textMode, setTextMode] = useState(TEXT_OUTPUTS[0].value);
  const [status, setStatus] = useState('Choose a file to begin.');
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [textPreview, setTextPreview] = useState('');

  const isImage = useMemo(() => file?.type?.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file?.name || ''), [file]);
  const isText = useMemo(() => file && !isImage, [file, isImage]);

  useEffect(() => {
    setError('');
    setTextPreview('');
    if (!file) {
      setPreviewUrl('');
      setStatus('Choose a file to begin.');
      return undefined;
    }
    setMode(isImage ? 'image' : 'text');
    setStatus(isImage ? 'Image ready to convert.' : 'Text-like file ready to convert.');

    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl('');
    readFileAsText(file)
      .then((text) => setTextPreview(text.slice(0, 1500)))
      .catch((err) => setError(err.message));
    return undefined;
  }, [file, isImage]);

  async function handleConvert() {
    if (!file) return;
    setError('');
    setStatus('Converting...');
    try {
      if (mode === 'image') {
        if (!isImage) throw new Error('This does not look like an image file.');
        const img = await loadImageFromFile(file);
        const widthLimit = Number.parseInt(maxWidth, 10);
        const scale = Number.isFinite(widthLimit) && widthLimit > 0 && img.width > widthLimit ? widthLimit / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const blob = await canvasToBlob(canvas, imageOutput.mime, imageOutput.quality ? quality : undefined);
        downloadBlob(blob, `${safeFileBase(file.name)}.${imageOutput.ext}`);
        setStatus(`Done. Downloaded ${imageOutput.label} file (${formatBytes(blob.size)}).`);
        return;
      }

      const text = await readFileAsText(file);
      const converted = convertText(text, textMode);
      const blob = new Blob([converted.text], { type: `${converted.mime};charset=utf-8` });
      downloadBlob(blob, `${safeFileBase(file.name)}.${converted.ext}`);
      setTextPreview(converted.text.slice(0, 1500));
      setStatus(`Done. Downloaded .${converted.ext} file (${formatBytes(blob.size)}).`);
    } catch (err) {
      setError(err.message || 'Conversion failed.');
      setStatus('Conversion failed.');
    }
  }

  return (
    <div className="converter-shell">
      <header className="topbar">
        <a className="brand" href="/">Christian<span>Goblin</span></a>
        <nav>
          <a href="/tools/">Tools</a>
          <a href="/store/">Store</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">Private Browser Tool</p>
          <h1>File Converter</h1>
          <p className="hero-copy">Convert common images and text files directly in your browser. Files stay on your device; nothing is uploaded to a server.</p>
        </section>

        <section className="converter-card">
          <FileDropZone file={file} onFile={setFile} />

          <div className="controls-grid">
            <div className="control-group">
              <label>Conversion type</label>
              <div className="segmented">
                <button type="button" className={mode === 'image' ? 'active' : ''} onClick={() => setMode('image')}>Image</button>
                <button type="button" className={mode === 'text' ? 'active' : ''} onClick={() => setMode('text')}>Text / Data</button>
              </div>
            </div>

            {mode === 'image' ? (
              <>
                <div className="control-group">
                  <label htmlFor="image-output">Output format</label>
                  <select id="image-output" value={imageOutput.mime} onChange={(event) => setImageOutput(IMAGE_OUTPUTS.find((item) => item.mime === event.target.value) || IMAGE_OUTPUTS[0])}>
                    {IMAGE_OUTPUTS.map((item) => <option key={item.mime} value={item.mime}>{item.label}</option>)}
                  </select>
                </div>
                <div className="control-group">
                  <label htmlFor="quality">Quality: {Math.round(quality * 100)}%</label>
                  <input id="quality" type="range" min="0.4" max="1" step="0.01" value={quality} disabled={!imageOutput.quality} onChange={(event) => setQuality(Number(event.target.value))} />
                </div>
                <div className="control-group">
                  <label htmlFor="max-width">Max width, optional</label>
                  <input id="max-width" type="number" min="1" placeholder="Keep original" value={maxWidth} onChange={(event) => setMaxWidth(event.target.value)} />
                </div>
              </>
            ) : (
              <div className="control-group wide">
                <label htmlFor="text-output">Text/data conversion</label>
                <select id="text-output" value={textMode} onChange={(event) => setTextMode(event.target.value)}>
                  {TEXT_OUTPUTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
            )}
          </div>

          <button className="convert-button" type="button" disabled={!file} onClick={handleConvert}>Convert & Download</button>
          <p className="status">{status}</p>
          {error ? <p className="error">{error}</p> : null}
        </section>

        {(previewUrl || textPreview) ? (
          <section className="preview-card">
            <div>
              <p className="eyebrow">Preview</p>
              <h2>{previewUrl ? 'Image preview' : 'Text preview'}</h2>
            </div>
            {previewUrl ? <img src={previewUrl} alt="Selected file preview" /> : <pre>{textPreview}</pre>}
          </section>
        ) : null}

        <section className="notes-grid">
          <article>
            <h3>Works now</h3>
            <p>PNG, JPEG, WEBP, JSON, CSV, Markdown, and plain text.</p>
          </article>
          <article>
            <h3>Local by design</h3>
            <p>The first version runs entirely in the browser, so files are not sent to a backend.</p>
          </article>
          <article>
            <h3>Later upgrades</h3>
            <p>PDF, DOCX, audio, video, and bulk ZIP conversion can be added with heavier libraries or a Worker backend.</p>
          </article>
        </section>
      </main>
    </div>
  );
}

export default ConverterApp;
