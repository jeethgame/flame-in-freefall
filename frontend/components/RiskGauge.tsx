"use client";

interface RiskGaugeProps {
  score: number;
  label: string;
}

export default function RiskGauge({ score, label }: RiskGaugeProps) {
  const pct = Math.min(100, Math.max(0, score));
  const radius = 70;
  const cx = 90;
  const cy = 90;
  const sweepDeg = 240;
  const startDeg = 150;

  function polar(cx: number, cy: number, r: number, deg: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arc(pctFill: number) {
    const endDeg = startDeg + (sweepDeg * pctFill) / 100;
    const start = polar(cx, cy, radius, startDeg);
    const end = polar(cx, cy, radius, endDeg);
    const large = sweepDeg * pctFill / 100 > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`;
  }

  const color = pct < 30 ? "#22C55E" : pct < 60 ? "#F59E0B" : pct < 80 ? "#EA580C" : "#EF4444";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <svg width={180} height={130} viewBox="0 0 180 130">
        <path d={arc(100)} fill="none" stroke="#1e293b" strokeWidth={6} strokeLinecap="butt" />
        <path d={arc(pct)} fill="none" stroke={color} strokeWidth={6} strokeLinecap="butt" style={{ transition: "stroke 0.15s" }} />
        <text x={cx} y={cy + 8} textAnchor="middle" fill={color} fontSize={26} fontWeight="700" fontFamily="JetBrains Mono, monospace">
          {Math.round(pct)}
        </text>
        <text x={cx} y={cy + 24} textAnchor="middle" fill="#475569" fontSize={10} fontFamily="JetBrains Mono, monospace">
          / 100
        </text>
      </svg>
      <span className={`mc-tag ${pct < 30 ? "teal" : pct < 60 ? "amber" : "red"}`}>
        {label}
      </span>
      <span style={{ color: "var(--label)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
        IGNITION/SPREAD RISK
      </span>
    </div>
  );
}
