import ScoreRing from './ScoreRing';

function formatSaved(ts) {
  if (!ts) return 'Not saved yet';
  try {
    return `Saved locally ${new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  } catch {
    return 'Saved locally';
  }
}

export default function ResumeUtilityBar({
  data,
  analysis,
  lastSavedAt,
  warnings = [],
  onCopyText,
  onDownloadTXT,
  onPrint,
  onStartOver,
}) {
  const hasContent = Object.values(data || {}).some((v) => typeof v === 'string' && v.trim());
  return (
    <div className="rb-utility-card" aria-label="Resume utilities">
      <div className="rb-utility-left">
        {analysis ? <ScoreRing value={analysis.overall} size={42} /> : <div className="rb-score-placeholder">ATS</div>}
        <div>
          <div className="rb-utility-title">Resume workspace</div>
          <div className="rb-utility-sub">{formatSaved(lastSavedAt)} · no signup · no watermark · stored in this browser</div>
        </div>
      </div>
      <div className="rb-utility-actions">
        <button className="rb-small-action" type="button" onClick={onCopyText} disabled={!hasContent}>Copy text</button>
        <button className="rb-small-action" type="button" onClick={onDownloadTXT} disabled={!hasContent}>Download TXT</button>
        <button className="rb-small-action" type="button" onClick={onPrint} disabled={!hasContent}>Print / Save PDF</button>
        <button className="rb-small-action rb-small-action--danger" type="button" onClick={onStartOver}>Start over</button>
      </div>
      {warnings.length > 0 && (
        <div className="rb-utility-warnings">
          <strong>Before exporting:</strong>
          <ul>
            {warnings.slice(0, 5).map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
