import { useRef } from "react";
import SectionField from "../components/SectionField";
import ATSPanel from "../components/ATSPanel";
import ResumePreview from "../components/ResumePreview";
import ScoreRing from "../components/ScoreRing";
import ResumeUtilityBar from "../components/ResumeUtilityBar";
import { SCORE_COLOR } from "../engine/analyzeResume";
import jobCategories from "../data/jobCategories";

const CATEGORY_POSITIONS = {
  "General Use": "Professional",
  "Technology & IT": "Technology Professional",
  "Healthcare": "Healthcare Professional",
  "Marketing & Creative": "Marketing & Creative Professional",
  "Business & Finance": "Business Professional",
  "Sales & Customer Success": "Sales Professional",
  "Engineering & Trades": "Engineering Professional",
  "Education": "Education Professional",
  "Logistics & Transportation": "Logistics Professional",
  "Legal & Compliance": "Legal Professional",
};

const SECTION_PLACEHOLDERS = {
  summary: "Results-driven professional with X years of experience in [field]. Skilled in [skill 1], [skill 2], and [skill 3]. Proven track record of [achievement].",
  experience: "Job Title | Company Name | City, ST | Jan 2022 – Present\n• Achieved [result] by [action], improving [metric] by X%\n• Led [project/initiative] resulting in [outcome]",
  education: "Degree Name | University Name | City, ST | May 2022\n• GPA: 3.X/4.0\n• Relevant Coursework: Course 1, Course 2",
  skills: "Technical: Skill 1, Skill 2, Skill 3\nSoft Skills: Communication, Leadership, Problem Solving",
  certifications: "Certification Name | Issuing Organization | 2023",
  projects: "Project Name | github.com/link | 2023\n• Built [what] using [tech], achieving [result]",
  volunteer: "Organization | Role | 2022–2023\n• [What you did and impact]",
};

const SECTION_HINTS = {
  experience: "Format: Job Title | Company | Location | Dates — then bullet points starting with •",
  education: "Format: Degree | School | Location | Year — then optional bullets",
  certifications: "Format: Certification Name | Issuer | Year",
  projects: "Format: Project Name | Link | Year — then bullet points",
  volunteer: "Format: Organization | Role | Dates — then bullet points",
};

