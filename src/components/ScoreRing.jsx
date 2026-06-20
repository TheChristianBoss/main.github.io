import { SCORE_COLOR } from "../engine/analyzeResume";

export default function ScoreRing({ value, size = 80 }) {
  const r = size / 2 - 7;
  const circ = 2 * Math.PI * r;
  const fill = circ * (1 - value / 100);
  const color = SCORE_COLOR(value);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e1e1e" strokeWidth="5.5" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5.5"
        strokeDasharray={circ} strokeDashoffset={fill}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fill={color} fontSize={size < 65 ? "12" : "15"} fontWeight="700" fontFamily="monospace">
        {value}%
      </text>
    </svg>
  );
}
