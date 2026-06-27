const TOOL_DEFINITIONS = [
  {
    id: 'images',
    label: 'Images',
    eyebrow: 'Light module',
    title: 'Image Converter',
    description: 'Convert, resize, batch-export, and turn images into a simple PDF.',
    accept: 'image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg',
    multiple: true,
    loader: () => import('./modules/imageTools.js'),
  },
  {
    id: 'text-data',
    label: 'Text / Data',
    eyebrow: 'Light module',
    title: 'Text & Data Converter',
    description: 'Convert JSON, CSV, TSV, YAML-style text, Markdown, HTML, and plain text.',
    accept: '.txt,.json,.csv,.tsv,.md,.markdown,.html,.yaml,.yml,text/*,application/json,text/csv,text/markdown,text/html',
    multiple: false,
    loader: () => import('./modules/textDataTools.js'),
  },
  {
    id: 'utilities',
    label: 'Utilities',
    eyebrow: 'Light module',
    title: 'Encode, Decode & Hash',
    description: 'Create SHA-256 hashes, Base64 encode files, and URL encode/decode text.',
    accept: '*/*',
    multiple: true,
    loader: () => import('./modules/utilityTools.js'),
  },
  {
    id: 'archives',
    label: 'ZIP',
    eyebrow: 'Medium module',
    title: 'ZIP Tools',
    description: 'Bundle files into a ZIP and inspect simple ZIP archives locally.',
    accept: '*/*,.zip,application/zip',
    multiple: true,
    loader: () => import('./modules/zipTools.js'),
  },
  {
    id: 'media',
    label: 'Audio / Video',
    eyebrow: 'Heavy lazy module',
    title: 'Audio & Video Converter',
    description: 'Convert, trim, compress, and extract media with a FFmpeg WebAssembly engine that loads only when this module is used.',
    accept: 'audio/*,video/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.mp4,.webm,.mov,.avi,.mkv,.gif',
    multiple: false,
    loader: () => import('./modules/mediaTools.js'),
  },
  {
    id: 'heavy',
    label: 'More types',
    eyebrow: 'Planned lazy modules',
    title: 'OCR, Office & Advanced PDF',
    description: 'A planning area for other bigger converters that should load only when requested.',
    accept: '*/*',
    multiple: true,
    loader: () => import('./modules/plannedHeavyTools.js'),
  },
];

const MB = 1024 * 1024;

const SIZE_GUIDES = {
  images: {
    low: 25 * MB,
    medium: 90 * MB,
    high: 250 * MB,
    max: 400 * MB,
    subject: 'selected image batch',
    tip: 'Resize very large photos before batch converting, especially on phones.',
  },
  'text-data': {
    low: 10 * MB,
    medium: 35 * MB,
    high: 100 * MB,
    max: 180 * MB,
    subject: 'text or data file',
    tip: 'Huge CSV/JSON files can freeze a browser because the whole file is parsed in memory.',
  },
  utilities: {
    low: 50 * MB,
    medium: 200 * MB,
    high: 750 * MB,
    max: 1200 * MB,
    subject: 'utility files',
    tip: 'Hashing is safer for large files than Base64, because Base64 expands the file in memory.',
  },
  archives: {
    low: 50 * MB,
    medium: 200 * MB,
    high: 500 * MB,
    max: 900 * MB,
    subject: 'ZIP job',
    tip: 'ZIP creation/extraction may need more memory than the original file size.',
  },
  media: {
    low: 80 * MB,
    medium: 250 * MB,
    high: 750 * MB,
    max: 1200 * MB,
    subject: 'audio/video file',
    tip: 'For video, shorter clips and 720p/1080p sources work best in browser mode.',
  },
  heavy: {
    low: 25 * MB,
    medium: 100 * MB,
    high: 300 * MB,
    max: 600 * MB,
    subject: 'future heavy conversion',
    tip: 'OCR, office files, and advanced PDF tools may need dedicated lazy modules.',
  },
};

