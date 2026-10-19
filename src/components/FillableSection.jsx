  return segments;
}

// One edit replaces exactly one bracket span in the current block text.
// No separate fill dictionary or shifting numeric IDs are needed.
function replacePlaceholder(text, start, end, replacement) {
  return text.slice(0, start) + replacement + text.slice(end);
}

// Used by ResumeBuilder.jsx when exporting completed resumes.
// eslint-disable-next-line react-refresh/only-export-components
export function stripBrackets(text) {
  if (!text) return "";
  return text.split("\n").filter((line) => {
    if (/\[[^\]]+\]/.test(line)) return false;
    return line.replace(/^[|•·▪▸\s-]+$/, "").trim().length > 0;
  }).join("\n");
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
    onChange(seg.start, seg.end, val);
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
  const handleChipChange = (start, end, chipValue) => {
    onTextChange(blockIndex, replacePlaceholder(text, start, end, chipValue));
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
  // Parent value is the only source of truth, including after reset or draft load.
  const blocks = splitIntoBlocks(value || "");

  const handleBlockChange = (blockIndex, newText) => {
    const next = [...blocks];
    next[blockIndex] = newText;
    onChange(id, joinBlocks(next));
  };

  const addBlock = () => {
    onChange(id, joinBlocks([...blocks, BLOCK_TEMPLATES[id] || ""]));
  };

  const removeBlock = (i) => {
    onChange(id, joinBlocks(blocks.filter((_, idx) => idx !== i)));
  };

  const hasBrackets = /\[[^\]]+\]/.test(value || "");
  const canAddMore = ADD_LABELS[id] !== undefined;
  const handleRawChange = (e) => onChange(id, e.target.value);

  if (skipped) {
    return (
