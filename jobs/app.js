/*
  Christian Goblin Jobs — OLD WORKER compatible version

  This version keeps job titles/questions in this public JS file and sends a
  Discord embed payload to the old Cloudflare Worker.

  Your old Worker expects:
    - Header: X-Submit-Token
    - Body fields: _jobCode, _formType, embeds

  IMPORTANT:
  1. Replace WORKER_URL with your deployed Cloudflare Worker URL.
  2. Replace SUBMIT_TOKEN with the same value stored in the Worker secret.
  3. This uses only old valid codes, so you do not need to edit Cloudflare
     unless you want to add a brand-new code.
*/

const WORKER_URL = 'PASTE_YOUR_CLOUDFLARE_WORKER_URL_HERE';
const SUBMIT_TOKEN = 'PASTE_YOUR_SUBMIT_TOKEN_HERE';

// These codes are from the old Worker's VALID_CODES list.
// Sales uses code 9432 so you can avoid adding a new Cloudflare code.
const JOBS = {
  '9432': {
    title: 'Sales Representative',
    open: true,
    summary: 'Help find clients, communicate project value, follow up with leads, and bring in paid work for Christian Goblin projects.',
    questions: [
      'What sales experience do you have?',
      'Are you comfortable messaging potential clients or businesses?',
      'Have you sold services, creative work, software, websites, games, or digital products before?',
      'How would you find people or businesses who might need our services?',
      'Are you comfortable working on commission, hourly pay, or both?',
      'What tools have you used for outreach, lead tracking, email, or CRM?',
      'Write a short example message you would send to a potential client.',
    ],
  },

  '3544': {
    title: 'Pixel Artist',
    open: true,
    summary: 'Create pixel-art sprites, tiles, icons, and small animations for Christian Goblin projects.',
    questions: [
      'What pixel art tools do you use?',
      'Can you make 16x16, 32x32, and 64x64 sprites?',
      'Can you make tilemaps or only character/object sprites?',
      'Link or describe your best examples.',
    ],
  },

  '2456': {
    title: 'Game Writer / Biblical Event Designer',
    open: true,
    summary: 'Help turn biblical themes and events into respectful game quests, encounters, dialogue, and lore.',
    questions: [
      'What Bible stories or themes are you most comfortable writing around?',
      'Can you write short dialogue, quest text, and item descriptions?',
      'How would you handle biblical material respectfully in a game?',
      'Link or paste a writing sample if you have one.',
    ],
  },

  '4987': {
    title: 'Godot Gameplay Programmer',
    open: true,
    summary: 'Help build 2D gameplay systems, procedural rooms, enemies, bosses, and UI.',
    questions: [
      'What experience do you have with Godot or GDScript?',
      'Have you built procedural generation before?',
      'Can you work with 2D combat, enemy AI, UI, or inventory systems?',
      'Link a GitHub, itch.io, or project example if available.',
    ],
  },

  '5680': {
    title: 'Music / Sound Designer',
    open: false,
    summary: 'Create short loops, stingers, UI sounds, ambience, and boss/event music.',
    questions: [
      'What tools do you use for music or sound design?',
      'Can you make seamless loops?',
      'What genres or moods are you strongest in?',
    ],
  },

  '1654': {
    title: 'QA Game Tester',
    open: false,
    summary: 'Test builds, find bugs, and write clear reproduction steps.',
    questions: [
      'What devices or operating systems can you test on?',
      'Have you tested games or apps before?',
      'Can you write clear bug reports with steps and screenshots?',
    ],
  },

  '6987': {
    title: 'UI / UX Designer',
    open: false,
    summary: 'Design simple menus, icons, layout, and readable game screens.',
    questions: [
      'What design tools do you use?',
      'Do you have UI examples?',
      'Can you design for pixel-art games?',
    ],
  },

  '7578': {
    title: 'Trailer / Video Editor',
    open: false,
    summary: 'Edit gameplay clips, trailers, social clips, and short promotional videos.',
    questions: [
      'What editing software do you use?',
      'Can you cut short trailers or social clips?',
      'Link examples if available.',
    ],
  },

  '8345': {
    title: 'Community Helper',
    open: false,
    summary: 'Help organize feedback, answer basic questions, and keep community spaces clean.',
    questions: [
      'Have you moderated or helped in online communities before?',
      'What hours are you usually available?',
      'How would you handle rude or spammy behavior?',
    ],
  },
};

const els = {
  codePanel: document.querySelector('#codePanel'),
  codeForm: document.querySelector('#codeForm'),
  jobCode: document.querySelector('#jobCode'),
  codeMessage: document.querySelector('#codeMessage'),

  applicationPanel: document.querySelector('#applicationPanel'),
  applicationForm: document.querySelector('#applicationForm'),
  roleTitle: document.querySelector('#roleTitle'),
  roleSummary: document.querySelector('#roleSummary'),
  activeCode: document.querySelector('#activeCode'),
  questionArea: document.querySelector('#questionArea'),
  changeCodeButton: document.querySelector('#changeCodeButton'),
  submitButton: document.querySelector('#submitButton'),
  submitMessage: document.querySelector('#submitMessage'),
};

let activeJob = null;

function setMessage(el, text, kind = '') {
  el.textContent = text || '';
  el.classList.remove('good', 'bad');
  if (kind) el.classList.add(kind);
}

function clean(value, max = 900) {
  return String(value ?? '').replace(/\r/g, '').trim().slice(0, max);
}

