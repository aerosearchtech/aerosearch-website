"use client";

import { useRef } from "react";
import { COLORS } from "@/drishti/theme/colors";
import type { Track } from "@/drishti/types/track";

interface Assessed extends Track {
  score: number;
  level: "HIGH" | "MEDIUM" | "LOW";
}

// EMA factor for the threat score itself. Stops sort-order thrash when raw
// scores are within noise of each other.
const SCORE_ALPHA = 0.08;
// Scores within QUANTIZE of each other are treated as tied for sort
// purposes (ID then breaks the tie). Stops visually-equal threats swapping.
const QUANTIZE = 0.05;

function rawScore(t: Track): number {
  const rcsScore = Math.min(1, t.rcs / 0.5);
  const spdScore = Math.min(1, t.speed / 40);
  const bearing = ((Math.atan2(t.x, t.y) * 180) / Math.PI + 360) % 360;
  const hdg = ((Math.atan2(-t.vx, -t.vy) * 180) / Math.PI + 360) % 360;
  const bearingDiff = Math.abs(((bearing - hdg + 540) % 360) - 180);
  const approachScore = Math.max(0, 1 - bearingDiff / 90);
  return rcsScore * 0.3 + spdScore * 0.3 + approachScore * 0.4;
}

function level(score: number): Assessed["level"] {
  return score > 0.65 ? "HIGH" : score > 0.35 ? "MEDIUM" : "LOW";
}

const COL: Record<Assessed["level"], string> = {
  HIGH: COLORS.red,
  MEDIUM: COLORS.amber,
  LOW: COLORS.txtMid,
};
const BG: Record<Assessed["level"], string> = {
  HIGH: COLORS.redBg,
  MEDIUM: COLORS.amberBg,
  LOW: "#040a07",
};
const BD: Record<Assessed["level"], string> = {
  HIGH: COLORS.redBd,
  MEDIUM: COLORS.amberBd,
  LOW: COLORS.bdDim,
};

export function ThreatPanel({ tracks }: { tracks: Track[] }) {
  // Persisted EMA-smoothed score per track id across renders.
  const scoreRef = useRef<Map<string, number>>(new Map());
  const assessed: Assessed[] = tracks.map((t) => {
    const raw = rawScore(t);
    const prev = scoreRef.current.get(t.id) ?? raw;
    const score = prev * (1 - SCORE_ALPHA) + raw * SCORE_ALPHA;
    scoreRef.current.set(t.id, score);
    return { ...t, score, level: level(score) };
  });
  // Drop scores for IDs that are no longer present
  for (const id of Array.from(scoreRef.current.keys())) {
    if (!tracks.find((t) => t.id === id)) scoreRef.current.delete(id);
  }
  // Sort by quantised score (so tiny ranking deltas don't flip order),
  // then by id for a deterministic tiebreaker.
  assessed.sort((a, b) => {
    const qa = Math.round(a.score / QUANTIZE);
    const qb = Math.round(b.score / QUANTIZE);
    return qb - qa || a.id.localeCompare(b.id);
  });
  return (
    <div style={{ padding: "4px 8px 8px" }}>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "8px",
          color: COLORS.txtLo,
          letterSpacing: "0.1em",
          marginBottom: "5px",
        }}
      >
        THREAT ASSESSMENT — IFF / PRIORITY
      </div>
      {assessed.map((t) => (
        <div
          key={t.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 6px",
            marginBottom: "3px",
            background: BG[t.level],
            border: `1px solid ${BD[t.level]}`,
          }}
        >
          <div style={{ width: "3px", alignSelf: "stretch", background: COL[t.level], flexShrink: 0 }} />
          <div style={{ width: "44px", flexShrink: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: COLORS.txtHi,
                fontWeight: 600,
              }}
            >
              {t.id}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "7px", color: COL[t.level] }}>
              {t.type}
            </div>
          </div>
          <div
            style={{
              padding: "1px 6px",
              fontFamily: "var(--font-mono)",
              fontSize: "8px",
              fontWeight: 700,
              color: COL[t.level],
              border: `1px solid ${BD[t.level]}`,
              background: "rgba(0,0,0,0.3)",
              flexShrink: 0,
            }}
          >
            {t.level}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "7px", color: COLORS.txtLo }}>
                {t.range.toFixed(1)}km / {Math.round(t.speed)}m/s
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "7px", color: COL[t.level] }}>
                {(t.score * 100).toFixed(0)}%
              </span>
            </div>
            <div style={{ height: "3px", background: "#0a1810", border: `1px solid ${COLORS.bdDim}` }}>
              <div
                style={{
                  height: "100%",
                  width: `${t.score * 100}%`,
                  background: COL[t.level],
                  transition: "width 0.5s",
                }}
              />
            </div>
          </div>
        </div>
      ))}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "6px",
          padding: "3px 4px",
          borderTop: `1px solid ${COLORS.bdDim}`,
        }}
      >
        {(["HIGH", "MEDIUM", "LOW"] as const).map((l) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "5px", height: "5px", background: COL[l] }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "7px", color: COLORS.txtLo }}>
              {l}: {l === "HIGH" ? "ENGAGE" : l === "MEDIUM" ? "MONITOR" : "CLUTTER"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
