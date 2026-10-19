import { useState, useRef, useEffect } from "react";

// ─── SUGGESTIONS MAP ──────────────────────────────────────────────────────────
// Keys match bracket label patterns (lowercase). Values = suggested options.
// Personal fields (name, school, dates) get free-type only — no suggestions.

// ─── SUGGESTIONS MAP ──────────────────────────────────────────────────────────
// Keys are EXACT lowercase bracket labels. null = personal (free type only).
// No partial matching — each label must be listed explicitly.

const SUGGESTIONS = {
  // ── years of experience (summary line) ──────────────────────────────────
  "x": ["1", "2", "3", "4", "5", "6", "7", "8", "10+"],
  "x years": ["1", "2", "3", "4", "5", "6–8", "10+"],
  // ── percentages / metrics ────────────────────────────────────────────────
  "x%": ["10%", "15%", "20%", "25%", "30%", "40%", "50%"],
  "metric": ["response time", "error rate", "processing time", "customer satisfaction", "revenue", "costs", "efficiency"],
  "result": ["increased revenue", "reduced costs", "improved performance", "streamlined workflow", "enhanced user experience"],
  "outcome": ["increased revenue by 20%", "reduced costs by 15%", "improved efficiency by 30%", "boosted team productivity"],
  // ── counts ───────────────────────────────────────────────────────────────
  "x hours": ["2", "5", "10", "20", "40"],
  "x hours/week": ["2 hours/week", "5 hours/week", "10 hours/week"],
  "x hours/month": ["5 hours/month", "10 hours/month", "20 hours/month"],
  "x releases/day": ["2", "5", "10", "20+"],
  "x microservices": ["5", "10", "20", "50+"],
  "x environments": ["2", "3", "4 (dev/staging/prod/dr)"],
  "x features per sprint": ["2–3", "3–5", "5+"],
  "x users": ["100", "1,000", "10,000", "100,000+"],
  "x active users": ["1,000", "10,000", "100,000+"],
  "x patients per shift": ["4–6", "6–8", "8–10", "10+"],
  "x patients per day": ["10–15", "15–20", "20–30"],
  "x bed unit": ["10", "20", "30", "40+"],
  "x-bed unit": ["10", "20", "30", "40+"],
  "x providers": ["2–3", "3–5", "5–10"],
  "x business units": ["2", "3", "5", "8+"],
  "x senior leaders": ["3–5", "5–10", "10+"],
  "x participants": ["5", "10", "15", "20+"],
  "x projects": ["3–5", "5–10", "10+"],
  "x-hour clinical externship": ["160-hour", "240-hour", "320-hour", "480-hour"],
  "x stakeholders": ["3–5", "5–10", "10+"],
  "x features": ["3", "5", "8", "10+"],
  "x component library": ["design system", "UI component", "icon", "pattern"],
  "x new graduate nurses": ["1–2", "3–5", "5+"],
  "x new graduate nurses, reducing onboarding time by [x]%": null,
  "x+ patients per shift": ["4+", "6+", "8+", "10+"],
  "x satisfaction score": ["90%", "95%", "4.5/5", "4.8/5"],
  // ── GPA ──────────────────────────────────────────────────────────────────
  "x.x": ["3.5", "3.6", "3.7", "3.8", "3.9", "4.0"],
  "x.x/4.0": ["3.5/4.0", "3.6/4.0", "3.7/4.0", "3.8/4.0", "3.9/4.0", "4.0/4.0"],
  // ── personal / free type ─────────────────────────────────────────────────
  "company name": null,
  "previous company": null,
  "hospital/facility name": null,
  "previous facility": null,
  "clinic/practice name": null,
  "facility": null,
  "organization": null,
  "job title": null,
  "previous job title": null,
  "city, st": null,
  "month year": null,
  "year": null,
  "university name": null,
  "school name": null,
  "link": null,
  "project name": null,
  "certification name": null,
  "issuer": null,
  "certification #": null,
  "license #[xxxxx]": null,
  "xxxxx": null,
  "key achievement 1": null,
  "key achievement 2": null,
  "add more": null,
  "primary skills": null,
  "secondary skills": null,
  // ── degree ───────────────────────────────────────────────────────────────
  "degree": ["B.S.", "B.A.", "M.S.", "M.B.A.", "Ph.D.", "A.A.", "B.F.A.", "M.F.A."],
  "degree/certification": ["B.S.", "B.A.", "M.S.", "Certificate", "Associate Degree", "Diploma"],
  // ── tech stacks ──────────────────────────────────────────────────────────
  "languages/frameworks": ["JavaScript/React", "Python/Django", "Java/Spring", "TypeScript/Node", "Go/Gin", "Ruby/Rails"],
  "react/node/etc.": ["React", "Vue", "Angular", "Node.js", "Django", "Spring Boot", "Laravel"],
  "jenkins/gitlab ci/github actions": ["GitHub Actions", "GitLab CI", "Jenkins", "CircleCI", "Azure DevOps"],
  "aws/gcp/azure": ["AWS", "GCP", "Azure", "multi-cloud"],
  "prometheus/grafana/datadog": ["Datadog", "Prometheus + Grafana", "New Relic", "Splunk"],
  "tableau/power bi": ["Tableau", "Power BI", "Looker", "Metabase"],
  "excel/tableau": ["Excel", "Tableau", "Power BI", "Google Data Studio"],
  "epic/athenahealth/etc.": ["Epic", "AthenaHealth", "Cerner", "Meditech", "eClinicalWorks"],
  "tools you use": ["VS Code, Git, Jira", "GitHub, Slack, Notion", "Figma, Zeplin, Jira", "Excel, Tableau, SQL"],
  "database": ["PostgreSQL", "MySQL", "Snowflake", "Redshift", "BigQuery"],
  "old tech": ["legacy monolith", "on-premise servers", "manual processes", "spreadsheet-based system"],
  "new tech": ["microservices", "cloud infrastructure", "automated pipeline", "modern SaaS platform"],
  // ── features / systems ────────────────────────────────────────────────────
  "feature/system": ["authentication system", "payment integration", "reporting dashboard", "API gateway", "data pipeline", "notification service"],
  "feature": ["user dashboard", "search feature", "notification system", "analytics module", "payment flow"],
  "component": ["frontend component", "REST API", "database layer", "caching system", "CI/CD pipeline"],
  "solution/system": ["automation system", "reporting tool", "integration platform", "monitoring solution", "self-service portal"],
  "project/initiative": ["digital transformation", "system migration", "cost optimization", "process improvement", "new product launch"],
  "product/feature": ["mobile app", "web platform", "dashboard", "API service", "customer portal"],
  // ── healthcare ────────────────────────────────────────────────────────────
  "ehr system": ["Epic", "Cerner", "AthenaHealth", "Meditech"],
  "unit type": ["medical-surgical", "ICU", "emergency", "pediatric", "oncology"],
  "setting": ["acute care hospital", "outpatient clinic", "long-term care", "rehabilitation center"],
  "shift/day": ["shift", "day", "week"],
  "procedures/tasks": ["patient intake", "vitals monitoring", "specimen collection", "medication administration"],
  "specialty, e.g., medical-surgical, icu": ["medical-surgical", "ICU/critical care", "emergency", "pediatrics", "oncology", "orthopedics"],
};

