/*
  Christian Goblin Jobs — front-end logic

  STEP 1:
  Replace WORKER_URL with your deployed Cloudflare Worker URL.

  Example:
  const WORKER_URL = 'https://white-poetry-2b38.michaelthechristiangoblin.workers.dev';

  This page expects the Worker included in cloudflare-worker.js.
*/

const WORKER_URL = 'PASTE_YOUR_CLOUDFLARE_WORKER_URL_HERE';

const els = {
  codeForm: document.querySelector('#code-form'),
  jobCode: document.querySelector('#job-code'),
  codeMessage: document.querySelector('#code-message'),
  codeCard: document.querySelector('#code-card'),
  jobCard: document.querySelector('#job-card'),
  jobTitle: document.querySelector('#job-title'),
  jobSummary: document.querySelector('#job-summary'),
  activeJobCode: document.querySelector('#active-job-code'),
  questionArea: document.querySelector('#question-area'),
  changeCodeBtn: document.querySelector('#change-code-btn'),
  applicationForm: document.querySelector('#application-form'),
  submitBtn: document.querySelector('#submit-btn'),
  submitMessage: document.querySelector('#submit-message'),
};

let activeJob = null;

function setMessage(el, text, type = '') {
  el.textContent = text || '';
  el.classList.remove('good', 'bad');
  if (type) el.classList.add(type);
}

function requireWorkerUrl() {
  if (!WORKER_URL || WORKER_URL.includes('PASTE_YOUR')) {
    throw new Error('Worker URL is not configured yet. Open jobs/app.js and set WORKER_URL.');
  }
}

async function postToWorker(payload) {
  requireWorkerUrl();

  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    throw new Error('The server returned an invalid response.');
  }

  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Request failed.');
  }

  return data;
}

function renderQuestions(questions) {
  els.questionArea.innerHTML = '';

  if (!questions || questions.length === 0) return;

  const heading = document.createElement('h3');
  heading.textContent = 'Job Questions';
  els.questionArea.appendChild(heading);

  questions.forEach((question, index) => {
    const box = document.createElement('div');
    box.className = 'question-box field';

    const id = `question-${index}`;

    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = question;

    const textarea = document.createElement('textarea');
    textarea.id = id;
    textarea.name = id;
    textarea.rows = 5;
    textarea.required = true;
    textarea.dataset.question = question;

    box.append(label, textarea);
    els.questionArea.appendChild(box);
  });
}

function showJob(job, code) {
  activeJob = job;
  els.jobTitle.textContent = job.title;
  els.jobSummary.textContent = job.summary || '';
  els.activeJobCode.value = code;
  renderQuestions(job.questions);
  els.codeCard.classList.add('hidden');
  els.jobCard.classList.remove('hidden');
  setMessage(els.submitMessage, '');
}

function resetToCodeEntry() {
  activeJob = null;
  els.jobCard.classList.add('hidden');
  els.codeCard.classList.remove('hidden');
  els.applicationForm.reset();
  els.jobCode.focus();
  setMessage(els.codeMessage, '');
  setMessage(els.submitMessage, '');
}

els.codeForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const code = els.jobCode.value.trim();

  if (!code) {
    setMessage(els.codeMessage, 'Enter a job code.', 'bad');
    return;
  }

  setMessage(els.codeMessage, 'Checking job code...');
  els.codeForm.querySelector('button').disabled = true;

  try {
    const data = await postToWorker({ _action: 'lookup', _jobCode: code });
    showJob(data.job, code);
    setMessage(els.codeMessage, '');
  } catch (error) {
    setMessage(els.codeMessage, error.message, 'bad');
  } finally {
    els.codeForm.querySelector('button').disabled = false;
  }
});

els.changeCodeBtn.addEventListener('click', resetToCodeEntry);

els.applicationForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!activeJob) {
    setMessage(els.submitMessage, 'No active job selected.', 'bad');
    return;
  }

  const questionTextareas = [...els.questionArea.querySelectorAll('textarea[data-question]')];
  const answers = questionTextareas.map((textarea) => ({
    question: textarea.dataset.question,
    answer: textarea.value.trim(),
  }));

  const payload = {
    _action: 'submit',
    _formType: 'job_application',
    _jobCode: els.activeJobCode.value.trim(),
    applicant: {
      name: document.querySelector('#full-name').value.trim(),
      email: document.querySelector('#email').value.trim(),
      contact: document.querySelector('#contact').value.trim(),
      portfolio: document.querySelector('#portfolio').value.trim(),
      availability: document.querySelector('#availability').value.trim(),
      experience: document.querySelector('#experience').value.trim(),
      notes: document.querySelector('#notes').value.trim(),
    },
    answers,
    website: document.querySelector('#website').value.trim(),
  };

  setMessage(els.submitMessage, 'Submitting application...');
  els.submitBtn.disabled = true;

  try {
    await postToWorker(payload);
    els.applicationForm.reset();
    els.jobCard.classList.add('hidden');
    els.codeCard.classList.remove('hidden');
    els.jobCode.value = '';
    setMessage(els.codeMessage, 'Application submitted. Thank you.', 'good');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    setMessage(els.submitMessage, error.message, 'bad');
  } finally {
    els.submitBtn.disabled = false;
  }
});
