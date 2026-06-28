import { getScoreColor, getResumeGrade } from "../utils/resumeUtils";

const resumeSections = [
  "skills", "experience", "education", "projects",
  "certifications", "summary", "technical skills", "employment", "volunteer",
];

function safeList(value) {
  return Array.isArray(value) ? value : [];
}

function buildReport(analysis) {
  const lines = [];
  lines.push("Christian Goblin ATS Checker Report");
  lines.push("Heuristic resume review — not a guarantee of employer ATS performance.");
  lines.push("");
  lines.push(`Overall score: ${analysis.score}%`);
  lines.push(`Resume strength: ${getResumeGrade(analysis.score)}`);
  lines.push(`Keyword match: ${analysis.keywordScore}%`);
  lines.push(`Formatting: ${analysis.formatScore}%`);
  lines.push(`Sections: ${analysis.sectionScore}%`);
  lines.push("");

  const sections = [
    ["Missing critical keywords", analysis.missingCritical],
    ["Missing optional keywords", analysis.missingOptional],
    ["Missing role phrases", analysis.missingPhrases],
    ["Detected skills", analysis.detectedSkills],
    ["Strong verbs", analysis.strongVerbs],
    ["Weak resume language", analysis.weakVerbs],
    ["Formatting warnings", analysis.formatWarnings],
    ["Suggestions", analysis.suggestions],
  ];

  sections.forEach(([title, items]) => {
    lines.push(title);
    safeList(items).forEach((item) => lines.push(`- ${typeof item === "string" ? item : JSON.stringify(item)}`));
    if (!safeList(items).length) lines.push("- None detected");
    lines.push("");
  });

  if (analysis.atsPreview) {
    lines.push("ATS parse preview");
    lines.push(analysis.atsPreview);
  }

  return lines.join("\n");
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export default function ResultsPanel({ analysis }) {
  if (!analysis) {
    return (
      <div className="ats-card">
        <p className="ats-muted">Run an analysis from the Input tab first.</p>
      </div>
    );
  }

  const {
    score = 0, keywordScore = 0, formatScore = 0, sectionScore = 0,
    missingCritical = [], missingOptional = [],
    matchedPhrases = [], missingPhrases = [],
    detectedSections = [], formatWarnings = [],
    insights = {}, detectedSkills = [],
    strongVerbs = [], weakVerbs = [], metrics = [],
    stuffing = [], duplicateWords = [],
    skillGaps = [], recruiterSim,
    suggestions = [], confidenceLabel, topSkills = [],
    atsPreview = "",
  } = analysis;

  return (
    <div id="results-section" className="ats-card">
      <div className="ats-result-actions">
        <button className="ats-btn ats-btn--small" onClick={() => window.print()}>Print / save PDF</button>
        <button className="ats-btn ats-btn--small" onClick={() => downloadText("ats-report.txt", buildReport(analysis))}>Download report</button>
        <button className="ats-btn ats-btn--small" onClick={() => navigator.clipboard?.writeText(buildReport(analysis))}>Copy report</button>
      </div>

      <div className="ats-score-hero">
        <h2 style={{ color: getScoreColor(score) }}>Heuristic Match Score: {score}%</h2>
        <div className="ats-confidence-badge" style={{ borderColor: getScoreColor(score), color: getScoreColor(score) }}>
          {score}% estimated resume-match strength
        </div>
        <p className="ats-confidence-label">{confidenceLabel || "This score is a guidance estimate, not an ATS guarantee."}</p>
        <h3>Resume Strength: {getResumeGrade(score)}</h3>
      </div>

      <div className="ats-notice">
        Employer ATS platforms, recruiter filters, and job-board parsers vary. Use this as a practical checklist: improve truthful keyword alignment, clear sections, readable formatting, and quantified achievements.
      </div>

      <div className="ats-subscores">
        {[
          { label: "Keyword Match", value: keywordScore },
          { label: "Formatting",    value: formatScore  },
          { label: "Sections",      value: sectionScore },
        ].map(({ label, value }) => (
          <div key={label} className="ats-subscore">
            <div className="ats-subscore-label">{label}</div>
            <div className="ats-subscore-bar">
              <div className="ats-subscore-fill" style={{ width: `${value}%`, background: getScoreColor(value) }} />
            </div>
            <div className="ats-subscore-val" style={{ color: getScoreColor(value) }}>{value}%</div>
          </div>
        ))}
      </div>

      {recruiterSim && (
        <section className="ats-section">
          <h3 className="ats-section-title">Recruiter-style quick scan</h3>
          <div className="ats-keywords">
            <div className="ats-keyword">Scan Speed: <b>{recruiterSim.scanSpeed}</b></div>
            <div className="ats-keyword">Keyword Visibility: <b>{recruiterSim.keyVisibility}</b></div>
            <div className="ats-keyword ats-keyword--score" style={{ borderColor: getScoreColor(recruiterSim.readabilityScore) }}>
              Readability: <b>{recruiterSim.readabilityScore}%</b>
            </div>
            <div className="ats-keyword ats-keyword--score" style={{ borderColor: getScoreColor(recruiterSim.firstImpression) }}>
              First Impression: <b>{recruiterSim.firstImpression}%</b>
            </div>
          </div>
        </section>
      )}

      {safeList(skillGaps).length > 0 && (
        <section className="ats-section">
          <h3 className="ats-section-title">Skill gap analysis</h3>
          <p className="ats-muted ats-small">Skills found in the job description but missing from your resume:</p>
          <div className="ats-keywords">
            {skillGaps.map((gap, i) => (
              <div key={i} className="ats-keyword ats-keyword--bad">{gap}</div>
            ))}
          </div>
        </section>
      )}

      <section className="ats-section">
        <h3 className="ats-section-title">Detected contact info</h3>
        <div className="ats-keywords">
          {Object.entries(insights).map(([k, v]) => (
            <div key={k} className="ats-keyword">{k}: {v}</div>
          ))}
        </div>
      </section>

      {safeList(matchedPhrases).length > 0 && (
        <section className="ats-section">
          <h3 className="ats-section-title">Matched role phrases</h3>
          <div className="ats-keywords">
            {matchedPhrases.map((p, i) => (
              <div key={i} className="ats-keyword ats-keyword--good">"{p}"</div>
            ))}
          </div>
        </section>
      )}

      {safeList(missingPhrases).length > 0 && (
        <section className="ats-section">
          <h3 className="ats-section-title">Missing role phrases</h3>
          <p className="ats-muted ats-small">Only add phrases that truthfully describe your background.</p>
          <div className="ats-keywords">
            {missingPhrases.map((p, i) => (
              <div key={i} className="ats-keyword ats-keyword--warn">"{p}"</div>
            ))}
          </div>
        </section>
      )}

      <section className="ats-section">
        <h3 className="ats-section-title">Missing critical keywords</h3>
        <div className="ats-keywords">
          {safeList(missingCritical).length === 0
            ? <div className="ats-keyword ats-keyword--good">No critical keywords missing</div>
            : missingCritical.map((w, i) => <div key={i} className="ats-keyword ats-keyword--bad">{w}</div>)}
        </div>
      </section>

      <section className="ats-section">
        <h3 className="ats-section-title">Missing optional keywords</h3>
        <div className="ats-keywords">
          {safeList(missingOptional).length === 0
            ? <div className="ats-keyword ats-keyword--good">No optional keywords missing</div>
            : missingOptional.map((w, i) => <div key={i} className="ats-keyword ats-keyword--warn">{w}</div>)}
        </div>
      </section>

      <section className="ats-section">
        <h3 className="ats-section-title">Detected skills</h3>
        <div className="ats-keywords">
          {safeList(detectedSkills).length === 0
            ? <div className="ats-keyword ats-muted">None detected from the standard skill list.</div>
            : detectedSkills.map((s, i) => <div key={i} className="ats-keyword ats-keyword--good">{s}</div>)}
        </div>
      </section>

      <section className="ats-section">
        <h3 className="ats-section-title">Strong action verbs</h3>
        <div className="ats-keywords">
          {safeList(strongVerbs).length === 0
            ? <div className="ats-keyword ats-muted">None detected.</div>
            : strongVerbs.map((v, i) => <div key={i} className="ats-keyword ats-keyword--good">{v}</div>)}
        </div>
      </section>

      <section className="ats-section">
        <h3 className="ats-section-title">Weak resume language</h3>
        <div className="ats-keywords">
          {safeList(weakVerbs).length === 0
            ? <div className="ats-keyword ats-keyword--good">No weak verbs detected</div>
            : weakVerbs.map((v, i) => <div key={i} className="ats-keyword ats-keyword--warn">{v}</div>)}
        </div>
      </section>

      <section className="ats-section">
        <h3 className="ats-section-title">Quantified achievements</h3>
        <div className="ats-keywords">
          {safeList(metrics).length === 0
            ? <div className="ats-keyword ats-muted">None found — add numbers, percentages, dollar amounts, volume, time saved, or accuracy improvements.</div>
            : metrics.map((m, i) => <div key={i} className="ats-keyword ats-keyword--good">{m}</div>)}
        </div>
      </section>

      <section className="ats-section">
        <h3 className="ats-section-title">ATS formatting warnings</h3>
        <div className="ats-keywords">
          {safeList(formatWarnings).length === 0
            ? <div className="ats-keyword ats-keyword--good">No formatting issues detected</div>
            : formatWarnings.map((w, i) => <div key={i} className="ats-keyword ats-keyword--bad">{w}</div>)}
        </div>
      </section>

      <section className="ats-section">
        <h3 className="ats-section-title">Resume suggestions</h3>
        <div className="ats-keywords">
          {safeList(suggestions).length === 0
            ? <div className="ats-keyword ats-muted">No suggestions generated.</div>
            : suggestions.map((s, i) => <div key={i} className="ats-keyword">{s}</div>)}
        </div>
      </section>

      {safeList(stuffing).length > 0 && (
        <section className="ats-section">
          <h3 className="ats-section-title">Keyword stuffing detected</h3>
          <div className="ats-keywords">
            {stuffing.map((item, i) => (
              <div key={i} className="ats-keyword ats-keyword--bad">{item.keyword} — {item.count}×</div>
            ))}
          </div>
        </section>
      )}

      {safeList(duplicateWords).length > 0 && (
        <section className="ats-section">
          <h3 className="ats-section-title">Overused words</h3>
          <div className="ats-keywords">
            {duplicateWords.map(([word, count], i) => <div key={i} className="ats-keyword">{word} — {count}×</div>)}
          </div>
        </section>
      )}

      {safeList(topSkills).length > 0 && (
        <section className="ats-section">
          <h3 className="ats-section-title">Top skills for this role</h3>
          <div className="ats-keywords">
            {topSkills.map((s, i) => <div key={i} className="ats-keyword">{s}</div>)}
          </div>
        </section>
      )}

      <section className="ats-section">
        <h3 className="ats-section-title">Detected resume sections</h3>
        <div className="ats-keywords">
          {safeList(detectedSections).map((s, i) => <div key={i} className="ats-keyword ats-keyword--good">{s}</div>)}
          {resumeSections.filter((s) => !safeList(detectedSections).includes(s)).map((s, i) => (
            <div key={i} className="ats-keyword" style={{ opacity: 0.4 }}>missing: {s}</div>
          ))}
        </div>
      </section>

      <section className="ats-section">
        <h3 className="ats-section-title">ATS parse preview</h3>
        <p className="ats-muted ats-small">This is the plain text the tool could read from your resume. If this looks wrong, paste the resume text manually.</p>
        <pre className="parse-preview">{atsPreview}</pre>
      </section>
    </div>
  );
}
