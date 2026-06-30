// ─── SHARED RESUME UTILITIES ─────────────────────────────────────────────────
// Single source of truth for helpers used across App.jsx tabs and analyzeResume.js
// Import from here rather than defining inline in each file.

import roleKeywords, { normalizeKeyword } from "../data/roleKeywords";

export { normalizeKeyword };

// ─── SCORING HELPERS ──────────────────────────────────────────────────────────

export const getScoreColor = (v) =>
  v >= 80 ? "#22c55e" : v >= 50 ? "#facc15" : "#ef4444";

export const getResumeGrade = (v) => {
  if (v >= 90) return "Excellent";
  if (v >= 75) return "Strong";
  if (v >= 60) return "Competitive";
  if (v >= 40) return "Average";
  return "Weak";
};

export const getConfidenceLabel = (s) => {
  if (s >= 85) return "Strong keyword and formatting alignment";
  if (s >= 70) return "Good alignment, with some improvement areas";
  if (s >= 55) return "Partial alignment; review keywords, sections, and formatting";
  if (s >= 40) return "Weak alignment; several important gaps need review";
  return "Very weak alignment; rebuild around the target role";
};

// ─── ANALYSIS HELPERS ─────────────────────────────────────────────────────────

export const detectMetrics = (text) => [
  ...(text.match(/\d+%/g) || []),
  ...(text.match(/\$\d[\d,]*/g) || []),
  ...(text.match(/\d+x\b/gi) || []),
];

