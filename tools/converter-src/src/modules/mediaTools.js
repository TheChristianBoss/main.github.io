let ffmpegInstance = null;
let ffmpegLoading = null;

const FFMPEG_IMPORTS = {
  ffmpeg: 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js',
  util: 'https://unpkg.com/@ffmpeg/util@0.12.1/dist/esm/index.js',
  coreBase: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm',
};

const PRESETS = [
  {
    id: 'audio-mp3',
    label: 'Audio → MP3',
    extension: 'mp3',
    outputMime: 'audio/mpeg',
    args: ({ input, output, audioBitrate, trimArgs }) => ['-i', input, ...trimArgs, '-vn', '-codec:a', 'libmp3lame', '-b:a', audioBitrate, output],
  },
  {
    id: 'audio-wav',
    label: 'Audio → WAV',
    extension: 'wav',
    outputMime: 'audio/wav',
    args: ({ input, output, trimArgs }) => ['-i', input, ...trimArgs, '-vn', '-codec:a', 'pcm_s16le', output],
  },
  {
    id: 'audio-ogg',
    label: 'Audio → OGG',
    extension: 'ogg',
    outputMime: 'audio/ogg',
    args: ({ input, output, audioBitrate, trimArgs }) => ['-i', input, ...trimArgs, '-vn', '-codec:a', 'libvorbis', '-b:a', audioBitrate, output],
  },
  {
    id: 'video-mp4',
    label: 'Video → MP4',
    extension: 'mp4',
    outputMime: 'video/mp4',
    args: ({ input, output, videoBitrate, audioBitrate, trimArgs, scaleArgs }) => [
      '-i', input, ...trimArgs, ...scaleArgs,
      '-codec:v', 'libx264', '-preset', 'veryfast', '-movflags', 'faststart', '-b:v', videoBitrate,
      '-codec:a', 'aac', '-b:a', audioBitrate,
      output,
    ],
  },
  {
    id: 'video-webm',
    label: 'Video → WEBM',
    extension: 'webm',
    outputMime: 'video/webm',
    args: ({ input, output, videoBitrate, audioBitrate, trimArgs, scaleArgs }) => [
      '-i', input, ...trimArgs, ...scaleArgs,
      '-codec:v', 'libvpx-vp9', '-b:v', videoBitrate,
      '-codec:a', 'libopus', '-b:a', audioBitrate,
      output,
    ],
  },
  {
    id: 'extract-audio-mp3',
    label: 'Video → MP3 audio',
    extension: 'mp3',
    outputMime: 'audio/mpeg',
    args: ({ input, output, audioBitrate, trimArgs }) => ['-i', input, ...trimArgs, '-vn', '-codec:a', 'libmp3lame', '-b:a', audioBitrate, output],
  },
  {
    id: 'video-gif',
    label: 'Video → GIF',
    extension: 'gif',
    outputMime: 'image/gif',
    args: ({ input, output, trimArgs, gifFps, scaleWidth }) => {
      const filters = [`fps=${gifFps}`];
      if (scaleWidth) filters.push(`scale=${scaleWidth}:-1:flags=lanczos`);
      return ['-i', input, ...trimArgs, '-vf', filters.join(','), output];
    },
  },
];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeName(name = 'media') {
  return String(name || 'media')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/^-|-$/g, '') || 'media';
}

function fileToUint8(file) {
  return file.arrayBuffer().then((buffer) => new Uint8Array(buffer));
}

function looksLikeMedia(file) {
  return /^audio\//.test(file?.type || '') || /^video\//.test(file?.type || '') || /\.(mp3|wav|m4a|aac|ogg|flac|mp4|webm|mov|avi|mkv|gif)$/i.test(file?.name || '');
}

function parseSeconds(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d+(\.\d+)?$/.test(raw)) return raw;
  if (/^\d{1,2}:\d{2}(:\d{2})?(\.\d+)?$/.test(raw)) return raw;
  throw new Error('Trim times must be seconds, mm:ss, or hh:mm:ss.');
}

function buildTrimArgs(start, duration) {
  const args = [];
  const cleanStart = parseSeconds(start);
  const cleanDuration = parseSeconds(duration);
  if (cleanStart) args.push('-ss', cleanStart);
  if (cleanDuration) args.push('-t', cleanDuration);
  return args;
}

