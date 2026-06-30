import { useState } from "react";
import jobCategories from "../data/jobCategories";
import ScoreRing from "../components/ScoreRing";
import ResumeUtilityBar from "../components/ResumeUtilityBar";
import ResumePreview from "../components/ResumePreview";
import { SCORE_COLOR } from "../engine/analyzeResume";

const STEP_TIPS = {
  0: {
    title: "Why role targeting matters",
    body: "Selecting your target role unlocks keyword alignment guidance. The closer your resume truthfully matches role-specific language, the stronger the guidance score becomes.",
  },
  1: {
    title: "Contact info tips",
    body: "Include a professional email, phone number, and LinkedIn. Your email and phone are required by ATS systems to route your application. LinkedIn adds credibility.",
  },
  2: {
    title: "What makes a great summary",
    body: "3–5 sentences. Mention your role, 2–3 key skills, and 1 quantified achievement. Keep it specific — recruiters spend ~6 seconds on a resume.",
  },
  3: {
    title: "Experience formatting",
    body: "Use: Job Title | Company | Location | Dates, then bullet points starting with strong action verbs. Each bullet = one achievement, ideally with a metric.",
    example: "• Reduced costs by 23% by renegotiating vendor contracts",
  },
  4: {
    title: "Education section tips",
    body: "Include degree, school, location, and year. Add GPA if 3.5+. Include relevant coursework for entry-level roles. Omit high school if you have a college degree.",
  },
  5: {
    title: "Skills keyword strategy",
    body: "Mirror language from the job posting. Separate technical and soft skills. Click the missing keyword chips on the left to inject them directly.",
  },
  6: {
    title: "When optional sections help",
    body: "Certifications: always include if relevant. Projects: great for tech/creative roles or new grads. Volunteer: adds character and can show leadership.",
  },
  7: {
    title: "Understanding your ATS score",
    body: "80+ = strong keyword and formatting alignment. 60–79 = solid with targeted tweaks. Under 60 = review missing keywords, sections, and clarity. Tailor each application honestly.",
  },
};

const STEPS = [
  { id: "role", label: "Target Role" },
  { id: "contact", label: "Contact Info" },
  { id: "summary", label: "Summary" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "optional", label: "Optional" },
  { id: "review", label: "Review" },
];