function detectDeviceProfile() {
  const memory = Number(navigator.deviceMemory || 0);
  const cores = Number(navigator.hardwareConcurrency || 0);
  const connection = navigator.connection || navigator.webkitConnection || navigator.mozConnection || null;
  const effectiveType = connection?.effectiveType || '';
  const saveData = Boolean(connection?.saveData);
  const ua = navigator.userAgent || '';
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) < 900);

  let score = 0;
  if (memory >= 8) score += 2;
  else if (memory >= 4) score += 1;
  else if (memory > 0) score -= 1;

  if (cores >= 8) score += 2;
  else if (cores >= 4) score += 1;
  else if (cores > 0) score -= 1;

  if (isMobile) score -= 1;
  if (saveData) score -= 2;
  if (/slow-2g|2g/.test(effectiveType)) score -= 1;

  const tier = score >= 3 ? 'high' : score >= 1 ? 'medium' : 'low';
  return { tier, memory, cores, isMobile, effectiveType, saveData };
}

function tierLabel(tier) {
  if (tier === 'high') return 'High-capacity device';
  if (tier === 'medium') return 'Medium-capacity device';
  return 'Low/unknown-capacity device';
}

function getSizeGuide(toolId) {
  return SIZE_GUIDES[toolId] || SIZE_GUIDES.images;
}

function getRecommendedLimit(toolId, tier = state.deviceProfile?.tier || 'medium') {
  const guide = getSizeGuide(toolId);
  return guide[tier] || guide.medium;
}

function selectedTotalBytes(files = state.files) {
  return files.reduce((sum, file) => sum + Number(file.size || 0), 0);
}

function renderDeviceCard() {
  if (!refs.deviceCard) return;
  const profile = state.deviceProfile;
  const parts = [];
  parts.push(profile.memory ? `${profile.memory} GB memory estimate` : 'memory unknown');
  parts.push(profile.cores ? `${profile.cores} CPU threads` : 'CPU threads unknown');
  if (profile.isMobile) parts.push('mobile/tablet style device');
  if (profile.effectiveType) parts.push(`${profile.effectiveType} network`);
  if (profile.saveData) parts.push('data-saver on');

  refs.deviceCard.innerHTML = `
    <strong>${escapeHtml(tierLabel(profile.tier))}</strong>
    <p>${escapeHtml(parts.join(' • '))}</p>
    <small>Estimate only. Browsers do not expose exact device strength, but this helps avoid oversized conversions.</small>
  `;
}

function renderSizeAdvice() {
  if (!refs.sizeAdvice) return;
  const tool = TOOL_DEFINITIONS.find((item) => item.id === state.activeToolId) || TOOL_DEFINITIONS[0];
  const guide = getSizeGuide(tool.id);
  const limit = getRecommendedLimit(tool.id);
  const hardMax = guide.max || limit * 2;
  const total = selectedTotalBytes();
  const hasFiles = state.files.length > 0;
  let level = 'info';
  let headline = `Recommended size: up to ${formatBytes(limit)}`;
  let copy = `${tool.label}: ${guide.tip}`;

  if (hasFiles) {
    if (total > hardMax) {
      level = 'danger';
      headline = `Too large for reliable browser conversion: ${formatBytes(total)}`;
      copy = `Recommended for this device/module is ${formatBytes(limit)}. Try a smaller file, trim video first, or wait for a cloud/server mode.`;
    } else if (total > limit) {
      level = 'warn';
      headline = `Above recommended size: ${formatBytes(total)}`;
      copy = `This may still work, but it could be slow or fail on this device. Recommended: ${formatBytes(limit)} or less for this module.`;
    } else {
      level = 'ok';
      headline = `Selected size looks reasonable: ${formatBytes(total)}`;
      copy = `This is under the ${formatBytes(limit)} recommendation for your estimated device class.`;
    }
  }

  refs.sizeAdvice.dataset.level = level;
  refs.sizeAdvice.innerHTML = `
    <strong>${escapeHtml(headline)}</strong>
    <p>${escapeHtml(copy)}</p>
    <small>Hard caution point for this module: ${escapeHtml(formatBytes(hardMax))} ${escapeHtml(guide.subject)}.</small>
  `;
}

