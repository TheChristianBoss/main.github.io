function readU16(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readU32(bytes, offset) {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

function findEndOfCentralDirectory(bytes) {
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 66000); i -= 1) {
    if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) return i;
  }
  return -1;
}

function parseZipEntries(bytes) {
  const decoder = new TextDecoder();
  const eocd = findEndOfCentralDirectory(bytes);
  if (eocd < 0) throw new Error('Could not find ZIP central directory.');
  const count = readU16(bytes, eocd + 10);
  let offset = readU32(bytes, eocd + 16);
  const entries = [];
  for (let i = 0; i < count; i += 1) {
    if (readU32(bytes, offset) !== 0x02014b50) throw new Error('Invalid ZIP central directory entry.');
    const method = readU16(bytes, offset + 10);
    const compressedSize = readU32(bytes, offset + 20);
    const uncompressedSize = readU32(bytes, offset + 24);
    const nameLength = readU16(bytes, offset + 28);
    const extraLength = readU16(bytes, offset + 30);
    const commentLength = readU16(bytes, offset + 32);
    const localOffset = readU32(bytes, offset + 42);
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    entries.push({ name, method, compressedSize, uncompressedSize, localOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries.filter((entry) => !entry.name.endsWith('/'));
}

async function extractEntry(bytes, entry) {
  const decoder = new TextDecoder();
  const offset = entry.localOffset;
  if (readU32(bytes, offset) !== 0x04034b50) throw new Error(`Invalid local file header for ${entry.name}.`);
  const nameLength = readU16(bytes, offset + 26);
  const extraLength = readU16(bytes, offset + 28);
  const dataStart = offset + 30 + nameLength + extraLength;
  const compressed = bytes.subarray(dataStart, dataStart + entry.compressedSize);

  if (entry.method === 0) return new Blob([compressed], { type: 'application/octet-stream' });
  if (entry.method === 8 && 'DecompressionStream' in globalThis) {
    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Response(stream).blob();
  }

  throw new Error(`${entry.name} uses ZIP compression method ${entry.method}. This browser can only extract stored files and some deflated files.`);
}

export function render({ root, files, setStatus, helpers }) {
  root.innerHTML = `
    <div class="module-panel">
      <div class="grid-controls two">
        <div class="control">
          <label for="zipMode">ZIP tool</label>
          <select id="zipMode">
            <option value="create">Selected files → ZIP</option>
            <option value="list">List ZIP contents</option>
            <option value="extract">Extract supported ZIP files</option>
          </select>
        </div>
        <div class="control">
          <label>Supported now</label>
          <div class="badge-list">
            <span class="badge">Create ZIP</span>
            <span class="badge">List ZIP entries</span>
            <span class="badge">Extract simple ZIPs</span>
          </div>
        </div>
      </div>
      <div class="button-row">
        <button class="action-button" id="runZip" type="button" ${files.length ? '' : 'disabled'}>Run ZIP tool</button>
      </div>
      <pre class="result-box" id="zipResult">ZIP results will appear here.</pre>
    </div>
  `;

  const mode = root.querySelector('#zipMode');
  const result = root.querySelector('#zipResult');

  root.querySelector('#runZip').addEventListener('click', async () => {
    try {
      if (!files.length) throw new Error('Choose files first.');
      if (mode.value === 'create') {
        const zip = await helpers.createZipBlob(files, 'christian-goblin-files');
        helpers.downloadBlob(zip, 'christian-goblin-files.zip');
        result.textContent = `Created ZIP with ${files.length} file${files.length === 1 ? '' : 's'}.\nSize: ${helpers.formatBytes(zip.size)}\n\nNote: This uses ZIP store mode, which prioritizes compatibility and privacy over heavy compression.`;
        setStatus(`Done. Downloaded ZIP (${helpers.formatBytes(zip.size)}).`, 'success');
        return;
      }

      const zipFile = files.find((file) => /\.zip$/i.test(file.name) || file.type === 'application/zip') || files[0];
      const bytes = new Uint8Array(await zipFile.arrayBuffer());
      const entries = parseZipEntries(bytes);

      if (mode.value === 'list') {
        result.textContent = entries.length
          ? entries.map((entry) => `${entry.name}\n  compressed: ${helpers.formatBytes(entry.compressedSize)}\n  original: ${helpers.formatBytes(entry.uncompressedSize)}\n  method: ${entry.method}`).join('\n\n')
          : 'No file entries found.';
        setStatus(`Found ${entries.length} ZIP entr${entries.length === 1 ? 'y' : 'ies'}.`, 'success');
        return;
      }

      let extracted = 0;
      const failed = [];
      for (const entry of entries) {
        try {
          const blob = await extractEntry(bytes, entry);
          const safeName = entry.name.split('/').pop() || 'extracted-file.bin';
          helpers.downloadBlob(blob, safeName);
          extracted += 1;
        } catch (err) {
          failed.push(`${entry.name}: ${err.message}`);
        }
      }

      result.textContent = `Extracted ${extracted} file${extracted === 1 ? '' : 's'}.` + (failed.length ? `\n\nSkipped/failed:\n${failed.join('\n')}` : '');
      setStatus(`ZIP extraction finished. Extracted ${extracted} file${extracted === 1 ? '' : 's'}.`, failed.length ? 'info' : 'success');
    } catch (err) {
      result.textContent = err.message || 'ZIP tool failed.';
      setStatus(err.message || 'ZIP tool failed.', 'error');
    }
  });
}
