var e=[{label:`PNG`,ext:`png`,mime:`image/png`,quality:!1},{label:`JPEG`,ext:`jpg`,mime:`image/jpeg`,quality:!0},{label:`WEBP`,ext:`webp`,mime:`image/webp`,quality:!0},{label:`ICO favicon`,ext:`ico`,mime:`image/x-icon`,quality:!0,icon:!0},{label:`Image PDF`,ext:`pdf`,mime:`application/pdf`,quality:!0,pdf:!0}],t={custom:{label:`Custom settings`},smallest:{label:`Smallest file size`,format:`webp`,quality:70,width:1200},best:{label:`Best quality`,format:`png`,quality:100,width:``},web:{label:`Web optimized`,format:`webp`,quality:84,width:1600},email:{label:`Email friendly`,format:`jpg`,quality:78,width:1200},social:{label:`Social media`,format:`jpg`,quality:88,width:1080},favicon:{label:`Favicon / app icon`,format:`ico`,quality:92,width:64}};function n(e){return new TextEncoder().encode(String(e))}function r(e){return typeof e==`string`?n(e).length:e.byteLength||e.length||0}function i(e){let t=``;for(let n of String(e??``)){let e=n.codePointAt(0);(e===9||e===10||e===13||e>=32&&e!==127)&&(t+=n)}return t}function a(e){let t=i(e);if([...t].every(e=>e.codePointAt(0)<=126))return`(${t.replace(/\\/g,`\\\\`).replace(/\(/g,`\\(`).replace(/\)/g,`\\)`).replace(/\r/g,`\\r`).replace(/\n/g,`\\n`).replace(/\t/g,`\\t`)})`;let n=`FEFF`;for(let e=0;e<t.length;e+=1)n+=t.charCodeAt(e).toString(16).padStart(4,`0`).toUpperCase();return`<${n}>`}function o(e){let t=1,i=t++,o=t++,s=t++,c=[],l=[],u=[];e.forEach(e=>{let n=t++,r=t++,i=t++;c.push({id:n,imageId:r,contentId:i,width:e.width,height:e.height,name:e.name}),l.push({id:r,width:e.width,height:e.height,data:e.jpegBytes}),u.push({id:i,imageId:r,width:e.width,height:e.height})});let d=new Map;d.set(i,[`<< /Type /Catalog /Pages ${o} 0 R >>`]),d.set(o,[`<< /Type /Pages /Kids [${c.map(e=>`${e.id} 0 R`).join(` `)}] /Count ${c.length} >>`]),d.set(s,[`<< /Producer ${a(`Christian Goblin File Converter`)} /Title ${a(e[0]?.name||`Converted Images`)} >>`]);for(let e of c)d.set(e.id,[`<< /Type /Page /Parent ${o} 0 R /MediaBox [0 0 ${e.width} ${e.height}] /Resources << /XObject << /Im${e.imageId} ${e.imageId} 0 R >> >> /Contents ${e.contentId} 0 R >>`]);for(let e of l)d.set(e.id,[`<< /Type /XObject /Subtype /Image /Width ${e.width} /Height ${e.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${e.data.length} >>\nstream\n`,e.data,`
endstream`]);for(let e of u){let t=`q\n${e.width} 0 0 ${e.height} 0 0 cm\n/Im${e.imageId} Do\nQ`;d.set(e.id,[`<< /Length ${n(t).length} >>\nstream\n${t}\nendstream`])}let f=[],p=[0],m=0,h=e=>{f.push(e),m+=r(e)};h(`%PDF-1.4
% Christian Goblin File Converter
`);for(let e=1;e<t;e+=1){p[e]=m,h(`${e} 0 obj\n`);for(let t of d.get(e))h(t);h(`
endobj
`)}let g=m;h(`xref\n0 ${t}\n0000000000 65535 f \n`);for(let e=1;e<t;e+=1)h(`${String(p[e]).padStart(10,`0`)} 00000 n \n`);return h(`trailer\n<< /Size ${t} /Root ${i} 0 R /Info ${s} 0 R >>\nstartxref\n${g}\n%%EOF`),new Blob(f,{type:`application/pdf`})}function s(e,t=64){let n=new Uint8Array([0,0,1,0,1,0,t>=256?0:t,t>=256?0:t,0,0,1,0,32,0,e.length&255,e.length>>>8&255,e.length>>>16&255,e.length>>>24&255,22,0,0,0]);return new Blob([n,e],{type:`image/x-icon`})}async function c(e,t,n){let r=await t.loadImageFromFile(e),i=Number.parseInt(n.maxWidth,10),a=Number.parseInt(n.maxHeight,10),o=Number.parseFloat(n.scalePercent||`100`),s=Number.parseInt(n.rotate||`0`,10)||0,c=Number.isFinite(i)&&i>0&&r.width>i?i/r.width:1,l=Number.isFinite(a)&&a>0&&r.height>a?a/r.height:1,u=Number.isFinite(o)&&o>0?o/100:1,d=Math.min(c,l)*u,f=Math.max(1,Math.round(r.width*d)),p=Math.max(1,Math.round(r.height*d)),m=Math.abs(s%180)===90,h=document.createElement(`canvas`);h.width=m?p:f,h.height=m?f:p;let g=h.getContext(`2d`,{alpha:!n.background});return n.background&&(g.fillStyle=n.background,g.fillRect(0,0,h.width,h.height)),s?(g.translate(h.width/2,h.height/2),g.rotate(s*Math.PI/180),g.drawImage(r,-f/2,-p/2,f,p)):g.drawImage(r,0,0,f,p),h}async function l(e,t,n,r){let i=n.mime===`image/jpeg`||n.pdf||r.forceBackground,a=await c(e,t,{...r,background:i?r.backgroundColor||`#ffffff`:``});if(n.icon){let n=document.createElement(`canvas`),i=Math.min(256,Math.max(16,Number.parseInt(r.maxWidth,10)||64));n.width=i,n.height=i;let o=n.getContext(`2d`);o.fillStyle=r.backgroundColor||`#ffffff`,o.fillRect(0,0,i,i);let c=Math.min(i/a.width,i/a.height),l=a.width*c,u=a.height*c;o.drawImage(a,(i-l)/2,(i-u)/2,l,u);let d=await t.canvasToBlob(n,`image/png`),f=s(new Uint8Array(await d.arrayBuffer()),i);return{name:`${t.safeFileBase(e.name)}.ico`,blob:f,width:i,height:i}}let o=await t.canvasToBlob(a,n.mime,n.quality?r.quality:void 0);return{name:`${t.safeFileBase(e.name)}.${n.ext}`,blob:o,width:a.width,height:a.height}}function u({root:n,files:r,setStatus:i,helpers:a}){n.innerHTML=`
    <div class="module-panel">
      <div class="grid-controls">
        <div class="control">
          <label for="imagePreset">Preset</label>
          <select id="imagePreset">
            ${Object.entries(t).map(([e,t])=>`<option value="${e}">${t.label}</option>`).join(``)}
          </select>
        </div>
        <div class="control">
          <label for="imageFormat">Output format</label>
          <select id="imageFormat">
            ${e.map(e=>`<option value="${e.ext}">${e.label}</option>`).join(``)}
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
        <div class="control">
          <label for="scalePercent">Resize percentage</label>
          <input id="scalePercent" type="number" min="1" max="400" value="100">
        </div>
        <div class="control">
          <label for="rotateImage">Rotate</label>
          <select id="rotateImage">
            <option value="0">No rotation</option>
            <option value="90">90° right</option>
            <option value="180">180°</option>
            <option value="270">90° left</option>
          </select>
        </div>
        <div class="control">
          <label for="backgroundColor">JPEG/ICO background</label>
          <input id="backgroundColor" type="color" value="#ffffff">
        </div>
        <div class="control full">
          <label>Supported now</label>
          <div class="badge-list">
            <span class="badge">PNG ↔ JPEG ↔ WEBP</span>
            <span class="badge">SVG → PNG/JPEG/WEBP/PDF</span>
            <span class="badge">Batch images → ZIP</span>
            <span class="badge">Images → PDF</span>
            <span class="badge">ICO favicon</span>
            <span class="badge">Rotate / resize presets</span>
            <span class="badge">Before/after preview</span>
          </div>
        </div>
      </div>
      <div class="button-row">
        <button class="action-button" id="convertImages" type="button" ${r.length?``:`disabled`}>Convert images</button>
      </div>
      <div id="imageResult"></div>
    </div>
  `;let s=n.querySelector(`#imagePreset`),u=n.querySelector(`#imageFormat`),d=n.querySelector(`#imageQuality`),f=n.querySelector(`#qualityLabel`),p=n.querySelector(`#maxWidth`),m=n.querySelector(`#maxHeight`),h=n.querySelector(`#scalePercent`),g=n.querySelector(`#rotateImage`),_=n.querySelector(`#backgroundColor`),v=n.querySelector(`#imageResult`);d.addEventListener(`input`,()=>{f.textContent=d.value}),s.addEventListener(`change`,()=>{let e=t[s.value];!e||s.value===`custom`||(e.format&&(u.value=e.format),e.quality&&(d.value=e.quality,f.textContent=e.quality),e.width!==void 0&&(p.value=e.width),e.format===`ico`&&(m.value=e.width||64))}),n.querySelector(`#convertImages`).addEventListener(`click`,async()=>{if(!r.length)return;let t=e.find(e=>e.ext===u.value)||e[0],n={quality:Number(d.value)/100,maxWidth:p.value,maxHeight:m.value,scalePercent:h.value,rotate:g.value,backgroundColor:_.value};i(`Converting ${r.length} image${r.length===1?``:`s`}…`),v.innerHTML=``;try{if(t.pdf){let e=[];for(let t of r){let r=await c(t,a,{...n,background:`#ffffff`}),i=await a.canvasToBlob(r,`image/jpeg`,n.quality);e.push({name:t.name,width:r.width,height:r.height,jpegBytes:new Uint8Array(await i.arrayBuffer())})}let t=o(e);a.downloadBlob(t,r.length===1?`${a.safeFileBase(r[0].name)}.pdf`:`converted-images.pdf`),i(`Done. Downloaded PDF with ${e.length} page${e.length===1?``:`s`} (${a.formatBytes(t.size)}).`,`success`),v.innerHTML=`<div class="result-box">Created image PDF with ${e.length} page${e.length===1?``:`s`}.</div>`;return}let e=[];for(let i of r)e.push(await l(i,a,t,n));if(e.length===1)a.downloadBlob(e[0].blob,e[0].name),i(`Done. Downloaded ${e[0].name} (${a.formatBytes(e[0].blob.size)}).`,`success`);else{let t=e.map(e=>new File([e.blob],e.name,{type:e.blob.type})),n=await a.createZipBlob(t,`converted-images`);a.downloadBlob(n,`converted-images.zip`),i(`Done. Downloaded ZIP with ${e.length} converted images (${a.formatBytes(n.size)}).`,`success`)}let s=r.reduce((e,t)=>e+Number(t.size||0),0),u=e.reduce((e,t)=>e+Number(t.blob.size||0),0),d=s?Math.round((1-u/s)*100):0,f=``;if(e.length===1&&e[0].blob.type.startsWith(`image/`)){let t=URL.createObjectURL(r[0]),n=URL.createObjectURL(e[0].blob);window.setTimeout(()=>{URL.revokeObjectURL(t),URL.revokeObjectURL(n)},15e3),f=`<div class="preview-grid"><div class="preview-card"><strong>Original</strong><img src="${t}" alt="Original preview"></div><div class="preview-card"><strong>Converted</strong><img src="${n}" alt="Converted preview"></div></div>`}v.innerHTML=`<div class="compare-stats"><div class="stat-pill"><small>Original</small><strong>${a.formatBytes(s)}</strong></div><div class="stat-pill"><small>Converted</small><strong>${a.formatBytes(u)}</strong></div><div class="stat-pill"><small>Size change</small><strong>${d>0?d+`% smaller`:Math.abs(d)+`% larger`}</strong></div></div><div class="result-box"><h3>Converted files</h3>${e.map(e=>`${a.escapeHtml(e.name)} — ${e.width}×${e.height} — ${a.formatBytes(e.blob.size)}`).join(`
`)}</div>${f}`}catch(e){let t=a.friendlyErrorMessage?a.friendlyErrorMessage(e,`image conversion`):e.message||`Image conversion failed.`;i(t,`error`),v.innerHTML=a.renderErrorBox?a.renderErrorBox(t):`<div class="error-box">${a.escapeHtml(t)}</div>`}})}export{o as buildPdfFromJpegs,u as render};