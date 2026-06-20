import { getScoreColor, getResumeGrade } from "../utils/resumeUtils";

export default function ComparisonPanel({ analysis, analysisBData, comparisonMode }) {
  if (!analysis) {
    return (
      <div className="ats-card">
        <p style={{ color: "var(--muted)" }}>Run an analysis from the Input tab first.</p>
      </div>
    );
  }

  if (!comparisonMode) {
    return (
      <div className="ats-card">
        <p style={{ color: "var(--muted)" }}>
          Enable "Compare Two Resumes" in the Input tab, then re-analyze.
        </p>
      </div>
    );
  }

  const {
    score, keywordScore, formatScore, sectionScore,
    strongVerbs, weakVerbs, metrics, matchedPhrases,
    detectedSkills, missingCritical, missingPhrases,
    confidenceLabel,
  } = analysis;

  const bScore = analysisBData?.score ?? 0;
  const winner = bScore > score ? "Resume B" : bScore < score ? "Resume A" : "Tie";

  return (
    <div className="ats-card">
      <h2 className="ats-title">⚖️ Side-by-Side Recruiter Comparison</h2>

      {/* Winner banner */}
      <div className="ats-winner-banner" style={{ borderColor: getScoreColor(Math.max(score, bScore)) }}>
        🏆 Winner: <strong>{winner}</strong>
      </div>

      {/* Side-by-side */}
      <div className="ats-compare-grid">
        {/* Resume A */}
        <div className="ats-compare-col">
          <h3 style={{ color: getScoreColor(score) }}>Resume A — {score}%</h3>
          <div className="ats-compare-grade">{getResumeGrade(score)}</div>
          <div className="ats-confidence-label" style={{ fontSize: 12, color: "var(--muted)" }}>
            {confidenceLabel}
          </div>
          <div className="ats-compare-section">
            <div className="ats-compare-item ats-compare-strength">
              <b>Strengths</b>
              {strongVerbs.slice(0, 3).map((v, i) => <div key={i}>• {v}</div>)}
              {metrics.slice(0, 2).map((m, i) => <div key={i}>• {m} (metric)</div>)}
              {matchedPhrases.slice(0, 2).map((p, i) => <div key={i}>• "{p}"</div>)}
              {detectedSkills.slice(0, 2).map((s, i) => <div key={i}>• {s}</div>)}
              {strongVerbs.length + metrics.length + matchedPhrases.length === 0 && (
                <div>• No strong signals detected</div>
              )}
            </div>
            <div className="ats-compare-item ats-compare-weakness">
              <b>Weaknesses</b>
              {weakVerbs.slice(0, 3).map((v, i) => <div key={i}>• {v} (weak verb)</div>)}
              {missingCritical.slice(0, 3).map((k, i) => <div key={i}>• missing: {k}</div>)}
              {missingPhrases.slice(0, 2).map((p, i) => <div key={i}>• missing phrase: "{p}"</div>)}
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            {[
              { label: "Keywords",   value: keywordScore },
              { label: "Formatting", value: formatScore  },
              { label: "Sections",   value: sectionScore },
            ].map(({ label, value }) => (
              <div key={label} className="ats-subscore" style={{ marginBottom: 6 }}>
                <div className="ats-subscore-label" style={{ minWidth: 80, fontSize: 12 }}>{label}</div>
                <div className="ats-subscore-bar">
                  <div className="ats-subscore-fill" style={{ width: `${value}%`, background: getScoreColor(value) }} />
                </div>
                <div className="ats-subscore-val" style={{ color: getScoreColor(value) }}>{value}%</div>
              </div>
            ))}
          </div>
          <div className="ats-compare-pref">
            Recruiter Preference: {score > bScore ? "✅ Preferred" : score === bScore ? "🤝 Tied" : "❌ Not Preferred"}
          </div>
        </div>

        <div className="ats-compare-divider" />

        {/* Resume B */}
        <div className="ats-compare-col">
          {analysisBData ? (
            <>
              <h3 style={{ color: getScoreColor(bScore) }}>Resume B — {bScore}%</h3>
              <div className="ats-compare-grade">{getResumeGrade(bScore)}</div>
              <div className="ats-confidence-label" style={{ fontSize: 12, color: "var(--muted)" }}>
                {analysisBData.confidenceLabel}
              </div>
              <div className="ats-compare-section">
                <div className="ats-compare-item ats-compare-strength">
                  <b>Strengths</b>
                  {analysisBData.strongVerbs.slice(0, 3).map((v, i) => <div key={i}>• {v}</div>)}
                  {analysisBData.metrics.slice(0, 2).map((m, i) => <div key={i}>• {m} (metric)</div>)}
                  {analysisBData.matchedPhrases.slice(0, 2).map((p, i) => <div key={i}>• "{p}"</div>)}
                  {analysisBData.strongVerbs.length + analysisBData.metrics.length === 0 && (
                    <div>• No strong signals detected</div>
                  )}
                </div>
                <div className="ats-compare-item ats-compare-weakness">
                  <b>Weaknesses</b>
                  {analysisBData.weakVerbs.slice(0, 3).map((v, i) => <div key={i}>• {v} (weak verb)</div>)}
                  {analysisBData.missingCritical.slice(0, 3).map((k, i) => <div key={i}>• missing: {k}</div>)}
                  {analysisBData.missingPhrases.slice(0, 2).map((p, i) => <div key={i}>• missing phrase: "{p}"</div>)}
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                {[
                  { label: "Keywords",   value: analysisBData.keywordScore },
                  { label: "Formatting", value: analysisBData.formatScore  },
                  { label: "Sections",   value: analysisBData.sectionScore },
                ].map(({ label, value }) => (
                  <div key={label} className="ats-subscore" style={{ marginBottom: 6 }}>
                    <div className="ats-subscore-label" style={{ minWidth: 80, fontSize: 12 }}>{label}</div>
                    <div className="ats-subscore-bar">
                      <div className="ats-subscore-fill" style={{ width: `${value}%`, background: getScoreColor(value) }} />
                    </div>
                    <div className="ats-subscore-val" style={{ color: getScoreColor(value) }}>{value}%</div>
                  </div>
                ))}
              </div>
              {analysisBData.formatWarnings.length > 0 && (
                <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 4 }}>
                  ⚠ {analysisBData.formatWarnings[0]}
                </div>
              )}
              <div className="ats-compare-pref">
                Recruiter Preference: {bScore > score ? "✅ Preferred" : bScore === score ? "🤝 Tied" : "❌ Not Preferred"}
              </div>
            </>
          ) : (
            <p style={{ color: "var(--muted)" }}>Upload Resume B and re-analyze to see comparison.</p>
          )}
        </div>
      </div>

      {/* Score bar comparison */}
      <div style={{ marginTop: 24 }}>
        <h3 className="ats-section-title">Score Comparison</h3>
        {[
          { label: "Resume A", value: score },
          { label: "Resume B", value: bScore },
        ].map(({ label, value }) => (
          <div key={label} className="ats-subscore" style={{ marginBottom: 10 }}>
            <div className="ats-subscore-label" style={{ width: 100 }}>{label}</div>
            <div className="ats-subscore-bar">
              <div className="ats-subscore-fill" style={{ width: `${value}%`, background: getScoreColor(value) }} />
            </div>
            <div className="ats-subscore-val" style={{ color: getScoreColor(value) }}>{value}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
