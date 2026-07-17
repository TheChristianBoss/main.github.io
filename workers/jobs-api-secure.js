// Cloudflare Worker — Christian Goblin secure job-application API
//
// Required secrets:
//   DISCORD_WEBHOOK_URL     — private Discord webhook for applications
//   TURNSTILE_SECRET_KEY    — Cloudflare Turnstile secret key
//   JOB_CODE_MAP            — JSON object mapping private codes to role IDs
//
// Required binding:
//   JOB_APPLICATIONS_KV     — KV namespace for rate limits and duplicate prevention
//
// Optional variable:
//   TURNSTILE_HOSTNAME      — expected hostname, for example christiangoblin.com
//
// Routes:
//   GET  /health            — configuration-safe health response
//   POST /job               — validate a private job code and return the open role
//   POST /apply             — validate and forward an application to Discord

const SITE = 'https://christiangoblin.com';
const ALLOWED_ORIGINS = new Set([
  'https://christiangoblin.com',
  'https://www.christiangoblin.com',
  'https://christiangoblin.github.io',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
]);

const MAX_BODY_BYTES = 64 * 1024;
const LOOKUP_LIMIT_PER_FIVE_MINUTES = 30;
const APPLY_LIMIT_PER_HOUR = 5;
const DUPLICATE_WINDOW_SECONDS = 10 * 60;
const EMBED_TEXT_BUDGET = 5_400;