function requireConfig() {
  if (!WORKER_URL || WORKER_URL.includes('PASTE_YOUR')) {
    throw new Error('Worker URL is not configured. Edit jobs/app.js.');
  }

  if (!SUBMIT_TOKEN || SUBMIT_TOKEN.includes('PASTE_YOUR')) {
    throw new Error('Submit token is not configured. Edit jobs/app.js.');
  }
}

function renderQuestions(job) {
  els.questionArea.innerHTML = '';

  if (!job.questions || job.questions.length === 0) {
    return;
  }

  const heading = document.createElement('h3');
  heading.textContent = 'Job Questions';
  els.questionArea.appendChild(heading);

  job.questions.forEach((question, index) => {
    const box = document.createElement('div');
    box.className = 'question-box field';

    const id = `question-${index}`;

    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = question;

    const textarea = document.createElement('textarea');
    textarea.id = id;
    textarea.rows = 5;
    textarea.required = true;
    textarea.dataset.question = question;

    box.append(label, textarea);
    els.questionArea.appendChild(box);
  });
}

function showApplication(code, job) {
  activeJob = job;

  els.activeCode.value = code;
  els.roleTitle.textContent = job.title;
  els.roleSummary.textContent = job.summary;

  renderQuestions(job);

  els.codePanel.classList.add('hidden');
  els.applicationPanel.classList.remove('hidden');
  setMessage(els.submitMessage, '');
}

function resetForm() {
  activeJob = null;
  els.applicationForm.reset();
  els.applicationPanel.classList.add('hidden');
  els.codePanel.classList.remove('hidden');
  els.jobCode.focus();
  setMessage(els.codeMessage, '');
  setMessage(els.submitMessage, '');
}

function buildDiscordPayload(code, job) {
  const answerFields = [...els.questionArea.querySelectorAll('textarea[data-question]')]
    .map((textarea) => ({
      name: clean(textarea.dataset.question, 240),
      value: clean(textarea.value, 1000) || '—',
      inline: false,
    }));

  return {
    _jobCode: code,

    // Do not use "contract" here, because the old Worker restricts contract
    // submissions to OPEN_CODES only. This keeps the old VALID_CODES usable.
    _formType: 'job_application',

    username: 'CG Job Applications',
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: `New Job Application — ${job.title}`,
        color: 15186531,
        timestamp: new Date().toISOString(),
        fields: [
          { name: 'Job Code', value: code, inline: true },
          { name: 'Position', value: job.title, inline: true },
          { name: 'Applicant', value: clean(document.querySelector('#fullName').value, 200), inline: true },
          { name: 'Email', value: clean(document.querySelector('#email').value, 200), inline: true },
          { name: 'Best Contact', value: clean(document.querySelector('#bestContact').value, 400) || '—', inline: true },
          { name: 'Pay Preference', value: clean(document.querySelector('#payPreference').value, 400) || '—', inline: true },
          { name: 'Portfolio / Examples', value: clean(document.querySelector('#portfolio').value, 900) || '—', inline: false },
          { name: 'Availability', value: clean(document.querySelector('#availability').value, 700) || '—', inline: false },
          { name: 'Relevant Experience', value: clean(document.querySelector('#experience').value, 1000) || '—', inline: false },
          ...answerFields,
          { name: 'Extra Notes', value: clean(document.querySelector('#notes').value, 1000) || '—', inline: false },
        ],
      },
    ],
  };
}

els.codeForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const code = clean(els.jobCode.value, 20);
  const job = JOBS[code];

  if (!job) {
    setMessage(els.codeMessage, 'Invalid job code.', 'bad');
    return;
  }

  if (!job.open) {
    setMessage(els.codeMessage, 'This position is not currently accepting applications.', 'bad');
    return;
  }

  showApplication(code, job);
});

els.changeCodeButton.addEventListener('click', resetForm);

els.applicationForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    requireConfig();
  } catch (error) {
    setMessage(els.submitMessage, error.message, 'bad');
    return;
  }

  if (!activeJob) {
    setMessage(els.submitMessage, 'No active job selected.', 'bad');
    return;
  }

  const honeypot = clean(document.querySelector('#website').value, 200);
  if (honeypot) {
    setMessage(els.submitMessage, 'Application submitted. Thank you.', 'good');
    els.applicationForm.reset();
    return;
  }

  const name = clean(document.querySelector('#fullName').value, 200);
  const email = clean(document.querySelector('#email').value, 200);

  if (name.length < 2) {
    setMessage(els.submitMessage, 'Enter your full name.', 'bad');
    return;
  }

  if (!email.includes('@')) {
    setMessage(els.submitMessage, 'Enter a valid email address.', 'bad');
    return;
  }

  const payload = buildDiscordPayload(els.activeCode.value, activeJob);

  els.submitButton.disabled = true;
  setMessage(els.submitMessage, 'Submitting application...');

  try {
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Submit-Token': SUBMIT_TOKEN,
      },
      body: JSON.stringify(payload),
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      throw new Error('Server returned an invalid response.');
    }

    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Submission failed.');
    }

    els.applicationForm.reset();
    els.applicationPanel.classList.add('hidden');
    els.codePanel.classList.remove('hidden');
    els.jobCode.value = '';

    setMessage(els.codeMessage, 'Application submitted. Thank you.', 'good');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    setMessage(els.submitMessage, error.message, 'bad');
  } finally {
    els.submitButton.disabled = false;
  }
});
