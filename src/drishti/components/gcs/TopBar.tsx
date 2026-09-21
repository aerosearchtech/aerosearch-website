"use client";

import { COLORS } from "@/drishti/theme/colors";
import { DrishtiLogo } from "./DrishtiLogo";

interface Props {
  missionTimeSec: number;
  radarOn: boolean;
  mode: string;
  trackCount: number;
  zuluTime: string;
}

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export function TopBar({ missionTimeSec, radarOn, mode, trackCount, zuluTime }: Props) {
  const sysItems: [string, boolean, string][] = [
    ["ASP FEED", trackCount > 0, trackCount > 0 ? "LIVE" : "NO DATA"],
    ["RADAR TX", radarOn, radarOn ? "EMITTING" : "SILENT"],
    ["FUSION", true, "CI ACTIVE"],
    ["RECORD", true, "REC"],
  ];

  return (
    <div
      style={{
        gridColumn: "1 / -1",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 14px",
        background: "#040a07",
        borderBottom: `1px solid ${COLORS.bdDim}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <DrishtiLogo />
        <div>
          <div
            style={{
              fontFamily: "var(--font-cond)",
              fontWeight: 700,
              fontSize: "18px",
              letterSpacing: "0.12em",
              color: COLORS.txtHi,
              lineHeight: 1,
            }}
          >
            DRISHTI-SWARM
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "8px",
              color: COLORS.txtLo,
              letterSpacing: "0.14em",
              marginTop: "1px",
              whiteSpace: "nowrap",
            }}
          >
            DISTRIBUTED RADAR INTELLIGENCE SWARM FOR HOSTILE TARGET IDENTIFICATION
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: "#1a0000",
            border: "1px solid #3a0000",
            padding: "2px 8px",
          }}
        >
          <div
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: COLORS.red,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-cond)",
              fontWeight: 700,
              fontSize: "10px",
              letterSpacing: "0.2em",
              color: COLORS.red,
            }}
          >
            RESTRICTED
          </span>
        </div>
        <div
          style={{
            background: COLORS.greenBg,
            border: `1px solid ${COLORS.bdHi}`,
            padding: "3px 12px",
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: COLORS.green,
            letterSpacing: "0.08em",
          }}
        >
          {mode}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          paddingLeft: "16px",
          borderLeft: `1px solid ${COLORS.bdDim}`,
        }}
      >
        {sysItems.map(([lbl, ok, val]) => (
          <div key={lbl} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div
              className={ok ? "animate-radar-pulse" : ""}
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: ok ? COLORS.green : COLORS.red,
                boxShadow: ok ? `0 0 5px ${COLORS.green}99` : `0 0 5px ${COLORS.red}99`,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: ok ? COLORS.txtMid : COLORS.red,
                letterSpacing: "0.06em",
              }}
            >
              {val}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "18px",
          paddingLeft: "16px",
          borderLeft: `1px solid ${COLORS.bdDim}`,
        }}
      >
        <button
          style={{
            background: COLORS.greenBg,
            border: `1px solid ${COLORS.bdHi}`,
            padding: "5px 12px",
            fontFamily: "var(--font-cond)",
            fontWeight: 700,
            fontSize: "10px",
            letterSpacing: "0.1em",
            color: COLORS.green,
            cursor: "pointer",
          }}
        >
          MISSION REPORT
        </button>
        <div style={{ width: "1px", height: "28px", background: COLORS.bdDim }} />
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              color: COLORS.txtLo,
              letterSpacing: "0.12em",
            }}
          >
            MISSION TIME
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "14px",
              fontWeight: 600,
              color: COLORS.green,
              letterSpacing: "0.08em",
            }}
          >
            {fmt(missionTimeSec)}
          </div>
        </div>
        <div style={{ width: "1px", height: "28px", background: COLORS.bdDim }} />
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              color: COLORS.txtLo,
              letterSpacing: "0.12em",
            }}
          >
            ZULU
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "14px",
              fontWeight: 600,
              color: COLORS.txtHi,
              letterSpacing: "0.04em",
            }}
          >
            {zuluTime}
          </div>
        </div>
      </div>
    </div>
  );
}
