import { useState } from "react";
import ScoreRing from "./ScoreRing";
import MiniBar from "./MiniBar";
import { SCORE_COLOR } from "../engine/analyzeResume";

const ATS_EXPLANATION = `ATS (Applicant Tracking System) Score

Your ATS score estimates how well your resume will pass automated screening software used by most employers.

📊 How it's calculated:
• Keywords (45%) — Critical and optional keywords for your target role
• Sections (25%) — Required sections present (Summary, Experience, Education, Skills)
• Format (20%) — Contact info, appropriate length, clean structure
• Metrics Bonus (up to 10pts) — Quantified achievements (%, $, Nx)
• Stuffing Penalty — Deducted for keyword overuse

🎯 Score ranges:
• 80–100: Excellent — Likely to pass ATS screening
• 60–79: Strong — Good chance of passing with minor tweaks
• 40–59: Average — May need improvements
• Below 40: Needs Work — Significant gaps detected`;

export default function ATSPanel({ analysis, role, skipped, onSkip, onInjectKeyword }) {
  const [panelTab, setPanelTab] = useState("score");
  const [showModal, setShowModal] = useState(false);

  const tabs = [
    { id: "score", label: "Score" },
    { id: "keywords", label: "Keywords" },
    { id: "sections", label: "Sections" },
    { id: "verbs", label: "Verbs" },
    { id: "recruiter", label: "Recruiter" },
  ];

  const REQUIRED_SECTIONS = ["experience", "education", "skills", "summary"];
  const OPTIONAL_SECTIONS = ["projects", "certifications", "volunteer"];

  return (
    <aside className="rb-panel">
      {showModal && (
        <div className="rb-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="rb-modal" onClick={(e) => e.stopPropagation()}>
            <button className="rb-modal-close" onClick={() => setShowModal(false)}>✕</button>
            <pre className="rb-modal-text">{ATS_EXPLANATION}</pre>
          </div>
        </div>
      )}

      <div className="rb-panel-tabs">
        {tabs.map((t) => (
          <button key={t.id} className={`rb-panel-tab${panelTab === t.id ? " active" : ""}`} onClick={() => setPanelTab(t.id)}>
            {t.label}
            {t.id === "keywords" && analysis?.missingCritical.length > 0 && (
              <span className="rb-badge">{analysis.missingCritical.length}</span>
            )}
            {t.id === "sections" && analysis?.missingSections.length > 0 && (
              <span className="rb-badge">{analysis.missingSections.length}</span>
            )}
            {t.id === "verbs" && analysis?.foundWeakVerbs.length > 0 && (
              <span className="rb-badge rb-badge--warn">{analysis.foundWeakVerbs.length}</span>
            )}
            {t.id === "recruiter" && analysis?.stuffingWarnings.length > 0 && (
              <span className="rb-badge rb-badge--warn">{analysis.stuffingWarnings.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="rb-panel-body">
        {!analysis ? (
          <div className="rb-empty">
            <div className="rb-empty-icon">📄</div>
            <p>Fill in your resume to see live ATS feedback.</p>
            {!role && <p className="rb-empty-hint">Select a target role for keyword scoring.</p>}
          </div>
        ) : (
          <>
            {/* ── SCORE ── */}
            {panelTab === "score" && (
              <div className="rb-tab-content">
                <div className="rb-score-hero">
                  <ScoreRing value={analysis.overall} size={96} />
                  <div>
                    <div className="rb-grade" style={{ color: SCORE_COLOR(analysis.overall) }}>{analysis.grade}</div>
                    <div className="rb-grade-sub">{analysis.confidenceLabel}</div>
                    <button className="rb-ats-explain-btn" onClick={() => setShowModal(true)}>What is ATS? ⓘ</button>
                  </div>
                </div>

                <div className="rb-sub-scores">
                  <MiniBar label="Keywords" value={analysis.keywordScore} />
                  <MiniBar label="Sections" value={analysis.sectionScore} />
                  <MiniBar label="Format" value={analysis.formatScore} />
                  {analysis.metricsFound.length > 0 && (
                    <MiniBar label="Metrics" value={Math.min(100, analysis.metricsFound.length * 20)} />
                  )}
                </div>

                {analysis.formatWarnings.length > 0 && (
                  <div className="rb-alert-list">
                    <div className="rb-list-title">⚠ Issues</div>
                    {analysis.formatWarnings.map((w, i) => (
                      <div key={i} className="rb-alert-item">{w}</div>
                    ))}
                  </div>
                )}

                {analysis.missingPhrases.length > 0 && (
                  <div className="rb-phrase-list">
                    <div className="rb-list-title">💡 Suggested phrases for {role || "this role"}</div>
                    {analysis.missingPhrases.map((p, i) => (
                      <div key={i} className="rb-phrase-item">"{p}"</div>
                    ))}
                  </div>
                )}

                {analysis.suggestions.length > 0 && (
                  <div className="rb-suggestions-list">
                    <div className="rb-list-title">🚀 Top Improvements</div>
                    {analysis.suggestions.slice(0, 4).map((s, i) => (
                      <div key={i} className="rb-suggestion-item">• {s}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── KEYWORDS ── */}
            {panelTab === "keywords" && (
              <div className="rb-tab-content">
                {!role ? (
                  <p className="rb-hint">Select a target role to see keyword suggestions.</p>
                ) : (
                  <>
                    {analysis.missingCritical.length > 0 && (
                      <div className="rb-kw-group">
                        <div className="rb-list-title rb-list-title--red">🔴 Missing Critical</div>
                        <div className="rb-kw-chips">
                          {analysis.missingCritical.map((kw, i) => (
                            <button key={i} className="rb-kw-chip rb-kw-chip--red" onClick={() => onInjectKeyword?.(kw)} title="Click to add to Skills">
                              + {kw}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.missingOptional.length > 0 && (
                      <div className="rb-kw-group">
                        <div className="rb-list-title rb-list-title--yellow">🟡 Missing Optional</div>
                        <div className="rb-kw-chips">
                          {analysis.missingOptional.map((kw, i) => (
                            <button key={i} className="rb-kw-chip rb-kw-chip--yellow" onClick={() => onInjectKeyword?.(kw)} title="Click to add to Skills">
                              + {kw}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.presentKeywords.length > 0 && (
                      <div className="rb-kw-group">
                        <div className="rb-list-title rb-list-title--green">✅ Detected</div>
                        <div className="rb-kw-chips">
                          {analysis.presentKeywords.map((kw, i) => (
                            <span key={i} className="rb-kw-chip rb-kw-chip--green">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.matchedPhrases.length > 0 && (
                      <div className="rb-kw-group">
                        <div className="rb-list-title rb-list-title--green">✅ Power Phrases Matched</div>
                        {analysis.matchedPhrases.slice(0, 4).map((p, i) => (
                          <div key={i} className="rb-phrase-item rb-phrase-item--green">"{p}"</div>
                        ))}
                      </div>
                    )}
                    {analysis.missingCritical.length === 0 && analysis.missingOptional.length === 0 && (
                      <div className="rb-success-msg">✅ All keywords covered for {role}!</div>
                    )}
                    <p className="rb-hint" style={{ marginTop: 12 }}>Click a missing keyword to add it to Skills.</p>
                  </>
                )}
              </div>
            )}

            {/* ── SECTIONS ── */}
            {panelTab === "sections" && (
              <div className="rb-tab-content">
                <div className="rb-list-title" style={{ marginBottom: 12 }}>Required</div>
                {REQUIRED_SECTIONS.map((s) => {
                  const found = analysis.foundSections.includes(s);
                  const isSkipped = skipped?.[s];
                  return (
                    <div key={s} className={`rb-section-item${found ? " found" : isSkipped ? " skipped" : " missing"}`}>
                      <span>{found ? "✅" : isSkipped ? "⏭" : "❌"} {s.charAt(0).toUpperCase() + s.slice(1)}</span>
                      {isSkipped && (
                        <button className="rb-insert-inline" onClick={() => onSkip?.(s, false)}>Undo</button>
                      )}
                    </div>
                  );
                })}
                <div className="rb-list-title" style={{ marginTop: 20, marginBottom: 12 }}>Optional</div>
                {OPTIONAL_SECTIONS.map((s) => {
                  const found = analysis.foundSections?.includes(s);
                  const isSkipped = skipped?.[s];
                  return (
                    <div key={s} className={`rb-section-item${found ? " found" : isSkipped ? " skipped" : " optional"}`}>
                      <span>{found ? "✅" : isSkipped ? "⏭" : "○"} {s.charAt(0).toUpperCase() + s.slice(1)}</span>
                      {isSkipped && (
                        <button className="rb-insert-inline" onClick={() => onSkip?.(s, false)}>Undo</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── VERBS ── */}
            {panelTab === "verbs" && (
              <div className="rb-tab-content">
                {analysis.foundWeakVerbs.length > 0 ? (
                  <div className="rb-kw-group">
                    <div className="rb-list-title rb-list-title--red">⚠ Weak Verbs</div>
                    <p className="rb-hint" style={{ marginBottom: 10 }}>Replace these with stronger action verbs:</p>
                    {analysis.foundWeakVerbs.map((v, i) => (
                      <div key={i} className="rb-verb-row">
                        <span className="rb-verb-weak">{v}</span>
                        <span className="rb-verb-arrow">→</span>
                        <span className="rb-verb-suggestions">
                          {v === "helped" && "supported, enabled, facilitated"}
                          {v === "worked" && "built, developed, executed"}
                          {v === "assisted" && "collaborated, contributed, partnered"}
                          {v === "participated" && "led, drove, championed"}
                          {v === "supported" && "strengthened, bolstered, advanced"}
                          {v === "handled" && "managed, oversaw, directed"}
                          {v === "responsible" && "led, owned, spearheaded"}
                          {v === "tasked" && "assigned, delegated, executed"}
                          {v === "involved" && "contributed, collaborated, engaged"}
                          {v === "did" && "executed, delivered, achieved"}
                          {v === "made" && "created, built, produced"}
                          {v === "tried" && "implemented, tested, piloted"}
                          {v === "used" && "leveraged, utilized, applied"}
                          {v === "went" && "advanced, progressed, transitioned"}
                          {v === "got" && "achieved, secured, earned"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rb-success-msg">✅ No weak verbs detected!</div>
                )}
                {analysis.foundStrongVerbs.length > 0 && (
                  <div className="rb-kw-group" style={{ marginTop: 20 }}>
                    <div className="rb-list-title rb-list-title--green">💪 Strong Verbs in Use</div>
                    <div className="rb-kw-chips">
                      {analysis.foundStrongVerbs.slice(0, 12).map((v, i) => (
                        <span key={i} className="rb-kw-chip rb-kw-chip--green">{v}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="rb-kw-group" style={{ marginTop: 20 }}>
                  <div className="rb-list-title">💡 Strong Verb Bank</div>
                  <div className="rb-kw-chips">
                    {["led","built","achieved","optimized","delivered","engineered","launched","scaled","drove","spearheaded","reduced","increased"].map((v, i) => (
                      <span key={i} className="rb-kw-chip rb-kw-chip--dim">{v}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── RECRUITER ── */}
            {panelTab === "recruiter" && (
              <div className="rb-tab-content">
                <div className="rb-list-title" style={{ marginBottom: 12 }}>🕵 Recruiter Simulation</div>
                <div className="rb-recruiter-grid">
                  {[
                    { label: "Scan Speed", value: analysis.recruiterSim.scanSpeed },
                    { label: "Keyword Visibility", value: analysis.recruiterSim.keyVisibility },
                    { label: "Readability", value: `${analysis.recruiterSim.readabilityScore}%` },
                    { label: "First Impression", value: `${analysis.recruiterSim.firstImpression}%` },
                  ].map((stat) => (
                    <div key={stat.label} className="rb-recruiter-stat">
                      <div className="rb-recruiter-label">{stat.label}</div>
                      <div className="rb-recruiter-value">{stat.value}</div>
                    </div>
                  ))}
                </div>

                {analysis.metricsFound.length > 0 ? (
                  <div className="rb-kw-group" style={{ marginTop: 20 }}>
                    <div className="rb-list-title rb-list-title--green">📊 Quantified Metrics Found</div>
                    <div className="rb-kw-chips">
                      {analysis.metricsFound.map((m, i) => (
                        <span key={i} className="rb-kw-chip rb-kw-chip--green">{m}</span>
                      ))}
                    </div>
                    <p className="rb-hint" style={{ marginTop: 6 }}>More numbers = stronger impact.</p>
                  </div>
                ) : (
                  <div className="rb-alert-list" style={{ marginTop: 16 }}>
                    <div className="rb-alert-item">📊 No quantified metrics found — add numbers, %, or $ amounts.</div>
                  </div>
                )}

                {analysis.stuffingWarnings.length > 0 && (
                  <div className="rb-kw-group" style={{ marginTop: 16 }}>
                    <div className="rb-list-title rb-list-title--red">⚠ Keyword Stuffing</div>
                    {analysis.stuffingWarnings.map((w, i) => (
                      <div key={i} className="rb-stuffing-warn">
                        "{w.keyword}" appears {w.count}× — consider reducing
                      </div>
                    ))}
                  </div>
                )}

                {analysis.duplicateWords.length > 0 && (
                  <div className="rb-kw-group" style={{ marginTop: 16 }}>
                    <div className="rb-list-title rb-list-title--yellow">🔁 Overused Words</div>
                    <div className="rb-kw-chips">
                      {analysis.duplicateWords.slice(0, 6).map(([w, c], i) => (
                        <span key={i} className="rb-kw-chip rb-kw-chip--yellow">"{w}" ({c}×)</span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.insights && (
                  <div className="rb-kw-group" style={{ marginTop: 16 }}>
                    <div className="rb-list-title">🔍 Contact Detected</div>
                    {[
                      { label: "Email", val: analysis.insights.email },
                      { label: "Phone", val: analysis.insights.phone },
                      { label: "LinkedIn", val: analysis.insights.linkedin },
                      { label: "GitHub", val: analysis.insights.github },
                    ].map(({ label, val }) => val && (
                      <div key={label} className="rb-insight-row">
                        <span className="rb-insight-label">{label}:</span>
                        <span className="rb-insight-val">{val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
