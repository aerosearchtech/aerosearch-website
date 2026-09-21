"use client";

import { COLORS } from "@/drishti/theme/colors";

interface Props {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  color: string;
}

const toRad = (a: number) => (a * Math.PI) / 180;

export function AttGauge({ label, value, unit, min, max, color }: Props) {
  const pct = (value - min) / (max - min);
  const angle = pct * 270 - 135;
  const cx = 28;
  const cy = 28;
  const r = 20;
  const sx = cx + r * Math.cos(toRad(-135));
  const sy = cy + r * Math.sin(toRad(-135));
  const ex = cx + r * Math.cos(toRad(135));
  const ey = cy + r * Math.sin(toRad(135));
  const nx = cx + r * Math.cos(toRad(angle));
  const ny = cy + r * Math.sin(toRad(angle));
  const bgPath = `M ${sx} ${sy} A ${r} ${r} 0 1 1 ${ex} ${ey}`;
  const fillPct = Math.max(0, Math.min(1, pct));
  const fillEnd_x = cx + r * Math.cos(toRad(angle));
  const fillEnd_y = cy + r * Math.sin(toRad(angle));
  const fillArc = fillPct > 0.5 ? 1 : 0;
  const fillPath = `M ${sx} ${sy} A ${r} ${r} 0 ${fillArc} 1 ${fillEnd_x} ${fillEnd_y}`;

  return (
    <div style={{ textAlign: "center" }}>
      <svg width="56" height="44" viewBox="0 0 56 44">
        <path d={bgPath} fill="none" stroke="#0c2018" strokeWidth="3" strokeLinecap="round" />
        {pct > 0 && (
          <path d={fillPath} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        )}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="2.5" fill={color} />
        <text
          x={cx}
          y={cy + 13}
          textAnchor="middle"
          fill={color}
          fontSize="7"
          fontFamily="IBM Plex Mono"
          fontWeight="600"
        >
          {value > 0 ? "+" : ""}
          {value.toFixed(1)}
          {unit}
        </text>
      </svg>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "7px",
          color: COLORS.txtLo,
          letterSpacing: "0.1em",
          marginTop: "-4px",
        }}
      >
        {label}
      </div>
    </div>
  );
}
