const STORAGE_KEY = 'cg.coverLetter.draft.v3';
const DEFAULT_STATE = {
  basics: {
    name: '',
    email: '',
    phone: '',
    location: '',
    date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
  },
  job: {
    title: '',
    company: '',
    hiringManager: '',
    source: '',
    description: '',
  },
  fit: {
    experience: '',
    skills: '',
    achievements: '',
    whyCompany: '',
    callToAction: 'I would welcome the opportunity to discuss how my background can support your team.',
  },
  settings: {
    tone: 'professional',
    length: 'standard',
    template: 'modern',
    accent: '#b88746',
    font: 'Georgia, serif',
  },
  letterText: '',
  lastSaved: '',
};

const STOP_WORDS = new Set('about above after again against all also am an and any are as at be because been before being below between both but by can did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with you your yours yourself yourselves role job company team work'.split(' '));

let state = loadState();
let saveTimer = null;
let lastFocusId = '';

const root = document.getElementById('cover-root');

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return mergeDeep(clone(DEFAULT_STATE), parsed);
  } catch {
    return clone(DEFAULT_STATE);
  }
}

function mergeDeep(base, incoming) {
  for (const [key, value] of Object.entries(incoming || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value) && base[key] && typeof base[key] === 'object') {
      base[key] = mergeDeep(base[key], value);
    } else {
      base[key] = value;
    }
  }
  return base;
}

function saveState(immediate = false) {
  clearTimeout(saveTimer);
  const run = () => {
    try {
      state.lastSaved = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      updateSaveStatus();
    } catch {
      setStatus('Browser storage is full or unavailable. You can still copy or download your letter.', 'warn');
    }
  };
  if (immediate) run();
  else saveTimer = setTimeout(run, 300);
}

function setByPath(path, value) {
  const parts = path.split('.');
  let target = state;
  for (let i = 0; i < parts.length - 1; i += 1) target = target[parts[i]];
  target[parts.at(-1)] = value;
  saveState();
  renderPreviewOnly();
  renderAnalysisOnly();
}

