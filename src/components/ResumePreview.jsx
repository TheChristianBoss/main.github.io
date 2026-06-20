export default function ResumePreview({ data, portrait }) {
  const sections = [
    { key: "summary", title: "Professional Summary" },
    { key: "experience", title: "Work Experience" },
    { key: "education", title: "Education" },
    { key: "skills", title: "Skills" },
    { key: "certifications", title: "Certifications" },
    { key: "projects", title: "Projects" },
    { key: "volunteer", title: "Volunteer" },
  ].filter((s) => data[s.key] && data[s.key].trim());

  const contactParts = [data.email, data.phone, data.location, data.linkedin, data.website].filter(Boolean);

  const renderContent = (content) =>
    content.split("\n").map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} style={{ height: 4 }} />;
      if (/^[-•*·▪▸]/.test(trimmed)) {
        return (
          <div key={i} className="rbp-bullet">
            <span className="rbp-bullet-dot">•</span>
            <span>{trimmed.replace(/^[-•*·▪▸]\s*/, "")}</span>
          </div>
        );
      }
      if (trimmed.includes("|")) {
        const parts = trimmed.split("|").map((p) => p.trim());
        return (
          <div key={i} className="rbp-job-meta">
            <span className="rbp-job-title">{parts[0]}</span>
            <span className="rbp-job-rest">{parts.slice(1).join(" | ")}</span>
          </div>
        );
      }
      return <div key={i} className="rbp-line">{trimmed}</div>;
    });

  return (
    <div className="rb-preview-paper">
      <div className="rbp-header">
        {portrait && <img src={portrait} alt="Portrait" className="rbp-portrait" />}
        <div className="rbp-header-text">
          <h1 className="rbp-name">{data.name || <span style={{ opacity: 0.3 }}>Your Name</span>}</h1>
          {data.position && <div className="rbp-position">{data.position}</div>}
          {contactParts.length > 0 && <div className="rbp-contact">{contactParts.join("  |  ")}</div>}
        </div>
      </div>
      <hr className="rbp-divider" />
      {sections.length === 0 && (
        <div className="rbp-empty">Fill in sections on the left to see your resume preview.</div>
      )}
      {sections.map((sec) => (
        <div key={sec.key} className="rbp-section">
          <div className="rbp-section-title">{sec.title.toUpperCase()}</div>
          <hr className="rbp-section-rule" />
          <div className="rbp-section-body">{renderContent(data[sec.key])}</div>
        </div>
      ))}
    </div>
  );
}
