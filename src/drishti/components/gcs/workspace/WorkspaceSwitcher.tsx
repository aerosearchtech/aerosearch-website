"use client";

import { COLORS } from "@/drishti/theme/colors";

type Workspace = "OBSERVE" | "MISSION" | "DRONE";

const TABS: { id: Workspace; label: string; sub: string }[] = [
  { id: "OBSERVE", label: "OBSERVATION", sub: "Live radar · tracks · threats" },
  { id: "MISSION", label: "MISSION CONTROL", sub: "Plan · waypoints · sectors" },
  { id: "DRONE", label: "DRONE OUTPUT", sub: "Telemetry · sensors · command" },
];

interface Props {
  workspace: Workspace;
  onChange: (w: Workspace) => void;
  // Selected drone callsign — shown when the DRONE tab is active
  selectedCallsign?: string | null;
}

export function WorkspaceSwitcher({ workspace, onChange, selectedCallsign }: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexShrink: 0,
        background: "#040a07",
        borderBottom: `1px solid ${COLORS.bdDim}`,
      }}
    >
      {TABS.map((t) => {
        const active = workspace === t.id;
        const label = t.id === "DRONE" && selectedCallsign ? `${t.label} · ${selectedCallsign}` : t.label;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              flex: 1,
              padding: "8px 16px",
              border: "none",
              background: active ? COLORS.greenBg : "transparent",
              color: active ? COLORS.green : COLORS.txtLo,
              cursor: "pointer",
              textAlign: "left",
              borderBottom: active ? `2px solid ${COLORS.green}` : "2px solid transparent",
              transition: "all 0.12s",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-cond)",
                fontWeight: 700,
                fontSize: "12px",
                letterSpacing: "0.16em",
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "8px",
                color: COLORS.txtLo,
                letterSpacing: "0.1em",
                marginTop: "1px",
              }}
            >
              {t.sub}
            </div>
          </button>
        );
      })}
    </div>
  );
}