export default function GuidedMode({ data, setData, analysis, role, category, onRoleChange, onCategoryChange, onSwitchMode, portrait, onExportPDF, onExportDOCX, exportLoading, lastSavedAt, exportWarnings, onStartOver, onCopyText, onDownloadTXT, onPrint }) {
  const [step, setStep] = useState(0);

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

  const tip = STEP_TIPS[step];

  const stepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="rb-card">
            <div className="rb-card-title">Target Role</div>
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
        );

      case 1:
        return (
          <div className="rb-card">
            <div className="rb-card-title">Contact Information</div>
            <div className="rb-contact-grid">
              {[
                { id: "name", label: "Full Name *", placeholder: "Jane Smith", full: true },
                { id: "email", label: "Email *", placeholder: "jane@email.com", type: "email" },
                { id: "phone", label: "Phone *", placeholder: "(555) 123-4567" },
                { id: "location", label: "Location", placeholder: "City, ST" },
                { id: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/jane" },
                { id: "website", label: "Website", placeholder: "janesmith.com" },
              ].map(({ id, label, placeholder, type, full }) => (
                <div key={id} className={`rb-inline-field${full ? " rb-inline-field--full" : ""}`}>
                  <label>{label}</label>
                  <input className="rb-input" type={type || "text"} value={data[id]} onChange={(e) => updateField(id, e.target.value)} placeholder={placeholder} />
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
      case 3:
      case 4:
      case 5: {
        const sectionMap = { 2: "summary", 3: "experience", 4: "education", 5: "skills" };
        const secId = sectionMap[step];
        const labels = { summary: "Professional Summary", experience: "Work Experience", education: "Education", skills: "Skills" };
        const placeholders = {
          summary: "Results-driven professional with X years of experience...",
          experience: "Job Title | Company Name | City, ST | Jan 2022 – Present\n• Achieved [result] by [action], improving [metric] by X%",
          education: "Degree Name | University Name | City, ST | May 2022\n• GPA: 3.X/4.0",
          skills: "Technical: Skill 1, Skill 2, Skill 3\nSoft Skills: Communication, Leadership",
        };
        return (
          <div className="rb-card">
            <div className="rb-card-title">{labels[secId]}</div>
            <textarea
              className="rb-field-textarea"
              rows={secId === "experience" ? 10 : 6}
              value={data[secId]}
              onChange={(e) => updateField(secId, e.target.value)}
              placeholder={placeholders[secId]}
              spellCheck={false}
            />
            {step === 5 && analysis?.missingCritical.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div className="rb-list-title rb-list-title--red" style={{ fontSize: 12, marginBottom: 6 }}>Click to add missing keywords:</div>
                <div className="rb-kw-chips">
                  {analysis.missingCritical.slice(0, 8).map((kw, i) => (
                    <button key={i} className="rb-kw-chip rb-kw-chip--red" onClick={() => injectKeyword(kw)}>+ {kw}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      case 6:
        return (
          <div className="rb-card">
            <div className="rb-card-title">Optional Sections</div>
            {[
              { id: "certifications", label: "Certifications", placeholder: "Certification Name | Issuer | Year", rows: 3 },
              { id: "projects", label: "Projects", placeholder: "Project Name | link | Year\n• Built [what] using [tech]", rows: 4 },
              { id: "volunteer", label: "Volunteer Experience", placeholder: "Organization | Role | 2022–2023\n• [What you did]", rows: 4 },
            ].map(({ id, label, placeholder, rows }) => (
              <div key={id} className="rb-field">
                <div className="rb-field-header">
                  <label className="rb-field-label">{label} <span className="rb-optional-tag">optional</span></label>
                </div>
                <textarea className="rb-field-textarea" rows={rows} value={data[id]} onChange={(e) => updateField(id, e.target.value)} placeholder={placeholder} spellCheck={false} />
              </div>
            ))}
          </div>
        );

      case 7:
        return (
          <div>
            <div className="rb-generated-notice" style={{ marginBottom: 16 }}>
              ✅ Review your resume below. Download when ready.
            </div>
            <div className="rb-preview-col">
              <ResumePreview data={data} portrait={portrait} />
            </div>
            <div className="rb-export-row" style={{ marginTop: 16 }}>
              <button className="rb-export-btn rb-export-btn--pdf" onClick={onExportPDF} disabled={!data.name || exportLoading === "pdf"}>
                {exportLoading === "pdf" ? "Generating…" : "⬇ Download PDF"}
              </button>
              <button className="rb-export-btn rb-export-btn--docx" onClick={onExportDOCX} disabled={!data.name || exportLoading === "docx"}>
                {exportLoading === "docx" ? "Generating…" : "⬇ Download DOCX"}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="rb-app">
      <header className="rb-header">
        <div className="rb-header-inner">
          <a href="/" className="rb-logo"><span className="rb-logo-cg">CG</span> Resume Builder <span className="open-beta-badge">Open Beta</span></a>
          <div className="rb-header-center">
            <button className="rb-back-mode-btn" onClick={() => onSwitchMode(null)}>← Modes</button>
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
          {/* Progress Bar */}
          <div className="rb-steps-bar">
            {STEPS.map((s, i) => (
              <div key={s.id} className={`rb-step-dot${i === step ? " rb-step-dot--active" : i < step ? " rb-step-dot--done" : ""}`} title={s.label} />
            ))}
            <span className="rb-steps-label">Step {step + 1} of {STEPS.length} — {STEPS[step].label}</span>
          </div>

          <div className="rb-guided-layout">
            <div className="rb-guided-main">
              {stepContent()}

              <div className="rb-guided-nav">
                <button className="rb-export-btn" style={{ minWidth: 100 }} onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
                  ← Back
                </button>
                {step < STEPS.length - 1 && (
                  <button className="rb-export-btn rb-export-btn--pdf" style={{ minWidth: 100 }} onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
                    Next →
                  </button>
                )}
              </div>
            </div>

            <div className="rb-guided-tip">
              <div className="rb-guided-tip-title">💡 {tip.title}</div>
              <p className="rb-guided-tip-body">{tip.body}</p>
              {tip.example && <div className="rb-guided-tip-example">{tip.example}</div>}
              {analysis && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Alignment score so far</div>
                  <ScoreRing value={analysis.overall} size={64} />
                  {analysis.missingCritical.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Missing keywords:</div>
                      <div className="rb-kw-chips">
                        {analysis.missingCritical.slice(0, 4).map((kw, i) => (
                          <span key={i} className="rb-kw-chip rb-kw-chip--red" style={{ fontSize: 10 }}>{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
