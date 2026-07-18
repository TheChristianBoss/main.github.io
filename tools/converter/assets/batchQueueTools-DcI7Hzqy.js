var e={png:{mime:`image/png`,ext:`png`,quality:!1},jpg:{mime:`image/jpeg`,ext:`jpg`,quality:!0},webp:{mime:`image/webp`,ext:`webp`,quality:!0}};function t(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#039;`)}function n(e,t=`,`){let n=[],r=``,i=!1;for(let a=0;a<e.length;a+=1){let o=e[a],s=e[a+1];o===`"`&&i&&s===`"`?(r+=`"`,a+=1):o===`"`?i=!i:o===t&&!i?(n.push(r),r=``):r+=o}return n.push(r),n.map(e=>e.trim())}function r(e){let t=e.replace(/\r\n/g,`
`).replace(/\r/g,`
`).split(`
`).filter(e=>e.trim());if(!t.length)return`[]`;let r=n(t[0],`,`).map((e,t)=>e||`column_${t+1}`),i=t.slice(1).map(e=>{let t=n(e,`,`);return r.reduce((e,n,r)=>(e[n]=t[r]??``,e),{})});return JSON.stringify(i,null,2)}function i(e){let t=e=>e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`),n=e=>t(e).replace(/\*\*(.+?)\*\*/g,`<strong>$1</strong>`).replace(/\*(.+?)\*/g,`<em>$1</em>`).replace(/`(.+?)`/g,`<code>$1</code>`);return e.replace(/\r\n/g,`
`).split(`
`).map(e=>{let t=e.trim();return t?t.startsWith(`# `)?`<h1>${n(t.slice(2))}</h1>`:t.startsWith(`## `)?`<h2>${n(t.slice(3))}</h2>`:t.startsWith(`### `)?`<h3>${n(t.slice(4))}</h3>`:t.startsWith(`- `)?`<li>${n(t.slice(2))}</li>`:`<p>${n(t)}</p>`:``}).join(`
`)}async function a(e,t,n,r,i=``){let a=await t.loadImageFromFile(e),o=Number.parseInt(n,10),s=Number.isFinite(o)&&o>0&&a.width>o?o/a.width:1,c=document.createElement(`canvas`);c.width=Math.max(1,Math.round(a.width*s)),c.height=Math.max(1,Math.round(a.height*s));let l=c.getContext(`2d`,{alpha:!i});return i&&(l.fillStyle=i,l.fillRect(0,0,c.width,c.height)),l.drawImage(a,0,0,c.width,c.height),c}async function o(t,n,o,s){if(n.startsWith(`image-`)){if(!/^image\//.test(t.type||``)&&!/\.(png|jpe?g|webp|svg)$/i.test(t.name))throw Error(`Skipped: not an image`);let r=e[n.replace(`image-`,``)]||e.webp,i=await a(t,o,s.maxWidth,s.quality,r.mime===`image/jpeg`?`#ffffff`:``),c=await o.canvasToBlob(i,r.mime,r.quality?s.quality:void 0);return new File([c],`${o.safeFileBase(t.name)}.${r.ext}`,{type:r.mime})}let c=await o.readFileAsText(t),l=c,u=`txt`,d=`text/plain`;return n===`json-pretty`&&(l=JSON.stringify(JSON.parse(c),null,2),u=`json`,d=`application/json`),n===`json-minify`&&(l=JSON.stringify(JSON.parse(c)),u=`json`,d=`application/json`),n===`csv-json`&&(l=r(c),u=`json`,d=`application/json`),n===`md-html`&&(l=i(c),u=`html`,d=`text/html`),new File([l],`${o.safeFileBase(t.name)}.${u}`,{type:`${d};charset=utf-8`})}function s({root:e,files:n,setStatus:r,helpers:i}){let a=[];e.innerHTML=`
    <div class="module-panel">
      <div class="notice-box">
        <strong>Batch queue</strong>
        <p>Drop several files, choose a preset, convert them one by one, then download everything as one ZIP.</p>
      </div>
      <div class="grid-controls two">
        <label class="control">
          Batch preset
          <select id="batchMode">
            <optgroup label="Images">
              <option value="image-webp">Images → WEBP</option>
              <option value="image-jpg">Images → JPEG</option>
              <option value="image-png">Images → PNG</option>
            </optgroup>
            <optgroup label="Text/Data">
              <option value="json-pretty">JSON files → pretty JSON</option>
              <option value="json-minify">JSON files → minified JSON</option>
              <option value="csv-json">CSV files → JSON</option>
              <option value="md-html">Markdown files → HTML</option>
            </optgroup>
          </select>
        </label>
        <label class="control">
          Image max width, optional
          <input id="batchMaxWidth" type="number" min="1" placeholder="1280">
        </label>
        <label class="control">
          Image quality
          <input id="batchQuality" type="range" min="40" max="100" value="86">
        </label>
        <div class="control">
          <label>Output</label>
          <div class="badge-list"><span class="badge">Queue status</span><span class="badge">Download all as ZIP</span><span class="badge">Skips incompatible files</span></div>
        </div>
      </div>
      <div class="button-row">
        <button class="action-button" id="runBatch" type="button" ${n.length?``:`disabled`}>Run batch queue</button>
        <button class="secondary-button" id="cancelBatch" type="button" disabled>Cancel batch</button>
        <button class="secondary-button" id="downloadBatch" type="button" disabled>Download all as ZIP</button>
        <button class="secondary-button" id="clearBatch" type="button">Clear results</button>
      </div>
      <div class="queue-list" id="queueList">${n.length?n.map((e,n)=>`<div class="queue-item"><span>${t(e.name)}</span><small>Waiting • #${n+1} • ${i.formatBytes(e.size)}</small></div>`).join(``):`<div class="queue-item"><span>No files selected.</span><small>Choose files above.</small></div>`}</div>
      <pre class="result-box" id="batchLog">Batch log will appear here.</pre>
    </div>
  `;let s=e.querySelector(`#batchMode`),c=e.querySelector(`#batchMaxWidth`),l=e.querySelector(`#batchQuality`),u=e.querySelector(`#runBatch`),d=e.querySelector(`#cancelBatch`),f=e.querySelector(`#downloadBatch`),p=e.querySelector(`#clearBatch`),m=!1,h=e.querySelector(`#queueList`),g=e.querySelector(`#batchLog`);function _(e=new Map){h.innerHTML=n.length?n.map((n,r)=>{let a=e.get(r)||`Waiting`;return`<div class="queue-item"><span>${t(n.name)}</span><small>${t(a)} • #${r+1} • ${i.formatBytes(n.size)}</small></div>`}).join(``):`<div class="queue-item"><span>No files selected.</span><small>Choose files above.</small></div>`}u.addEventListener(`click`,async()=>{a=[];let e=new Map;try{if(!n.length)throw Error(`Choose files first.`);m=!1,u.disabled=!0,d.disabled=!1,f.disabled=!0,g.textContent=``;let t={maxWidth:c.value,quality:Number(l.value)/100};for(let r=0;r<n.length;r+=1){if(m){g.textContent+=`Batch cancelled after ${a.length} converted file${a.length===1?``:`s`}.
`;break}let c=n[r];e.set(r,`Converting`),_(e);try{let n=await o(c,s.value,i,t);a.push(n),e.set(r,`Done → ${n.name}`),g.textContent+=`✓ ${c.name} → ${n.name} (${i.formatBytes(n.size)})\n`}catch(t){let n=i.friendlyErrorMessage?i.friendlyErrorMessage(t,`batch conversion`):t.message||`Failed`;e.set(r,n),g.textContent+=`✗ ${c.name}: ${n}\n`}}if(_(e),!a.length)throw Error(m?`Batch cancelled before any files were converted.`:`No files converted. Check that the files match the selected preset.`);f.disabled=!1,r(m?`Batch cancelled. ${a.length} converted file${a.length===1?``:`s`} ready to download.`:`Batch complete. ${a.length} file${a.length===1?``:`s`} ready.`,m?`info`:`success`)}catch(e){r(i.friendlyErrorMessage?i.friendlyErrorMessage(e,`batch conversion`):e.message||`Batch conversion failed.`,`error`)}finally{u.disabled=!1,d.disabled=!0}}),d.addEventListener(`click`,()=>{m=!0,d.disabled=!0,g.textContent+=`Cancel requested. Finishing current file, then stopping batch.
`,r(`Cancel requested. The current file will finish, then the batch stops.`,`info`)}),f.addEventListener(`click`,async()=>{if(!a.length)return;let e=await i.createZipBlob(a,`converted-batch`);i.downloadBlob(e,`converted-batch.zip`),r(`Downloaded batch ZIP (${i.formatBytes(e.size)}).`,`success`)}),p.addEventListener(`click`,()=>{a=[],m=!1,_(),g.textContent=`Batch log cleared.`,f.disabled=!0})}export{s as render};