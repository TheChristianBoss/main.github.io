import { useState } from "react";
import { exportToDOCX } from "../utils/docxExport";
import { rewriteBullet } from "../utils/resumeUtils";

const DEFAULT_SECTION_ORDER = ["Summary", "Skills", "Experience", "Education", "Projects", "Certifications"];

export default function EditorPanel({
  editedResume, setEditedResume,
  missingCriticalKeywords, missingPhrases,
  role, roleKeywords,
  resumeB,
  onSaveVersion,
}) {
  const [keywordPreview,   setKeywordPreview]   = useState(null);
  const [rewrittenBullets, setRewrittenBullets] = useState([]);
  const [sectionOrder,     setSectionOrder]     = useState(DEFAULT_SECTION_ORDER);
  const [dragIndex,        setDragIndex]        = useState(null);
  const [mergedResume,     setMergedResume]     = useState("");

  // ── Keyword injection ────────────────────────────────────────────────────

  const previewKeywordInjection = () => {
    if (!editedResume || !role) return;
    const resumeLower = editedResume.toLowerCase();

    const roleData = roleKeywords[role] || {};
    const allRoleKws = Object.keys({ ...(roleData.critical || {}), ...(roleData.optional || {}) });
    const roleSignalCount = allRoleKws.filter((kw) => resumeLower.includes(kw)).length;
    if (roleSignalCount < 2 && allRoleKws.length > 5) {
      alert(`⚠️ Your resume doesn't seem to match the "${role}" role — only ${roleSignalCount} role keywords detected. Switch to the correct role before injecting keywords.`);
      return;
    }

    const candidates = missingCriticalKeywords.filter((kw) => !resumeLower.includes(kw.toLowerCase()));
    const phraseCandidates = (missingPhrases || []).filter((p) => !resumeLower.includes(p.toLowerCase()));

    if (candidates.length === 0 && phraseCandidates.length === 0) {
      alert("✅ No missing critical keywords or phrases to add.");
      return;
    }

    setKeywordPreview({
      keywords: candidates.slice(0, 8).map((t) => ({ text: t, checked: true })),
      phrases:  phraseCandidates.slice(0, 4).map((t) => ({ text: t, checked: true })),
    });
  };

  const applyKeywordInjection = () => {
    if (!keywordPreview || !editedResume) return;
    const checkedKeywords = keywordPreview.keywords.filter((k) => k.checked).map((k) => k.text);
    const checkedPhrases  = keywordPreview.phrases.filter((p) => p.checked).map((p) => p.text);
    if (checkedKeywords.length === 0 && checkedPhrases.length === 0) {
      setKeywordPreview(null);
      return;
    }

    let updated = editedResume;

    if (checkedKeywords.length > 0) {
      const skillsMatch = updated.match(/((?:technical )?skills[^\n]*\n)([\s\S]*?)(\n\s*\n[A-Z]|\n[A-Z][A-Za-z ]{3,}\n|$)/i);
      if (skillsMatch) {
        const blockEnd = skillsMatch.index + skillsMatch[1].length + skillsMatch[2].length;
        const injection = `\n${checkedKeywords.map((k) => k.charAt(0).toUpperCase() + k.slice(1)).join("   ·   ")}`;
        updated = updated.slice(0, blockEnd) + injection + updated.slice(blockEnd);
      } else {
        const eduMatch = updated.match(/\n(education|certifications)/i);
        const insertAt = eduMatch ? eduMatch.index : updated.length;
        const newSection = `\n\nTechnical Skills\n${checkedKeywords.map((k) => k.charAt(0).toUpperCase() + k.slice(1)).join("   ·   ")}`;
        updated = updated.slice(0, insertAt) + newSection + updated.slice(insertAt);
      }
    }

    if (checkedPhrases.length > 0) {
      const summaryMatch = updated.match(/((?:professional )?summary[^\n]*\n)([\s\S]*?)(\n\s*\n[A-Z]|\n[A-Z][A-Za-z ]{3,}\n|$)/i);
      if (summaryMatch) {
        const blockEnd = summaryMatch.index + summaryMatch[1].length + summaryMatch[2].length;
        const injection = ` Demonstrated ability in ${checkedPhrases.join(", ")}.`;
        const block = updated.slice(summaryMatch.index + summaryMatch[1].length, blockEnd);
        const lastPeriod = block.lastIndexOf(".");
        if (lastPeriod !== -1) {
          const absPos = summaryMatch.index + summaryMatch[1].length + lastPeriod + 1;
          updated = updated.slice(0, absPos) + injection + updated.slice(absPos);
        } else {
          updated = updated.slice(0, blockEnd) + injection + updated.slice(blockEnd);
        }
      }
    }

    setEditedResume(updated);
    onSaveVersion(updated, `Injected ${checkedKeywords.length} keywords, ${checkedPhrases.length} phrases`);
    setKeywordPreview(null);
  };

  // ── One-click fixes ──────────────────────────────────────────────────────

  const improveFormatting = () => {
    if (!editedResume) return;
    const updated = editedResume
      .replace(/\|/g, " ")
      .replace(/★|◆|●|•/g, "-")
      .replace(/\n{3,}/g, "\n\n");
    setEditedResume(updated);
    onSaveVersion(updated, "Improved formatting");
  };

  const strengthenBullets = () => {
    if (!editedResume) return;
    // Save version BEFORE applying so users can undo
    onSaveVersion(editedResume, "Before bullet strengthening");
    const rewrites = [];
    const updated = editedResume.split("\n").map((line) => {
      const rewritten = rewriteBullet(line.trim());
      if (rewritten) {
        rewrites.push({ original: line.trim(), rewritten });
        return rewritten;
      }
      return line;
    }).join("\n");
    setEditedResume(updated);
    setRewrittenBullets(rewrites);
    onSaveVersion(updated, "Strengthened bullet points");
  };

  // ── Drag-and-drop section reorder ────────────────────────────────────────

  const handleDragStart = (i) => setDragIndex(i);

  const handleDragOver = (e, i) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) return;
    const next = [...sectionOrder];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(i, 0, moved);
    setSectionOrder(next);
    setDragIndex(i);
  };

  const handleDrop = () => setDragIndex(null);

  const applySectionOrder = () => {
    if (!editedResume) return;
    // Extract section blocks from the text and reorder them
    const lines = editedResume.split("\n");
    const sectionBlocks = {};
    let currentSection = "__header__";
    let buffer = [];

    lines.forEach((line) => {
      const trimmed = line.trim().toLowerCase();
      const matchedSection = sectionOrder.find((s) => trimmed === s.toLowerCase());
      if (matchedSection) {
        sectionBlocks[currentSection] = buffer;
        buffer = [line];
        currentSection = matchedSection;
      } else {
        buffer.push(line);
      }
    });
    sectionBlocks[currentSection] = buffer;

    const header = (sectionBlocks["__header__"] || []).join("\n");
    const body = sectionOrder
      .filter((s) => sectionBlocks[s])
      .map((s) => sectionBlocks[s].join("\n"))
      .join("\n\n");

    const reordered = [header, body].filter(Boolean).join("\n\n");
    setEditedResume(reordered);
    onSaveVersion(reordered, `Reordered sections: ${sectionOrder.join(" → ")}`);
  };

  const copyResume = async () => {
    if (!editedResume?.trim()) return;
    try {
      await navigator.clipboard.writeText(editedResume);
      alert("Resume text copied.");
    } catch {
      alert("Copy failed. Select the text manually and copy it.");
    }
  };

  const clearEditor = () => {
    if (!editedResume?.trim()) return;
    if (!window.confirm("Clear the editor text? Save a version first if you need to keep it.")) return;
    onSaveVersion(editedResume, "Before clearing editor");
    setEditedResume("");
  };

  // ── Resume merge ──────────────────────────────────────────────────────────

  const mergeResumes = () => {
    if (!editedResume.trim() || !resumeB?.trim()) return;
    const skillsMatch = editedResume.match(/skills[\s\S]*?(?=\n[A-Z]{4,}|\n\n[A-Z]|$)/i);
    const expMatch    = resumeB.match(/experience[\s\S]*?(?=\n[A-Z]{4,}|\n\n[A-Z]|$)/i);
    const merged = [
      "=== MERGED RESUME ===\n",
      skillsMatch ? `[Skills from Resume A]\n${skillsMatch[0].trim()}` : "[No skills section found in Resume A]",
      "\n",
      expMatch ? `[Experience from Resume B]\n${expMatch[0].trim()}` : "[No experience section found in Resume B]",
    ].join("\n");
    setMergedResume(merged);
    onSaveVersion(merged, "Merged A+B");
  };

  return (
    <div className="ats-card">
      <h2 className="ats-title ats-title--sm">Resume Editor</h2>
      <p className="ats-muted" style={{ marginBottom: 12 }}>
        Edit your resume directly below. Save a version before making large changes so you can restore it later.
      </p>

      {/* One-click fix buttons */}
      <div className="ats-fix-buttons">
        <button className="ats-btn ats-btn--fix" onClick={previewKeywordInjection} disabled={!editedResume?.trim()}>
          Add Missing Keywords
        </button>
        <button className="ats-btn ats-btn--fix" onClick={improveFormatting} disabled={!editedResume?.trim()}>
          Improve Formatting
        </button>
        <button className="ats-btn ats-btn--fix" onClick={strengthenBullets} disabled={!editedResume?.trim()}>
          Strengthen Bullet Points
        </button>
        <button className="ats-btn ats-btn--fix" onClick={() => onSaveVersion(editedResume, "Manual save")} disabled={!editedResume?.trim()}>
          Save Version
        </button>
        <button className="ats-btn ats-btn--fix" onClick={copyResume} disabled={!editedResume?.trim()}>
          Copy Text
        </button>
        <button className="ats-btn ats-btn--fix" onClick={() => exportToDOCX(editedResume, "my-resume")} disabled={!editedResume?.trim()}>
          Export as .docx
        </button>
        <button className="ats-btn ats-btn--fix ats-btn--danger-outline" onClick={clearEditor} disabled={!editedResume?.trim()}>
          Clear Editor
        </button>
      </div>

      {/* Keyword injection preview */}
      {keywordPreview && (
        <div style={{
          border: "1px solid var(--accent-ui)", borderRadius: "var(--radius)",
          padding: "16px 20px", marginBottom: 16, background: "rgba(232,197,71,0.04)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--accent-ui)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Review Before Adding
            </h3>
            <button className="ats-btn ats-btn--small" onClick={() => setKeywordPreview(null)} style={{ marginTop: 0 }}>
              ✕ Cancel
            </button>
          </div>

          {keywordPreview.keywords.length > 0 && (
            <>
              <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                Keywords — will be added to your Skills section:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                {keywordPreview.keywords.map((kw, i) => (
                  <label key={i} style={{
                    display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                    padding: "5px 10px", borderRadius: "var(--radius)",
                    border: `1px solid ${kw.checked ? "var(--accent-ui)" : "var(--border)"}`,
                    background: kw.checked ? "rgba(232,197,71,0.08)" : "transparent",
                    fontSize: 13, userSelect: "none", transition: "all 0.12s",
                  }}>
                    <input
                      type="checkbox"
                      checked={kw.checked}
                      onChange={() => setKeywordPreview((prev) => ({
                        ...prev,
                        keywords: prev.keywords.map((k, j) => j === i ? { ...k, checked: !k.checked } : k),
                      }))}
                      style={{ accentColor: "var(--accent-ui)" }}
                    />
                    {kw.text}
                  </label>
                ))}
              </div>
            </>
          )}

          {keywordPreview.phrases.length > 0 && (
            <>
              <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                Phrases — will be woven into your Summary:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                {keywordPreview.phrases.map((ph, i) => (
                  <label key={i} style={{
                    display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                    padding: "5px 10px", borderRadius: "var(--radius)",
                    border: `1px solid ${ph.checked ? "#6366f1" : "var(--border)"}`,
                    background: ph.checked ? "rgba(99,102,241,0.08)" : "transparent",
                    fontSize: 13, userSelect: "none", transition: "all 0.12s",
                  }}>
                    <input
                      type="checkbox"
                      checked={ph.checked}
                      onChange={() => setKeywordPreview((prev) => ({
                        ...prev,
                        phrases: prev.phrases.map((p, j) => j === i ? { ...p, checked: !p.checked } : p),
                      }))}
                      style={{ accentColor: "#6366f1" }}
                    />
                    {ph.text}
                  </label>
                ))}
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button className="ats-btn" style={{ marginTop: 0, padding: "9px 20px", fontSize: 13 }} onClick={applyKeywordInjection}>
              ✅ Apply Selected
            </button>
            <button className="ats-btn ats-btn--small" style={{ marginTop: 0 }} onClick={() =>
              setKeywordPreview((prev) => ({
                keywords: prev.keywords.map((k) => ({ ...k, checked: true })),
                phrases:  prev.phrases.map((p)  => ({ ...p, checked: true })),
              }))
            }>Select All</button>
            <button className="ats-btn ats-btn--small" style={{ marginTop: 0 }} onClick={() =>
              setKeywordPreview((prev) => ({
                keywords: prev.keywords.map((k) => ({ ...k, checked: false })),
                phrases:  prev.phrases.map((p)  => ({ ...p, checked: false })),
              }))
            }>Deselect All</button>
          </div>
        </div>
      )}

      {/* Bullet rewrite log */}
      {rewrittenBullets.length > 0 && (
        <div className="ats-section">
          <h3 className="ats-section-title">Bullet Point Rewrites Applied</h3>
          {rewrittenBullets.map((r, i) => (
            <div key={i} className="ats-bullet-rewrite">
              <div className="ats-bullet-before">Before: {r.original}</div>
              <div className="ats-bullet-after">After:  {r.rewritten}</div>
            </div>
          ))}
        </div>
      )}

      {/* Editable resume text */}
      <textarea
        rows="24"
        value={editedResume}
        onChange={(e) => setEditedResume(e.target.value)}
        className="ats-textarea ats-editor"
        placeholder="Your resume will appear here after analysis. You can also paste directly and edit."
      />

      {/* Section reorder — now actually functional */}
      <div className="ats-section" style={{ marginTop: 16 }}>
        <h3 className="ats-section-title">Section Order (drag to reorder, then Apply)</h3>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: 10 }}>
          ATS prefers: Summary → Skills → Experience → Education → Projects. Drag the pills, then click Apply to reorder your resume text.
        </p>
        <div className="ats-section-order">
          {sectionOrder.map((s, i) => (
            <div
              key={s}
              className="ats-section-pill"
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={handleDrop}
              style={{ opacity: dragIndex === i ? 0.5 : 1, cursor: "grab" }}
            >
              {s}
            </div>
          ))}
        </div>
        <button
          className="ats-btn ats-btn--small"
          style={{ marginTop: 10 }}
          onClick={applySectionOrder}
          disabled={!editedResume.trim()}
        >
          Apply Section Order
        </button>
      </div>

      {/* Resume merge */}
      {resumeB?.trim() && (
        <div className="ats-section" style={{ marginTop: 20 }}>
          <h3 className="ats-section-title">Resume Merge System</h3>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
            Combine Resume A skills + Resume B experience into one optimized resume.
          </p>
          <button className="ats-btn ats-btn--secondary" onClick={mergeResumes}>
            Merge Resume A + B
          </button>
          {mergedResume && (
            <>
              <textarea rows="10" value={mergedResume} readOnly className="ats-textarea" style={{ marginTop: 12 }} />
              <button className="ats-btn ats-btn--small" onClick={() => exportToDOCX(mergedResume, "merged-resume")}>
                Export Merged Resume (.docx)
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
