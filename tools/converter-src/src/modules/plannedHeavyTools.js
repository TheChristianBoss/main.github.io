const PLANNED = [
  {
    title: 'OCR module',
    body: 'Image/PDF screenshot to text. This should stay lazy because OCR engines are large and can use a lot of memory.',
  },
  {
    title: 'Ebooks',
    body: 'EPUB to HTML/TXT and HTML/Markdown to EPUB. Useful, but it should be a separate focused module.',
  },
  {
    title: 'Fonts',
    body: 'TTF/OTF to WOFF/WOFF2 and font preview tools. These require specialized libraries and licensing care.',
  },
  {
    title: 'Advanced PDF cleanup',
    body: 'Stronger compression, OCR layers, redaction, form flattening, and password handling. These are harder in a browser-only app.',
  },
  {
    title: 'Cloud mode for huge files',
    body: 'Very large video, OCR, PDF, and office conversions may eventually need an optional backend mode instead of browser-only conversion.',
  },
];

export function render({ root, setStatus }) {
  root.innerHTML = `
    <div class="module-panel">
      <div class="grid-controls two">
        <div class="control full">
          <h3 style="margin:0;color:var(--gold);font-family:Georgia,serif;">Advanced converters can stay lazy</h3>
          <p style="color:var(--muted);line-height:1.7;margin:.6rem 0 0;">The converter now has image, text/data, PDF, DOCX, XLSX, ZIP, batch queue, utilities, and audio/video modules. These remaining converter groups are best added as optional heavy modules so every visitor does not download them immediately.</p>
        </div>
      </div>
      <div class="check-list">
        ${PLANNED.map((item) => `<p><strong style="color:var(--text);">${item.title}</strong><br>${item.body}</p>`).join('')}
      </div>
      <div class="button-row">
        <button class="secondary-button" id="copyPlan" type="button">Copy advanced roadmap text</button>
      </div>
    </div>
  `;

  root.querySelector('#copyPlan').addEventListener('click', async () => {
    const text = PLANNED.map((item) => `${item.title}: ${item.body}`).join('\n\n');
    await navigator.clipboard.writeText(text);
    setStatus('Copied advanced module roadmap.', 'success');
  });
}
