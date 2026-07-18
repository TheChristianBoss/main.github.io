var e=[{id:`json-pretty`,label:`JSON → Pretty JSON`,ext:`json`,mime:`application/json`},{id:`json-minify`,label:`JSON → Minified JSON`,ext:`json`,mime:`application/json`},{id:`csv-json`,label:`CSV → JSON`,ext:`json`,mime:`application/json`},{id:`json-csv`,label:`JSON → CSV`,ext:`csv`,mime:`text/csv`},{id:`csv-tsv`,label:`CSV → TSV`,ext:`tsv`,mime:`text/tab-separated-values`},{id:`tsv-csv`,label:`TSV → CSV`,ext:`csv`,mime:`text/csv`},{id:`json-yaml`,label:`JSON → YAML-style text`,ext:`yaml`,mime:`text/yaml`},{id:`yaml-json`,label:`Simple YAML-style text → JSON`,ext:`json`,mime:`application/json`},{id:`markdown-html`,label:`Markdown → HTML`,ext:`html`,mime:`text/html`},{id:`html-text`,label:`HTML → Plain text`,ext:`txt`,mime:`text/plain`},{id:`plain-txt`,label:`Any text → .txt`,ext:`txt`,mime:`text/plain`}];function t(e,t=`,`){let n=[],r=``,i=!1;for(let a=0;a<e.length;a+=1){let o=e[a],s=e[a+1];o===`"`&&i&&s===`"`?(r+=`"`,a+=1):o===`"`?i=!i:o===t&&!i?(n.push(r),r=``):r+=o}return n.push(r),n.map(e=>e.trim())}function n(e,n=`,`){let r=e.replace(/\r\n/g,`
`).replace(/\r/g,`
`).split(`
`).filter(e=>e.trim());if(!r.length)return`[]`;let i=t(r[0],n).map((e,t)=>e||`column_${t+1}`),a=r.slice(1).map(e=>{let r=t(e,n);return i.reduce((e,t,n)=>(e[t]=r[n]??``,e),{})});return JSON.stringify(a,null,2)}function r(e,t=`,`){let n=e==null?``:String(e);return(t===`	`?/["\n\r\t]/:/[",\n\r]/).test(n)?`"${n.replace(/"/g,`""`)}"`:n}function i(e,t=`,`){let n=JSON.parse(e),i=Array.isArray(n)?n:[n],a=[...new Set(i.flatMap(e=>Object.keys(e||{})))];if(!a.length)return``;let o=[a.map(e=>r(e,t)).join(t)];return i.forEach(e=>o.push(a.map(n=>r(e?.[n],t)).join(t))),o.join(`
`)}function a(e){return e.replace(/\r\n/g,`
`).replace(/\r/g,`
`).split(`
`).filter(Boolean).map(e=>t(e,`,`)).map(e=>e.map(e=>r(e,`	`)).join(`	`)).join(`
`)}function o(e){return e.replace(/\r\n/g,`
`).replace(/\r/g,`
`).split(`
`).filter(Boolean).map(e=>t(e,`	`)).map(e=>e.map(e=>r(e,`,`)).join(`,`)).join(`
`)}function s(e,t=0){let n=`  `.repeat(t);return Array.isArray(e)?e.map(e=>e&&typeof e==`object`?`${n}-\n${s(e,t+1)}`:`${n}- ${String(e??``)}`).join(`
`):e&&typeof e==`object`?Object.entries(e).map(([e,r])=>r&&typeof r==`object`?`${n}${e}:\n${s(r,t+1)}`:`${n}${e}: ${String(r??``)}`).join(`
`):`${n}${String(e??``)}`}function c(e){let t={};for(let n of e.split(/\r?\n/)){let e=n.trim();if(!e||e.startsWith(`#`)||!e.includes(`:`))continue;let r=e.indexOf(`:`),i=e.slice(0,r).trim(),a=e.slice(r+1).trim();i&&(/^(true|false)$/i.test(a)?t[i]=a.toLowerCase()===`true`:/^-?\d+(\.\d+)?$/.test(a)?t[i]=Number(a):t[i]=a.replace(/^['"]|['"]$/g,``))}return JSON.stringify(t,null,2)}function l(e){let t=e=>e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`),n=e=>t(e).replace(/\*\*(.+?)\*\*/g,`<strong>$1</strong>`).replace(/\*(.+?)\*/g,`<em>$1</em>`).replace(/`(.+?)`/g,`<code>$1</code>`);return e.replace(/\r\n/g,`
`).split(`
`).map(e=>{let t=e.trim();return t?t.startsWith(`### `)?`<h3>${n(t.slice(4))}</h3>`:t.startsWith(`## `)?`<h2>${n(t.slice(3))}</h2>`:t.startsWith(`# `)?`<h1>${n(t.slice(2))}</h1>`:t.startsWith(`- `)?`<li>${n(t.slice(2))}</li>`:`<p>${n(t)}</p>`:``}).join(`
`)}function u(e){return new DOMParser().parseFromString(e,`text/html`).body.textContent.replace(/\n{3,}/g,`

`).trim()}function d(e,t){switch(t){case`json-pretty`:return{text:JSON.stringify(JSON.parse(e),null,2),ext:`json`,mime:`application/json`};case`json-minify`:return{text:JSON.stringify(JSON.parse(e)),ext:`json`,mime:`application/json`};case`csv-json`:return{text:n(e,`,`),ext:`json`,mime:`application/json`};case`json-csv`:return{text:i(e,`,`),ext:`csv`,mime:`text/csv`};case`csv-tsv`:return{text:a(e),ext:`tsv`,mime:`text/tab-separated-values`};case`tsv-csv`:return{text:o(e),ext:`csv`,mime:`text/csv`};case`json-yaml`:return{text:s(JSON.parse(e)),ext:`yaml`,mime:`text/yaml`};case`yaml-json`:return{text:c(e),ext:`json`,mime:`application/json`};case`markdown-html`:return{text:l(e),ext:`html`,mime:`text/html`};case`html-text`:return{text:u(e),ext:`txt`,mime:`text/plain`};default:return{text:e,ext:`txt`,mime:`text/plain`}}}function f({root:t,files:n,setStatus:r,helpers:i}){t.innerHTML=`
    <div class="module-panel">
      <div class="grid-controls two">
        <div class="control">
          <label for="textMode">Conversion</label>
          <select id="textMode">
            ${e.map(e=>`<option value="${e.id}">${e.label}</option>`).join(``)}
          </select>
        </div>
        <div class="control">
          <label>Supported now</label>
          <div class="badge-list">
            <span class="badge">JSON</span>
            <span class="badge">CSV</span>
            <span class="badge">TSV</span>
            <span class="badge">Markdown</span>
            <span class="badge">HTML</span>
            <span class="badge">simple YAML</span>
          </div>
        </div>
        <div class="control full">
          <label for="textInput">Text input</label>
          <textarea id="textInput" placeholder="Drop a text-like file above or paste text here."></textarea>
        </div>
      </div>
      <div class="button-row">
        <button class="action-button" id="convertText" type="button">Convert & download</button>
        <button class="secondary-button" id="loadFileText" type="button" ${n[0]?``:`disabled`}>Load selected file text</button>
      </div>
      <pre class="result-box" id="textResult">Converted preview will appear here.</pre>
    </div>
  `;let a=t.querySelector(`#textInput`),o=t.querySelector(`#textMode`),s=t.querySelector(`#textResult`);async function c(){if(!n[0])return;let e=await i.readFileAsText(n[0]);a.value=e,s.textContent=e.slice(0,5e3),r(`Loaded ${n[0].name} as text.`,`success`)}t.querySelector(`#loadFileText`).addEventListener(`click`,async()=>{try{await c()}catch(e){r(i.friendlyErrorMessage?i.friendlyErrorMessage(e,`text loading`):e.message||`Could not load file.`,`error`)}}),n[0]&&c().catch(()=>{}),t.querySelector(`#convertText`).addEventListener(`click`,()=>{try{let e=a.value;if(!e.trim())throw Error(`Paste text or choose a text-like file first.`);let t=d(e,o.value),c=new Blob([t.text],{type:`${t.mime};charset=utf-8`});i.downloadBlob(c,`${i.safeFileBase(n[0]?.name||`converted`)}.${t.ext}`),s.textContent=t.text.slice(0,1e4),r(`Done. Downloaded .${t.ext} file (${i.formatBytes(c.size)}).`,`success`)}catch(e){let t=i.friendlyErrorMessage?i.friendlyErrorMessage(e,`text/data conversion`):e.message||`Text conversion failed.`;s.textContent=t,r(t,`error`)}})}export{f as render};