function buildScaleArgs(width) {
  const n = Number.parseInt(width, 10);
  if (!Number.isFinite(n) || n <= 0) return [];
  return ['-vf', `scale=${n}:-2`];
}

async function loadFFmpeg(setStatus, refs) {
  if (ffmpegInstance) return ffmpegInstance;
  if (ffmpegLoading) return ffmpegLoading;

  ffmpegLoading = (async () => {
    refs.convertBtn.disabled = true;
    refs.loadBtn.disabled = true;
    setStatus('Loading FFmpeg media engine. This can take a moment the first time.', 'info');

    const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
      import(FFMPEG_IMPORTS.ffmpeg),
      import(FFMPEG_IMPORTS.util),
    ]);

    const ffmpeg = new FFmpeg();
    ffmpeg.on('log', ({ message }) => {
      refs.log.textContent = `${refs.log.textContent}\n${message}`.trim().slice(-7000);
      refs.log.scrollTop = refs.log.scrollHeight;
    });
    ffmpeg.on('progress', ({ progress, time }) => {
      const pct = Number.isFinite(progress) ? Math.max(0, Math.min(100, Math.round(progress * 100))) : 0;
      refs.progress.value = pct;
      refs.progressLabel.textContent = `${pct}%${time ? ` • ${Math.round(time / 1000000)}s processed` : ''}`;
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(`${FFMPEG_IMPORTS.coreBase}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${FFMPEG_IMPORTS.coreBase}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegInstance = ffmpeg;
    refs.loadBtn.disabled = false;
    refs.convertBtn.disabled = false;
    setStatus('Media engine loaded. Choose a conversion and run it.', 'success');
    return ffmpeg;
  })().catch((err) => {
    ffmpegLoading = null;
    refs.loadBtn.disabled = false;
    refs.convertBtn.disabled = false;
    throw err;
  });

  return ffmpegLoading;
}

async function convertMedia({ file, refs, helpers, setStatus }) {
  if (!file) throw new Error('Choose one audio or video file first.');
  if (!looksLikeMedia(file)) throw new Error('This module expects an audio or video file.');
  if (file.size > 750 * 1024 * 1024) throw new Error('That file is very large for browser conversion. Try a smaller file or a future cloud mode.');

  const preset = PRESETS.find((item) => item.id === refs.preset.value) || PRESETS[0];
  const inputExt = (file.name.match(/\.([a-z0-9]+)$/i)?.[1] || 'bin').toLowerCase();
  const input = `input.${inputExt}`;
  const output = `${safeName(file.name)}.${preset.extension}`;
  const ffmpeg = await loadFFmpeg(setStatus, refs);

  refs.convertBtn.disabled = true;
  refs.loadBtn.disabled = true;
  refs.progress.value = 0;
  refs.progressLabel.textContent = '0%';
  refs.log.textContent = '';
  setStatus(`Converting ${file.name}… Keep this tab open.`, 'info');

  try {
    try { await ffmpeg.deleteFile(input); } catch {}
    try { await ffmpeg.deleteFile(output); } catch {}

    await ffmpeg.writeFile(input, await fileToUint8(file));

    const trimArgs = buildTrimArgs(refs.start.value, refs.duration.value);
    const scaleArgs = preset.id.startsWith('video-') && preset.id !== 'video-gif'
      ? buildScaleArgs(refs.scaleWidth.value)
      : [];

    const args = preset.args({
      input,
      output,
      audioBitrate: refs.audioBitrate.value,
      videoBitrate: refs.videoBitrate.value,
      trimArgs,
      scaleArgs,
      gifFps: refs.gifFps.value,
      scaleWidth: refs.scaleWidth.value,
    });

    await ffmpeg.exec(['-y', ...args]);
    const data = await ffmpeg.readFile(output);
    const blob = new Blob([data.buffer], { type: preset.outputMime });
    helpers.downloadBlob(blob, output);
    setStatus(`Done. Downloaded ${output}.`, 'success');
  } finally {
    try { await ffmpeg.deleteFile(input); } catch {}
    try { await ffmpeg.deleteFile(output); } catch {}
    refs.convertBtn.disabled = false;
    refs.loadBtn.disabled = false;
  }
}

function updateHint(refs, file) {
  const preset = PRESETS.find((item) => item.id === refs.preset.value) || PRESETS[0];
  const isGif = preset.id === 'video-gif';
  const isVideoOutput = preset.id === 'video-mp4' || preset.id === 'video-webm';
  refs.videoOptions.style.display = isVideoOutput || isGif ? '' : 'none';
  refs.gifOptions.style.display = isGif ? '' : 'none';
  refs.hint.textContent = file
    ? `${file.name} will be exported as .${preset.extension}. For large media, conversion can be slow.`
    : `Choose a media file and export as .${preset.extension}.`;
}

export function render({ root, files, setStatus, helpers }) {
  const file = files?.[0] || null;
  root.innerHTML = `
    <div class="module-panel">
      <div class="notice-box">
        <strong>Heavy lazy module</strong>
        <p>This loads FFmpeg WebAssembly only when you use audio/video conversion. Files still process in your browser. Very large videos may be slow or fail on low-memory devices.</p>
      </div>

      <div class="grid-controls two">
        <label class="control">
          Output type
          <select id="mediaPreset">
            ${PRESETS.map((preset) => `<option value="${preset.id}">${escapeHtml(preset.label)}</option>`).join('')}
          </select>
        </label>
        <label class="control">
          Audio bitrate
          <select id="audioBitrate">
            <option value="96k">96k smaller</option>
            <option value="128k" selected>128k balanced</option>
            <option value="192k">192k better</option>
            <option value="256k">256k high</option>
          </select>
        </label>
        <label class="control">
          Start time optional
          <input id="trimStart" type="text" placeholder="0 or 00:30">
        </label>
        <label class="control">
          Duration optional
          <input id="trimDuration" type="text" placeholder="60 or 01:30">
        </label>
      </div>

      <div id="videoOptions" class="grid-controls two module-subpanel">
        <label class="control">
          Video bitrate
          <select id="videoBitrate">
            <option value="800k">800k small</option>
            <option value="1500k" selected>1500k balanced</option>
            <option value="2500k">2500k better</option>
            <option value="4500k">4500k high</option>
          </select>
        </label>
        <label class="control">
          Resize width optional
          <input id="scaleWidth" type="number" min="160" max="3840" step="2" placeholder="1280">
        </label>
      </div>

      <div id="gifOptions" class="grid-controls two module-subpanel">
        <label class="control">
          GIF FPS
          <select id="gifFps">
            <option value="8">8 fps small</option>
            <option value="12" selected>12 fps balanced</option>
            <option value="18">18 fps smoother</option>
          </select>
        </label>
      </div>

      <p class="module-hint" id="mediaHint"></p>

      <div class="button-row">
        <button class="secondary-button" id="loadMediaEngine" type="button">Load media engine</button>
        <button class="action-button" id="convertMedia" type="button">Convert media</button>
      </div>

      <div class="progress-wrap">
        <progress id="mediaProgress" max="100" value="0"></progress>
        <span id="mediaProgressLabel">0%</span>
      </div>

      <pre class="result-box media-log" id="mediaLog">Media log will appear here.</pre>
    </div>
  `;

  const refs = {
    preset: root.querySelector('#mediaPreset'),
    audioBitrate: root.querySelector('#audioBitrate'),
    videoBitrate: root.querySelector('#videoBitrate'),
    start: root.querySelector('#trimStart'),
    duration: root.querySelector('#trimDuration'),
    scaleWidth: root.querySelector('#scaleWidth'),
    gifFps: root.querySelector('#gifFps'),
    videoOptions: root.querySelector('#videoOptions'),
    gifOptions: root.querySelector('#gifOptions'),
    hint: root.querySelector('#mediaHint'),
    loadBtn: root.querySelector('#loadMediaEngine'),
    convertBtn: root.querySelector('#convertMedia'),
    progress: root.querySelector('#mediaProgress'),
    progressLabel: root.querySelector('#mediaProgressLabel'),
    log: root.querySelector('#mediaLog'),
  };

  updateHint(refs, file);
  refs.preset.addEventListener('change', () => updateHint(refs, file));
  refs.loadBtn.addEventListener('click', async () => {
    try {
      await loadFFmpeg(setStatus, refs);
    } catch (err) {
      setStatus(err.message || 'Could not load media engine.', 'error');
    }
  });
  refs.convertBtn.addEventListener('click', async () => {
    try {
      await convertMedia({ file, refs, helpers, setStatus });
    } catch (err) {
      setStatus(err.message || 'Could not convert media.', 'error');
    }
  });

  if (!file) setStatus('Choose one audio or video file to begin.', 'info');
}
