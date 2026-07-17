'use strict';

const config = window.CG_JOBS_CONFIG || {};
const WORKER_URL = String(config.workerUrl || '').replace(/\/+$/, '');
const TURNSTILE_SITE_KEY = String(config.turnstileSiteKey || '');

const els = {
  codePanel: document.querySelector('#codePanel'),
  codeForm: document.querySelector('#codeForm'),
  jobCode: document.querySelector('#jobCode'),
  codeButton: document.querySelector('#codeButton'),
  codeMessage: document.querySelector('#codeMessage'),
  applicationPanel: document.querySelector('#applicationPanel'),
  applicationForm: document.querySelector('#applicationForm'),
  roleTitle: document.querySelector('#roleTitle'),
  roleSummary: document.querySelector('#roleSummary'),
  questionArea: document.querySelector('#questionArea'),
  changeCodeButton: document.querySelector('#changeCodeButton'),
  submitButton: document.querySelector('#submitButton'),
  submitMessage: document.querySelector('#submitMessage'),
  turnstileContainer: document.querySelector('#turnstileContainer'),
};

let activeCode = '';
let activeRole = null;
let turnstileWidgetId = null;
let turnstileRenderAttempts = 0;

function setMessage(element, text, kind = '') {
  element.textContent = text || '';
  element.classList.remove('good', 'bad');
  if (kind) element.classList.add(kind);
}

function clean(value, max = 1_000) {
  return String(value ?? '').replace(/\r/g, '').trim().slice(0, max);
}

function serviceConfigured() {
  return Boolean(
    WORKER_URL
    && !WORKER_URL.includes('REPLACE-')
    && /^https:\/\//i.test(WORKER_URL)
    && TURNSTILE_SITE_KEY
    && !TURNSTILE_SITE_KEY.includes('REPLACE_'),
  );
}

function apiUrl(path) {
  return `${WORKER_URL}${path}`;
}

