const IMAGE_FORMATS = [
  { label: 'PNG', ext: 'png', mime: 'image/png', quality: false },
  { label: 'JPEG', ext: 'jpg', mime: 'image/jpeg', quality: true },
  { label: 'WEBP', ext: 'webp', mime: 'image/webp', quality: true },
  { label: 'ICO favicon', ext: 'ico', mime: 'image/x-icon', quality: true, icon: true },
  { label: 'Image PDF', ext: 'pdf', mime: 'application/pdf', quality: true, pdf: true },
];

const IMAGE_PRESETS = {
  custom: { label: 'Custom settings' },
  smallest: { label: 'Smallest file size', format: 'webp', quality: 70, width: 1200 },
  best: { label: 'Best quality', format: 'png', quality: 100, width: '' },
  web: { label: 'Web optimized', format: 'webp', quality: 84, width: 1600 },
  email: { label: 'Email friendly', format: 'jpg', quality: 78, width: 1200 },
  social: { label: 'Social media', format: 'jpg', quality: 88, width: 1080 },
  favicon: { label: 'Favicon / app icon', format: 'ico', quality: 92, width: 64 },
};

function asciiBytes(text) {
  return new TextEncoder().encode(String(text));
}

function partLength(part) {
  if (typeof part === 'string') return asciiBytes(part).length;
  return part.byteLength || part.length || 0;
}