const state = {
  activeToolId: 'images',
  files: [],
  loadedModules: new Map(),
  loading: false,
  deviceProfile: detectDeviceProfile(),
};

const refs = {};

function qs(selector, root = document) {
  return root.querySelector(selector);
}

function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function formatBytes(bytes = 0) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function safeFileBase(name = 'converted') {
  return String(name || 'converted')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/^-|-$/g, '') || 'converted';
}

function setStatus(message, type = 'info') {
  refs.status.textContent = message;
  refs.status.dataset.type = type;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 750);
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read that file as text.'));
    reader.readAsText(file);
  });
}

function readFileAsArrayBuffer(file) {
  return file.arrayBuffer();
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
      reject(new Error(`Could not load ${file.name} as an image.`));
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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function uint32(value) {
  return [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255];
}

function uint16(value) {
  return [value & 255, (value >>> 8) & 255];
}

let crcTable;
function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
}

function crc32(bytes) {
  crcTable ||= makeCrcTable();
  let crc = 0 ^ -1;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 255];
  }
  return (crc ^ -1) >>> 0;
}

function dateToDosParts(date = new Date()) {
  const time = ((date.getHours() & 31) << 11) | ((date.getMinutes() & 63) << 5) | ((Math.floor(date.getSeconds() / 2)) & 31);
  const dosDate = (((date.getFullYear() - 1980) & 127) << 9) | (((date.getMonth() + 1) & 15) << 5) | (date.getDate() & 31);
  return { time, dosDate };
}

async function createZipBlob(inputFiles, zipNamePrefix = 'converted-files') {
  const files = [...inputFiles].filter(Boolean);
  if (!files.length) throw new Error('Choose at least one file to zip.');

  const encoder = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const name = String(file.name || `${zipNamePrefix}-${central.length + 1}.bin`).replace(/^[/\\]+/, '').replace(/\\/g, '/');
    const nameBytes = encoder.encode(name);
    const crc = crc32(bytes);
    const { time, dosDate } = dateToDosParts(file.lastModified ? new Date(file.lastModified) : new Date());
    const localHeader = new Uint8Array([
      0x50, 0x4b, 0x03, 0x04,
      ...uint16(20), ...uint16(0), ...uint16(0), ...uint16(time), ...uint16(dosDate),
      ...uint32(crc), ...uint32(bytes.length), ...uint32(bytes.length),
      ...uint16(nameBytes.length), ...uint16(0),
    ]);
    chunks.push(localHeader, nameBytes, bytes);

    const centralHeader = new Uint8Array([
      0x50, 0x4b, 0x01, 0x02,
      ...uint16(20), ...uint16(20), ...uint16(0), ...uint16(0), ...uint16(time), ...uint16(dosDate),
      ...uint32(crc), ...uint32(bytes.length), ...uint32(bytes.length),
      ...uint16(nameBytes.length), ...uint16(0), ...uint16(0), ...uint16(0), ...uint16(0),
      ...uint32(0), ...uint32(offset),
    ]);
    central.push(centralHeader, nameBytes);
    offset += localHeader.length + nameBytes.length + bytes.length;
  }

  const centralStart = offset;
  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array([
    0x50, 0x4b, 0x05, 0x06,
    ...uint16(0), ...uint16(0), ...uint16(files.length), ...uint16(files.length),
    ...uint32(centralSize), ...uint32(centralStart), ...uint16(0),
  ]);

  return new Blob([...chunks, ...central, end], { type: 'application/zip' });
}

function fileSummary(files) {
  if (!files.length) return 'No files selected.';
  if (files.length === 1) return `${files[0].name} • ${formatBytes(files[0].size)}${files[0].type ? ` • ${files[0].type}` : ''}`;
  const total = files.reduce((sum, file) => sum + file.size, 0);
  return `${files.length} files selected • ${formatBytes(total)} total`;
}

