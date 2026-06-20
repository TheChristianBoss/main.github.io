export default function SectionField({ id, label, placeholder, value, onChange, onSkip, skipped, rows = 5, hint }) {
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
  return (
    <div className="rb-field">
      <div className="rb-field-header">
        <label className="rb-field-label" htmlFor={id}>{label}</label>
        {onSkip && (
          <button className="rb-skip-btn" onClick={() => onSkip(id, true)}>Skip Section</button>
        )}
      </div>
      {hint && <p className="rb-field-hint">{hint}</p>}
      <textarea
        id={id}
        className="rb-field-textarea"
        rows={rows}
        value={value}
        onChange={(e) => onChange(id, e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
      />
    </div>
  );
}
