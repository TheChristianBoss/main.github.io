import{t as e}from"./index-D6i22IcY.js";var t=null,n=null,r={ffmpeg:new URL(`data:text/javascript;base64,ZXhwb3J0ICogZnJvbSAiLi9jbGFzc2VzLmpzIjsNCg==`,``+import.meta.url).href,util:new URL(`/tools/converter/assets/index-C0XQeWjT.js`,``+import.meta.url).href,coreBase:`https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm`},i=[{id:`audio-mp3`,label:`Audio → MP3`,extension:`mp3`,outputMime:`audio/mpeg`,args:({input:e,output:t,audioBitrate:n,trimArgs:r})=>[`-i`,e,...r,`-vn`,`-codec:a`,`libmp3lame`,`-b:a`,n,t]},{id:`audio-wav`,label:`Audio → WAV`,extension:`wav`,outputMime:`audio/wav`,args:({input:e,output:t,trimArgs:n})=>[`-i`,e,...n,`-vn`,`-codec:a`,`pcm_s16le`,t]},{id:`audio-ogg`,label:`Audio → OGG`,extension:`ogg`,outputMime:`audio/ogg`,args:({input:e,output:t,audioBitrate:n,trimArgs:r})=>[`-i`,e,...r,`-vn`,`-codec:a`,`libvorbis`,`-b:a`,n,t]},{id:`video-mp4`,label:`Video → MP4`,extension:`mp4`,outputMime:`video/mp4`,args:({input:e,output:t,videoBitrate:n,audioBitrate:r,trimArgs:i,scaleArgs:a})=>[`-i`,e,...i,...a,`-codec:v`,`libx264`,`-preset`,`veryfast`,`-movflags`,`faststart`,`-b:v`,n,`-codec:a`,`aac`,`-b:a`,r,t]},{id:`video-webm`,label:`Video → WEBM`,extension:`webm`,outputMime:`video/webm`,args:({input:e,output:t,videoBitrate:n,audioBitrate:r,trimArgs:i,scaleArgs:a})=>[`-i`,e,...i,...a,`-codec:v`,`libvpx-vp9`,`-b:v`,n,`-codec:a`,`libopus`,`-b:a`,r,t]},{id:`extract-audio-mp3`,label:`Video → MP3 audio`,extension:`mp3`,outputMime:`audio/mpeg`,args:({input:e,output:t,audioBitrate:n,trimArgs:r})=>[`-i`,e,...r,`-vn`,`-codec:a`,`libmp3lame`,`-b:a`,n,t]},{id:`video-gif`,label:`Video → GIF`,extension:`gif`,outputMime:`image/gif`,args:({input:e,output:t,trimArgs:n,gifFps:r,scaleWidth:i})=>{let a=[`fps=${r}`];return i&&a.push(`scale=${i}:-1:flags=lanczos`),[`-i`,e,...n,`-vf`,a.join(`,`),t]}}];function a(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#039;`)}function o(e=`media`){return String(e||`media`).replace(/\.[^/.]+$/,``).replace(/[^a-z0-9-_]+/gi,`-`).replace(/^-|-$/g,``)||`media`}function s(e){return e.arrayBuffer().then(e=>new Uint8Array(e))}function c(e){return/^audio\//.test(e?.type||``)||/^video\//.test(e?.type||``)||/\.(mp3|wav|m4a|aac|ogg|flac|mp4|webm|mov|avi|mkv|gif)$/i.test(e?.name||``)}function l(e=0){if(!e)return`0 B`;let t=[`B`,`KB`,`MB`,`GB`],n=Math.min(Math.floor(Math.log(e)/Math.log(1024)),t.length-1);return`${(e/1024**n).toFixed(n===0?0:1)} ${t[n]}`}function u(e){return e===`high`?`high-capacity device`:e===`medium`?`medium-capacity device`:`low/unknown-capacity device`}function d(e){let t=e?.deviceProfile?.tier||`medium`;return{tier:t,recommended:typeof e?.getRecommendedLimit==`function`?e.getRecommendedLimit(`media`,t):({low:80,medium:250,high:750}[t]||250)*1024*1024,hardMax:(typeof e?.getSizeGuide==`function`?e.getSizeGuide(`media`):null)?.max||1200*1024*1024,format:e?.formatBytes||l}}function f(e,t,n){if(!e.deviceAdvice)return;let{tier:r,recommended:i,hardMax:o,format:s}=d(n),c=Number(t?.size||0),l=`info`,f=`Estimated ${u(r)}. Recommended media file size: ${s(i)} or less.`;t&&(c>o?(l=`danger`,f=`${t.name} is ${s(c)}, which is above the browser caution point of ${s(o)}. Trim or compress it before converting.`):c>i?(l=`warn`,f=`${t.name} is ${s(c)}. It may still work, but ${s(i)} or less is recommended for this device.`):(l=`ok`,f=`${t.name} is ${s(c)}, which is within the recommended media size for this device.`)),e.deviceAdvice.dataset.level=l,e.deviceAdvice.innerHTML=`<strong>Device-aware media recommendation</strong><br>${a(f)}`}function p(e){let t=String(e||``).trim();if(!t)return``;if(/^\d+(\.\d+)?$/.test(t)||/^\d{1,2}:\d{2}(:\d{2})?(\.\d+)?$/.test(t))return t;throw Error(`Trim times must be seconds, mm:ss, or hh:mm:ss.`)}function m(e,t){let n=[],r=p(e),i=p(t);return r&&n.push(`-ss`,r),i&&n.push(`-t`,i),n}function h(e){let t=Number.parseInt(e,10);return!Number.isFinite(t)||t<=0?[]:[`-vf`,`scale=${t}:-2`]}async function g(i,a){return t||n||(n=(async()=>{a.convertBtn.disabled=!0,a.loadBtn.disabled=!0,i(`Loading FFmpeg media engine. This can take a moment the first time and needs a working connection for the on-demand core.`,`info`);let[{FFmpeg:n},{toBlobURL:o}]=await Promise.all([e(()=>import(r.ffmpeg),[]),e(()=>import(r.util),[])]),s=new n;s.on(`log`,({message:e})=>{a.log.textContent=`${a.log.textContent}\n${e}`.trim().slice(-7e3),a.log.scrollTop=a.log.scrollHeight}),s.on(`progress`,({progress:e,time:t})=>{let n=Number.isFinite(e)?Math.max(0,Math.min(100,Math.round(e*100))):0;a.progress.value=n,a.progressLabel.textContent=`${n}%${t?` • ${Math.round(t/1e6)}s processed`:``}`});let[c,l]=await Promise.all([o(`${r.coreBase}/ffmpeg-core.js`,`text/javascript`),o(`${r.coreBase}/ffmpeg-core.wasm`,`application/wasm`)]);return await s.load({coreURL:c,wasmURL:l}),t=s,a.loadBtn.disabled=!1,a.convertBtn.disabled=!1,i(`Media engine loaded. Choose a conversion and run it.`,`success`),s})().catch(e=>{throw n=null,a.loadBtn.disabled=!1,a.convertBtn.disabled=!1,e}),n)}async function _({file:e,refs:t,helpers:n,setStatus:r}){if(!e)throw Error(`Choose one audio or video file first.`);if(!c(e))throw Error(`This module expects an audio or video file.`);let a=d(n);if(e.size>a.hardMax)throw Error(`That file is very large for browser conversion (${a.format(e.size)}). Recommended for this device is ${a.format(a.recommended)} or less.`);e.size>a.recommended&&r(`This file is above the recommended size for your device (${a.format(a.recommended)}). It may be slow or fail.`,`info`);let l=i.find(e=>e.id===t.preset.value)||i[0],u=`input.${(e.name.match(/\.([a-z0-9]+)$/i)?.[1]||`bin`).toLowerCase()}`,f=`${o(e.name)}.${l.extension}`,p=await g(r,t);t.convertBtn.disabled=!0,t.loadBtn.disabled=!0,t.progress.value=0,t.progressLabel.textContent=`0%`,t.log.textContent=``,r(`Converting ${e.name}… Keep this tab open.`,`info`);try{try{await p.deleteFile(u)}catch{}try{await p.deleteFile(f)}catch{}await p.writeFile(u,await s(e));let i=m(t.start.value,t.duration.value),a=l.id.startsWith(`video-`)&&l.id!==`video-gif`?h(t.scaleWidth.value):[],o=l.args({input:u,output:f,audioBitrate:t.audioBitrate.value,videoBitrate:t.videoBitrate.value,trimArgs:i,scaleArgs:a,gifFps:t.gifFps.value,scaleWidth:t.scaleWidth.value});await p.exec([`-y`,...o]);let c=await p.readFile(f),d=new Blob([c],{type:l.outputMime});n.downloadBlob(d,f),r(`Done. Downloaded ${f}.`,`success`)}finally{try{await p.deleteFile(u)}catch{}try{await p.deleteFile(f)}catch{}t.convertBtn.disabled=!1,t.loadBtn.disabled=!1}}function v(e,r){try{if(!t&&!n){e.progressLabel.textContent=`No active engine`,r(`No media engine is currently loaded or converting.`,`info`);return}if(n&&!t){e.progressLabel.textContent=`Engine loading`,r(`The media engine is still loading and cannot be cancelled cleanly yet. If it stays stuck, refresh the page and try a smaller file.`,`info`);return}t&&(t.terminate(),t=null,n=null,e.log.textContent=`${e.log.textContent}
Conversion cancelled. Media engine was unloaded and can be loaded again.`.trim(),e.progress.value=0,e.progressLabel.textContent=`Cancelled`,e.loadBtn.disabled=!1,e.convertBtn.disabled=!1,r(`Cancelled media conversion. Load the media engine again before the next run.`,`info`))}catch(e){r(e.message||`Could not cancel conversion.`,`error`)}}function y(e,t,n){let r=i.find(t=>t.id===e.preset.value)||i[0],a=r.id===`video-gif`,o=r.id===`video-mp4`||r.id===`video-webm`;e.videoOptions.style.display=o||a?``:`none`,e.gifOptions.style.display=a?``:`none`,e.hint.textContent=t?`${t.name} will be exported as .${r.extension}. For large media, conversion can be slow or fail in browser mode.`:`Choose a media file and export as .${r.extension}.`,f(e,t,n)}function b({root:e,files:t,setStatus:n,helpers:r}){let o=t?.[0]||null;e.innerHTML=`
    <div class="module-panel">
      <div class="notice-box">
        <strong>Heavy lazy module</strong>
        <p>This loads FFmpeg WebAssembly only when you use audio/video conversion, including the FFmpeg core fetched on demand. Files still process in your browser, but very large videos may be slow or fail on low-memory devices.</p>
      </div>

      <div class="grid-controls two">
        <label class="control">
          Output type
          <select id="mediaPreset">
            ${i.map(e=>`<option value="${e.id}">${a(e.label)}</option>`).join(``)}
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
      <div class="media-device-box" id="mediaDeviceAdvice"></div>

      <div class="button-row">
        <button class="secondary-button" id="loadMediaEngine" type="button">Load media engine</button>
        <button class="action-button" id="convertMedia" type="button" ${o?``:`disabled`}>Convert media</button>
        <button class="secondary-button" id="cancelMedia" type="button">Cancel / unload engine</button>
      </div>

      <div class="progress-wrap">
        <progress id="mediaProgress" max="100" value="0"></progress>
        <span id="mediaProgressLabel">0%</span>
      </div>

      <pre class="result-box media-log" id="mediaLog">Media log will appear here.</pre>
    </div>
  `;let s={preset:e.querySelector(`#mediaPreset`),audioBitrate:e.querySelector(`#audioBitrate`),videoBitrate:e.querySelector(`#videoBitrate`),start:e.querySelector(`#trimStart`),duration:e.querySelector(`#trimDuration`),scaleWidth:e.querySelector(`#scaleWidth`),gifFps:e.querySelector(`#gifFps`),videoOptions:e.querySelector(`#videoOptions`),gifOptions:e.querySelector(`#gifOptions`),hint:e.querySelector(`#mediaHint`),deviceAdvice:e.querySelector(`#mediaDeviceAdvice`),loadBtn:e.querySelector(`#loadMediaEngine`),convertBtn:e.querySelector(`#convertMedia`),cancelBtn:e.querySelector(`#cancelMedia`),progress:e.querySelector(`#mediaProgress`),progressLabel:e.querySelector(`#mediaProgressLabel`),log:e.querySelector(`#mediaLog`)};y(s,o,r),s.preset.addEventListener(`change`,()=>y(s,o,r)),s.loadBtn.addEventListener(`click`,async()=>{try{await g(n,s)}catch(e){let t=e?.message||String(e||``);n(/Failed to construct 'Worker'|cannot be accessed from origin|SecurityError/i.test(t)?`Could not start the media worker. The app now uses same-origin worker files, so hard refresh this page and try again.`:r.friendlyErrorMessage?r.friendlyErrorMessage(e,`media engine`):t||`Could not load media engine.`,`error`)}}),s.convertBtn.addEventListener(`click`,async()=>{try{await _({file:o,refs:s,helpers:r,setStatus:n})}catch(e){n(r.friendlyErrorMessage?r.friendlyErrorMessage(e,`media conversion`):e.message||`Could not convert media.`,`error`)}}),s.cancelBtn.addEventListener(`click`,()=>v(s,n)),o||n(`Choose one audio or video file to begin.`,`info`)}export{b as render};