import { useState } from "react";
import jobCategories from "../data/jobCategories";
import { generateTemplate } from "../engine/generateTemplate";
import FillableSection from "../components/FillableSection";
import ATSPanel from "../components/ATSPanel";
import ResumePreview from "../components/ResumePreview";
import ScoreRing from "../components/ScoreRing";
import ResumeUtilityBar from "../components/ResumeUtilityBar";
import { SCORE_COLOR } from "../engine/analyzeResume";


export default function QuickMode({ data, setData, analysis, role, category, onRoleChange, onCategoryChange, onSwitchMode, portrait, onExportPDF, onExportDOCX, exportLoading, lastSavedAt, exportWarnings, onStartOver, onCopyText, onDownloadTXT, onPrint }) {
  const [generated, setGenerated] = useState(false);
  const [view, setView] = useState("form");

  const handleGenerate = () => {
    const template = generateTemplate(data, role, category);
    setData((prev) => ({ ...prev, ...template }));
    setGenerated(true);
  };

  const updateField = (id, value) => setData((prev) => ({ ...prev, [id]: value }));

  const injectKeyword = (kw) => {
    const skills = data.skills || "";
    if (skills) {
      const lines = skills.split("\n");
      const techLine = lines.findIndex((l) => /technical:/i.test(l));
      if (techLine !== -1) {
        lines[techLine] = lines[techLine] + `, ${kw.charAt(0).toUpperCase() + kw.slice(1)}`;
        updateField("skills", lines.join("\n"));
      } else {
        updateField("skills", skills + `, ${kw.charAt(0).toUpperCase() + kw.slice(1)}`);
      }
    } else {
      updateField("skills", `Technical: ${kw.charAt(0).toUpperCase() + kw.slice(1)}`);
    }
  };

  const canGenerate = (category || role) && data.name;

  return (
    <div className="rb-app">
      <header className="rb-header">
        <div className="rb-header-inner">
          <a href="/" className="rb-logo"><span className="rb-logo-cg">CG</span> Resume Builder <span className="open-beta-badge">Open Beta</span></a>
          <div className="rb-header-center">
            <button className="rb-back-mode-btn" onClick={() => onSwitchMode(null)}>← Modes</button>
            {generated && (
              <>
                <button className={`rb-view-btn${view === "form" ? " active" : ""}`} onClick={() => setView("form")}>✏ Edit</button>
                <button className={`rb-view-btn${view === "preview" ? " active" : ""}`} onClick={() => setView("preview")}>👁 Preview</button>
              </>
            )}
          </div>
          {analysis && (
            <div className="rb-header-score">
              <ScoreRing value={analysis.overall} size={48} />
              <div className="rb-header-grade" style={{ color: SCORE_COLOR(analysis.overall) }}>{analysis.grade}</div>
            </div>
          )}
        </div>
      </header>

      <main className="rb-main">
        <section className="rb-editor-col">
          <ResumeUtilityBar
            data={data}
            analysis={analysis}
            lastSavedAt={lastSavedAt}
            warnings={exportWarnings}
            onStartOver={onStartOver}
            onCopyText={onCopyText}
            onDownloadTXT={onDownloadTXT}
            onPrint={onPrint}
          />
          {!generated ? (
            <div className="rb-quick-steps">
              <div className="rb-card">
                <div className="rb-card-title">⚡ Quick Generate</div>
                <p className="rb-hint" style={{ marginBottom: 16 }}>Fill in 2 quick fields and we'll build your resume.</p>

                <div className="rb-quick-step">
                  <div className="rb-quick-step-num">1</div>
                  <div className="rb-quick-step-body">
                    <div className="rb-quick-step-label">Target Role</div>
                    <div className="rb-role-row">
                      <select className="rb-select" value={category} onChange={(e) => { onCategoryChange(e.target.value); onRoleChange(""); }}>
                        <option value="">Job Category</option>
                        {Object.keys(jobCategories).map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select className="rb-select" value={role} onChange={(e) => onRoleChange(e.target.value)} disabled={!category}>
                        <option value="">{category ? "Select Role" : "Select category first"}</option>
                        {category && jobCategories[category].map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="rb-quick-step">
                  <div className="rb-quick-step-num">2</div>
                  <div className="rb-quick-step-body">
                    <div className="rb-quick-step-label">Your Info</div>
                    <div className="rb-contact-grid">
                      <div className="rb-inline-field rb-inline-field--full">
                        <label>Full Name *</label>
                        <input className="rb-input" value={data.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Jane Smith" />
                      </div>
                      <div className="rb-inline-field">
                        <label>Email</label>
                        <input className="rb-input" type="email" value={data.email} onChange={(e) => updateField("email", e.target.value)} placeholder="jane@email.com" />
                      </div>
                      <div className="rb-inline-field">
                        <label>Phone</label>
                        <input className="rb-input" value={data.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="(555) 123-4567" />
                      </div>
                      <div className="rb-inline-field rb-inline-field--full">
                        <label>Location</label>
                        <input className="rb-input" value={data.location} onChange={(e) => updateField("location", e.target.value)} placeholder="City, ST" />
                      </div>
                    </div>
                  </div>
                </div>

                <button className="rb-generate-btn" onClick={handleGenerate} disabled={!canGenerate}>
                  ⚡ Generate My Resume
                </button>
                {!canGenerate && (
                  <p className="rb-hint" style={{ marginTop: 8, textAlign: "center" }}>Enter your name {!category && "and select a category"} to continue.</p>
                )}
              </div>
            </div>
          ) : (
            <>
              {view === "form" ? (
                <>
                  <div className="rb-generated-notice">
                    ✅ Resume generated! Click the <strong>highlighted fields</strong> below to fill in your real info — no bracket-deleting needed.
                    <span className="rb-hint" style={{ display: "block", marginTop: 4 }}>
                      Want to edit raw text? Use the ⌨ Raw Edit toggle on any section.
                    </span>
                  </div>

                  <div className="rb-card">
                    <div className="rb-card-title">Contact Information</div>
                    <div className="rb-contact-grid">
                      <div className="rb-inline-field rb-inline-field--full">
                        <label>Full Name *</label>
                        <input className="rb-input" value={data.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Jane Smith" />
                      </div>
                      <div className="rb-inline-field rb-inline-field--full">
                        <label>Position</label>
                        <input className="rb-input" value={data.position} onChange={(e) => updateField("position", e.target.value)} placeholder={role || "Your title"} />
                      </div>
                      <div className="rb-inline-field">
                        <label>Email *</label>
                        <input className="rb-input" type="email" value={data.email} onChange={(e) => updateField("email", e.target.value)} placeholder="jane@email.com" />
                      </div>
                      <div className="rb-inline-field">
                        <label>Phone *</label>
                        <input className="rb-input" value={data.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="(555) 123-4567" />
                      </div>
                      <div className="rb-inline-field">
                        <label>Location</label>
                        <input className="rb-input" value={data.location} onChange={(e) => updateField("location", e.target.value)} placeholder="City, ST" />
                      </div>
                      <div className="rb-inline-field">
                        <label>LinkedIn</label>
                        <input className="rb-input" value={data.linkedin} onChange={(e) => updateField("linkedin", e.target.value)} placeholder="linkedin.com/in/jane" />
                      </div>
                    </div>
                  </div>

                  <div className="rb-card">
                    <div className="rb-card-title">Resume Sections</div>
                    <div className="rb-fill-hint-banner">
                      <span className="rb-fill-hint-icon">✎</span>
                      Click any <span className="rb-fill-hint-chip">highlighted field</span> to fill it in — no bracket-editing needed!
                    </div>
                    {["summary","experience","education","skills","certifications","projects","volunteer"].map((sec) => (
                      <FillableSection key={sec} id={sec}
                        label={sec.charAt(0).toUpperCase() + sec.slice(1)}
                        value={data[sec]} onChange={updateField}
                        role={role} category={category}
                      />
                    ))}
                  </div>

                  <div className="rb-export-row">
                    <button className="rb-export-btn rb-export-btn--pdf" onClick={onExportPDF} disabled={!data.name || exportLoading === "pdf"}>
                      {exportLoading === "pdf" ? "Generating…" : "⬇ Download PDF"}
                    </button>
                    <button className="rb-export-btn rb-export-btn--docx" onClick={onExportDOCX} disabled={!data.name || exportLoading === "docx"}>
                      {exportLoading === "docx" ? "Generating…" : "⬇ Download DOCX"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="rb-preview-col">
                  <div className="rb-preview-toolbar">
                    <span className="rb-preview-label">Resume Preview</span>
                    <div className="rb-preview-actions">
                      <button className="rb-export-btn rb-export-btn--pdf" onClick={onExportPDF} disabled={!data.name || exportLoading === "pdf"}>
                        {exportLoading === "pdf" ? "Generating…" : "⬇ PDF"}
                      </button>
                      <button className="rb-export-btn rb-export-btn--docx" onClick={onExportDOCX} disabled={!data.name || exportLoading === "docx"}>
                        {exportLoading === "docx" ? "Generating…" : "⬇ DOCX"}
                      </button>
                    </div>
                  </div>
                  <ResumePreview data={data} portrait={portrait} />
                </div>
              )}
            </>
          )}
        </section>

        <ATSPanel analysis={analysis} role={role} onInjectKeyword={injectKeyword} />
      </main>
    </div>
  );
}
