"use client";

import { COLORS } from "@/drishti/theme/colors";
import { SBadge } from "../primitives/SBadge";
import type { Track } from "@/drishti/types/track";

interface RowProps {
  t: Track;
  flash: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
}

function TrkRow({ t, flash, selected, onSelect }: RowProps) {
  const tc = t.type === "DRONE" ? COLORS.red : t.type === "BIRD" ? COLORS.amber : COLORS.txtMid;
  return (
    <div
      onClick={() => onSelect(t.id)}
      style={{
        display: "grid",
        gridTemplateColumns: "46px 42px 44px 44px 42px 38px 46px",
        gap: "2px",
        alignItems: "center",
        padding: "4px 4px",
        cursor: "pointer",
        background: selected ? COLORS.greenBg : flash ? "#1a0a0a" : COLORS.card,
        borderBottom: `1px solid ${COLORS.bdDim}`,
        borderLeft: `2px solid ${tc}`,
        marginBottom: "1px",
        transition: "background 0.2s",
      }}
    >
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: COLORS.txtHi, fontWeight: 600 }}>
        {t.id}
      </span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: tc, fontWeight: 700 }}>
        {t.type}
      </span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: COLORS.txtMid, textAlign: "right" }}>
        {t.range.toFixed(1)}
        <span style={{ fontSize: "7px", color: COLORS.txtLo }}>km</span>
      </span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: COLORS.txtMid, textAlign: "right" }}>
        {Math.round(t.azimuth)}
        <span style={{ fontSize: "7px", color: COLORS.txtLo }}>°</span>
      </span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: COLORS.txtMid, textAlign: "right" }}>
        {Math.round(t.speed)}
        <span style={{ fontSize: "7px", color: COLORS.txtLo }}>m/s</span>
      </span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: COLORS.txtMid, textAlign: "right" }}>
        {t.rcs.toFixed(2)}
      </span>
      <SBadge s={t.state} />
    </div>
  );
}

interface Props {
  tracks: Track[];
  flashIds: Record<string, boolean>;
  selectedTrackId: string | null;
  onSelect: (id: string) => void;
}

const HEADERS = ["TRK", "TYPE", "RNG", "AZ", "VEL", "RCS", "STATE"];

export function TracksTab({ tracks, flashIds, selectedTrackId, onSelect }: Props) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "6px 6px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "46px 42px 44px 44px 42px 38px 46px",
          gap: "2px",
          padding: "2px 4px 5px",
          borderBottom: `1px solid ${COLORS.bdMid}`,
          marginBottom: "3px",
        }}
      >
        {HEADERS.map((h) => (
          <span
            key={h}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "7px",
              color: COLORS.txtLo,
              letterSpacing: "0.08em",
            }}
          >
            {h}
          </span>
        ))}
      </div>
      {tracks.length === 0 ? (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: COLORS.txtLo,
            textAlign: "center",
            padding: "20px 0",
          }}
        >
          NO TRACKS
        </div>
      ) : (
        tracks.map((t) => (
          <TrkRow
            key={t.id}
            t={t}
            flash={!!flashIds[t.id]}
            selected={selectedTrackId === t.id}
            onSelect={onSelect}
          />
        ))
      )}
    </div>
  );
}