function renderFileList() {
  refs.fileList.innerHTML = state.files.length
    ? state.files.map((file) => `
        <li>
          <span>${escapeHtml(file.name)}</span>
          <small>${formatBytes(file.size)}${file.type ? ` · ${escapeHtml(file.type)}` : ''}</small>
        </li>
      `).join('')
    : '<li><span>No files selected yet.</span><small>Drop files above or click Choose Files.</small></li>';
}

function updateFileInputForTool() {
  const tool = TOOL_DEFINITIONS.find((item) => item.id === state.activeToolId) || TOOL_DEFINITIONS[0];
  refs.fileInput.accept = tool.accept || '*/*';
  refs.fileInput.multiple = Boolean(tool.multiple);
  refs.dropTitle.textContent = tool.multiple ? 'Drop one or more files here' : 'Drop a file here';
  refs.dropCopy.textContent = `${tool.description} Files stay on your device.`;
}

async function getActiveModule() {
  const tool = TOOL_DEFINITIONS.find((item) => item.id === state.activeToolId) || TOOL_DEFINITIONS[0];
  if (state.loadedModules.has(tool.id)) return state.loadedModules.get(tool.id);
  state.loading = true;
  refs.toolMount.innerHTML = `<div class="module-loading"><div class="spinner"></div><p>Loading ${escapeHtml(tool.label)} module…</p></div>`;
  const module = await tool.loader();
  state.loadedModules.set(tool.id, module);
  state.loading = false;
  return module;
}

async function renderActiveTool() {
  const tool = TOOL_DEFINITIONS.find((item) => item.id === state.activeToolId) || TOOL_DEFINITIONS[0];
  refs.moduleEyebrow.textContent = tool.eyebrow;
  refs.moduleTitle.textContent = tool.title;
  refs.moduleDescription.textContent = tool.description;
  updateFileInputForTool();
  renderDeviceCard();
  renderSizeAdvice();
  qsa('.tool-tab').forEach((button) => button.classList.toggle('active', button.dataset.toolId === tool.id));
  try {
    const module = await getActiveModule();
    module.render({
      root: refs.toolMount,
      files: state.files,
      setStatus,
      helpers,
    });
  } catch (err) {
    refs.toolMount.innerHTML = `<div class="error-box">${escapeHtml(err.message || 'Module failed to load.')}</div>`;
  }
}

function setFiles(fileList) {
  const tool = TOOL_DEFINITIONS.find((item) => item.id === state.activeToolId) || TOOL_DEFINITIONS[0];
  const incoming = [...(fileList || [])].filter(Boolean);
  state.files = tool.multiple ? incoming : incoming.slice(0, 1);
  renderFileList();
  renderSizeAdvice();
  setStatus(fileSummary(state.files));
  renderActiveTool();
}

function renderToolTabs() {
  refs.toolTabs.innerHTML = TOOL_DEFINITIONS.map((tool) => `
    <button class="tool-tab${tool.id === state.activeToolId ? ' active' : ''}" data-tool-id="${tool.id}" type="button">
      <span>${escapeHtml(tool.label)}</span>
      <small>${escapeHtml(tool.eyebrow)}</small>
    </button>
  `).join('');

  refs.toolTabs.addEventListener('click', (event) => {
    const button = event.target.closest('.tool-tab');
    if (!button) return;
    state.activeToolId = button.dataset.toolId;
    updateFileInputForTool();
    renderSizeAdvice();
    setStatus(`Switched to ${button.querySelector('span')?.textContent || 'tool'} module.`);
    renderActiveTool();
  });
}

