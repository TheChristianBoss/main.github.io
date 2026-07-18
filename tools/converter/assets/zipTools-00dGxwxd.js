function e(e,t){return e[t]|e[t+1]<<8}function t(e,t){return(e[t]|e[t+1]<<8|e[t+2]<<16|e[t+3]<<24)>>>0}function n(e){for(let t=e.length-22;t>=Math.max(0,e.length-66e3);--t)if(e[t]===80&&e[t+1]===75&&e[t+2]===5&&e[t+3]===6)return t;return-1}function r(r){let i=new TextDecoder,a=n(r);if(a<0)throw Error(`Could not find ZIP central directory.`);let o=e(r,a+10),s=t(r,a+16),c=[];for(let n=0;n<o;n+=1){if(t(r,s)!==33639248)throw Error(`Invalid ZIP central directory entry.`);let n=e(r,s+10),a=t(r,s+20),o=t(r,s+24),l=e(r,s+28),u=e(r,s+30),d=e(r,s+32),f=t(r,s+42),p=i.decode(r.subarray(s+46,s+46+l));c.push({name:p,method:n,compressedSize:a,uncompressedSize:o,localOffset:f}),s+=46+l+u+d}return c.filter(e=>!e.name.endsWith(`/`))}async function i(n,r){let i=r.localOffset;if(t(n,i)!==67324752)throw Error(`Invalid local file header for ${r.name}.`);let a=e(n,i+26),o=e(n,i+28),s=i+30+a+o,c=n.subarray(s,s+r.compressedSize);if(r.method===0)return new Blob([c],{type:`application/octet-stream`});if(r.method===8&&`DecompressionStream`in globalThis){let e=new Blob([c]).stream().pipeThrough(new DecompressionStream(`deflate-raw`));return new Response(e).blob()}throw Error(`${r.name} uses ZIP compression method ${r.method}. This browser can only extract stored files and some deflated files.`)}function a(e){return String(e||`extracted-file.bin`).replace(/\\/g,`/`).split(`/`).filter(e=>e&&e!==`.`&&e!==`..`).join(`/`)||`extracted-file.bin`}function o({root:e,files:t,setStatus:n,helpers:o}){e.innerHTML=`
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
            <span class="badge">Extract simple ZIPs into one download</span>
          </div>
        </div>
      </div>
      <div class="button-row">
        <button class="action-button" id="runZip" type="button" ${t.length?``:`disabled`}>Run ZIP tool</button>
      </div>
      <pre class="result-box" id="zipResult">ZIP results will appear here.</pre>
    </div>
  `;let s=e.querySelector(`#zipMode`),c=e.querySelector(`#zipResult`);e.querySelector(`#runZip`).addEventListener(`click`,async()=>{try{if(!t.length)throw Error(`Choose files first.`);if(s.value===`create`){let e=await o.createZipBlob(t,`christian-goblin-files`);o.downloadBlob(e,`christian-goblin-files.zip`),c.textContent=`Created ZIP with ${t.length} file${t.length===1?``:`s`}.\nSize: ${o.formatBytes(e.size)}\n\nNote: This uses ZIP store mode, which prioritizes compatibility and privacy over heavy compression.`,n(`Done. Downloaded ZIP (${o.formatBytes(e.size)}).`,`success`);return}let e=t.find(e=>/\.zip$/i.test(e.name)||e.type===`application/zip`)||t[0],l=new Uint8Array(await e.arrayBuffer()),u=r(l);if(s.value===`list`){c.textContent=u.length?u.map(e=>`${e.name}\n  compressed: ${o.formatBytes(e.compressedSize)}\n  original: ${o.formatBytes(e.uncompressedSize)}\n  method: ${e.method}`).join(`

`):`No file entries found.`,n(`Found ${u.length} ZIP entr${u.length===1?`y`:`ies`}.`,`success`);return}let d=[],f=[];for(let e of u)try{let t=await i(l,e),n=a(e.name);d.push(new File([t],n,{type:t.type||`application/octet-stream`}))}catch(t){f.push(`${e.name}: ${t.message}`)}if(d.length){let t=await o.createZipBlob(d,`extracted-files`);o.downloadBlob(t,`${o.safeFileBase(e.name)}-extracted.zip`)}c.textContent=`Extracted ${d.length} file${d.length===1?``:`s`} into one ZIP download.`+(f.length?`\n\nSkipped/failed:\n${f.join(`
`)}`:``),n(`ZIP extraction finished. Downloaded ${d.length} extracted file${d.length===1?``:`s`} as one ZIP.`,f.length?`info`:`success`)}catch(e){let t=o.friendlyErrorMessage?o.friendlyErrorMessage(e,`ZIP tool`):e.message||`ZIP tool failed.`;c.textContent=t,n(t,`error`)}})}export{o as render};