export default function FullMode({
  data, setData, analysis, role, category, skipped, setSkipped,
  onRoleChange, onCategoryChange, onSwitchMode,
  portrait, setPortrait, view, setView,
  onExportPDF, onExportDOCX, exportLoading,
  lastSavedAt, exportWarnings, onStartOver, onCopyText, onDownloadTXT, onPrint,
}) {
  const portraitRef = useRef(null);

  const updateField = (id, value) => setData((prev) => ({ ...prev, [id]: value }));

  const handleSkip = (id, skip) => {
    setSkipped((prev) => ({ ...prev, [id]: skip }));
    if (skip) setData((prev) => ({ ...prev, [id]: "" }));
  };

  const handlePortrait = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPortrait(ev.target.result);
    reader.readAsDataURL(file);
  };

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

  return (
    <div className="rb-app">
      <header className="rb-header">
        <div className="rb-header-inner">
          <a href="/" className="rb-logo"><span className="rb-logo-cg">CG</span> Resume Builder</a>
          <div className="rb-header-center">
            <button className="rb-back-mode-btn" onClick={() => onSwitchMode(null)}>← Modes</button>
            <button className={`rb-view-btn${view === "form" ? " active" : ""}`} onClick={() => setView("form")}>✏ Edit</button>
            <button className={`rb-view-btn${view === "preview" ? " active" : ""}`} onClick={() => setView("preview")}>👁 Preview</button>
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
          {view === "form" ? (
            <>
              {/* Role Picker */}
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
                {category && !role && (
                  <p className="rb-hint" style={{ marginTop: 8 }}>
                    General position: <strong style={{ color: "var(--accent)" }}>{CATEGORY_POSITIONS[category]}</strong>
                  </p>
                )}
              </div>

              {/* Contact Info */}
              <div className="rb-card">
                <div className="rb-card-title">Contact Information</div>
                <div className="rb-contact-grid">
                  <div className="rb-inline-field rb-inline-field--full">
                    <label>Full Name *</label>
                    <input className="rb-input" value={data.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Jane Smith" />
                  </div>
                  <div className="rb-inline-field rb-inline-field--full">
                    <label>Professional Title / Position *</label>
                    <input className="rb-input" value={data.position} onChange={(e) => updateField("position", e.target.value)} placeholder={role || (CATEGORY_POSITIONS[category] || "Software Engineer")} />
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
                  <div className="rb-inline-field rb-inline-field--full">
                    <label>Website / Portfolio</label>
                    <input className="rb-input" value={data.website} onChange={(e) => updateField("website", e.target.value)} placeholder="janesmith.com" />
                  </div>
                </div>

                {/* Portrait */}
                <div className="rb-portrait-section">
                  <div className="rb-portrait-label">
                    <span>Portrait Photo <span className="rb-optional-tag">optional</span></span>
                    <span className="rb-hint">Will appear in the top-right of your resume.</span>
                  </div>
                  <div className="rb-portrait-row">
                    {portrait && <img src={portrait} alt="Portrait" className="rb-portrait-thumb" />}
                    <div className="rb-portrait-actions">
                      <button className="rb-upload-btn" onClick={() => portraitRef.current?.click()}>
                        {portrait ? "Change Photo" : "Upload Photo"}
                      </button>
                      {portrait && <button className="rb-remove-btn" onClick={() => setPortrait(null)}>Remove</button>}
                    </div>
                    <input ref={portraitRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePortrait} />
                  </div>
                </div>
              </div>

              {/* Resume Sections */}
              <div className="rb-card">
                <div className="rb-card-title">Resume Sections</div>
                <SectionField id="summary" label="Professional Summary *" rows={4} placeholder={SECTION_PLACEHOLDERS.summary} value={data.summary} onChange={updateField} onSkip={handleSkip} skipped={skipped.summary} />
                <SectionField id="experience" label="Work Experience *" rows={8} placeholder={SECTION_PLACEHOLDERS.experience} hint={SECTION_HINTS.experience} value={data.experience} onChange={updateField} onSkip={handleSkip} skipped={skipped.experience} />
                <SectionField id="education" label="Education *" rows={4} placeholder={SECTION_PLACEHOLDERS.education} hint={SECTION_HINTS.education} value={data.education} onChange={updateField} onSkip={handleSkip} skipped={skipped.education} />
                <SectionField id="skills" label="Skills *" rows={3} placeholder={SECTION_PLACEHOLDERS.skills} value={data.skills} onChange={updateField} onSkip={handleSkip} skipped={skipped.skills} />
              </div>

              <div className="rb-card">
                <div className="rb-card-title">Optional Sections</div>
                <SectionField id="certifications" label="Certifications" rows={3} placeholder={SECTION_PLACEHOLDERS.certifications} hint={SECTION_HINTS.certifications} value={data.certifications} onChange={updateField} onSkip={handleSkip} skipped={skipped.certifications} />
                <SectionField id="projects" label="Projects" rows={5} placeholder={SECTION_PLACEHOLDERS.projects} hint={SECTION_HINTS.projects} value={data.projects} onChange={updateField} onSkip={handleSkip} skipped={skipped.projects} />
                <SectionField id="volunteer" label="Volunteer Experience" rows={4} placeholder={SECTION_PLACEHOLDERS.volunteer} hint={SECTION_HINTS.volunteer} value={data.volunteer} onChange={updateField} onSkip={handleSkip} skipped={skipped.volunteer} />
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
                    {exportLoading === "pdf" ? "Generating…" : "⬇ Download PDF"}
                  </button>
                  <button className="rb-export-btn rb-export-btn--docx" onClick={onExportDOCX} disabled={!data.name || exportLoading === "docx"}>
                    {exportLoading === "docx" ? "Generating…" : "⬇ Download DOCX"}
                  </button>
                </div>
              </div>
              <ResumePreview data={data} portrait={portrait} />
            </div>
          )}
        </section>

        <ATSPanel
          analysis={analysis}
          role={role}
          skipped={skipped}
          onSkip={handleSkip}
          onInjectKeyword={injectKeyword}
        />
      </main>
    </div>
  );
}
