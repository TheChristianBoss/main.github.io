import { getScoreColor, getResumeGrade } from "../utils/resumeUtils";

const resumeSections = [
  "skills", "experience", "education", "projects",
  "certifications", "summary", "technical skills", "employment", "volunteer",
];

export default function ResultsPanel({ analysis }) {
  if (!analysis) {
    return (
      <div className="ats-card">
        <p style={{ color: "var(--muted)" }}>Run an analysis from the Input tab first.</p>
      </div>
    );
  }

  const {
    score, keywordScore, formatScore, sectionScore,
    missingCritical, missingOptional,
    matchedPhrases, missingPhrases,
    detectedSections, formatWarnings,
    insights, detectedSkills,
    strongVerbs, weakVerbs, metrics,
    stuffing, duplicateWords,
    skillGaps, recruiterSim,
    suggestions, confidenceLabel, topSkills,
    atsPreview,
  } = analysis;

  return (
    <div id="results-section" className="ats-card">
      {/* Score hero */}
      <div className="ats-score-hero">
        <h2 style={{ color: getScoreColor(score) }}>ATS Score: {score}%</h2>
        <div className="ats-confidence-badge" style={{ borderColor: getScoreColor(score), color: getScoreColor(score) }}>
          {score}% confidence of passing ATS screening
        </div>
        <p className="ats-confidence-label">{confidenceLabel}</p>
        <h3>Resume Strength: {getResumeGrade(score)}</h3>
      </div>

      {/* Sub-scores */}
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

      {/* Recruiter simulation */}
      {recruiterSim && (
        <section className="ats-section">
          <h3 className="ats-section-title">👤 Recruiter Simulation</h3>
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

      {/* Skill gap */}
      {skillGaps.length > 0 && (
        <section className="ats-section">
          <h3 className="ats-section-title">🔍 Skill Gap Analysis</h3>
          <p style={{ color: "var(--muted)", marginBottom: 8 }}>
            Skills found in the job description but missing from your resume:
          </p>
          <div className="ats-keywords">
            {skillGaps.map((gap, i) => (
              <div key={i} className="ats-keyword" style={{ border: "1px solid #ef4444", background: "rgba(239,68,68,0.1)" }}>
                {gap}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contact info */}
      <section className="ats-section">
        <h3 className="ats-section-title">📋 Detected Contact Info</h3>
        <div className="ats-keywords">
          {Object.entries(insights).map(([k, v]) => (
            <div key={k} className="ats-keyword">{k}: {v}</div>
          ))}
        </div>
      </section>

      {/* Matched phrases */}
      {matchedPhrases.length > 0 && (
        <section className="ats-section">
          <h3 className="ats-section-title">✅ Matched Role Phrases</h3>
          <div className="ats-keywords">
            {matchedPhrases.map((p, i) => (
              <div key={i} className="ats-keyword ats-keyword--good">"{p}"</div>
            ))}
          </div>
        </section>
      )}

      {/* Missing phrases */}
      {missingPhrases.length > 0 && (
        <section className="ats-section">
          <h3 className="ats-section-title">🟠 Missing Role Phrases</h3>
          <p style={{ color: "var(--muted)", marginBottom: 8, fontSize: "0.85rem" }}>
            These industry phrases boost ATS match for your selected role.
          </p>
          <div className="ats-keywords">
            {missingPhrases.map((p, i) => (
              <div key={i} className="ats-keyword" style={{ border: "1px solid #f97316", background: "rgba(249,115,22,0.08)" }}>
                "{p}"
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Critical keywords */}
      <section className="ats-section">
        <h3 className="ats-section-title">🔴 Missing Critical Keywords</h3>
        <div className="ats-keywords">
          {missingCritical.length === 0
            ? <div className="ats-keyword ats-keyword--good">✅ No critical keywords missing</div>
            : missingCritical.map((w, i) => (
              <div key={i} className="ats-keyword" style={{ border: "1px solid #ef4444", background: "rgba(239,68,68,0.1)" }}>{w}</div>
            ))}
        </div>
      </section>

      {/* Optional keywords */}
      <section className="ats-section">
        <h3 className="ats-section-title">🟡 Missing Optional Keywords</h3>
        <div className="ats-keywords">
          {missingOptional.length === 0
            ? <div className="ats-keyword ats-keyword--good">✅ No optional keywords missing</div>
            : missingOptional.map((w, i) => (
              <div key={i} className="ats-keyword" style={{ border: "1px solid #facc15", background: "rgba(250,204,21,0.1)" }}>{w}</div>
            ))}
        </div>
      </section>

      {/* Detected skills */}
      <section className="ats-section">
        <h3 className="ats-section-title">✅ Detected Skills</h3>
        <div className="ats-keywords">
          {detectedSkills.length === 0
            ? <div className="ats-keyword" style={{ color: "var(--muted)" }}>None detected from standard skill list.</div>
            : detectedSkills.map((s, i) => (
              <div key={i} className="ats-keyword ats-keyword--good">{s}</div>
            ))}
        </div>
      </section>

      {/* Action verbs */}
      <section className="ats-section">
        <h3 className="ats-section-title">💪 Strong Action Verbs</h3>
        <div className="ats-keywords">
          {strongVerbs.length === 0
            ? <div className="ats-keyword" style={{ color: "var(--muted)" }}>None detected.</div>
            : strongVerbs.map((v, i) => <div key={i} className="ats-keyword ats-keyword--good">{v}</div>)}
        </div>
      </section>

      <section className="ats-section">
        <h3 className="ats-section-title">⚠️ Weak Resume Language</h3>
        <div className="ats-keywords">
          {weakVerbs.length === 0
            ? <div className="ats-keyword ats-keyword--good">✅ No weak verbs detected</div>
            : weakVerbs.map((v, i) => (
              <div key={i} className="ats-keyword" style={{ border: "1px solid #f97316", background: "rgba(249,115,22,0.1)" }}>{v}</div>
            ))}
        </div>
      </section>

      {/* Metrics */}
      <section className="ats-section">
        <h3 className="ats-section-title">📈 Quantified Achievements</h3>
        <div className="ats-keywords">
          {metrics.length === 0
            ? <div className="ats-keyword" style={{ color: "var(--muted)" }}>None found — add numbers, %, $ amounts.</div>
            : metrics.map((m, i) => <div key={i} className="ats-keyword ats-keyword--good">{m}</div>)}
        </div>
      </section>

      {/* Formatting warnings */}
      <section className="ats-section">
        <h3 className="ats-section-title">🔧 ATS Formatting Warnings</h3>
        <div className="ats-keywords">
          {formatWarnings.length === 0
            ? <div className="ats-keyword ats-keyword--good">✅ No formatting issues detected</div>
            : formatWarnings.map((w, i) => (
              <div key={i} className="ats-keyword" style={{ border: "1px solid #ef4444", background: "rgba(239,68,68,0.1)" }}>{w}</div>
            ))}
        </div>
      </section>

      {/* Suggestions */}
      <section className="ats-section">
        <h3 className="ats-section-title">💡 Resume Suggestions</h3>
        <div className="ats-keywords">
          {suggestions.map((s, i) => <div key={i} className="ats-keyword">{s}</div>)}
        </div>
      </section>

      {/* Keyword stuffing */}
      {stuffing.length > 0 && (
        <section className="ats-section">
          <h3 className="ats-section-title">🚫 Keyword Stuffing Detected</h3>
          <div className="ats-keywords">
            {stuffing.map((item, i) => (
              <div key={i} className="ats-keyword" style={{ border: "1px solid #ef4444" }}>
                {item.keyword} — {item.count}×
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Duplicate words */}
      {duplicateWords.length > 0 && (
        <section className="ats-section">
          <h3 className="ats-section-title">🔁 Overused Words</h3>
          <div className="ats-keywords">
            {duplicateWords.map(([word, count], i) => (
              <div key={i} className="ats-keyword">{word} — {count}×</div>
            ))}
          </div>
        </section>
      )}

      {/* Top skills for role */}
      {topSkills?.length > 0 && (
        <section className="ats-section">
          <h3 className="ats-section-title">🎯 Top Skills for This Role</h3>
          <div className="ats-keywords">
            {topSkills.map((s, i) => <div key={i} className="ats-keyword">{s}</div>)}
          </div>
        </section>
      )}

      {/* Sections detected */}
      <section className="ats-section">
        <h3 className="ats-section-title">📑 Detected Resume Sections</h3>
        <div className="ats-keywords">
          {detectedSections.map((s, i) => (
            <div key={i} className="ats-keyword ats-keyword--good">{s}</div>
          ))}
          {resumeSections.filter((s) => !detectedSections.includes(s)).map((s, i) => (
            <div key={i} className="ats-keyword" style={{ opacity: 0.4 }}>missing: {s}</div>
          ))}
        </div>
      </section>

      {/* ATS parse preview */}
      <section className="ats-section">
        <h3 className="ats-section-title">👁 ATS Parse Preview</h3>
        <pre className="parse-preview">{atsPreview}</pre>
      </section>
    </div>
  );
}
