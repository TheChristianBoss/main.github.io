var e=new TextEncoder;function t(e){return[...new Uint8Array(e)].map(e=>e.toString(16).padStart(2,`0`)).join(``)}function n(e){let t=``,n=32768;for(let r=0;r<e.length;r+=n)t+=String.fromCharCode(...e.subarray(r,r+n));return btoa(t)}function r(e){let t=e.replace(/\s+/g,``),n=atob(t),r=new Uint8Array(n.length);for(let e=0;e<n.length;e+=1)r[e]=n.charCodeAt(e);return r}async function i(e,n){if(!e.length)throw Error(`Choose at least one file first.`);let r=[];for(let i of e){let e=await crypto.subtle.digest(`SHA-256`,await n.readFileAsArrayBuffer(i));r.push(`${i.name}\n  SHA-256: ${t(e)}\n  Size: ${n.formatBytes(i.size)}`)}return r.join(`

`)}function a({root:t,files:a,setStatus:o,helpers:s}){t.innerHTML=`
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
  `;let c=t.querySelector(`#utilityMode`),l=t.querySelector(`#utilityInput`),u=t.querySelector(`#utilityResult`),d=t.querySelector(`#downloadUtility`),f=null,p=`utility-result.txt`;function m(e,t,n){u.textContent=e,f=t||new Blob([e],{type:`text/plain;charset=utf-8`}),p=n||`utility-result.txt`,d.disabled=!1}t.querySelector(`#runUtility`).addEventListener(`click`,async()=>{try{let t=c.value;if(t===`sha256`){let e=await i(a,s);m(e,new Blob([e],{type:`text/plain;charset=utf-8`}),`sha256-report.txt`),o(`Created SHA-256 hash report.`,`success`)}else if(t===`file-base64`){if(!a[0])throw Error(`Choose a file first.`);let e=n(new Uint8Array(await a[0].arrayBuffer()));m(e,new Blob([e],{type:`text/plain;charset=utf-8`}),`${s.safeFileBase(a[0].name)}.b64.txt`),o(`Encoded ${a[0].name} as Base64.`,`success`)}else if(t===`text-base64-encode`){let t=n(e.encode(l.value));m(t,new Blob([t],{type:`text/plain;charset=utf-8`}),`base64-encoded.txt`),o(`Encoded text as Base64.`,`success`)}else if(t===`text-base64-decode`){let e=r(l.value),t=new TextDecoder().decode(e);m(t,new Blob([t],{type:`text/plain;charset=utf-8`}),`base64-decoded.txt`),o(`Decoded Base64 as text.`,`success`)}else if(t===`base64-file-decode`){let e=r(l.value),t=new Blob([e],{type:`application/octet-stream`});m(`Decoded ${s.formatBytes(t.size)} from Base64. Use Download result to save it.`,t,`decoded-from-base64.bin`),o(`Decoded Base64 as a binary file.`,`success`)}else if(t===`url-encode`){let e=encodeURIComponent(l.value);m(e,new Blob([e],{type:`text/plain;charset=utf-8`}),`url-encoded.txt`),o(`URL encoded text.`,`success`)}else if(t===`url-decode`){let e=decodeURIComponent(l.value);m(e,new Blob([e],{type:`text/plain;charset=utf-8`}),`url-decoded.txt`),o(`URL decoded text.`,`success`)}}catch(e){let t=s.friendlyErrorMessage?s.friendlyErrorMessage(e,`utility conversion`):e.message||`Utility failed.`;o(t,`error`),u.textContent=t,d.disabled=!0}}),d.addEventListener(`click`,()=>{f&&s.downloadBlob(f,p)})}export{a as render};