function getSuggestions(label) {
  // Exact match only — no partial matching to avoid false positives
  return SUGGESTIONS[label.toLowerCase().trim()];
}

// ─── PARSER ───────────────────────────────────────────────────────────────────

function parseSegments(text) {
  const segments = [];
  const regex = /\[([^\]]+)\]/g;
  let last = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) segments.push({ type: "text", value: text.slice(last, match.index) });
    segments.push({ type: "fill", label: match[1], start: match.index, end: regex.lastIndex });
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push({ type: "text", value: text.slice(last) });
  return segments;
}


// Strip remaining [brackets] for clean export — called from parent before PDF/DOCX
// eslint-disable-next-line react-refresh/only-export-components
export function stripBrackets(text) {
  if (!text) return "";
  return text
    .split("\n")
    .filter(line => {
      // Drop the ENTIRE line if it contains any unfilled [bracket]
      if (/\[[^\]]+\]/.test(line)) return false;
      // Also drop lines that are only bullet/pipe/whitespace
      const clean = line.replace(/^[|\-•·▪▸\s]+$/, "").trim();
      return clean.length > 0;
    })
    .join("\n");
}

// ─── FILL CHIP ────────────────────────────────────────────────────────────────

function FillChip({ seg, onChange }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const ref = useRef(null);

  const suggestions = getSuggestions(seg.label);
  const isPersonal = suggestions === null;
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const commit = (val) => {
    onChange(seg, val);
    setOpen(false);
    setCustom("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); if (custom.trim()) commit(custom.trim()); }
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <span className="rb-chip-wrap" ref={ref}>
      <button
        className="rb-fill-chip"
        onClick={() => setOpen((o) => !o)}
        type="button"
        title={`Click to fill: ${seg.label}`}
      >
        <><span className="rb-fill-chip-icon">✎</span>{seg.label}</>
      </button>

      {open && (
        <div className="rb-chip-dropdown">
          <div className="rb-chip-dropdown-label">{seg.label}</div>

          {/* Suggestions */}
          {suggestions && suggestions.length > 0 && (
            <div className="rb-chip-suggestions">
              <div className="rb-chip-section-title">Suggested</div>
              {suggestions.map((s) => (
                <button key={s} className="rb-chip-option" onClick={() => commit(s)} type="button">{s}</button>
              ))}
            </div>
          )}

          {/* Free type */}
          <div className="rb-chip-custom">
            {!isPersonal && suggestions && suggestions.length > 0 && (
              <div className="rb-chip-section-title">Or type your own</div>
            )}
            <input
              autoFocus={isPersonal || !suggestions || suggestions.length === 0}
              className="rb-chip-input"
              placeholder={`Enter ${seg.label}…`}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {custom.trim() && (
              <button className="rb-chip-commit" onClick={() => commit(custom.trim())} type="button">✓ Use this</button>
            )}
          </div>
        </div>
      )}
    </span>
  );
}

// ─── BLOCK RENDERER ───────────────────────────────────────────────────────────
// Renders one "block" of template text (e.g. one job entry) as fillable lines.

function TemplateBlock({ text, blockIndex, onTextChange }) {
  const segments = parseSegments(text);

  // Replace only the clicked bracket range in the current block. Never index
  // values by the number of placeholders still visible: that number changes.
  const handleChipChange = (seg, chipValue) => {
    const placeholder = `[${seg.label}]`;
    if (text.slice(seg.start, seg.end) !== placeholder) return;
    onTextChange(blockIndex, text.slice(0, seg.start) + chipValue + text.slice(seg.end));
  };

  // Build lines
  const lines = [];
  let currentLine = [];
  segments.forEach((seg, i) => {
    if (seg.type === "text") {
      const parts = seg.value.split("\n");
      parts.forEach((part, pi) => {
        if (pi > 0) { lines.push([...currentLine]); currentLine = []; }
        if (part) currentLine.push({ type: "text", value: part, key: `t-${i}-${pi}` });
      });
    } else {
      currentLine.push({ ...seg, key: `f-${seg.start}` });
    }
  });
  if (currentLine.length) lines.push(currentLine);

  return (
    <div className="rb-template-block">
      {lines.map((line, li) => (
        <div className="rb-fillable-line" key={li}>
          {line.map((seg) =>
            seg.type === "text"
              ? <span key={seg.key} className="rb-fillable-text">{seg.value}</span>
              : <FillChip key={seg.key} seg={seg} onChange={handleChipChange} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── SECTION SPLITTER ─────────────────────────────────────────────────────────
// Splits multi-job / multi-school text into discrete blocks separated by blank lines.

function splitIntoBlocks(text) {
  if (!text) return [""];
  const blocks = text.split(/\n\n+/);
  return blocks.length > 0 ? blocks : [text];
}

function joinBlocks(blocks) {
  return blocks.join("\n\n");
}

// Label for "Add another" button per section
const ADD_LABELS = {
  experience: "＋ Add Another Job",
  education: "＋ Add Another School",
  certifications: "＋ Add Another Certification",
  projects: "＋ Add Another Project",
  volunteer: "＋ Add Another Entry",
};

const BLOCK_TEMPLATES = {
  experience: "[Previous Job Title] | [Previous Company] | [City, ST] | [Month Year] – [Month Year]\n• [Key achievement 1]\n• [Key achievement 2]",
  education: "[Degree] | [University Name] | [City, ST] | [Year]",
  certifications: "[Certification Name] | [Issuer] | [Year]",
  projects: "[Project Name] | [link] | [Year]\n• Built [feature] using [component]",
  volunteer: "[Organization] | [Job Title] | [Month Year] – [Month Year]\n• [Key achievement 1]",
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function FillableSection({ id, label, value, onChange, onSkip, skipped, hint }) {
  const [showRaw, setShowRaw] = useState(false);
  // The parent value is the only authoritative copy. Resets, templates, and
  // saved-draft restores are reflected immediately instead of leaving stale blocks.
  const blocks = splitIntoBlocks(value);

  const updateBlocks = (newBlocks) => onChange(id, joinBlocks(newBlocks));

  const handleBlockChange = (blockIndex, newText) => {
    const next = [...blocks];
    next[blockIndex] = newText;
    updateBlocks(next);
  };

  const addBlock = () => {
    updateBlocks([...blocks, BLOCK_TEMPLATES[id] || ""]);
  };

  const removeBlock = (i) => {
    updateBlocks(blocks.filter((_, idx) => idx !== i));
  };

  const hasBrackets = /\[[^\]]+\]/.test(value || "");
  const canAddMore = ADD_LABELS[id] !== undefined;

  const handleRawChange = (e) => {
    onChange(id, e.target.value);
  };

  if (skipped) {
    return (
      <div className="rb-field rb-field--skipped">
        <div className="rb-field-header">
          <label className="rb-field-label rb-field-label--muted">
            {label} <span className="rb-skipped-tag">skipped</span>
          </label>
          <button className="rb-skip-btn rb-skip-btn--undo" onClick={() => onSkip(id, false)}>Undo Skip</button>
        </div>
      </div>
    );
  }

  if (!hasBrackets || showRaw) {
    return (
      <div className="rb-field">
        <div className="rb-field-header">
          <label className="rb-field-label" htmlFor={id}>{label}</label>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {hasBrackets && <button className="rb-fill-mode-btn" onClick={() => setShowRaw(false)}>✎ Fill Mode</button>}
            {onSkip && <button className="rb-skip-btn" onClick={() => onSkip(id, true)}>Skip</button>}
          </div>
        </div>
        {hint && <p className="rb-field-hint">{hint}</p>}
        <textarea id={id} className="rb-field-textarea" rows={id === "experience" ? 8 : 4}
          value={value} onChange={handleRawChange} spellCheck={false} />
      </div>
    );
  }

  const totalBrackets = (value.match(/\[[^\]]+\]/g) || []).length;

  return (
    <div className="rb-field">
      <div className="rb-field-header">
        <label className="rb-field-label">{label}</label>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {totalBrackets > 0 && <span className="rb-fill-progress">{totalBrackets} remaining</span>}
          <button className="rb-fill-mode-btn rb-fill-mode-btn--raw" onClick={() => setShowRaw(true)} title="Switch to raw text editor">⌨ Raw Edit</button>
          {onSkip && <button className="rb-skip-btn" onClick={() => onSkip(id, true)}>Skip</button>}
        </div>
      </div>
      {hint && <p className="rb-field-hint">{hint}</p>}

      <div className="rb-fillable-body">
        {blocks.map((blockText, bi) => (
          <div key={bi} className="rb-block-wrap">
            {blocks.length > 1 && (
              <button className="rb-block-remove" onClick={() => removeBlock(bi)} type="button" title="Remove this entry">✕</button>
            )}
            <TemplateBlock
              text={blockText}
              blockIndex={bi}
              onTextChange={handleBlockChange}
            />
            {bi < blocks.length - 1 && <div className="rb-block-divider" />}
          </div>
        ))}
      </div>

      {canAddMore && (
        <button className="rb-add-block-btn" onClick={addBlock} type="button">
          {ADD_LABELS[id]}
        </button>
      )}
    </div>
  );
}