async function postJson(path, payload, timeoutMs = 15_000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(apiUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('The application server returned an invalid response.');
    }

    if (!response.ok || data.ok !== true) {
      throw new Error(data.error || 'The request could not be completed.');
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('The application server took too long to respond.', { cause: error });
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function renderQuestions(role) {
  els.questionArea.replaceChildren();

  const heading = document.createElement('h3');
  heading.textContent = 'Job Questions';
  els.questionArea.appendChild(heading);

  role.questions.forEach((question, index) => {
    const box = document.createElement('div');
    box.className = 'question-box field';

    const id = `question-${index}`;
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = question;

    const textarea = document.createElement('textarea');
    textarea.id = id;
    textarea.name = `question-${index}`;
    textarea.rows = 5;
    textarea.required = true;
    textarea.maxLength = 1_000;
    textarea.dataset.applicationAnswer = 'true';

    box.append(label, textarea);
    els.questionArea.appendChild(box);
  });
}

function resetTurnstile() {
  if (window.turnstile && turnstileWidgetId !== null) {
    try {
      window.turnstile.remove(turnstileWidgetId);
    } catch {
      // The widget may already have removed itself during navigation.
    }
  }
  turnstileWidgetId = null;
  turnstileRenderAttempts = 0;
  els.turnstileContainer.replaceChildren();
}

function renderTurnstile() {
  if (!activeRole || turnstileWidgetId !== null) return;

  if (!window.turnstile) {
    turnstileRenderAttempts += 1;
    if (turnstileRenderAttempts <= 25) {
      window.setTimeout(renderTurnstile, 200);
    } else {
      setMessage(els.submitMessage, 'Human verification could not load. Refresh the page and try again.', 'bad');
    }
    return;
  }

  turnstileWidgetId = window.turnstile.render(els.turnstileContainer, {
    sitekey: TURNSTILE_SITE_KEY,
    action: 'job_application',
    theme: 'dark',
    callback: () => setMessage(els.submitMessage, ''),
    'expired-callback': () => setMessage(els.submitMessage, 'Human verification expired. Complete it again.', 'bad'),
    'error-callback': () => setMessage(els.submitMessage, 'Human verification failed to load. Try again.', 'bad'),
  });
}

function showApplication(code, role) {
  activeCode = code;
  activeRole = role;
  els.roleTitle.textContent = role.title;
  els.roleSummary.textContent = role.summary;
  renderQuestions(role);
  els.codePanel.classList.add('hidden');
  els.applicationPanel.classList.remove('hidden');
  setMessage(els.submitMessage, '');
  resetTurnstile();
  renderTurnstile();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetApplication() {
  activeCode = '';
  activeRole = null;
  resetTurnstile();
  els.applicationForm.reset();
  els.questionArea.replaceChildren();
  els.applicationPanel.classList.add('hidden');
  els.codePanel.classList.remove('hidden');
  setMessage(els.submitMessage, '');
  els.jobCode.focus();
}

function createApplicationId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

els.codeForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage(els.codeMessage, '');

  if (!serviceConfigured()) {
    setMessage(els.codeMessage, 'The application service has not been configured yet.', 'bad');
    return;
  }

  const code = clean(els.jobCode.value, 64).toUpperCase();
  if (code.length < 12) {
    setMessage(els.codeMessage, 'Enter the full private job code.', 'bad');
    return;
  }

  els.codeButton.disabled = true;
  setMessage(els.codeMessage, 'Checking code...');

  try {
    const data = await postJson('/job', { jobCode: code });
    if (!data.role || !Array.isArray(data.role.questions)) {
      throw new Error('The application server returned incomplete role information.');
    }
    showApplication(code, data.role);
  } catch (error) {
    setMessage(els.codeMessage, error.message, 'bad');
  } finally {
    els.codeButton.disabled = false;
  }
});

els.changeCodeButton.addEventListener('click', resetApplication);

els.applicationForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage(els.submitMessage, '');

  if (!activeCode || !activeRole) {
    setMessage(els.submitMessage, 'Enter a valid job code before applying.', 'bad');
    return;
  }

  const turnstileToken = window.turnstile && turnstileWidgetId !== null
    ? window.turnstile.getResponse(turnstileWidgetId)
    : '';

  if (!turnstileToken) {
    setMessage(els.submitMessage, 'Complete the human-verification check.', 'bad');
    return;
  }

  const answers = [...els.questionArea.querySelectorAll('[data-application-answer="true"]')]
    .map((textarea) => clean(textarea.value, 1_000));

  const payload = {
    applicationId: createApplicationId(),
    jobCode: activeCode,
    fullName: clean(document.querySelector('#fullName').value, 200),
    email: clean(document.querySelector('#email').value, 254),
    bestContact: clean(document.querySelector('#bestContact').value, 400),
    portfolio: clean(document.querySelector('#portfolio').value, 900),
    availability: clean(document.querySelector('#availability').value, 700),
    payPreference: clean(document.querySelector('#payPreference').value, 400),
    experience: clean(document.querySelector('#experience').value, 1_500),
    answers,
    notes: clean(document.querySelector('#notes').value, 1_000),
    website: clean(document.querySelector('#website').value, 200),
    privacyAccepted: document.querySelector('#privacyAccepted').checked,
    turnstileToken,
  };

  els.submitButton.disabled = true;
  setMessage(els.submitMessage, 'Submitting application...');

  try {
    const data = await postJson('/apply', payload, 20_000);
    resetApplication();
    els.jobCode.value = '';
    setMessage(
      els.codeMessage,
      `Application submitted. Reference: ${clean(data.applicationId, 100)}`,
      'good',
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    setMessage(els.submitMessage, error.message, 'bad');
    if (window.turnstile && turnstileWidgetId !== null) {
      window.turnstile.reset(turnstileWidgetId);
    }
  } finally {
    els.submitButton.disabled = false;
  }
});