function initDropZone() {
  refs.dropZone.addEventListener('click', () => refs.fileInput.click());
  refs.dropZone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') refs.fileInput.click();
  });
  refs.fileInput.addEventListener('change', (event) => setFiles(event.target.files));
  ['dragenter', 'dragover'].forEach((name) => refs.dropZone.addEventListener(name, (event) => {
    event.preventDefault();
    refs.dropZone.classList.add('is-dragging');
  }));
  ['dragleave', 'drop'].forEach((name) => refs.dropZone.addEventListener(name, (event) => {
    event.preventDefault();
    refs.dropZone.classList.remove('is-dragging');
  }));
  refs.dropZone.addEventListener('drop', (event) => setFiles(event.dataTransfer.files));
}

const helpers = {
  formatBytes,
  safeFileBase,
  downloadBlob,
  readFileAsText,
  readFileAsArrayBuffer,
  loadImageFromFile,
  canvasToBlob,
  escapeHtml,
  createZipBlob,
  crc32,
  deviceProfile: state.deviceProfile,
  getRecommendedLimit,
  getSizeGuide,
};

function mount() {
  document.body.innerHTML = `
    <div class="converter-shell">
      <header class="topbar">
        <a class="brand" href="/">Christian<span>Goblin</span></a>
        <nav>
          <a href="/tools/">Tools</a>
          <a href="/store/">Store</a>
        </nav>
      </header>
      <main>
        <section class="hero">
          <p class="eyebrow">Private Browser Tool</p>
          <h1>File Converter</h1>
          <p class="hero-copy">A modular converter for images, text, data, ZIP files, utilities, and media tools. It estimates device capacity and recommends safer file sizes before heavy conversions.</p>
        </section>

        <section class="converter-layout">
          <aside class="tool-sidebar">
            <p class="side-label">Converter Modules</p>
            <div class="tool-tabs" id="toolTabs"></div>
            <div class="privacy-card">
              <strong>Local by default</strong>
              <p>Current modules run in the browser. Heavy media converters load only when visitors open Audio / Video tools.</p>
            </div>
            <div class="device-card" id="deviceCard"></div>
          </aside>

          <section class="work-card">
            <div class="module-head">
              <div>
                <p class="eyebrow" id="moduleEyebrow"></p>
                <h2 id="moduleTitle"></h2>
                <p id="moduleDescription"></p>
              </div>
            </div>

            <div class="drop-zone" id="dropZone" role="button" tabindex="0">
              <input id="fileInput" type="file" hidden>
              <div class="drop-icon">⇪</div>
              <h3 id="dropTitle">Drop files here</h3>
              <p id="dropCopy"></p>
            </div>

            <div class="size-advice" id="sizeAdvice"></div>

            <ul class="file-list" id="fileList"></ul>
            <div id="toolMount" class="tool-mount"></div>
            <p class="status" id="status" data-type="info">Choose a module and file to begin.</p>
          </section>
        </section>

        <section class="roadmap-grid">
          <article>
            <h3>Light modules</h3>
            <p>Images, JSON, CSV, Markdown, text, Base64, URL tools, and hashes.</p>
          </article>
          <article>
            <h3>Medium modules</h3>
            <p>ZIP bundling and simple image-to-PDF exports without loading video/audio code.</p>
          </article>
          <article>
            <h3>Heavy modules</h3>
            <p>Audio/video now load as a separate heavy module; OCR, DOCX, and XLSX can be added the same way later.</p>
          </article>
        </section>
      </main>
    </div>
  `;

  Object.assign(refs, {
    toolTabs: qs('#toolTabs'),
    dropZone: qs('#dropZone'),
    fileInput: qs('#fileInput'),
    dropTitle: qs('#dropTitle'),
    dropCopy: qs('#dropCopy'),
    fileList: qs('#fileList'),
    toolMount: qs('#toolMount'),
    status: qs('#status'),
    moduleEyebrow: qs('#moduleEyebrow'),
    moduleTitle: qs('#moduleTitle'),
    moduleDescription: qs('#moduleDescription'),
    deviceCard: qs('#deviceCard'),
    sizeAdvice: qs('#sizeAdvice'),
  });

  renderToolTabs();
  initDropZone();
  renderFileList();
  renderDeviceCard();
  renderSizeAdvice();
  renderActiveTool();
}

mount();
