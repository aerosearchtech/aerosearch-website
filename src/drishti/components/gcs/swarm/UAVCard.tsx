"use client";

import { COLORS, DRONE_COLORS } from "@/drishti/theme/colors";
import { SBadge } from "../primitives/SBadge";
import { SigBars } from "../primitives/SigBars";
import { BattBar } from "../primitives/BattBar";
import type { UAV } from "@/drishti/types/uav";

interface Props {
  uav: UAV;
  idx: number;
  selected: boolean;
  onClick: (id: number) => void;
  onFault: (id: number) => void;
  onRTH: (id: number) => void;
}

export function UAVCard({ uav, idx, selected, onClick, onFault, onRTH }: Props) {
  const dc = DRONE_COLORS[idx] ?? COLORS.green;
  const bord =
    uav.status === "ACTIVE"
      ? dc
      : uav.status === "FAULT"
        ? COLORS.red
        : uav.status === "RTH"
          ? COLORS.amber
          : COLORS.blue;

  return (
    <div
      style={{
        padding: "4px 7px",
        marginBottom: "2px",
        cursor: "pointer",
        background: selected ? "#0a1810" : COLORS.card,
        borderTop: `1px solid ${selected ? COLORS.bdHi : COLORS.bdDim}`,
        borderRight: `1px solid ${selected ? COLORS.bdHi : COLORS.bdDim}`,
        borderBottom: `1px solid ${selected ? COLORS.bdHi : COLORS.bdDim}`,
        borderLeft: `3px solid ${bord}`,
        transition: "all 0.12s",
      }}
      onClick={() => onClick(uav.id)}
    >
      {/* Row 1 — callsign · ACTIVE · FAULT-inject */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2px",
          gap: "6px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            fontWeight: 600,
            color: dc,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
          }}
        >
          {uav.callsign}
        </span>
        <div style={{ display: "flex", gap: "4px", alignItems: "center", flexShrink: 0 }}>
          {uav.controlMode === "MANUAL" && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "7px",
                padding: "1px 4px",
                background: COLORS.amberBg,
                color: COLORS.amber,
                border: `1px solid ${COLORS.amberBd}`,
              }}
            >
              MAN
            </span>
          )}
          <SBadge s={uav.status} />
          {uav.status !== "FAULT" && uav.status !== "RTH" && uav.status !== "RECOVERING" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRTH(uav.id);
              }}
              title="Return this drone to base"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "6px",
                padding: "1px 3px",
                cursor: "pointer",
                background: "transparent",
                color: COLORS.amber,
                border: `1px solid ${COLORS.amberBd}`,
                letterSpacing: "0.08em",
              }}
            >
              RTH
            </button>
          )}
          {uav.status !== "FAULT" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFault(uav.id);
              }}
              title="Inject a hard fault (for demo)"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "6px",
                padding: "1px 3px",
                cursor: "pointer",
                background: "transparent",
                color: COLORS.red,
                border: `1px solid ${COLORS.redBd}`,
                letterSpacing: "0.08em",
              }}
            >
              FAULT
            </button>
          )}
        </div>
      </div>

      {/* Row 2 — ALT · NAV · ROLE inline */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "8px",
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          marginBottom: "2px",
          color: COLORS.txtMid,
        }}
      >
        <span>{Math.round(uav.pos.z)}m</span>
        <span style={{ color: uav.navMode === "GPS" ? COLORS.green : COLORS.amber }}>
          {uav.navMode}
        </span>
        <span style={{ color: COLORS.txtLo }}>{uav.role}</span>
      </div>

      {/* Row 3 — radar status · signal bars */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "3px",
          gap: "6px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            color: uav.radarOn ? COLORS.green : "#2a4030",
            letterSpacing: "0.04em",
          }}
        >
          {uav.radarOn ? "● RADAR ON" : "○ RADAR OFF"}
        </span>
        <SigBars v={uav.signal} />
      </div>

      {/* Row 4 — battery bar */}
      <BattBar v={uav.battery} />
    </div>
  );
}
