const TOOL_DEFINITIONS = [
  {
    id: 'images',
    label: 'Images',
    eyebrow: 'Light module',
    title: 'Image Converter',
    description: 'Convert, resize, rotate, batch-export, make favicons, and turn images into a simple PDF.',
    accept: 'image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg',
    multiple: true,
    signatures: ['image'],
    loader: () => import('./modules/imageTools.js'),
  },
  {
    id: 'office-pdf',
    label: 'Docs / Sheets / PDF',
    eyebrow: 'Medium lazy module',
    title: 'Document, Spreadsheet & PDF Tools',
    description: 'Merge/split PDFs, turn text/images into PDF, extract DOCX text, and convert XLSX/CSV/JSON files.',
    accept: '.pdf,.docx,.xlsx,.csv,.json,.txt,.md,.markdown,.html,image/png,image/jpeg,image/webp,image/svg+xml,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/*,application/json',
    multiple: true,
    signatures: ['pdf', 'docx', 'xlsx'],
    loader: () => import('./modules/officePdfTools.js'),
  },
  {
    id: 'text-data',
    label: 'Text / Data',
    eyebrow: 'Light module',
    title: 'Text & Data Converter',
    description: 'Convert JSON, CSV, TSV, YAML-style text, Markdown, HTML, and plain text.',
    accept: '.txt,.json,.csv,.tsv,.md,.markdown,.html,.yaml,.yml,text/*,application/json,text/csv,text/markdown,text/html',
    multiple: false,
    signatures: ['text', 'json', 'csv', 'markdown', 'html'],
    loader: () => import('./modules/textDataTools.js'),
  },
  {
    id: 'batch',
    label: 'Batch Queue',
    eyebrow: 'Workflow module',
    title: 'Batch Conversion Queue',
    description: 'Convert compatible files one by one, track status, and download all results as one ZIP.',
    accept: '*/*',
    multiple: true,
    signatures: ['batch'],
    loader: () => import('./modules/batchQueueTools.js'),
  },
  {
    id: 'utilities',
    label: 'Utilities',
    eyebrow: 'Light module',
    title: 'Encode, Decode & Hash',
    description: 'Create SHA-256 hashes, Base64 encode files, URL encode/decode text, and inspect file details.',
    accept: '*/*',
    multiple: true,
    signatures: ['utility'],
    loader: () => import('./modules/utilityTools.js'),
  },
  {
    id: 'archives',
    label: 'ZIP',
    eyebrow: 'Medium module',
    title: 'ZIP Tools',
    description: 'Bundle files into a ZIP and inspect/extract simple ZIP archives locally.',
    accept: '*/*,.zip,application/zip',
    multiple: true,
    signatures: ['zip'],
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
    signatures: ['media'],
    loader: () => import('./modules/mediaTools.js'),
  },
  {
    id: 'heavy',
    label: 'Coming Soon',
    eyebrow: 'Roadmap only',
    title: 'Advanced Converter Roadmap',
    description: 'Planned OCR, ebook, font, redaction, and huge-file workflows. This section is informational and does not run conversions yet.',
    accept: '*/*',
    multiple: false,
    signatures: ['future'],
    comingSoon: true,
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
  'office-pdf': {
    low: 25 * MB,
    medium: 100 * MB,
    high: 300 * MB,
    max: 600 * MB,
    subject: 'document/PDF job',
    tip: 'PDF, DOCX, and XLSX files can require several times their file size in memory while parsing.',
  },
  batch: {
    low: 40 * MB,
    medium: 180 * MB,
    high: 600 * MB,
    max: 900 * MB,
    subject: 'batch conversion',
    tip: 'Batch jobs are safest when each file is smaller and outputs are downloaded as one ZIP.',
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
  if (saveData) score -= 1;
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
      copy = `This may still work, but it could be slow or fail on this device. PDF, spreadsheet, image batch, and media work can use several times the selected file size in memory. Recommended: ${formatBytes(limit)} or less for this module.`;
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
    <small>Hard caution point for this module: ${escapeHtml(formatBytes(hardMax))} ${escapeHtml(guide.subject)}. Keep the original file backed up.</small>
  `;
}

const state = {
  activeToolId: 'images',
  files: [],
  loadedModules: new Map(),
  loading: false,
  deviceProfile: detectDeviceProfile(),
  history: [],
  renderToken: 0,
  pickerAppendMode: false,
};

const refs = {};

function getActiveToolDefinition() {
  return TOOL_DEFINITIONS.find((item) => item.id === state.activeToolId) || TOOL_DEFINITIONS[0];
}

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

function fileKey(file) {
  return [file?.name || '', file?.size || 0, file?.lastModified || 0, file?.type || ''].join('::');
}

function setStatus(message, type = 'info') {
  refs.status.textContent = message;
  refs.status.dataset.type = type;
}


function friendlyErrorMessage(err, context = 'conversion') {
  const raw = String(err?.message || err || 'Unknown error');
  const lower = raw.toLowerCase();
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch')) {
    return `Could not load a helper needed for this ${context}. Check your connection and try again. Media and some document tools load extra browser code only when needed.`;
  }
  if (lower.includes('ffmpeg') || lower.includes('wasm') || lower.includes('webassembly')) {
    return `The media engine could not finish loading or running. Try a smaller media file, refresh the page, and check your connection because the FFmpeg core is loaded only when needed.`;
  }
  if (lower.includes('memory') || lower.includes('allocation') || lower.includes('out of bounds') || lower.includes('quota')) {
    return `This ${context} likely used more memory than the browser could safely provide. Try a smaller file, lower the output size, or close other tabs.`;
  }
  if (lower.includes('encrypted') || lower.includes('password')) {
    return `This file appears to be encrypted or password-protected. Browser conversion may not be able to open it.`;
  }
  if (lower.includes('unsupported') || lower.includes('not supported')) {
    return `This format or feature is not supported by this browser yet. Try Chrome or Edge, or choose a different output format.`;
  }
  if (lower.includes('could not read') || lower.includes('invalid')) {
    return `The file could not be read as the selected type. It may be corrupted, encrypted, or not the format its extension suggests.`;
  }
  if (lower.includes('timeout') || lower.includes('aborted')) {
    return `The ${context} was stopped before it finished. Try a smaller file or a simpler preset.`;
  }
  return raw;
}

function renderErrorBox(message, detail = '') {
  return `
    <div class="error-box">
      <strong>Conversion could not continue.</strong>
      <p>${escapeHtml(message)}</p>
      ${detail ? `<small>${escapeHtml(detail)}</small>` : '<small>Keep a backup of the original file and try a smaller or simpler conversion.</small>'}
    </div>
  `;
}

function renderHistory() {
  if (!refs.historyList) return;
  if (!state.history.length) {
    refs.historyList.innerHTML = '<li><span>No conversions yet.</span><small>Downloads you create in this session will appear here.</small></li>';
    return;
  }
  refs.historyList.innerHTML = state.history.slice(0, 8).map((item) => `
    <li>
      <span>${escapeHtml(item.name)}</span>
      <small>${escapeHtml(item.detail)}</small>
    </li>
  `).join('');
}

function recordHistory(name, detail = '') {
  state.history.unshift({ name, detail, at: new Date().toISOString() });
  state.history = state.history.slice(0, 20);
  renderHistory();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  recordHistory(filename, `${formatBytes(blob?.size || 0)} • downloaded`);
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
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

function extensionOf(file) {
  return (String(file?.name || '').match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();
}

function detectFileKind(file) {
  const ext = extensionOf(file);
  const type = String(file?.type || '').toLowerCase();
  if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) return 'image';
  if (type.startsWith('audio/') || type.startsWith('video/') || ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'mp4', 'webm', 'mov', 'avi', 'mkv', 'gif'].includes(ext)) return 'media';
  if (ext === 'pdf' || type === 'application/pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx';
  if (ext === 'zip' || type === 'application/zip') return 'zip';
  if (ext === 'json' || type.includes('json')) return 'json';
  if (ext === 'csv' || ext === 'tsv') return 'csv';
  if (['md', 'markdown'].includes(ext)) return 'markdown';
  if (ext === 'html' || type.includes('html')) return 'html';
  if (type.startsWith('text/') || ['txt', 'yaml', 'yml', 'xml', 'log'].includes(ext)) return 'text';
  return 'utility';
}

function detectBestToolForFiles(files) {
  const list = [...(files || [])].filter(Boolean);
  if (!list.length) return state.activeToolId;
  const kinds = list.map(detectFileKind);
  const unique = [...new Set(kinds)];
  if (list.length > 1) {
    if (unique.length === 1 && unique[0] === 'image') return 'images';
    if (unique.every((kind) => ['pdf', 'image'].includes(kind))) return 'office-pdf';
    return 'batch';
  }
  const kind = kinds[0];
  if (kind === 'image') return 'images';
  if (['pdf', 'docx', 'xlsx'].includes(kind)) return 'office-pdf';
  if (kind === 'zip') return 'archives';
  if (kind === 'media') return 'media';
  if (['json', 'csv', 'markdown', 'html', 'text'].includes(kind)) return 'text-data';
  return 'utilities';
}


function toolCompatibilityNotes(tool, files) {
  const list = [...(files || [])].filter(Boolean);
  if (!list.length) return [];
  const kinds = list.map(detectFileKind);
  const notes = [];

  if (!tool.multiple && list.length > 1) {
    notes.push(`${tool.label} uses one file at a time. Choose / replace files to swap the selected file.`);
  }

  const badByTool = {
    images: kinds.filter((kind) => kind !== 'image').length,
    media: kinds.filter((kind) => kind !== 'media').length,
    archives: kinds.filter((kind) => kind !== 'zip').length,
    'text-data': kinds.filter((kind) => !['json', 'csv', 'markdown', 'html', 'text'].includes(kind)).length,
    'office-pdf': kinds.filter((kind) => !['pdf', 'docx', 'xlsx', 'csv', 'json', 'text', 'markdown', 'html', 'image'].includes(kind)).length,
  };

  if (badByTool[tool.id]) {
    notes.push(`Some selected files may not match the ${tool.label} module. Switch modules or remove incompatible files before converting.`);
  }

  if (tool.id === 'batch') {
    notes.push('Batch mode skips files that do not match the chosen batch preset. Use one batch preset at a time.');
  }

  if (tool.comingSoon) {
    notes.push('This roadmap section is informational only; it does not convert files yet.');
  }

  return notes;
}

function renderFileWarnings(tool = getActiveToolDefinition()) {
  if (!refs.fileWarnings) return;
  const notes = toolCompatibilityNotes(tool, state.files);
  refs.fileWarnings.hidden = !notes.length;
  refs.fileWarnings.innerHTML = notes.length
    ? `<strong>Selected-file note</strong><ul>${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}</ul>`
    : '';
}

function fileSummary(files) {
  if (!files.length) return 'No files selected.';
  if (files.length === 1) return `${files[0].name} • ${formatBytes(files[0].size)}${files[0].type ? ` • ${files[0].type}` : ''}`;
  const total = files.reduce((sum, file) => sum + file.size, 0);
  return `${files.length} files selected • ${formatBytes(total)} total`;
}

function renderFileList() {
  const tool = getActiveToolDefinition();
  refs.fileList.innerHTML = state.files.length
    ? state.files.map((file, index) => `
        <li>
          <span title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
          <small>${formatBytes(file.size)}${file.type ? ` · ${escapeHtml(file.type)}` : ''}</small>
          <button class="file-remove" type="button" data-file-index="${index}" aria-label="Remove ${escapeHtml(file.name)}">Remove</button>
        </li>
      `).join('')
    : '<li><span>No files selected yet.</span><small>Drop files above or click Choose Files.</small></li>';
  if (refs.fileActions) {
    refs.fileActions.hidden = false;
    refs.clearFiles.disabled = !state.files.length;
    refs.addMoreFiles.disabled = !state.files.length || !tool.multiple;
    refs.addMoreFiles.textContent = tool.multiple ? 'Add more files' : 'One file at a time';
    refs.addMoreFiles.title = tool.multiple ? 'Append more files to this conversion.' : 'This module uses one file at a time. Use Choose / replace files to swap it.';
  }
  renderFileWarnings(tool);
}

function updateFileInputForTool() {
  const tool = TOOL_DEFINITIONS.find((item) => item.id === state.activeToolId) || TOOL_DEFINITIONS[0];
  refs.fileInput.accept = tool.accept || '*/*';
  refs.fileInput.multiple = Boolean(tool.multiple);
  refs.fileInput.disabled = Boolean(tool.comingSoon);
  refs.dropZone.dataset.disabled = tool.comingSoon ? 'true' : 'false';
  refs.dropTitle.textContent = tool.comingSoon ? 'Coming soon' : (tool.multiple ? 'Drop one or more files here' : 'Drop a file here');
  refs.dropCopy.textContent = tool.comingSoon ? `${tool.description} No file needed yet.` : `${tool.description} Files stay on your device.`;
}

async function getActiveModule() {
  const tool = TOOL_DEFINITIONS.find((item) => item.id === state.activeToolId) || TOOL_DEFINITIONS[0];
  if (state.loadedModules.has(tool.id)) return state.loadedModules.get(tool.id);
  state.loading = true;
  refs.toolMount.innerHTML = `<div class="module-loading"><div class="spinner"></div><p>Loading ${escapeHtml(tool.label)} module…</p></div>`;
  try {
    const module = await tool.loader();
    state.loadedModules.set(tool.id, module);
    return module;
  } finally {
    state.loading = false;
  }
}

async function renderActiveTool() {
  const renderToken = ++state.renderToken;
  const tool = getActiveToolDefinition();
  refs.moduleEyebrow.textContent = tool.eyebrow;
  refs.moduleTitle.textContent = tool.title;
  refs.moduleDescription.textContent = tool.description;
  updateFileInputForTool();
  renderDeviceCard();
  renderSizeAdvice();
  qsa('.tool-tab').forEach((button) => button.classList.toggle('active', button.dataset.toolId === tool.id));
  renderFileList();
  try {
    const module = await getActiveModule();
    if (renderToken !== state.renderToken || tool.id !== state.activeToolId) return;
    module.render({
      root: refs.toolMount,
      files: state.files,
      setStatus,
      helpers,
    });
  } catch (err) {
    if (renderToken !== state.renderToken) return;
    const friendly = friendlyErrorMessage(err, `${tool.label} module`);
    refs.toolMount.innerHTML = renderErrorBox(friendly, 'Try refreshing the page. If it is a heavy module, check your connection and device file-size recommendation.');
    setStatus(friendly, 'error');
  }
}

function setFiles(fileList, options = {}) {
  const incoming = [...(fileList || [])].filter(Boolean);

  // Important: choosing "Cancel" in the file picker returns an empty FileList.
  // Do not treat that as a request to clear the current files.
  if (!incoming.length && options.preserveOnEmpty !== false) {
    if (state.files.length) {
      setStatus(`${fileSummary(state.files)} Still selected. Choose new files to replace them, add more files, or clear them.`);
    } else {
      setStatus('No file selected yet. Drop files here or choose files to begin.');
    }
    refs.fileInput.value = '';
    return;
  }

  const currentTool = getActiveToolDefinition();
  const shouldAppend = Boolean(options.append && currentTool.multiple && state.files.length);
  const nextFiles = shouldAppend ? mergeFiles(state.files, incoming) : incoming;
  const suggestedTool = detectBestToolForFiles(nextFiles);
  if (suggestedTool && suggestedTool !== state.activeToolId) state.activeToolId = suggestedTool;
  const tool = getActiveToolDefinition();
  state.files = tool.multiple ? nextFiles : nextFiles.slice(0, 1);
  refs.fileInput.value = '';
  renderFileList();
  renderSizeAdvice();
  const detected = incoming.length ? ` Smart-detected ${tool.label}.` : '';
  const action = shouldAppend ? 'Added files.' : 'Selected files.';
  setStatus(`${action} ${fileSummary(state.files)}${detected}`);
  renderActiveTool();
}

function mergeFiles(current, incoming) {
  const merged = [...current];
  const seen = new Set(current.map(fileKey));
  for (const file of incoming) {
    const key = fileKey(file);
    if (!seen.has(key)) {
      merged.push(file);
      seen.add(key);
    }
  }
  return merged;
}

function clearSelectedFiles() {
  state.files = [];
  refs.fileInput.value = '';
  renderFileList();
  renderSizeAdvice();
  setStatus('Cleared selected files. Drop or choose new files to begin.');
  renderActiveTool();
}

function removeFileAt(index) {
  const removed = state.files[index];
  state.files = state.files.filter((_, i) => i !== index);
  refs.fileInput.value = '';
  renderFileList();
  renderSizeAdvice();
  setStatus(removed ? `Removed ${removed.name}. ${fileSummary(state.files)}` : fileSummary(state.files));
  renderActiveTool();
}


function resetConverter() {
  state.activeToolId = 'images';
  state.files = [];
  state.history = [];
  state.pickerAppendMode = false;
  refs.fileInput.value = '';
  renderFileList();
  renderHistory();
  renderSizeAdvice();
  setStatus('Started over. Drop or choose files to begin.', 'info');
  renderActiveTool();
}

function renderToolTabs() {
  refs.toolTabs.innerHTML = TOOL_DEFINITIONS.map((tool) => `
    <button class="tool-tab${tool.id === state.activeToolId ? ' active' : ''}" data-tool-id="${tool.id}" type="button">
      <span>${escapeHtml(tool.label)}</span>
      <small>${escapeHtml(tool.eyebrow)}${tool.comingSoon ? ' · not active yet' : ''}</small>
    </button>
  `).join('');

  refs.toolTabs.addEventListener('click', (event) => {
    const button = event.target.closest('.tool-tab');
    if (!button) return;
    state.activeToolId = button.dataset.toolId;
    updateFileInputForTool();
    renderFileList();
    renderSizeAdvice();
    setStatus(`Switched to ${button.querySelector('span')?.textContent || 'tool'} module.`);
    renderActiveTool();
  });
}

function initDropZone() {
  let suppressPickerUntil = 0;

  function openPicker({ append = false } = {}) {
    state.pickerAppendMode = append;
    refs.fileInput.click();
  }

  refs.dropZone.addEventListener('click', () => {
    if (Date.now() < suppressPickerUntil) return;
    if (getActiveToolDefinition().comingSoon) {
      setStatus('That converter group is marked Coming Soon and does not accept files yet.', 'info');
      return;
    }
    openPicker({ append: false });
  });

  refs.dropZone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (getActiveToolDefinition().comingSoon) {
        setStatus('That converter group is marked Coming Soon and does not accept files yet.', 'info');
        return;
      }
      openPicker({ append: false });
    }
  });

  refs.fileInput.addEventListener('change', (event) => {
    setFiles(event.target.files, { append: state.pickerAppendMode });
    state.pickerAppendMode = false;
  });

  refs.addMoreFiles.addEventListener('click', () => { if (getActiveToolDefinition().comingSoon) setStatus('That converter group is marked Coming Soon and does not accept files yet.', 'info'); else openPicker({ append: getActiveToolDefinition().multiple }); });
  refs.replaceFiles.addEventListener('click', () => { if (getActiveToolDefinition().comingSoon) setStatus('That converter group is marked Coming Soon and does not accept files yet.', 'info'); else openPicker({ append: false }); });
  refs.clearFiles.addEventListener('click', clearSelectedFiles);
  refs.fileList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-file-index]');
    if (!button) return;
    removeFileAt(Number(button.dataset.fileIndex));
  });

  ['dragenter', 'dragover'].forEach((name) => refs.dropZone.addEventListener(name, (event) => {
    event.preventDefault();
    event.stopPropagation();
    refs.dropZone.classList.add('is-dragging');
  }));

  ['dragleave', 'drop'].forEach((name) => refs.dropZone.addEventListener(name, (event) => {
    event.preventDefault();
    event.stopPropagation();
    refs.dropZone.classList.remove('is-dragging');
  }));

  refs.dropZone.addEventListener('drop', (event) => {
    suppressPickerUntil = Date.now() + 700;
    if (getActiveToolDefinition().comingSoon) {
      setStatus('That converter group is marked Coming Soon and does not accept files yet.', 'info');
      return;
    }
    setFiles(event.dataTransfer.files, { append: Boolean(state.files.length && getActiveToolDefinition().multiple) });
  });
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
  recordHistory,
  deviceProfile: state.deviceProfile,
  getRecommendedLimit,
  getSizeGuide,
  friendlyErrorMessage,
  renderErrorBox,
};

function mount() {
  document.body.innerHTML = `
    <div class="converter-shell">
      <header class="topbar">
        <a class="brand" href="/">Christian<span>Goblin</span></a>
        <nav>
          <a href="/tools/">Tools</a>
          <a href="/tools/converter/privacy.html">Privacy</a>
          <a href="/tools/converter/test.html">Test</a>
          <a href="/store/">Store</a>
        </nav>
      </header>
      <main>
        <section class="hero">
          <p class="eyebrow">Private Browser Tool</p>
          <h1>File Converter</h1>
          <p class="hero-copy">A modular converter for images, documents, PDFs, spreadsheets, text/data, ZIP files, utilities, and media tools. It smart-detects file types, estimates device capacity, and recommends safer file sizes before heavy browser conversions.</p>
          <div class="hero-actions">
            <a class="hero-link" href="/tools/converter/privacy.html">Privacy & limits</a>
            <a class="hero-link subtle" href="/tools/converter/test.html">Open test page</a>
          </div>
        </section>

        <section class="converter-layout">
          <aside class="tool-sidebar">
            <p class="side-label">Converter Modules</p>
            <div class="tool-tabs" id="toolTabs"></div>
            <div class="privacy-card">
              <strong>Local by default</strong>
              <p>Current modules run in the browser. Heavy PDF/media helpers load only when opened; media conversion also fetches the FFmpeg core on demand. Your files are not uploaded by the static site.</p>
              <a class="small-card-link" href="/tools/converter/privacy.html">Read privacy and limitations</a>
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
            <div class="file-warnings" id="fileWarnings" hidden></div>
            <div class="file-actions" id="fileActions">
              <button class="secondary-button tiny" id="replaceFiles" type="button">Choose / replace files</button>
              <button class="secondary-button tiny" id="addMoreFiles" type="button" disabled>Add more files</button>
              <button class="secondary-button tiny danger-button" id="clearFiles" type="button" disabled>Clear selected files</button>
              <button class="secondary-button tiny" id="resetConverter" type="button">Start over</button>
            </div>
            <div id="toolMount" class="tool-mount"></div>
            <p class="status" id="status" data-type="info">Choose a module and file to begin.</p>
            <div class="history-panel">
              <div class="history-head"><strong>Session history</strong><button class="secondary-button tiny" id="clearHistory" type="button">Clear</button></div>
              <ul class="file-list history-list" id="historyList"></ul>
            </div>
          </section>
        </section>

        <section class="roadmap-grid">
          <article>
            <h3>Safe mode</h3>
            <p>Images, text, data, hashes, simple ZIP, and many PDF/spreadsheet jobs are safest for everyday browser use.</p>
          </article>
          <article>
            <h3>Heavy mode</h3>
            <p>Audio/video and advanced document work use more memory, may load helper code on demand, and may need smaller files or a stronger device.</p>
          </article>
          <article>
            <h3>Stability tools</h3>
            <p>Use the test page after updates to check module loading, browser support, sample downloads, and basic app health.</p>
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
    fileActions: qs('#fileActions'),
    fileWarnings: qs('#fileWarnings'),
    replaceFiles: qs('#replaceFiles'),
    addMoreFiles: qs('#addMoreFiles'),
    clearFiles: qs('#clearFiles'),
    resetConverter: qs('#resetConverter'),
    toolMount: qs('#toolMount'),
    status: qs('#status'),
    historyList: qs('#historyList'),
    clearHistory: qs('#clearHistory'),
    moduleEyebrow: qs('#moduleEyebrow'),
    moduleTitle: qs('#moduleTitle'),
    moduleDescription: qs('#moduleDescription'),
    deviceCard: qs('#deviceCard'),
    sizeAdvice: qs('#sizeAdvice'),
  });

  refs.clearHistory.addEventListener('click', () => { state.history = []; renderHistory(); setStatus('Cleared session history.', 'info'); });
  refs.resetConverter.addEventListener('click', resetConverter);
  renderToolTabs();
  initDropZone();
  renderFileList();
  renderHistory();
  renderDeviceCard();
  renderSizeAdvice();
  renderActiveTool();
}

mount();
