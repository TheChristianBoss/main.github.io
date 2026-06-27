const PLANNED = [
  {
    title: 'Audio converter',
    body: 'MP3, WAV, M4A, OGG, FLAC, trim, compress, and extract audio from video. Best added with a lazy FFmpeg WebAssembly module.',
  },
  {
    title: 'Video converter',
    body: 'MP4, WEBM, MOV, resize, compress, trim, extract audio, and GIF export. This should not load until the user opens video tools.',
  },
  {
    title: 'Office documents',
    body: 'DOCX text extraction, DOCX to HTML, XLSX to CSV/JSON, CSV/JSON to XLSX, and basic document previews.',
  },
  {
    title: 'PDF tools',
    body: 'PDF merge, split, remove pages, images to PDF, text to PDF, and metadata tools. Image-to-PDF already has a light version in the Images module.',
  },
  {
    title: 'OCR',
    body: 'Image/PDF screenshot to text. This is useful, but should be a separate lazy module because OCR engines are large.',
  },
];

export function render({ root, setStatus }) {
  root.innerHTML = `
    <div class="module-panel">
      <div class="grid-controls two">
        <div class="control full">
          <h3 style="margin:0;color:var(--gold);font-family:Georgia,serif;">Heavy converters are intentionally separated</h3>
          <p style="color:var(--muted);line-height:1.7;margin:.6rem 0 0;">This app is now structured so big tools can be added without making every visitor download audio/video/OCR code. When we add these, each one should live in its own lazy module.</p>
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
    setStatus('Copied heavy module roadmap.', 'success');
  });
}
