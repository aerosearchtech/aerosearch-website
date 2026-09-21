"use client";

import { useState } from "react";
import { COLORS } from "@/drishti/theme/colors";
import { MISSION_PRESETS, type MissionPreset } from "@/drishti/data/missionPresets";

interface Props {
  onLoad: (preset: MissionPreset) => void;
}

export function MissionLibrary({ onLoad }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          padding: "5px 12px",
          letterSpacing: "0.1em",
          background: COLORS.card,
          color: COLORS.txtMid,
          border: `1px solid ${COLORS.bdMid}`,
          cursor: "pointer",
        }}
      >
        📚 MISSION LIBRARY {open ? "▲" : "▼"}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "32px",
            left: 0,
            width: "360px",
            zIndex: 99,
            background: COLORS.panel,
            border: `1px solid ${COLORS.bdHi}`,
            boxShadow: "0 0 30px rgba(0,200,80,0.1)",
          }}
        >
          {MISSION_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onLoad(p);
                setOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                background: COLORS.card,
                border: "none",
                borderBottom: `1px solid ${COLORS.bdDim}`,
                cursor: "pointer",
              }}
            >
              <div style={{ fontFamily: "var(--font-cond)", fontSize: "12px", color: COLORS.green, letterSpacing: "0.1em", fontWeight: 700 }}>
                {p.name}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: COLORS.txtMid, marginTop: "3px", lineHeight: 1.4 }}>
                {p.blurb}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: COLORS.txtLo, marginTop: "3px" }}>
                FORMATION: {p.formation} · {p.waypoints.length} waypoint{p.waypoints.length === 1 ? "" : "s"}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