export const detectDuplicateWords = (text) => {
  const words = normalizeKeyword(text).split(/\W+/).filter((w) => w.length > 4);
  const counts = {};
  words.forEach((w) => { counts[w] = (counts[w] || 0) + 1; });
  return Object.entries(counts)
    .filter(([, c]) => c >= 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
};

export const detectKeywordStuffing = (text, keywords) => {
  const n = normalizeKeyword(text);
  return Object.keys(keywords).flatMap((kw) => {
    const count = (n.match(new RegExp(`\\b${kw}\\b`, "g")) || []).length;
    return count > 8 ? [{ keyword: kw, count }] : [];
  });
};

// firstImpression is clamped to 100 here — the App.jsx inline version was missing this
export const simulateRecruiter = (text, kScore, fScore, metrics, wVerbs, sVerbs) => {
  const lines = text.split("\n").filter((l) => l.trim());
  const avgLineLen = lines.reduce((s, l) => s + l.length, 0) / (lines.length || 1);
  const scanSpeed = avgLineLen < 60 ? "Fast" : avgLineLen < 90 ? "Moderate" : "Slow";
  const keyVisibility = kScore >= 70 ? "High" : kScore >= 40 ? "Medium" : "Low";
  const readabilityScore = Math.min(100, Math.round(
    (avgLineLen < 80 ? 30 : 10) +
    (lines.length < 40 ? 30 : 15) +
    (wVerbs.length === 0 ? 20 : 5) +
    (metrics.length > 3 ? 20 : 10)
  ));
  const firstImpression = Math.min(100, Math.round(
    kScore * 0.4 + fScore * 0.3 + (sVerbs.length > 3 ? 20 : 5) + (metrics.length > 2 ? 10 : 0)
  ));
  return { scanSpeed, keyVisibility, readabilityScore, firstImpression };
};

export const parseResumeInsights = (text) => ({
  email:    text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)?.[0]          || "Not Found",
  phone:    text.match(/(\+?\d{1,2}\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g)?.[0] || "Not Found",
  linkedin: text.match(/(linkedin\.com\/in\/[A-Za-z0-9-_]+)/gi)?.[0]             || "Not Found",
  github:   text.match(/(github\.com\/[A-Za-z0-9-_]+)/gi)?.[0]                   || "Not Found",
});

// ─── FORMATTING ───────────────────────────────────────────────────────────────

export const analyzeFormatting = (text) => {
  const warnings = [];
  // Only flag pipes that appear mid-line in non-contact contexts
  // (pipe-separated contact lines are legitimate; we detect abuse by counting pipes per line)
  const lines = text.split("\n");
  const pipeAbuse = lines.some((l) => (l.match(/\|/g) || []).length > 4);
  if (pipeAbuse) warnings.push("Tables detected — ATS may misread multi-column layouts.");
  if (text.includes("★") || text.includes("◆")) warnings.push("Excessive symbols detected.");
  if (text.length < 300) warnings.push("Resume appears too short (< 300 chars).");
  if (!text.toLowerCase().includes("experience")) warnings.push("Missing work experience section.");
  if (!text.toLowerCase().includes("skills")) warnings.push("Missing skills section.");
  return warnings;
};

// ─── SKILL DATABASE ───────────────────────────────────────────────────────────

export const skillDatabase = [
  "javascript", "typescript", "react", "vue", "angular", "node", "express",
  "mongodb", "sql", "postgresql", "python", "java", "aws", "docker", "git",
  "github", "excel", "leadership", "communication", "customer service",
  "project management", "sales", "marketing", "cyber security", "machine learning",
  "ci/cd", "kubernetes", "terraform", "redux", "graphql", "rest api",
];

export const detectSkills = (text) => {
  const n = normalizeKeyword(text);
  return skillDatabase.filter((s) => n.includes(normalizeKeyword(s)));
};

// ─── PURE RESUME SCORER ───────────────────────────────────────────────────────
// Scores a raw resume string against a role. Used for both Resume A and B
// so comparison mode doesn't need a separate inline implementation.

import rolePhrases from "../data/phrases";
import { strongActionVerbs, weakActionVerbs } from "../data/actionVerbs";

const resumeSections = [
  "skills", "experience", "education", "projects",
  "certifications", "summary", "technical skills", "employment", "volunteer",
];

const ignoredWords = [
  "the","and","for","with","you","your","are","this","that","will","have",
  "from","our","job","work","team","role","was","has","not","but","can",
];

export const scoreResume = (resumeText, role, jobDescription = "") => {
  if (!resumeText.trim()) return null;

  const normalizedResume = normalizeKeyword(resumeText);
  const roleData = roleKeywords[role] || {};
  const critKws = roleData.critical || {};
  const optKws  = roleData.optional || {};
  const weightedKeywords = { ...critKws, ...optKws };

  let totalWeight = 0, matchedWeight = 0;
  const missingCritical = [], missingOptional = [];

  Object.entries(weightedKeywords).forEach(([keyword, weight]) => {
    totalWeight += weight;
    if (normalizedResume.includes(keyword)) {
      matchedWeight += weight;
    } else {
      if (weight >= 8) missingCritical.push(keyword);
      else missingOptional.push(keyword);
    }
  });

  const keywordScore = totalWeight > 0
    ? Math.round((matchedWeight / totalWeight) * 100)
    : 0;

  const phrases = rolePhrases[role] || [];
  const matchedPhrases = phrases.filter((p) => normalizedResume.includes(normalizeKeyword(p)));
  const missingPhrases  = phrases.filter((p) => !normalizedResume.includes(normalizeKeyword(p)));

  const detectedSections = resumeSections.filter((s) => normalizedResume.includes(s));
  const formatWarnings   = analyzeFormatting(resumeText);
  const formatScore      = Math.max(100 - formatWarnings.length * 15, 0);
  const sectionScore     = Math.round((detectedSections.length / resumeSections.length) * 100);

  const strongVerbs = strongActionVerbs.filter((v) => normalizeKeyword(resumeText).includes(v));
  const weakVerbs   = weakActionVerbs.filter((v)   => normalizeKeyword(resumeText).includes(v));
  const metrics     = detectMetrics(resumeText);
  const stuffing    = detectKeywordStuffing(resumeText, weightedKeywords);

  const overallScore = Math.max(0, Math.min(100, Math.round(
    keywordScore * 0.45 +
    sectionScore * 0.2  +
    formatScore  * 0.2  +
    metrics.length * 2  -
    stuffing.length * 5
  )));

  // Skill gap vs job description
  const jdWords = jobDescription
    ? normalizeKeyword(jobDescription).split(/\W+/).filter((w) => w.length > 3 && !ignoredWords.includes(w))
    : [];
  const resumeSkillSet = new Set(skillDatabase.map(normalizeKeyword).filter((s) => normalizedResume.includes(s)));
  const skillGaps = [...new Set(jdWords)]
    .filter((w) => skillDatabase.map(normalizeKeyword).includes(w) && !resumeSkillSet.has(w))
    .slice(0, 10);

  const recruiterSim = simulateRecruiter(resumeText, keywordScore, formatScore, metrics, weakVerbs, strongVerbs);

  const suggestions = [];
  if (missingCritical.length > 0) suggestions.push(`Add critical keywords: ${missingCritical.slice(0, 3).join(", ")}.`);
  if (metrics.length < 3)         suggestions.push("Add more quantified achievements (numbers, %, $).");
  if (weakVerbs.length > 0)       suggestions.push(`Replace weak verbs: ${weakVerbs.slice(0, 2).join(", ")}.`);
  if (formatWarnings.length > 0)  suggestions.push("Fix ATS formatting issues listed below.");
  if (detectedSections.length < 4) suggestions.push("Add more resume sections (Skills, Experience, Education, Projects).");
  suggestions.push("Tailor each application specifically to the job description.");

  return {
    score: overallScore,
    keywordScore,
    formatScore,
    sectionScore,
    missingCritical,
    missingOptional,
    criticalKeywords: Object.keys(critKws),
    optionalKeywords: Object.keys(optKws),
    matchedPhrases,
    missingPhrases,
    detectedSections,
    formatWarnings,
    insights:      parseResumeInsights(resumeText),
    detectedSkills: detectSkills(resumeText),
    strongVerbs,
    weakVerbs,
    metrics,
    stuffing,
    duplicateWords: detectDuplicateWords(resumeText),
    skillGaps,
    recruiterSim,
    suggestions,
    confidenceLabel: getConfidenceLabel(overallScore),
    grade:           getResumeGrade(overallScore),
    atsPreview:      resumeText.substring(0, 2500),
    topSkills:       Object.keys(weightedKeywords).slice(0, 5),
  };
};

// ─── BULLET REWRITER ──────────────────────────────────────────────────────────

export const rewriteBullet = (line) => {
  const patterns = [
    { pattern: /^responsible for (.+)/i,     rewrite: (m) => `Managed and delivered ${m[1]}` },
    { pattern: /^helped (with |to )?(.+)/i,  rewrite: (m) => `Contributed to ${m[2]} driving measurable team outcomes` },
    { pattern: /^worked on (.+)/i,           rewrite: (m) => `Developed and implemented ${m[1]}` },
    { pattern: /^assisted (with |in )?(.+)/i,rewrite: (m) => `Supported ${m[2]} resulting in improved team efficiency` },
    { pattern: /^did (.+)/i,                 rewrite: (m) => `Executed ${m[1]} with cross-functional collaboration` },
    { pattern: /^handled (.+)/i,             rewrite: (m) => `Oversaw ${m[1]}, ensuring quality and timely delivery` },
    { pattern: /^was in charge of (.+)/i,    rewrite: (m) => `Led ${m[1]} and drove key outcomes` },
    { pattern: /^managed (.+)/i,             rewrite: (m) => `Directed ${m[1]}, achieving operational excellence` },
  ];
  for (const { pattern, rewrite } of patterns) {
    const match = line.match(pattern);
    if (match) return rewrite(match);
  }
  return null;
};
