import roleKeywords, { normalizeKeyword } from "../data/roleKeywords";
import rolePhrases from "../data/phrases";
import { strongActionVerbs, weakActionVerbs } from "../data/actionVerbs";

const REQUIRED_SECTIONS = ["experience", "education", "skills", "summary"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const detectMetrics = (text) => [
  ...(text.match(/\d+%/g) || []),
  ...(text.match(/\$\d[\d,]*/g) || []),
  ...(text.match(/\d+x\b/gi) || []),
];

const detectDuplicateWords = (text) => {
  const words = normalizeKeyword(text).split(/\W+/).filter((w) => w.length > 4);
  const counts = {};
  words.forEach((w) => { counts[w] = (counts[w] || 0) + 1; });
  return Object.entries(counts).filter(([, c]) => c >= 5).sort((a, b) => b[1] - a[1]).slice(0, 10);
};

const detectKeywordStuffing = (text, keywords) => {
  const n = normalizeKeyword(text);
  return Object.keys(keywords).flatMap((kw) => {
    const count = (n.match(new RegExp(`\\b${kw}\\b`, "g")) || []).length;
    return count > 8 ? [{ keyword: kw, count }] : [];
  });
};

const simulateRecruiter = (text, kScore, fScore, metrics, wVerbs, sVerbs) => {
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

const parseResumeInsights = (text) => ({
  email: text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)?.[0] || null,
  phone: text.match(/(\+?\d{1,2}\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g)?.[0] || null,
  linkedin: text.match(/(linkedin\.com\/in\/[A-Za-z0-9-_]+)/gi)?.[0] || null,
  github: text.match(/(github\.com\/[A-Za-z0-9-_]+)/gi)?.[0] || null,
});

export const getGrade = (score) =>
  score >= 90 ? "Excellent" :
  score >= 75 ? "Strong" :
  score >= 60 ? "Competitive" :
  score >= 40 ? "Average" : "Needs Work";

export const getConfidenceLabel = (score) => {
  if (score >= 85) return "Very likely to pass ATS screening";
  if (score >= 70) return "Likely to pass ATS screening";
  if (score >= 55) return "May pass ATS screening with improvements";
  if (score >= 40) return "Unlikely to pass ATS screening";
  return "Very unlikely to pass ATS screening";
};

export const SCORE_COLOR = (v) => v >= 80 ? "#22c55e" : v >= 50 ? "#e8c547" : "#ef4444";

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export function analyzeResume(data, role) {
  const allText = Object.values(data).filter((v) => typeof v === "string").join(" ");
  if (!allText.trim()) return null;

  const norm = normalizeKeyword(allText);
  const roleData = roleKeywords[role] || {};
  const critKws = roleData.critical || {};
  const optKws = roleData.optional || {};
  const allKws = { ...critKws, ...optKws };

  let totalWeight = 0, matchedWeight = 0;
  const missingCritical = [], missingOptional = [], presentKeywords = [];
  Object.entries(critKws).forEach(([kw, w]) => {
    totalWeight += w;
    if (norm.includes(kw)) { matchedWeight += w; presentKeywords.push(kw); }
    else missingCritical.push(kw);
  });
  Object.entries(optKws).forEach(([kw, w]) => {
    totalWeight += w;
    if (norm.includes(kw)) { matchedWeight += w; presentKeywords.push(kw); }
    else missingOptional.push(kw);
  });
  const keywordScore = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 50;

  // Sections
  const foundSections = REQUIRED_SECTIONS.filter((s) => data[s] && data[s].trim());
  const missingSections = REQUIRED_SECTIONS.filter((s) => !data[s] || !data[s].trim());
  const sectionScore = Math.round((foundSections.length / REQUIRED_SECTIONS.length) * 100);

  // Format
  const formatWarnings = [];
  if (!data.email || !data.email.includes("@")) formatWarnings.push("No valid email address");
  if (!data.phone || data.phone.length < 7) formatWarnings.push("No phone number");
  if (!data.name || !data.name.trim()) formatWarnings.push("No name entered");
  if (allText.length < 200) formatWarnings.push("Resume is too short");
  const formatScore = Math.max(0, 100 - formatWarnings.length * 22);

  // Verbs
  const lower = allText.toLowerCase();
  const foundWeakVerbs = weakActionVerbs.filter((v) => lower.includes(v));
  const foundStrongVerbs = strongActionVerbs.filter((v) => lower.includes(v));

  // Phrases
  const phrases = rolePhrases[role] || [];
  const matchedPhrases = phrases.filter((p) => norm.includes(normalizeKeyword(p)));
  const missingPhrases = phrases.filter((p) => !norm.includes(normalizeKeyword(p))).slice(0, 5);

  // New: metrics, stuffing, duplicates, recruiter, insights
  const metricsFound = detectMetrics(allText);
  const stuffingWarnings = detectKeywordStuffing(allText, allKws);
  const duplicateWords = detectDuplicateWords(allText);
  const recruiterSim = simulateRecruiter(allText, keywordScore, formatScore, metricsFound, foundWeakVerbs, foundStrongVerbs);
  const insights = parseResumeInsights(allText);

  // Upgraded scoring formula
  const stuffingPenalty = stuffingWarnings.length;
  const overall = Math.max(0, Math.min(100, Math.round(
    keywordScore * 0.45 +
    sectionScore * 0.25 +
    formatScore * 0.20 +
    Math.min(metricsFound.length * 2, 10) -
    stuffingPenalty * 5
  )));

  // Suggestions
  const suggestions = [];
  if (missingCritical.length > 0) suggestions.push(`Add critical keywords: ${missingCritical.slice(0, 3).join(", ")}.`);
  if (metricsFound.length < 3) suggestions.push("Add more quantified achievements (numbers, %, $).");
  if (foundWeakVerbs.length > 0) suggestions.push(`Replace weak verbs: ${foundWeakVerbs.slice(0, 2).join(", ")}.`);
  if (formatWarnings.length > 0) suggestions.push("Fix formatting issues listed in the Score tab.");
  if (foundSections.length < 4) suggestions.push("Add missing required sections.");
  suggestions.push("Tailor each application specifically to the job description.");

  return {
    overall, keywordScore, sectionScore, formatScore,
    missingCritical: missingCritical.slice(0, 8),
    missingOptional: missingOptional.slice(0, 6),
    presentKeywords, foundWeakVerbs, foundStrongVerbs,
    matchedPhrases, missingPhrases,
    metricsFound, stuffingWarnings, duplicateWords,
    recruiterSim, insights, formatWarnings,
    missingSections, foundSections,
    suggestions,
    confidenceLabel: getConfidenceLabel(overall),
    grade: getGrade(overall),
  };
}
