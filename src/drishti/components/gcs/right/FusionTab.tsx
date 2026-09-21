"use client";

import { COLORS, DRONE_COLORS } from "@/drishti/theme/colors";
import type { UAV } from "@/drishti/types/uav";
import type { Track } from "@/drishti/types/track";

const SECTORS = ["315°–045°", "045°–135°", "135°–225°", "225°–270°", "270°–315°"];

export function FusionTab({ uavs, tracks }: { uavs: UAV[]; tracks: Track[] }) {
  const activeCnt = uavs.filter((u) => u.status === "ACTIVE").length;
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "8px",
          padding: "5px 8px",
          background: COLORS.greenBg,
          border: `1px solid ${COLORS.bdMid}`,
        }}
      >
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: COLORS.green,
            boxShadow: `0 0 6px ${COLORS.green}`,
          }}
        />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: COLORS.green }}>
          CI FUSION: {activeCnt}-NODE CONSENSUS ACHIEVED
        </span>
      </div>

      <div style={{ marginBottom: "8px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "8px",
            color: COLORS.txtLo,
            letterSpacing: "0.1em",
            marginBottom: "4px",
          }}
        >
          SECTOR ALLOCATION
        </div>
        {uavs.map((u, i) => {
          const dc = DRONE_COLORS[i] ?? COLORS.green;
          return (
            <div
              key={u.id}
              style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}
            >
              <div style={{ width: "6px", height: "6px", background: dc, flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "8px",
                  color: dc,
                  width: "72px",
                }}
              >
                {u.callsign.replace("KESTREL-", "K")}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: COLORS.txtMid }}>
                {SECTORS[i] ?? "—"}
              </span>
              {u.status === "FAULT" && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "7px", color: COLORS.red }}>
                  [REALLOCATING]
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "8px",
          color: COLORS.txtLo,
          letterSpacing: "0.1em",
          marginBottom: "4px",
        }}
      >
        CI CONFIDENCE PER TRACK
      </div>
      {tracks.map((t) => {
        const conf = t.confidence;
        const col = conf > 0.85 ? COLORS.green : conf > 0.6 ? COLORS.amber : COLORS.red;
        return (
          <div key={t.id} style={{ marginBottom: "4px" }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}
            >
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: COLORS.txtHi }}>
                  {t.id}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "7px", color: col }}>
                  {t.type}
                </span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: col }}>
                {(conf * 100).toFixed(0)}%
              </span>
            </div>
            <div style={{ height: "3px", background: "#0a1810", border: `1px solid ${COLORS.bdDim}` }}>
              <div
                style={{
                  height: "100%",
                  width: `${conf * 100}%`,
                  background: col,
                  transition: "width 0.5s",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "3px", marginTop: "2px" }}>
              {uavs.map((u, i) => {
                const contributing = u.status === "ACTIVE" && u.radarOn;
                const dc = DRONE_COLORS[i] ?? COLORS.green;
                return (
                  <div
                    key={u.id}
                    style={{
                      width: "10px",
                      height: "4px",
                      background: contributing ? dc + "88" : COLORS.bdDim,
                      border: `1px solid ${contributing ? dc + "44" : COLORS.bdDim}`,
                    }}
                  />
                );
              })}
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "7px",
                  color: COLORS.txtLo,
                  marginLeft: "3px",
                }}
              >
                node contrib
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
