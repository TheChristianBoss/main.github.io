import { exportToDOCX } from "../utils/docxExport";
import { getScoreColor } from "../utils/resumeUtils";

export default function HistoryPanel({ scoreHistory, versions, onRestoreVersion, onClearHistory }) {
  const CHART_H = 100; // fixed chart height in px

  return (
    <div className="ats-card">
      <h2 className="ats-title ats-title--sm">History & Score Trend</h2>
      <div className="ats-result-actions">
        <button className="ats-btn ats-btn--small ats-btn--danger-outline" onClick={onClearHistory} disabled={!scoreHistory.length && !versions.length}>Clear saved history</button>
      </div>

      {/* Score trend chart */}
      {scoreHistory.length > 0 && (
        <section className="ats-section">
          <h3 className="ats-section-title">📈 Score Trend</h3>
          <div style={{ overflowX: "auto" }}>
            <div style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 10,
              minWidth: `${scoreHistory.length * 52}px`,
              height: `${CHART_H + 32}px`,
              padding: "0 4px",
            }}>
              {scoreHistory.map((entry, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: "0 0 44px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: getScoreColor(entry.score) }}>
                    {entry.score}%
                  </div>
                  <div
                    style={{
                      width: "100%",
                      // Normalise: tallest bar fills CHART_H, others scale proportionally
                      height: `${Math.max(Math.round((entry.score / 100) * CHART_H), 4)}px`,
                      background: getScoreColor(entry.score),
                      borderRadius: "4px 4px 0 0",
                      opacity: i === scoreHistory.length - 1 ? 1 : 0.55,
                      transition: "height 0.4s ease",
                    }}
                  />
                  <div style={{ fontSize: 10, color: "var(--muted)", textAlign: "center", lineHeight: 1.3 }}>
                    {entry.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {scoreHistory.length > 1 && (() => {
            const first = scoreHistory[0].score;
            const last  = scoreHistory[scoreHistory.length - 1].score;
            const diff  = last - first;
            return (
              <p style={{ fontSize: 13, color: diff >= 0 ? "var(--success)" : "var(--danger)", marginTop: 8 }}>
                {diff >= 0 ? "▲" : "▼"} {Math.abs(diff)} points since first run
              </p>
            );
          })()}
        </section>
      )}

      {/* Analysis run log */}
      {scoreHistory.length > 0 && (
        <section className="ats-section">
          <h3 className="ats-section-title">Analysis Runs</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {scoreHistory.slice().reverse().map((entry, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px",
                border: "1px solid var(--border)", borderRadius: "var(--radius)",
                background: "var(--surface2)", fontSize: 13,
              }}>
                <span style={{ color: "var(--text)", fontWeight: 600 }}>{entry.label} — {entry.role}</span>
                <span style={{ color: getScoreColor(entry.score), fontWeight: 700 }}>{entry.score}%</span>
                <span style={{ color: "var(--muted)" }}>{entry.time}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Version history */}
      <section className="ats-section">
        <h3 className="ats-section-title">Resume Versions</h3>
        {versions.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>
            No versions saved yet. Use the Editor tab to save versions.
          </p>
        ) : (
          versions.slice().reverse().map((v) => (
            <div key={v.id} className="ats-version">
              <div className="ats-version-meta">
                <span className="ats-version-label">V{v.id}: {v.label}</span>
                <span className="ats-version-time">{v.timestamp}</span>
              </div>
              <pre className="ats-version-preview">{v.text.substring(0, 200)}…</pre>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="ats-btn ats-btn--small" onClick={() => onRestoreVersion(v)}>
                  ↩ Restore
                </button>
                <button className="ats-btn ats-btn--small" onClick={() => exportToDOCX(v.text, `resume-v${v.id}`)}>
                  ⬇ Export
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
