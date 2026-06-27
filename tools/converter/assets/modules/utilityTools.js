const encoder = new TextEncoder();

function bufferToHex(buffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(text) {
  const clean = text.replace(/\s+/g, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hashFiles(files, helpers) {
  if (!files.length) throw new Error('Choose at least one file first.');
  const rows = [];
  for (const file of files) {
    const hash = await crypto.subtle.digest('SHA-256', await helpers.readFileAsArrayBuffer(file));
    rows.push(`${file.name}\n  SHA-256: ${bufferToHex(hash)}\n  Size: ${helpers.formatBytes(file.size)}`);
  }
  return rows.join('\n\n');
}

export function render({ root, files, setStatus, helpers }) {
  root.innerHTML = `
    <div class="module-panel">
      <div class="grid-controls two">
        <div class="control">
          <label for="utilityMode">Utility</label>
          <select id="utilityMode">
            <option value="sha256">File → SHA-256 hash report</option>
            <option value="file-base64">File → Base64 text</option>
            <option value="text-base64-encode">Text → Base64</option>
            <option value="text-base64-decode">Base64 → Text</option>
            <option value="base64-file-decode">Base64 → Binary file</option>
            <option value="url-encode">Text → URL encoded text</option>
            <option value="url-decode">URL encoded text → Text</option>
          </select>
        </div>
        <div class="control">
          <label>Supported now</label>
          <div class="badge-list">
            <span class="badge">SHA-256</span>
            <span class="badge">Base64</span>
            <span class="badge">URL encode/decode</span>
          </div>
        </div>
        <div class="control full">
          <label for="utilityInput">Text input</label>
          <textarea id="utilityInput" placeholder="Paste text here for text utilities or Base64 decoding."></textarea>
        </div>
      </div>
      <div class="button-row">
        <button class="action-button" id="runUtility" type="button">Run utility</button>
        <button class="secondary-button" id="downloadUtility" type="button" disabled>Download result</button>
      </div>
      <pre class="result-box" id="utilityResult">Utility output will appear here.</pre>
    </div>
  `;

  const mode = root.querySelector('#utilityMode');
  const input = root.querySelector('#utilityInput');
  const result = root.querySelector('#utilityResult');
  const downloadButton = root.querySelector('#downloadUtility');
  let lastBlob = null;
  let lastName = 'utility-result.txt';

  function setResult(text, blob, name) {
    result.textContent = text;
    lastBlob = blob || new Blob([text], { type: 'text/plain;charset=utf-8' });
    lastName = name || 'utility-result.txt';
    downloadButton.disabled = false;
  }

  root.querySelector('#runUtility').addEventListener('click', async () => {
    try {
      const selected = mode.value;
      if (selected === 'sha256') {
        const report = await hashFiles(files, helpers);
        setResult(report, new Blob([report], { type: 'text/plain;charset=utf-8' }), 'sha256-report.txt');
        setStatus('Created SHA-256 hash report.', 'success');
      } else if (selected === 'file-base64') {
        if (!files[0]) throw new Error('Choose a file first.');
        const bytes = new Uint8Array(await files[0].arrayBuffer());
        const output = bytesToBase64(bytes);
        setResult(output, new Blob([output], { type: 'text/plain;charset=utf-8' }), `${helpers.safeFileBase(files[0].name)}.b64.txt`);
        setStatus(`Encoded ${files[0].name} as Base64.`, 'success');
      } else if (selected === 'text-base64-encode') {
        const output = bytesToBase64(encoder.encode(input.value));
        setResult(output, new Blob([output], { type: 'text/plain;charset=utf-8' }), 'base64-encoded.txt');
        setStatus('Encoded text as Base64.', 'success');
      } else if (selected === 'text-base64-decode') {
        const bytes = base64ToBytes(input.value);
        const output = new TextDecoder().decode(bytes);
        setResult(output, new Blob([output], { type: 'text/plain;charset=utf-8' }), 'base64-decoded.txt');
        setStatus('Decoded Base64 as text.', 'success');
      } else if (selected === 'base64-file-decode') {
        const bytes = base64ToBytes(input.value);
        const blob = new Blob([bytes], { type: 'application/octet-stream' });
        setResult(`Decoded ${helpers.formatBytes(blob.size)} from Base64. Use Download result to save it.`, blob, 'decoded-from-base64.bin');
        setStatus('Decoded Base64 as a binary file.', 'success');
      } else if (selected === 'url-encode') {
        const output = encodeURIComponent(input.value);
        setResult(output, new Blob([output], { type: 'text/plain;charset=utf-8' }), 'url-encoded.txt');
        setStatus('URL encoded text.', 'success');
      } else if (selected === 'url-decode') {
        const output = decodeURIComponent(input.value);
        setResult(output, new Blob([output], { type: 'text/plain;charset=utf-8' }), 'url-decoded.txt');
        setStatus('URL decoded text.', 'success');
      }
    } catch (err) {
      const friendly = helpers.friendlyErrorMessage ? helpers.friendlyErrorMessage(err, 'utility conversion') : (err.message || 'Utility failed.');
      setStatus(friendly, 'error');
      result.textContent = friendly;
      downloadButton.disabled = true;
    }
  });

  downloadButton.addEventListener('click', () => {
    if (lastBlob) helpers.downloadBlob(lastBlob, lastName);
  });
}
