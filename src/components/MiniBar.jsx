import { SCORE_COLOR } from "../engine/analyzeResume";

export default function MiniBar({ label, value }) {
  return (
    <div className="rb-minibar">
      <span className="rb-minibar-label">{label}</span>
      <div className="rb-minibar-track">
        <div className="rb-minibar-fill" style={{ width: `${value}%`, background: SCORE_COLOR(value) }} />
      </div>
      <span className="rb-minibar-val" style={{ color: SCORE_COLOR(value) }}>{value}%</span>
    </div>
  );
}