function text(value) {
  return String(value ?? '').trim();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizeSpaces(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function splitLines(value) {
  return String(value || '')
    .split(/[\n;•]+/)
    .map((line) => normalizeSpaces(line))
    .filter(Boolean);
}

function sentence(value) {
  const clean = normalizeSpaces(value);
  if (!clean) return '';
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
}

function firstNonEmpty(...values) {
  return values.map(text).find(Boolean) || '';
}

function joinSentenceList(items) {
  const clean = items.map(normalizeSpaces).filter(Boolean);
  if (!clean.length) return '';
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(', ')}, and ${clean.at(-1)}`;
}

function toneOpening() {
  const { tone } = state.settings;
  if (tone === 'warm') return 'I was excited to see';
  if (tone === 'confident') return 'I am ready to bring my experience to';
  if (tone === 'concise') return 'I am applying for';
  return 'I am writing to express my interest in';
}

function generateLetter() {
  const { basics, job, fit, settings } = state;
  const name = firstNonEmpty(basics.name, 'Your Name');
  const title = firstNonEmpty(job.title, 'the open role');
  const company = firstNonEmpty(job.company, 'your organization');
  const manager = text(job.hiringManager);
  const skills = splitLines(fit.skills).slice(0, 5);
  const achievements = splitLines(fit.achievements).slice(0, 4);
  const years = text(fit.experience);
  const whyCompany = sentence(fit.whyCompany);
  const callToAction = sentence(fit.callToAction || DEFAULT_STATE.fit.callToAction);
  const source = text(job.source);

  const introParts = [];
  if (settings.tone === 'confident') {
    introParts.push(`${toneOpening()} ${company} as ${title}.`);
  } else if (settings.tone === 'concise') {
    introParts.push(`${toneOpening()} ${title} at ${company}.`);
  } else {
    introParts.push(`${toneOpening()} the ${title} position at ${company}.`);
  }
  if (source) introParts.push(`I found the opportunity through ${source}.`);
  if (years) introParts.push(`I bring ${years} of relevant experience and a practical, results-focused approach.`);
  else introParts.push('I bring a practical, results-focused approach and a strong desire to contribute well.');

  const skillPhrase = skills.length
    ? `My background includes ${joinSentenceList(skills)}, and I am comfortable turning those strengths into dependable day-to-day results.`
    : 'My background has prepared me to learn quickly, communicate clearly, and contribute with steady attention to detail.';

  const achievementPhrase = achievements.length
    ? `Examples of my work include ${joinSentenceList(achievements.map((item) => item.replace(/^[•\-]\s*/, '')))}.`
    : 'I try to bring ownership, humility, and consistency to the responsibilities entrusted to me.';

  const companyPhrase = whyCompany
    ? `What draws me to ${company} is this: ${whyCompany}`
    : `I am especially interested in ${company} because the role appears to require both reliability and thoughtful problem-solving.`;

  const closing = settings.tone === 'warm'
    ? `Thank you for taking the time to consider my application. ${callToAction}`
    : `Thank you for your time and consideration. ${callToAction}`;

  const paragraphs = settings.length === 'compact'
    ? [
        `${introParts.join(' ')} ${skillPhrase}`,
        `${achievementPhrase} ${companyPhrase}`,
        closing,
      ]
    : settings.length === 'detailed'
      ? [
          introParts.join(' '),
          `${skillPhrase} ${achievementPhrase}`,
          companyPhrase,
          `If selected, I would aim to bring clear communication, dependable follow-through, and a willingness to keep improving. ${closing}`,
        ]
      : [
          introParts.join(' '),
          `${skillPhrase} ${achievementPhrase}`,
          `${companyPhrase} ${closing}`,
        ];

  state.letterText = paragraphs.map((p) => normalizeSpaces(p)).filter(Boolean).join('\n\n');
  saveState(true);
  render();
  setStatus('Live view updated from your details. Review it, personalize it, then export.', 'success');
  setTimeout(() => document.getElementById('letterText')?.focus(), 100);
}

function formatLetterText() {
  return text(state.letterText) || generatePlaceholderLetter();
}

function generatePlaceholderLetter() {
  return 'Your cover letter will appear here. Fill in the basics and click “Update live view,” or write your own letter in the editable text box.';
}

function addressBlock() {
  const { basics, job } = state;
  const sender = [basics.email, basics.phone, basics.location].map(text).filter(Boolean).join(' · ');
  const recipient = [job.hiringManager, job.company].map(text).filter(Boolean);
  return { sender, recipient };
}

function fullPlainText() {
  const { basics, job } = state;
  const { sender, recipient } = addressBlock();
  const lines = [];
  if (text(basics.name)) lines.push(text(basics.name));
  if (sender) lines.push(sender);
  if (text(basics.date)) lines.push('', text(basics.date));
  if (recipient.length) lines.push('', ...recipient);
  lines.push('', job.hiringManager ? `Dear ${text(job.hiringManager)},` : 'Dear Hiring Manager,');
  lines.push('', formatLetterText());
  lines.push('', 'Sincerely,', text(basics.name) || 'Your Name');
  return lines.join('\n');
}

function wordCount(value = fullPlainText()) {
  return String(value).trim().split(/\s+/).filter(Boolean).length;
}

function analyzeJobDescription() {
  const source = `${state.job.description} ${state.job.title}`.toLowerCase();
  const userText = `${state.fit.skills} ${state.fit.achievements} ${state.letterText}`.toLowerCase();
  const words = source.match(/[a-z][a-z+.#-]{2,}/g) || [];
  const counts = new Map();
  for (const word of words) {
    const clean = word.replace(/^[^a-z]+|[^a-z0-9+.#-]+$/g, '');
    if (!clean || STOP_WORDS.has(clean) || clean.length < 3) continue;
    counts.set(clean, (counts.get(clean) || 0) + 1);
  }
  const top = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([term]) => term);
  const matched = top.filter((term) => userText.includes(term));
  const missing = top.filter((term) => !userText.includes(term));
  return { top, matched, missing };
}

function getWarnings() {
  const warnings = [];
  const { basics, job } = state;
  if (!text(basics.name)) warnings.push('Add your name before exporting.');
  if (basics.email && !/^\S+@\S+\.\S+$/.test(basics.email)) warnings.push('Your email address may be misspelled.');
  if (!text(job.title)) warnings.push('Add the job title to make the letter more targeted.');
  if (!text(job.company)) warnings.push('Add the company name to avoid a generic letter.');
  if (!text(state.letterText)) warnings.push('Update the live view or write your letter before exporting.');
  const count = wordCount();
  if (count > 520) warnings.push('The letter is long. Consider trimming it closer to one page.');
  if (count < 170 && text(state.letterText)) warnings.push('The letter is short. Consider adding one concrete achievement.');
  return warnings;
}

function setStatus(message, type = 'info') {
  const status = document.getElementById('statusBar');
  if (!status) return;
  status.textContent = message;
  status.className = `status-bar ${type}`;
}

function updateSaveStatus() {
  const el = document.getElementById('saveStatus');
  if (!el) return;
  if (!state.lastSaved) {
    el.textContent = 'Draft not saved yet';
    return;
  }
  const date = new Date(state.lastSaved);
  el.textContent = `Autosaved ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

async function copyText() {
  const output = fullPlainText();
  try {
    await navigator.clipboard.writeText(output);
    setStatus('Copied to clipboard.', 'success');
  } catch {
    const box = document.createElement('textarea');
    box.value = output;
    document.body.appendChild(box);
    box.select();
    document.execCommand('copy');
    box.remove();
    setStatus('Copied to clipboard.', 'success');
  }
}

function downloadBlob(filename, type, content) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function safeFileBase() {
  const name = text(state.basics.name) || 'cover-letter';
  const company = text(state.job.company);
  return `${name}${company ? `-${company}` : ''}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'cover-letter';
}

function downloadTxt() {
  downloadBlob(`${safeFileBase()}.txt`, 'text/plain;charset=utf-8', fullPlainText());
  setStatus('Text file downloaded.', 'success');
}

function downloadDoc() {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Cover Letter</title></head><body>${previewHtml(true)}</body></html>`;
  downloadBlob(`${safeFileBase()}.doc`, 'application/msword;charset=utf-8', html);
  setStatus('Word-compatible document downloaded.', 'success');
}

function printLetter() {
  window.print();
}

function startOver() {
  const ok = confirm('Start over and clear this saved cover letter draft?');
  if (!ok) return;
  localStorage.removeItem(STORAGE_KEY);
  state = clone(DEFAULT_STATE);
  render();
  setStatus('Draft cleared. Start a new letter when ready.', 'success');
}

function clearLetterOnly() {
  const ok = confirm('Clear only the letter text and keep your contact/job details?');
  if (!ok) return;
  state.letterText = '';
  saveState(true);
  render();
  setStatus('Letter text cleared. Your details were kept.', 'success');
}

function previewHtml(forExport = false) {
  const { basics, job, settings } = state;
  const { sender, recipient } = addressBlock();
  const paragraphs = formatLetterText().split(/\n{2,}/).map((p) => normalizeSpaces(p)).filter(Boolean);
  return `
    <article class="letter-page template-${escapeHtml(settings.template)}" style="--accent:${escapeHtml(settings.accent)};--letter-font:${escapeHtml(settings.font)}">
      <header class="letter-head">
        <div>
          <h2>${escapeHtml(text(basics.name) || 'Your Name')}</h2>
          ${sender ? `<p>${escapeHtml(sender)}</p>` : ''}
        </div>
        <time>${escapeHtml(text(basics.date))}</time>
      </header>
      ${recipient.length ? `<section class="recipient-block">${recipient.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}</section>` : ''}
      <p class="salutation">${escapeHtml(job.hiringManager ? `Dear ${text(job.hiringManager)},` : 'Dear Hiring Manager,')}</p>
      <section class="letter-body">
        ${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}
      </section>
      <footer class="signature">
        <div>Sincerely,</div>
        <strong>${escapeHtml(text(basics.name) || 'Your Name')}</strong>
      </footer>
      ${forExport ? '<!-- Built with Christian Goblin Cover Letter Builder -->' : ''}
    </article>`;
}

function renderInput(path, label, placeholder = '', type = 'text') {
  const id = path.replaceAll('.', '-');
  const value = path.split('.').reduce((obj, part) => obj?.[part], state) ?? '';
  return `<label class="field" for="${id}"><span>${label}</span><input id="${id}" data-path="${path}" type="${type}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}"></label>`;
}

function renderTextArea(path, label, placeholder = '', rows = 5) {
  const id = path.replaceAll('.', '-');
  const value = path.split('.').reduce((obj, part) => obj?.[part], state) ?? '';
  return `<label class="field full" for="${id}"><span>${label}</span><textarea id="${id}" data-path="${path}" rows="${rows}" placeholder="${escapeHtml(placeholder)}">${escapeHtml(value)}</textarea></label>`;
}

function renderSelect(path, label, options) {
  const id = path.replaceAll('.', '-');
  const value = path.split('.').reduce((obj, part) => obj?.[part], state) ?? '';
  return `<label class="field" for="${id}"><span>${label}</span><select id="${id}" data-path="${path}">${options.map((opt) => `<option value="${escapeHtml(opt.value)}" ${opt.value === value ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`).join('')}</select></label>`;
}

function renderAnalysis() {
  const { top, matched, missing } = analyzeJobDescription();
  const warnings = getWarnings();
  const count = wordCount();
  return `
    <section class="panel analysis-panel" id="analysisPanel">
      <div class="panel-title-row">
        <h2>Review</h2>
        <span class="pill">${count} words</span>
      </div>
      ${warnings.length ? `<div class="warning-list">${warnings.map((w) => `<div>${escapeHtml(w)}</div>`).join('')}</div>` : '<div class="success-list">Looks ready for review. Read it once out loud before sending.</div>'}
      <div class="keyword-box">
        <h3>Job description terms</h3>
        ${top.length ? `
          <p class="muted">These are repeated terms from the job description. Use only the ones that honestly fit your experience.</p>
          <div class="term-row">${matched.map((term) => `<span class="term matched">${escapeHtml(term)}</span>`).join('')}${missing.map((term) => `<span class="term missing">${escapeHtml(term)}</span>`).join('')}</div>
        ` : '<p class="muted">Paste a job description to see repeated terms and fit reminders.</p>'}
      </div>
    </section>`;
}

function render() {
  root.innerHTML = `
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
            ${renderInput('basics.name', 'Name', 'Jane Smith')}
            ${renderInput('basics.email', 'Email', 'jane@email.com', 'email')}
            ${renderInput('basics.phone', 'Phone', '(555) 000-0000')}
            ${renderInput('basics.location', 'Location', 'Tampa, FL')}
            ${renderInput('basics.date', 'Date', 'June 27, 2026')}
          </div>
        </section>

        <section class="panel">
          <div class="panel-title-row"><h2>Style</h2><span class="step-badge">2</span></div>
          <div class="field-grid compact-grid">
            ${renderSelect('settings.tone', 'Tone', [
              { value: 'professional', label: 'Professional' },
              { value: 'warm', label: 'Warm' },
              { value: 'confident', label: 'Confident' },
              { value: 'concise', label: 'Concise' },
            ])}
            ${renderSelect('settings.length', 'Length', [
              { value: 'compact', label: 'Compact' },
              { value: 'standard', label: 'Standard' },
              { value: 'detailed', label: 'Detailed' },
            ])}
            ${renderSelect('settings.template', 'Template', [
              { value: 'modern', label: 'Modern' },
              { value: 'classic', label: 'Classic' },
              { value: 'minimal', label: 'Minimal' },
            ])}
            ${renderSelect('settings.font', 'Font', [
              { value: 'Georgia, serif', label: 'Serif' },
              { value: 'Arial, sans-serif', label: 'Sans' },
              { value: 'Times New Roman, serif', label: 'Traditional' },
            ])}
            <label class="field" for="settings-accent"><span>Accent color</span><input id="settings-accent" data-path="settings.accent" type="color" value="${escapeHtml(state.settings.accent)}"></label>
          </div>
          <div class="action-row">
            <button class="primary" id="generateBtn" type="button">Update live view</button>
            <button id="clearLetterBtn" type="button">Clear letter only</button>
            <button id="startOverBtn" type="button">Start over</button>
          </div>
        </section>

        <section class="panel">
          <div class="panel-title-row"><h2>Job target</h2><span class="step-badge">3</span></div>
          <div class="field-grid">
            ${renderInput('job.title', 'Job title', 'Cybersecurity Analyst')}
            ${renderInput('job.company', 'Company', 'Acme Corp')}
            ${renderInput('job.hiringManager', 'Hiring manager, optional', 'Jordan Lee')}
            ${renderInput('job.source', 'Where you found it, optional', 'company website')}
            ${renderTextArea('job.description', 'Job description, optional', 'Paste the job post here to see repeated terms and improve targeting.', 6)}
          </div>
        </section>

        <section class="panel">
          <div class="panel-title-row"><h2>Your fit</h2><span class="step-badge">4</span></div>
          <div class="field-grid">
            ${renderInput('fit.experience', 'Relevant experience', '3 years, 6 months, recent graduate, etc.')}
            ${renderTextArea('fit.skills', 'Skills and strengths', 'One per line works best: customer service, React, lab procedures, scheduling...', 4)}
            ${renderTextArea('fit.achievements', 'Concrete achievements', 'Use numbers if possible: reduced errors by 20%, trained 5 new employees...', 4)}
            ${renderTextArea('fit.whyCompany', 'Why this company or role?', 'Mention something specific and honest about the organization or job.', 3)}
            ${renderTextArea('fit.callToAction', 'Closing sentence', 'I would welcome the opportunity to discuss how my background can support your team.', 2)}
          </div>
        </section>

        <section class="panel">
          <div class="panel-title-row"><h2>Edit letter text</h2><span class="step-badge">5</span></div>
          <label class="field full" for="letterText"><span>Editable draft</span><textarea id="letterText" data-path="letterText" rows="12" placeholder="Update the live view or write your own letter here.">${escapeHtml(state.letterText)}</textarea></label>
          <p class="muted">The builder gives you a structured starting point. Read, revise, and make sure every claim is true before sending.</p>
        </section>
      </div>

      <aside class="preview-stack">
        ${renderAnalysis()}
        <section class="panel export-panel">
          <div class="panel-title-row"><h2>Export</h2><span class="pill">No watermark</span></div>
          <div class="action-grid">
            <button id="copyBtn" type="button">Copy text</button>
            <button id="downloadTxtBtn" type="button">Download TXT</button>
            <button id="downloadDocBtn" type="button">Download Word-compatible DOC</button>
            <button id="printBtn" type="button">Print / Save PDF</button>
          </div>
          <p class="muted">For PDF, choose “Print / Save PDF,” then select “Save as PDF” in your browser print dialog.</p>
        </section>
        <section class="letter-preview-wrap">
          <div class="preview-toolbar"><h2>Live preview</h2><span>${wordCount()} words</span></div>
          <div id="letterPreview">${previewHtml()}</div>
        </section>
      </aside>
    </section>
  `;
  bindEvents();
  updateSaveStatus();
  if (lastFocusId) document.getElementById(lastFocusId)?.focus();
}

function renderPreviewOnly() {
  const preview = document.getElementById('letterPreview');
  if (preview) preview.innerHTML = previewHtml();
  const toolbar = document.querySelector('.preview-toolbar span');
  if (toolbar) toolbar.textContent = `${wordCount()} words`;
}

function renderAnalysisOnly() {
  const analysis = document.getElementById('analysisPanel');
  if (analysis) analysis.outerHTML = renderAnalysis();
}

function bindEvents() {
  root.querySelectorAll('[data-path]').forEach((el) => {
    el.addEventListener('focus', () => { lastFocusId = el.id; });
    el.addEventListener('input', (event) => {
      const input = event.currentTarget;
      setByPath(input.dataset.path, input.value);
    });
    el.addEventListener('change', (event) => {
      const input = event.currentTarget;
      setByPath(input.dataset.path, input.value);
      if (input.tagName === 'SELECT' || input.type === 'color') render();
    });
  });

  document.getElementById('generateBtn')?.addEventListener('click', generateLetter);
  document.getElementById('clearLetterBtn')?.addEventListener('click', clearLetterOnly);
  document.getElementById('startOverBtn')?.addEventListener('click', startOver);
  document.getElementById('copyBtn')?.addEventListener('click', copyText);
  document.getElementById('downloadTxtBtn')?.addEventListener('click', downloadTxt);
  document.getElementById('downloadDocBtn')?.addEventListener('click', downloadDoc);
  document.getElementById('printBtn')?.addEventListener('click', printLetter);
}

window.addEventListener('beforeunload', () => saveState(true));
render();
