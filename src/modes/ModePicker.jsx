export default function ModePicker({ onSelect, hasDraft, draftSavedAt, onStartOver }) {
  const modes = [
    {
      id: "quick",
      icon: "⚡",
      title: "Quick Generate",
      desc: "Pick a role and we'll generate a starter resume in seconds.",
      details: ["Fast draft in 2 steps", "Pre-filled with role-specific content", "Edit inline after generation"],
      bestFor: "fast drafts & busy job seekers",
      cta: "Quick Start →",
    },
    {
      id: "guided",
      icon: "🧭",
      title: "Guided Step-by-Step",
      desc: "We'll walk through each section with tips and live ATS feedback.",
      details: ["8-step wizard format", "Per-step tips and guidance", "Live ATS score as you go"],
      bestFor: "first-timers & career changers",
      cta: "Start Guided →",
    },
    {
      id: "full",
      icon: "✏️",
      title: "Full Form",
      desc: "All sections at once with full control and live ATS panel.",
      details: ["All sections visible", "Full ATS panel with 5 tabs", "PDF & DOCX export"],
      bestFor: "experienced job seekers",
      cta: "Open Full Form →",
    },
  ];

  return (
    <div className="rb-mode-picker">
      <div className="rb-mode-picker-header">
        <h2 className="rb-mode-picker-title">How would you like to build your resume?</h2>
        <p className="rb-mode-picker-sub">Choose the approach that fits your situation. Your draft autosaves locally in this browser.</p>
        {hasDraft && (
          <div className="rb-draft-banner">
            <span>Saved draft restored{draftSavedAt ? ` from ${new Date(draftSavedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}.</span>
            <button type="button" onClick={onStartOver}>Start over</button>
          </div>
        )}
      </div>
      <div className="rb-mode-cards">
        {modes.map((m) => (
          <div key={m.id} className="rb-mode-card" onClick={() => onSelect(m.id)}>
            <div className="rb-mode-card--icon">{m.icon}</div>
            <div className="rb-mode-card--title">{m.title}</div>
            <p className="rb-mode-card--desc">{m.desc}</p>
            <ul className="rb-mode-card--details">
              {m.details.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
            <div className="rb-mode-card--best">Best for: {m.bestFor}</div>
            <button className="rb-mode-card--cta">{m.cta}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