const ROLE_CATALOG = Object.freeze({
  'sales-representative': {
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
  'pixel-artist': {
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
  'game-writer': {
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
  'godot-programmer': {
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
  'music-sound-designer': {
    title: 'Music / Sound Designer',
    open: false,
    summary: 'Create short loops, stingers, UI sounds, ambience, and boss/event music.',
    questions: [
      'What tools do you use for music or sound design?',
      'Can you make seamless loops?',
      'What genres or moods are you strongest in?',
    ],
  },
  'qa-game-tester': {
    title: 'QA Game Tester',
    open: false,
    summary: 'Test builds, find bugs, and write clear reproduction steps.',
    questions: [
      'What devices or operating systems can you test on?',
      'Have you tested games or apps before?',
      'Can you write clear bug reports with steps and screenshots?',
    ],
  },
  'ui-ux-designer': {
    title: 'UI / UX Designer',
    open: false,
    summary: 'Design simple menus, icons, layout, and readable game screens.',
    questions: [
      'What design tools do you use?',
      'Do you have UI examples?',
      'Can you design for pixel-art games?',
    ],
  },
  'video-editor': {
    title: 'Trailer / Video Editor',
    open: false,
    summary: 'Edit gameplay clips, trailers, social clips, and short promotional videos.',
    questions: [
      'What editing software do you use?',
      'Can you cut short trailers or social clips?',
      'Link examples if available.',
    ],
  },
  'community-helper': {
    title: 'Community Helper',
    open: false,
    summary: 'Help organize feedback, answer basic questions, and keep community spaces clean.',
    questions: [
      'Have you moderated or helped in online communities before?',
      'What hours are you usually available?',
      'How would you handle rude or spammy behavior?',
    ],
  },
});

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : SITE,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(request, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders(request),
    },
  });
}

function fail(request, message, status = 400, code = 'invalid_request') {
  return json(request, { ok: false, error: message, code }, status);
}

function requestOriginAllowed(request) {
  const origin = request.headers.get('Origin');
  return Boolean(origin && ALLOWED_ORIGINS.has(origin));
}

function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

function replaceControlCharacters(value, preserveNewlines = false) {
  return [...String(value ?? '')].map((character) => {
    const code = character.charCodeAt(0);
    if (preserveNewlines && code === 10) return '\n';
    if (code < 32 || code === 127) return ' ';
    return character;
  }).join('');
}

function cleanLine(value, max = 300) {
  return replaceControlCharacters(value)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function cleanMultiline(value, max = 1_000) {
  return replaceControlCharacters(value, true)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

function normalizeJobCode(value) {
  return String(value ?? '').trim().toUpperCase().slice(0, 64);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function cleanOptionalUrl(value) {
  const input = cleanLine(value, 900);
  if (!input) return '';
  try {
    const url = new URL(input);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function parseJobCodeMap(env) {
  if (!env.JOB_CODE_MAP) throw new Error('Missing JOB_CODE_MAP');
  const parsed = JSON.parse(env.JOB_CODE_MAP);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JOB_CODE_MAP must be a JSON object');
  }

  const normalized = new Map();
  for (const [code, roleId] of Object.entries(parsed)) {
    const normalizedCode = normalizeJobCode(code);
    if (normalizedCode.length < 12 || !/^[A-Z0-9_-]+$/.test(normalizedCode)) continue;
    if (!ROLE_CATALOG[roleId]) continue;
    normalized.set(normalizedCode, roleId);
  }
  return normalized;
}

function findOpenRole(code, env) {
  const roleId = parseJobCodeMap(env).get(normalizeJobCode(code));
  const role = roleId ? ROLE_CATALOG[roleId] : null;
  if (!roleId || !role?.open) return null;
  return { roleId, role };
}

async function parseJsonBody(request) {
  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Response('JSON required', { status: 415 });
  }

  const declaredLength = Number(request.headers.get('Content-Length') || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    throw new Response('Request too large', { status: 413 });
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    throw new Response('Request too large', { status: 413 });
  }

  try {
    return JSON.parse(text || '{}');
  } catch {
    throw new Response('Invalid JSON', { status: 400 });
  }
}

async function incrementRateLimit(kv, key, limit, ttlSeconds) {
  if (!kv) throw new Error('Missing JOB_APPLICATIONS_KV binding');
  const current = Number(await kv.get(key)) || 0;
  if (current >= limit) return false;
  await kv.put(key, String(current + 1), { expirationTtl: ttlSeconds });
  return true;
}

async function verifyTurnstile(token, request, env) {
  if (!env.TURNSTILE_SECRET_KEY) throw new Error('Missing TURNSTILE_SECRET_KEY');
  const cleanToken = cleanLine(token, 2_048);
  if (!cleanToken) return false;

  const form = new FormData();
  form.set('secret', env.TURNSTILE_SECRET_KEY);
  form.set('response', cleanToken);
  form.set('remoteip', clientIp(request));

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  });
  if (!response.ok) return false;

  const result = await response.json();
  if (!result.success) return false;
  if (result.action && result.action !== 'job_application') return false;
  if (env.TURNSTILE_HOSTNAME && result.hostname !== env.TURNSTILE_HOSTNAME) return false;
  return true;
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function ellipsize(value, max) {
  const text = String(value || '—');
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(1, max - 1))}…`;
}

function buildDiscordEmbed(application, role) {
  const title = `New Job Application — ${role.title}`;
  const fields = [];
  let used = title.length;

  const addField = (name, value, inline = false, preferredMax = 700) => {
    const safeName = ellipsize(cleanLine(name, 256) || 'Field', 256);
    const remaining = EMBED_TEXT_BUDGET - used - safeName.length;
    if (remaining < 20 || fields.length >= 25) return;
    const safeValue = ellipsize(cleanMultiline(value, 1_024) || '—', Math.min(1_024, preferredMax, remaining));
    fields.push({ name: safeName, value: safeValue, inline });
    used += safeName.length + safeValue.length;
  };

  addField('Applicant', application.fullName, true, 200);
  addField('Email', application.email, true, 254);
  addField('Best Contact', application.bestContact, true, 300);
  addField('Availability', application.availability, true, 300);
  addField('Pay Preference', application.payPreference, true, 300);
  addField('Portfolio / Examples', application.portfolio, false, 500);
  addField('Relevant Experience', application.experience, false, 700);

  role.questions.forEach((question, index) => {
    addField(question, application.answers[index], false, 520);
  });

  addField('Extra Notes', application.notes, false, 500);
  addField('Application ID', application.applicationId, false, 100);

  return {
    title,
    color: 15186531,
    timestamp: new Date().toISOString(),
    fields,
    footer: { text: 'Submitted through christiangoblin.com/jobs' },
  };
}

async function sendToDiscord(application, role, env) {
  if (!env.DISCORD_WEBHOOK_URL) throw new Error('Missing DISCORD_WEBHOOK_URL');
  const response = await fetch(env.DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'CG Job Applications',
      allowed_mentions: { parse: [] },
      embeds: [buildDiscordEmbed(application, role)],
    }),
  });

  if (!response.ok) {
    const detail = cleanLine(await response.text(), 300);
    throw new Error(`Discord webhook failed (${response.status})${detail ? `: ${detail}` : ''}`);
  }
}

async function handleJobLookup(request, env) {
  const ip = clientIp(request);
  const windowId = Math.floor(Date.now() / (5 * 60 * 1_000));
  const allowed = await incrementRateLimit(
    env.JOB_APPLICATIONS_KV,
    `lookup:${ip}:${windowId}`,
    LOOKUP_LIMIT_PER_FIVE_MINUTES,
    10 * 60,
  );
  if (!allowed) return fail(request, 'Too many attempts. Try again later.', 429, 'rate_limited');

  const body = await parseJsonBody(request);
  const match = findOpenRole(body.jobCode, env);
  if (!match) return fail(request, 'No open role matches that code.', 404, 'role_not_found');

  return json(request, {
    ok: true,
    role: {
      title: match.role.title,
      summary: match.role.summary,
      questions: match.role.questions,
    },
  });
}

function normalizeApplication(body, role) {
  const fullName = cleanLine(body.fullName, 200);
  const email = cleanLine(body.email, 254).toLowerCase();
  const portfolioInput = cleanLine(body.portfolio, 900);
  const answers = Array.isArray(body.answers)
    ? body.answers.map((answer) => cleanMultiline(answer, 1_000))
    : [];

  if (fullName.length < 2) throw new Error('Enter your full name.');
  if (!validEmail(email)) throw new Error('Enter a valid email address.');
  if (portfolioInput && !cleanOptionalUrl(portfolioInput)) throw new Error('Enter a valid portfolio URL.');
  if (answers.length !== role.questions.length || answers.some((answer) => answer.length < 1)) {
    throw new Error('Answer every job question.');
  }
  if (body.privacyAccepted !== true) throw new Error('Accept the application privacy notice.');

  const clientId = cleanLine(body.applicationId, 100);
  const applicationId = /^[a-f0-9-]{20,100}$/i.test(clientId) ? clientId : crypto.randomUUID();

  return {
    applicationId,
    fullName,
    email,
    bestContact: cleanLine(body.bestContact, 400),
    portfolio: cleanOptionalUrl(portfolioInput),
    availability: cleanLine(body.availability, 700),
    payPreference: cleanLine(body.payPreference, 400),
    experience: cleanMultiline(body.experience, 1_500),
    answers,
    notes: cleanMultiline(body.notes, 1_000),
  };
}

async function handleApplication(request, env) {
  const ip = clientIp(request);
  const hourId = Math.floor(Date.now() / (60 * 60 * 1_000));
  const allowed = await incrementRateLimit(
    env.JOB_APPLICATIONS_KV,
    `apply:${ip}:${hourId}`,
    APPLY_LIMIT_PER_HOUR,
    2 * 60 * 60,
  );
  if (!allowed) return fail(request, 'Too many applications were submitted. Try again later.', 429, 'rate_limited');

  const body = await parseJsonBody(request);

  // Honeypot: acknowledge without forwarding so bots receive no useful signal.
  if (cleanLine(body.website, 200)) {
    return json(request, { ok: true, applicationId: crypto.randomUUID() }, 202);
  }

  const captchaValid = await verifyTurnstile(body.turnstileToken, request, env);
  if (!captchaValid) return fail(request, 'Human verification failed. Please try again.', 400, 'captcha_failed');

  const match = findOpenRole(body.jobCode, env);
  if (!match) return fail(request, 'This role is not available.', 404, 'role_not_found');

  let application;
  try {
    application = normalizeApplication(body, match.role);
  } catch (error) {
    return fail(request, error.message || 'Check the application fields.', 400, 'validation_failed');
  }

  const duplicateHash = await sha256(`${match.roleId}\n${application.email}`);
  const duplicateKey = `duplicate:${duplicateHash}`;
  if (await env.JOB_APPLICATIONS_KV.get(duplicateKey)) {
    return fail(request, 'An application for this role was recently submitted with that email.', 409, 'duplicate');
  }

  await sendToDiscord(application, match.role, env);
  await env.JOB_APPLICATIONS_KV.put(duplicateKey, application.applicationId, {
    expirationTtl: DUPLICATE_WINDOW_SECONDS,
  });

  return json(request, { ok: true, applicationId: application.applicationId }, 201);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      if (!requestOriginAllowed(request)) return fail(request, 'Origin not allowed.', 403, 'origin_denied');
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return json(request, { ok: true, service: 'jobs-api' });
    }

    if (!requestOriginAllowed(request)) {
      return fail(request, 'Origin not allowed.', 403, 'origin_denied');
    }

    try {
      if (request.method === 'POST' && url.pathname === '/job') {
        return await handleJobLookup(request, env);
      }
      if (request.method === 'POST' && url.pathname === '/apply') {
        return await handleApplication(request, env);
      }
      return fail(request, 'Not found.', 404, 'not_found');
    } catch (error) {
      if (error instanceof Response) {
        const message = error.status === 413 ? 'Request too large.'
          : error.status === 415 ? 'JSON request required.'
            : 'Invalid request.';
        return fail(request, message, error.status, 'invalid_request');
      }
      console.error('Jobs API error:', error);
      return fail(request, 'The application service is temporarily unavailable.', 500, 'server_error');
    }
  },
};
