const IMAGE_FORMATS = [
  { label: 'PNG', ext: 'png', mime: 'image/png', quality: false },
  { label: 'JPEG', ext: 'jpg', mime: 'image/jpeg', quality: true },
  { label: 'WEBP', ext: 'webp', mime: 'image/webp', quality: true },
  { label: 'Image PDF', ext: 'pdf', mime: 'application/pdf', quality: true, pdf: true },
];

function arrayBufferToBinaryString(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return binary;
}

function escapePdfText(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
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
    contentObjects.push({ id: contentId, width: page.width, height: page.height });
  });

  const objects = new Map();
  objects.set(catalogId, `<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  objects.set(pagesId, `<< /Type /Pages /Kids [${pageObjects.map((p) => `${p.id} 0 R`).join(' ')}] /Count ${pageObjects.length} >>`);

  for (const page of pageObjects) {
    objects.set(page.id, `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Resources << /XObject << /Im${page.imageId} ${page.imageId} 0 R >> >> /Contents ${page.contentId} 0 R >>`);
  }

  for (const image of imageObjects) {
    const binary = arrayBufferToBinaryString(image.data.buffer);
    objects.set(image.id, `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.data.length} >>\nstream\n${binary}\nendstream`);
  }

  for (const content of contentObjects) {
    const stream = `q\n${content.width} 0 0 ${content.height} 0 0 cm\n/Im${content.id - 1} Do\nQ`;
    objects.set(content.id, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  }

  let pdf = '%PDF-1.4\n% Christian Goblin File Converter\n';
  const offsets = [0];
  for (let id = 1; id < nextId; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects.get(id)}\nendobj\n`;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${nextId}\n0000000000 65535 f \n`;
  for (let id = 1; id < nextId; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${nextId} /Root ${catalogId} 0 R /Info << /Producer (Christian Goblin File Converter) /Title (${escapePdfText(pages[0]?.name || 'Converted Images')}) >> >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

async function drawImageToCanvas(file, helpers, options) {
  const img = await helpers.loadImageFromFile(file);
  const widthLimit = Number.parseInt(options.maxWidth, 10);
  const heightLimit = Number.parseInt(options.maxHeight, 10);
  const widthScale = Number.isFinite(widthLimit) && widthLimit > 0 && img.width > widthLimit ? widthLimit / img.width : 1;
  const heightScale = Number.isFinite(heightLimit) && heightLimit > 0 && img.height > heightLimit ? heightLimit / img.height : 1;
  const scale = Math.min(widthScale, heightScale);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d', { alpha: true });
  if (options.background) {
    ctx.fillStyle = options.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function convertSingleImage(file, helpers, format, options) {
  const needsBackground = format.mime === 'image/jpeg' || format.pdf;
  const canvas = await drawImageToCanvas(file, helpers, { ...options, background: needsBackground ? '#ffffff' : '' });
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
        <div class="control full">
          <label>Supported now</label>
          <div class="badge-list">
            <span class="badge">PNG ↔ JPEG ↔ WEBP</span>
            <span class="badge">SVG → PNG/JPEG/WEBP/PDF</span>
            <span class="badge">Batch images → ZIP</span>
            <span class="badge">Images → PDF</span>
          </div>
        </div>
      </div>
      <div class="button-row">
        <button class="action-button" id="convertImages" type="button" ${files.length ? '' : 'disabled'}>Convert images</button>
      </div>
      <div id="imageResult"></div>
    </div>
  `;

  const formatSelect = root.querySelector('#imageFormat');
  const qualityInput = root.querySelector('#imageQuality');
  const qualityLabel = root.querySelector('#qualityLabel');
  const maxWidth = root.querySelector('#maxWidth');
  const maxHeight = root.querySelector('#maxHeight');
  const result = root.querySelector('#imageResult');

  qualityInput.addEventListener('input', () => { qualityLabel.textContent = qualityInput.value; });

  root.querySelector('#convertImages').addEventListener('click', async () => {
    if (!files.length) return;
    const format = IMAGE_FORMATS.find((item) => item.ext === formatSelect.value) || IMAGE_FORMATS[0];
    const options = {
      quality: Number(qualityInput.value) / 100,
      maxWidth: maxWidth.value,
      maxHeight: maxHeight.value,
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

      result.innerHTML = `<div class="result-box"><h3>Converted files</h3>${outputs.map((output) => `${helpers.escapeHtml(output.name)} — ${output.width}×${output.height} — ${helpers.formatBytes(output.blob.size)}`).join('\n')}</div>`;
    } catch (err) {
      setStatus(err.message || 'Image conversion failed.', 'error');
      result.innerHTML = `<div class="error-box">${helpers.escapeHtml(err.message || 'Image conversion failed.')}</div>`;
    }
  });
}
