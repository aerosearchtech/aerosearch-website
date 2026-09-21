"use client";

import { COLORS } from "@/drishti/theme/colors";

export interface HistorySample {
  t: number; // mission seconds
  batt: number;
  signal: number;
  alt: number;
}

interface Props {
  samples: HistorySample[];
}

interface SeriesProps {
  label: string;
  unit: string;
  color: string;
  values: number[];
  min: number;
  max: number;
}

function Sparkline({ label, unit, color, values, min, max }: SeriesProps) {
  const W = 220;
  const H = 60;
  const PAD = { l: 8, r: 8, t: 14, b: 14 };
  const pw = W - PAD.l - PAD.r;
  const ph = H - PAD.t - PAD.b;
  const last = values[values.length - 1];
  const span = Math.max(1, max - min);

  const points = values.map((v, i) => {
    const x = PAD.l + (i / Math.max(1, values.length - 1)) * pw;
    const y = PAD.t + (1 - (v - min) / span) * ph;
    return [x, y] as const;
  });
  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const areaPath = points.length > 0
    ? `${linePath} L${(points[points.length - 1]?.[0] ?? PAD.l).toFixed(1)} ${PAD.t + ph} L${PAD.l} ${PAD.t + ph} Z`
    : "";

  return (
    <div style={{ flex: 1 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--font-mono)",
          fontSize: "8px",
          color: COLORS.txtLo,
          letterSpacing: "0.12em",
          padding: "0 2px 2px",
        }}
      >
        <span>{label}</span>
        <span style={{ color }}>
          {last != null ? last.toFixed(unit === "%" ? 0 : 0) : "—"}
          {unit}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: "60px", display: "block" }}>
        <rect width={W} height={H} fill={COLORS.bg} stroke={COLORS.bdDim} strokeWidth={0.5} />
        {/* Mid-line */}
        <line x1={PAD.l} y1={PAD.t + ph / 2} x2={W - PAD.r} y2={PAD.t + ph / 2} stroke={COLORS.bdDim} strokeWidth={0.4} />
        {points.length > 1 && (
          <>
            <path d={areaPath} fill={`${color}22`} />
            <path d={linePath} fill="none" stroke={color} strokeWidth={1.2} />
          </>
        )}
        {points.length > 0 && (
          (() => {
            const [x, y] = points[points.length - 1] ?? [PAD.l, PAD.t];
            return <circle cx={x} cy={y} r={1.6} fill={color} />;
          })()
        )}
      </svg>
    </div>
  );
}

export function HistorySparklines({ samples }: Props) {
  const batt = samples.map((s) => s.batt);
  const sig = samples.map((s) => s.signal);
  const alt = samples.map((s) => s.alt);
  const altMin = Math.min(...(alt.length ? alt : [0]));
  const altMax = Math.max(...(alt.length ? alt : [1000]));
  return (
    <div style={{ display: "flex", gap: "6px" }}>
      <Sparkline label="BATTERY" unit="%" color={COLORS.green} values={batt} min={0} max={100} />
      <Sparkline label="SIGNAL" unit="%" color={COLORS.blue} values={sig} min={0} max={100} />
      <Sparkline label="ALT (AGL)" unit="m" color={COLORS.amber} values={alt} min={Math.max(0, altMin - 50)} max={altMax + 50} />
    </div>
  );
}
