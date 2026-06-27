const PLANNED = [
  {
    title: 'Office documents',
    body: 'DOCX text extraction, DOCX to HTML, XLSX to CSV/JSON, CSV/JSON to XLSX, and basic document previews.',
  },
  {
    title: 'Advanced PDF tools',
    body: 'PDF merge, split, remove pages, text to PDF, metadata tools, and stronger compression options. Image-to-PDF already has a light version in the Images module.',
  },
  {
    title: 'OCR',
    body: 'Image/PDF screenshot to text. This is useful, but should be a separate lazy module because OCR engines are large.',
  },
  {
    title: 'Ebooks and fonts',
    body: 'EPUB/TXT/HTML flows and font formats like TTF/OTF to WOFF/WOFF2 can be added later as specialized modules.',
  },
  {
    title: 'Cloud mode for huge files',
    body: 'Very large video, OCR, or office conversions may eventually need an optional backend mode instead of browser-only conversion.',
  },
];

export function render({ root, setStatus }) {
  root.innerHTML = `
    <div class="module-panel">
      <div class="grid-controls two">
        <div class="control full">
          <h3 style="margin:0;color:var(--gold);font-family:Georgia,serif;">More converters can stay lazy</h3>
          <p style="color:var(--muted);line-height:1.7;margin:.6rem 0 0;">Audio/video conversion now has its own heavy module. These remaining converter groups can be added without forcing every visitor to download them on the first page load.</p>
        </div>
      </div>
      <div class="check-list">
        ${PLANNED.map((item) => `<p><strong style="color:var(--text);">${item.title}</strong><br>${item.body}</p>`).join('')}
      </div>
      <div class="button-row">
        <button class="secondary-button" id="copyPlan" type="button">Copy roadmap text</button>
      </div>
    </div>
  `;

  root.querySelector('#copyPlan').addEventListener('click', async () => {
    const text = PLANNED.map((item) => `${item.title}: ${item.body}`).join('\n\n');
    await navigator.clipboard.writeText(text);
    setStatus('Copied remaining module roadmap.', 'success');
  });
}