function buildPdfFromJpegs(pages) {
  let nextId = 1;
  const catalogId = nextId++;
  const pagesId = nextId++;
  const pageObjects = [];
  const imageObjects = [];
  const contentObjects = [];

  pages.forEach((page) => {
    const pageId = nextId++;
    const imageId = nextId++;
    const contentId = nextId++;
    pageObjects.push({ id: pageId, imageId, contentId, width: page.width, height: page.height, name: page.name });
    imageObjects.push({ id: imageId, width: page.width, height: page.height, data: page.jpegBytes });
    contentObjects.push({ id: contentId, imageId, width: page.width, height: page.height });
  });

  const objects = new Map();
  objects.set(catalogId, [`<< /Type /Catalog /Pages ${pagesId} 0 R >>`]);
  objects.set(pagesId, [`<< /Type /Pages /Kids [${pageObjects.map((page) => `${page.id} 0 R`).join(' ')}] /Count ${pageObjects.length} >>`]);

  for (const page of pageObjects) {
    objects.set(page.id, [`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Resources << /XObject << /Im${page.imageId} ${page.imageId} 0 R >> >> /Contents ${page.contentId} 0 R >>`]);
  }

  for (const image of imageObjects) {
    objects.set(image.id, [
      `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.data.length} >>\nstream\n`,
      image.data,
      '\nendstream',
    ]);
  }

  for (const content of contentObjects) {
    const stream = `q\n${content.width} 0 0 ${content.height} 0 0 cm\n/Im${content.imageId} Do\nQ`;
    objects.set(content.id, [`<< /Length ${asciiBytes(stream).length} >>\nstream\n${stream}\nendstream`]);
  }

  const parts = [];
  const offsets = [0];
  let length = 0;
  const push = (part) => {
    parts.push(part);
    length += partLength(part);
  };

  push('%PDF-1.4\n% Christian Goblin File Converter\n');
  for (let id = 1; id < nextId; id += 1) {
    offsets[id] = length;
    push(`${id} 0 obj\n`);
    for (const part of objects.get(id)) push(part);
    push('\nendobj\n');
  }

  const xrefStart = length;
  push(`xref\n0 ${nextId}\n0000000000 65535 f \n`);
  for (let id = 1; id < nextId; id += 1) push(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
  push(`trailer\n<< /Size ${nextId} /Root ${catalogId} 0 R /Info << /Producer (Christian Goblin File Converter) /Title (${escapePdfText(pages[0]?.name || 'Converted Images')}) >> >>\nstartxref\n${xrefStart}\n%%EOF`);

  return new Blob(parts, { type: 'application/pdf' });
}

function buildIcoFromPngBytes(pngBytes, size = 64) {
  const header = new Uint8Array([
    0, 0, 1, 0, 1, 0,
    size >= 256 ? 0 : size, size >= 256 ? 0 : size, 0, 0, 1, 0, 32, 0,
    pngBytes.length & 255, (pngBytes.length >>> 8) & 255, (pngBytes.length >>> 16) & 255, (pngBytes.length >>> 24) & 255,
    22, 0, 0, 0,
  ]);
  return new Blob([header, pngBytes], { type: 'image/x-icon' });
}

async function drawImageToCanvas(file, helpers, options) {
  const img = await helpers.loadImageFromFile(file);
  const widthLimit = Number.parseInt(options.maxWidth, 10);
  const heightLimit = Number.parseInt(options.maxHeight, 10);
  const percent = Number.parseFloat(options.scalePercent || '100');
  const rotate = Number.parseInt(options.rotate || '0', 10) || 0;
  const widthScale = Number.isFinite(widthLimit) && widthLimit > 0 && img.width > widthLimit ? widthLimit / img.width : 1;
  const heightScale = Number.isFinite(heightLimit) && heightLimit > 0 && img.height > heightLimit ? heightLimit / img.height : 1;
  const percentScale = Number.isFinite(percent) && percent > 0 ? percent / 100 : 1;
  const scale = Math.min(widthScale, heightScale) * percentScale;
  const drawWidth = Math.max(1, Math.round(img.width * scale));
  const drawHeight = Math.max(1, Math.round(img.height * scale));
  const rotated = Math.abs(rotate % 180) === 90;
  const canvas = document.createElement('canvas');
  canvas.width = rotated ? drawHeight : drawWidth;
  canvas.height = rotated ? drawWidth : drawHeight;
  const ctx = canvas.getContext('2d', { alpha: !options.background });
  if (options.background) {
    ctx.fillStyle = options.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  if (rotate) {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  } else {
    ctx.drawImage(img, 0, 0, drawWidth, drawHeight);
  }
  return canvas;
}

async function convertSingleImage(file, helpers, format, options) {
  const needsBackground = format.mime === 'image/jpeg' || format.pdf || options.forceBackground;
  const canvas = await drawImageToCanvas(file, helpers, { ...options, background: needsBackground ? (options.backgroundColor || '#ffffff') : '' });

  if (format.icon) {
    const iconCanvas = document.createElement('canvas');
    const size = Math.min(256, Math.max(16, Number.parseInt(options.maxWidth, 10) || 64));
    iconCanvas.width = size;
    iconCanvas.height = size;
    const ctx = iconCanvas.getContext('2d');
    ctx.fillStyle = options.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, size, size);
    const scale = Math.min(size / canvas.width, size / canvas.height);
    const w = canvas.width * scale;
    const h = canvas.height * scale;
    ctx.drawImage(canvas, (size - w) / 2, (size - h) / 2, w, h);
    const png = await helpers.canvasToBlob(iconCanvas, 'image/png');
    const ico = buildIcoFromPngBytes(new Uint8Array(await png.arrayBuffer()), size);
    return { name: `${helpers.safeFileBase(file.name)}.ico`, blob: ico, width: size, height: size };
  }

  const blob = await helpers.canvasToBlob(canvas, format.mime, format.quality ? options.quality : undefined);
  return {
    name: `${helpers.safeFileBase(file.name)}.${format.ext}`,
    blob,
    width: canvas.width,
    height: canvas.height,
  };
}

export function render({ root, files, setStatus, helpers }) {
  root.innerHTML = `
    <div class="module-panel">
      <div class="grid-controls">
        <div class="control">
          <label for="imagePreset">Preset</label>
          <select id="imagePreset">
            ${Object.entries(IMAGE_PRESETS).map(([id, preset]) => `<option value="${id}">${preset.label}</option>`).join('')}
          </select>
        </div>
        <div class="control">
          <label for="imageFormat">Output format</label>
          <select id="imageFormat">
            ${IMAGE_FORMATS.map((format) => `<option value="${format.ext}">${format.label}</option>`).join('')}
          </select>
        </div>
        <div class="control">
          <label for="imageQuality">Quality: <span id="qualityLabel">92</span>%</label>
          <input id="imageQuality" type="range" min="40" max="100" value="92">
        </div>
        <div class="control">
          <label for="maxWidth">Max width, optional</label>
          <input id="maxWidth" type="number" min="1" placeholder="Keep original">
        </div>
        <div class="control">
          <label for="maxHeight">Max height, optional</label>
          <input id="maxHeight" type="number" min="1" placeholder="Keep original">
        </div>
        <div class="control">
          <label for="scalePercent">Resize percentage</label>
          <input id="scalePercent" type="number" min="1" max="400" value="100">
        </div>
        <div class="control">
          <label for="rotateImage">Rotate</label>
          <select id="rotateImage">
            <option value="0">No rotation</option>
            <option value="90">90° right</option>
            <option value="180">180°</option>
            <option value="270">90° left</option>
          </select>
        </div>
        <div class="control">
          <label for="backgroundColor">JPEG/ICO background</label>
          <input id="backgroundColor" type="color" value="#ffffff">
        </div>
        <div class="control full">
          <label>Supported now</label>
          <div class="badge-list">
            <span class="badge">PNG ↔ JPEG ↔ WEBP</span>
            <span class="badge">SVG → PNG/JPEG/WEBP/PDF</span>
            <span class="badge">Batch images → ZIP</span>
            <span class="badge">Images → PDF</span>
            <span class="badge">ICO favicon</span>
            <span class="badge">Rotate / resize presets</span>
            <span class="badge">Before/after preview</span>
          </div>
        </div>
      </div>
      <div class="button-row">
        <button class="action-button" id="convertImages" type="button" ${files.length ? '' : 'disabled'}>Convert images</button>
      </div>
      <div id="imageResult"></div>
    </div>
  `;

  const presetSelect = root.querySelector('#imagePreset');
  const formatSelect = root.querySelector('#imageFormat');
  const qualityInput = root.querySelector('#imageQuality');
  const qualityLabel = root.querySelector('#qualityLabel');
  const maxWidth = root.querySelector('#maxWidth');
  const maxHeight = root.querySelector('#maxHeight');
  const scalePercent = root.querySelector('#scalePercent');
  const rotateImage = root.querySelector('#rotateImage');
  const backgroundColor = root.querySelector('#backgroundColor');
  const result = root.querySelector('#imageResult');

  qualityInput.addEventListener('input', () => { qualityLabel.textContent = qualityInput.value; });
  presetSelect.addEventListener('change', () => {
    const preset = IMAGE_PRESETS[presetSelect.value];
    if (!preset || presetSelect.value === 'custom') return;
    if (preset.format) formatSelect.value = preset.format;
    if (preset.quality) { qualityInput.value = preset.quality; qualityLabel.textContent = preset.quality; }
    if (preset.width !== undefined) maxWidth.value = preset.width;
    if (preset.format === 'ico') maxHeight.value = preset.width || 64;
  });

  root.querySelector('#convertImages').addEventListener('click', async () => {
    if (!files.length) return;
    const format = IMAGE_FORMATS.find((item) => item.ext === formatSelect.value) || IMAGE_FORMATS[0];
    const options = {
      quality: Number(qualityInput.value) / 100,
      maxWidth: maxWidth.value,
      maxHeight: maxHeight.value,
      scalePercent: scalePercent.value,
      rotate: rotateImage.value,
      backgroundColor: backgroundColor.value,
    };
    setStatus(`Converting ${files.length} image${files.length === 1 ? '' : 's'}…`);
    result.innerHTML = '';

    try {
      if (format.pdf) {
        const pages = [];
        for (const file of files) {
          const canvas = await drawImageToCanvas(file, helpers, { ...options, background: '#ffffff' });
          const jpeg = await helpers.canvasToBlob(canvas, 'image/jpeg', options.quality);
          pages.push({
            name: file.name,
            width: canvas.width,
            height: canvas.height,
            jpegBytes: new Uint8Array(await jpeg.arrayBuffer()),
          });
        }
        const pdf = buildPdfFromJpegs(pages);
        helpers.downloadBlob(pdf, files.length === 1 ? `${helpers.safeFileBase(files[0].name)}.pdf` : 'converted-images.pdf');
        setStatus(`Done. Downloaded PDF with ${pages.length} page${pages.length === 1 ? '' : 's'} (${helpers.formatBytes(pdf.size)}).`, 'success');
        result.innerHTML = `<div class="result-box">Created image PDF with ${pages.length} page${pages.length === 1 ? '' : 's'}.</div>`;
        return;
      }

      const outputs = [];
      for (const file of files) outputs.push(await convertSingleImage(file, helpers, format, options));

      if (outputs.length === 1) {
        helpers.downloadBlob(outputs[0].blob, outputs[0].name);
        setStatus(`Done. Downloaded ${outputs[0].name} (${helpers.formatBytes(outputs[0].blob.size)}).`, 'success');
      } else {
        const zipFiles = outputs.map((output) => new File([output.blob], output.name, { type: output.blob.type }));
        const zip = await helpers.createZipBlob(zipFiles, 'converted-images');
        helpers.downloadBlob(zip, 'converted-images.zip');
        setStatus(`Done. Downloaded ZIP with ${outputs.length} converted images (${helpers.formatBytes(zip.size)}).`, 'success');
      }

      const originalTotal = files.reduce((sum, file) => sum + Number(file.size || 0), 0);
      const convertedTotal = outputs.reduce((sum, output) => sum + Number(output.blob.size || 0), 0);
      const change = originalTotal ? Math.round((1 - (convertedTotal / originalTotal)) * 100) : 0;
      let previewHtml = '';
      if (outputs.length === 1 && outputs[0].blob.type.startsWith('image/')) {
        const originalUrl = URL.createObjectURL(files[0]);
        const convertedUrl = URL.createObjectURL(outputs[0].blob);
        window.setTimeout(() => { URL.revokeObjectURL(originalUrl); URL.revokeObjectURL(convertedUrl); }, 15000);
        previewHtml = `<div class="preview-grid"><div class="preview-card"><strong>Original</strong><img src="${originalUrl}" alt="Original preview"></div><div class="preview-card"><strong>Converted</strong><img src="${convertedUrl}" alt="Converted preview"></div></div>`;
      }
      result.innerHTML = `<div class="compare-stats"><div class="stat-pill"><small>Original</small><strong>${helpers.formatBytes(originalTotal)}</strong></div><div class="stat-pill"><small>Converted</small><strong>${helpers.formatBytes(convertedTotal)}</strong></div><div class="stat-pill"><small>Size change</small><strong>${change > 0 ? change + '% smaller' : Math.abs(change) + '% larger'}</strong></div></div><div class="result-box"><h3>Converted files</h3>${outputs.map((output) => `${helpers.escapeHtml(output.name)} — ${output.width}×${output.height} — ${helpers.formatBytes(output.blob.size)}`).join('\n')}</div>${previewHtml}`;
    } catch (err) {
      const friendly = helpers.friendlyErrorMessage ? helpers.friendlyErrorMessage(err, 'image conversion') : (err.message || 'Image conversion failed.');
      setStatus(friendly, 'error');
      result.innerHTML = helpers.renderErrorBox ? helpers.renderErrorBox(friendly) : `<div class="error-box">${helpers.escapeHtml(friendly)}</div>`;
    }
  });
}
