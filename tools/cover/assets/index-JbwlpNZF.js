(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`cg.coverLetter.draft.v3`,t={basics:{name:``,email:``,phone:``,location:``,date:new Date().toLocaleDateString(void 0,{year:`numeric`,month:`long`,day:`numeric`})},job:{title:``,company:``,hiringManager:``,source:``,description:``},fit:{experience:``,skills:``,achievements:``,whyCompany:``,callToAction:`I would welcome the opportunity to discuss how my background can support your team.`},settings:{tone:`professional`,length:`standard`,template:`modern`,accent:`#b88746`,font:`Georgia, serif`},letterText:``,lastSaved:``},n=new Set(`about above after again against all also am an and any are as at be because been before being below between both but by can candidate candidates did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own preferred qualifications required requirement requirements responsibility responsibilities same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with you your yours yourself yourselves role job company team work workplace`.split(` `)),r=c(),i=null,a=``,o=document.getElementById(`cover-root`);function s(e){return JSON.parse(JSON.stringify(e))}function c(){try{let n=localStorage.getItem(e);if(!n)return s(t);let r=JSON.parse(n);return l(s(t),r)}catch{return s(t)}}function l(e,t){for(let[n,r]of Object.entries(t||{}))r&&typeof r==`object`&&!Array.isArray(r)&&e[n]&&typeof e[n]==`object`?e[n]=l(e[n],r):e[n]=r;return e}function u(t=!1){clearTimeout(i);let n=()=>{try{r.lastSaved=new Date().toISOString(),localStorage.setItem(e,JSON.stringify(r)),M()}catch{j(`Browser storage is full or unavailable. You can still copy or download your letter.`,`warn`)}};t?n():i=setTimeout(n,300)}function d(e,t){let n=e.split(`.`),i=r;for(let e=0;e<n.length-1;e+=1)i=i[n[e]];i[n.at(-1)]=t,u(),q(),J()}function f(e){return String(e??``).trim()}function p(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function m(e){return String(e??``).replace(/\s+/g,` `).trim()}function h(e){return String(e||``).split(/[\n;•]+/).map(e=>m(e)).filter(Boolean)}function g(e){let t=m(e);return t?/[.!?]$/.test(t)?t:`${t}.`:``}function _(...e){return e.map(f).find(Boolean)||``}function v(e){let t=e.map(m).filter(Boolean);return t.length?t.length===1?t[0]:t.length===2?`${t[0]} and ${t[1]}`:`${t.slice(0,-1).join(`, `)}, and ${t.at(-1)}`:``}function y(){let{tone:e}=r.settings;return e===`warm`?`I was excited to see`:e===`confident`?`I am ready to bring my experience to`:e===`concise`?`I am applying for`:`I am writing to express my interest in`}function b(){let{tone:e}=r.settings;return e===`warm`?`Warm keeps the structure professional but uses a friendlier, more human opening.`:e===`confident`?`Confident sounds assertive without making claims the details do not support.`:e===`concise`?`Concise keeps paragraphs shorter and cuts extra setup language.`:`Professional uses direct, respectful business wording with a balanced tone.`}function x(e){let t=v(e);return t?r.settings.tone===`warm`?`I have built strengths in ${t}, and I try to bring those abilities with steadiness and care.`:r.settings.tone===`confident`?`My background in ${t} can translate directly into dependable results for this role.`:r.settings.tone===`concise`?`My strengths include ${t}.`:`My background includes ${t}, and I am comfortable turning those strengths into dependable day-to-day results.`:`My background has prepared me to learn quickly, communicate clearly, and contribute with steady attention to detail.`}function S(e){let t=v(e.map(e=>e.replace(/^[•-]\s*/,``)));return t?r.settings.tone===`warm`?`Some of the work I am proud of includes ${t}.`:r.settings.tone===`confident`?`Relevant results include ${t}.`:r.settings.tone===`concise`?`Selected results: ${t}.`:`Examples of my work include ${t}.`:`I try to bring ownership, humility, and consistency to the responsibilities entrusted to me.`}function C(){let{job:e,fit:n,settings:i}=r,a=_(e.title,`the open role`),o=_(e.company,`your organization`),s=h(n.skills).slice(0,5),c=h(n.achievements).slice(0,4),l=f(n.experience),d=g(n.whyCompany),p=g(n.callToAction||t.fit.callToAction),v=f(e.source),b=[];i.tone===`confident`?b.push(`${y()} ${o} as ${a}.`):i.tone===`concise`?b.push(`${y()} ${a} at ${o}.`):b.push(`${y()} the ${a} position at ${o}.`),v&&b.push(`I found the opportunity through ${v}.`),l?b.push(`I bring ${l} of relevant experience and a practical, results-focused approach.`):b.push(`I bring a practical, results-focused approach and a strong desire to contribute well.`);let C=x(s),w=S(c),T=d?`What draws me to ${o} is this: ${d}`:`I am especially interested in ${o} because the role appears to require both reliability and thoughtful problem-solving.`,E=i.tone===`warm`?`Thank you for taking the time to consider my application. ${p}`:`Thank you for your time and consideration. ${p}`,D=i.length===`compact`?[`${b.join(` `)} ${C}`,`${w} ${T}`,E]:i.length===`detailed`?[b.join(` `),`${C} ${w}`,T,`If selected, I would aim to bring clear communication, dependable follow-through, and a willingness to keep improving. ${E}`]:[b.join(` `),`${C} ${w}`,`${T} ${E}`];r.letterText=D.map(e=>m(e)).filter(Boolean).join(`

`),u(!0),K(),j(`Live view updated from your details. Review it, personalize it, then export.`,`success`),setTimeout(()=>document.getElementById(`letterText`)?.focus(),100)}function w(){return f(r.letterText)||T()}function T(){return`Your cover letter will appear here. Fill in the basics and click “Update live view,” or write your own letter in the editable text box.`}function E(){let{basics:e,job:t}=r;return{sender:[e.email,e.phone,e.location].map(f).filter(Boolean).join(` · `),recipient:[t.hiringManager,t.company].map(f).filter(Boolean)}}function D(){let{basics:e,job:t}=r,{sender:n,recipient:i}=E(),a=[];return f(e.name)&&a.push(f(e.name)),n&&a.push(n),f(e.date)&&a.push(``,f(e.date)),i.length&&a.push(``,...i),a.push(``,t.hiringManager?`Dear ${f(t.hiringManager)},`:`Dear Hiring Manager,`),a.push(``,w()),a.push(``,`Sincerely,`,f(e.name)||`Your Name`),a.join(`
`)}function O(e=D()){return String(e).trim().split(/\s+/).filter(Boolean).length}function k(){let e=`${r.job.description} ${r.job.title}`.toLowerCase(),t=`${r.fit.skills} ${r.fit.achievements} ${r.letterText}`.toLowerCase(),i=e.match(/[a-z][a-z+.#-]{2,}/g)||[],a=new Map;for(let e of i){let t=e.replace(/^[^a-z]+|[^a-z0-9+.#-]+$/g,``);!t||n.has(t)||t.length<3||a.set(t,(a.get(t)||0)+1)}let o=[...a.entries()].filter(([,e])=>e>1).sort((e,t)=>t[1]-e[1]).slice(0,12).map(([e])=>e);return{top:o,matched:o.filter(e=>t.includes(e)),missing:o.filter(e=>!t.includes(e))}}function A(){let e=[],{basics:t,job:n}=r;f(t.name)||e.push(`Add your name before exporting.`),t.email&&!/^\S+@\S+\.\S+$/.test(t.email)&&e.push(`Your email address may be misspelled.`),f(n.title)||e.push(`Add the job title to make the letter more targeted.`),f(n.company)||e.push(`Add the company name to avoid a generic letter.`),f(r.letterText)||e.push(`Update the live view or write your letter before exporting.`);let i=O();return i>520&&e.push(`The letter is long. Consider trimming it closer to one page.`),i<170&&f(r.letterText)&&e.push(`The letter is short. Consider adding one concrete achievement.`),e}function j(e,t=`info`){let n=document.getElementById(`statusBar`);n&&(n.textContent=e,n.className=`status-bar ${t}`)}function M(){let e=document.getElementById(`saveStatus`);if(e){if(!r.lastSaved){e.textContent=`Draft not saved yet`;return}e.textContent=`Autosaved ${new Date(r.lastSaved).toLocaleTimeString([],{hour:`numeric`,minute:`2-digit`})}`}}async function N(){let e=D();try{await navigator.clipboard.writeText(e),j(`Copied to clipboard.`,`success`)}catch{let t=document.createElement(`textarea`);t.value=e,document.body.appendChild(t),t.select(),document.execCommand(`copy`),t.remove(),j(`Copied to clipboard.`,`success`)}}function P(e,t,n){let r=n instanceof Blob?n:new Blob([n],{type:t}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,document.body.appendChild(a),a.click(),a.remove(),setTimeout(()=>URL.revokeObjectURL(i),1e4)}function F(){let e=f(r.basics.name)||`cover-letter`,t=f(r.job.company);return`${e}${t?`-${t}`:``}`.toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``)||`cover-letter`}function I(){P(`${F()}.txt`,`text/plain;charset=utf-8`,D()),j(`Text file downloaded.`,`success`)}function L(){let e=`<!doctype html><html><head><meta charset="utf-8"><title>Cover Letter</title></head><body>${V(!0)}</body></html>`;P(`${F()}.doc`,`application/msword;charset=utf-8`,e),j(`Word-compatible .doc file downloaded.`,`success`)}function R(){window.print()}function z(){confirm(`Start over and clear this saved cover letter draft?`)&&(localStorage.removeItem(e),r=s(t),K(),j(`Draft cleared. Start a new letter when ready.`,`success`))}function B(){confirm(`Clear only the letter text and keep your contact/job details?`)&&(r.letterText=``,u(!0),K(),j(`Letter text cleared. Your details were kept.`,`success`))}function V(e=!1){let{basics:t,job:n,settings:i}=r,{sender:a,recipient:o}=E(),s=w().split(/\n{2,}/).map(e=>m(e)).filter(Boolean);return`
    <article class="letter-page template-${p(i.template)}" style="--accent:${p(i.accent)};--letter-font:${p(i.font)}">
      <header class="letter-head">
        <div>
          <h2>${p(f(t.name)||`Your Name`)}</h2>
          ${a?`<p>${p(a)}</p>`:``}
        </div>
        <time>${p(f(t.date))}</time>
      </header>
      ${o.length?`<section class="recipient-block">${o.map(e=>`<div>${p(e)}</div>`).join(``)}</section>`:``}
      <p class="salutation">${p(n.hiringManager?`Dear ${f(n.hiringManager)},`:`Dear Hiring Manager,`)}</p>
      <section class="letter-body">
        ${s.map(e=>`<p>${p(e)}</p>`).join(``)}
      </section>
      <footer class="signature">
        <div>Sincerely,</div>
        <strong>${p(f(t.name)||`Your Name`)}</strong>
      </footer>
      ${e?`<!-- Built with Christian Goblin Cover Letter Builder -->`:``}
    </article>`}function H(e,t,n=``,i=`text`){let a=e.replaceAll(`.`,`-`);return`<label class="field" for="${a}"><span>${t}</span><input id="${a}" data-path="${e}" type="${i}" value="${p(e.split(`.`).reduce((e,t)=>e?.[t],r)??``)}" placeholder="${p(n)}"></label>`}function U(e,t,n=``,i=5){let a=e.replaceAll(`.`,`-`),o=e.split(`.`).reduce((e,t)=>e?.[t],r)??``;return`<label class="field full" for="${a}"><span>${t}</span><textarea id="${a}" data-path="${e}" rows="${i}" placeholder="${p(n)}">${p(o)}</textarea></label>`}function W(e,t,n){let i=e.replaceAll(`.`,`-`),a=e.split(`.`).reduce((e,t)=>e?.[t],r)??``;return`<label class="field" for="${i}"><span>${t}</span><select id="${i}" data-path="${e}">${n.map(e=>`<option value="${p(e.value)}" ${e.value===a?`selected`:``}>${p(e.label)}</option>`).join(``)}</select></label>`}function G(){let{top:e,matched:t,missing:n}=k(),r=A();return`
    <section class="panel analysis-panel" id="analysisPanel">
      <div class="panel-title-row">
        <h2>Review</h2>
        <span class="pill">${O()} words</span>
      </div>
      ${r.length?`<div class="warning-list">${r.map(e=>`<div>${p(e)}</div>`).join(``)}</div>`:`<div class="success-list">Looks ready for review. Read it once out loud before sending.</div>`}
      <div class="keyword-box">
        <h3>Job description terms</h3>
        ${e.length?`
          <p class="muted">These are repeated terms from the job description. Use only the ones that honestly fit your experience.</p>
          <div class="term-row">${t.map(e=>`<span class="term matched">${p(e)}</span>`).join(``)}${n.map(e=>`<span class="term missing">${p(e)}</span>`).join(``)}</div>
        `:`<p class="muted">Paste a job description to see repeated terms and fit reminders.</p>`}
      </div>
    </section>`}function K(){o.innerHTML=`
    <section class="cover-hero">
      <div>
        <p class="eyebrow">Christian Goblin Tools</p>
        <h1>Cover Letter Builder <span class="open-beta-badge">Open Beta</span></h1>
        <p class="hero-copy">Build a clean, tailored cover letter in your browser. No signup, no watermark, and easy export options.</p>
      </div>
      <div class="hero-card">
        <strong>Private by default</strong>
        <span>Your draft autosaves in this browser. It is not uploaded by this static tool.</span>
        <span id="saveStatus">Draft not saved yet</span>
      </div>
    </section>

    <div id="statusBar" class="status-bar info">Fill in the details, update the live view, then personalize before sending.</div>

    <section class="cover-grid">
      <div class="form-stack">
        <section class="panel">
          <div class="panel-title-row"><h2>Your information</h2><span class="step-badge">1</span></div>
          <div class="field-grid">
            ${H(`basics.name`,`Name`,`Jane Smith`)}
            ${H(`basics.email`,`Email`,`jane@email.com`,`email`)}
            ${H(`basics.phone`,`Phone`,`(555) 000-0000`)}
            ${H(`basics.location`,`Location`,`Tampa, FL`)}
            ${H(`basics.date`,`Date`,`June 27, 2026`)}
          </div>
        </section>

        <section class="panel">
          <div class="panel-title-row"><h2>Style</h2><span class="step-badge">2</span></div>
          <div class="field-grid compact-grid">
            ${W(`settings.tone`,`Tone`,[{value:`professional`,label:`Professional`},{value:`warm`,label:`Warm`},{value:`confident`,label:`Confident`},{value:`concise`,label:`Concise`}])}
            ${W(`settings.length`,`Length`,[{value:`compact`,label:`Compact`},{value:`standard`,label:`Standard`},{value:`detailed`,label:`Detailed`}])}
            ${W(`settings.template`,`Template`,[{value:`modern`,label:`Modern`},{value:`classic`,label:`Classic`},{value:`minimal`,label:`Minimal`}])}
            ${W(`settings.font`,`Font`,[{value:`Georgia, serif`,label:`Serif`},{value:`Arial, sans-serif`,label:`Sans`},{value:`Times New Roman, serif`,label:`Traditional`}])}
            <label class="field" for="settings-accent"><span>Accent color</span><input id="settings-accent" data-path="settings.accent" type="color" value="${p(r.settings.accent)}"></label>
          </div>
          <p class="muted style-preview">${p(b())}</p>
          <div class="action-row">
            <button class="primary" id="generateBtn" type="button">Update live view</button>
            <button id="clearLetterBtn" type="button">Clear letter only</button>
            <button id="startOverBtn" type="button">Start over</button>
          </div>
        </section>

        <section class="panel">
          <div class="panel-title-row"><h2>Job target</h2><span class="step-badge">3</span></div>
          <div class="field-grid">
            ${H(`job.title`,`Job title`,`Cybersecurity Analyst`)}
            ${H(`job.company`,`Company`,`Acme Corp`)}
            ${H(`job.hiringManager`,`Hiring manager, optional`,`Jordan Lee`)}
            ${H(`job.source`,`Where you found it, optional`,`company website`)}
            ${U(`job.description`,`Job description, optional`,`Paste the job post here to see repeated terms and improve targeting.`,6)}
          </div>
        </section>

        <section class="panel">
          <div class="panel-title-row"><h2>Your fit</h2><span class="step-badge">4</span></div>
          <div class="field-grid">
            ${H(`fit.experience`,`Relevant experience`,`3 years, 6 months, recent graduate, etc.`)}
            ${U(`fit.skills`,`Skills and strengths`,`One per line works best: customer service, React, lab procedures, scheduling...`,4)}
            ${U(`fit.achievements`,`Concrete achievements`,`Use numbers if possible: reduced errors by 20%, trained 5 new employees...`,4)}
            ${U(`fit.whyCompany`,`Why this company or role?`,`Mention something specific and honest about the organization or job.`,3)}
            ${U(`fit.callToAction`,`Closing sentence`,`I would welcome the opportunity to discuss how my background can support your team.`,2)}
          </div>
        </section>

        <section class="panel">
          <div class="panel-title-row"><h2>Edit letter text</h2><span class="step-badge">5</span></div>
          <label class="field full" for="letterText"><span>Editable draft</span><textarea id="letterText" data-path="letterText" rows="12" placeholder="Update the live view or write your own letter here.">${p(r.letterText)}</textarea></label>
          <p class="muted">The builder gives you a structured starting point. Read, revise, and make sure every claim is true before sending.</p>
        </section>
      </div>

      <aside class="preview-stack">
        ${G()}
        <section class="panel export-panel">
          <div class="panel-title-row"><h2>Export</h2><span class="pill">No watermark</span></div>
          <div class="action-grid">
            <button id="copyBtn" type="button">Copy text</button>
            <button id="downloadTxtBtn" type="button">Download TXT</button>
            <button id="downloadDocBtn" type="button">Download Word-compatible file</button>
            <button id="printBtn" type="button">Print / Save PDF</button>
          </div>
          <p class="muted">Review before sending. Confirm every claim is true. For PDF, choose “Print / Save PDF,” then select “Save as PDF” in your browser print dialog.</p>
        </section>
        <section class="letter-preview-wrap">
          <div class="preview-toolbar"><h2>Live preview</h2><span>${O()} words</span></div>
          <div id="letterPreview">${V()}</div>
        </section>
      </aside>
    </section>
  `,Y(),M(),a&&document.getElementById(a)?.focus()}function q(){let e=document.getElementById(`letterPreview`);e&&(e.innerHTML=V());let t=document.querySelector(`.preview-toolbar span`);t&&(t.textContent=`${O()} words`)}function J(){let e=document.getElementById(`analysisPanel`);e&&(e.outerHTML=G())}function Y(){o.querySelectorAll(`[data-path]`).forEach(e=>{e.addEventListener(`focus`,()=>{a=e.id}),e.addEventListener(`input`,e=>{let t=e.currentTarget;d(t.dataset.path,t.value)}),e.addEventListener(`change`,e=>{let t=e.currentTarget;d(t.dataset.path,t.value),(t.tagName===`SELECT`||t.type===`color`)&&K()})}),document.getElementById(`generateBtn`)?.addEventListener(`click`,C),document.getElementById(`clearLetterBtn`)?.addEventListener(`click`,B),document.getElementById(`startOverBtn`)?.addEventListener(`click`,z),document.getElementById(`copyBtn`)?.addEventListener(`click`,N),document.getElementById(`downloadTxtBtn`)?.addEventListener(`click`,I),document.getElementById(`downloadDocBtn`)?.addEventListener(`click`,L),document.getElementById(`printBtn`)?.addEventListener(`click`,R)}window.addEventListener(`beforeunload`,()=>u(!0)),K();