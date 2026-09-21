"use client";

import { COLORS } from "@/drishti/theme/colors";
import type { Track } from "@/drishti/types/track";
import type { UAV } from "@/drishti/types/uav";
import type { Alert } from "@/drishti/types/alert";

interface Props {
  tracks: Track[];
  uavs: UAV[];
  alerts: Alert[];
}

export function ASPSummary({ tracks, uavs, alerts }: Props) {
  const activeCnt = uavs.filter((u) => u.status === "ACTIVE").length;
  const topThreat = [...tracks].sort((a, b) => {
    const score = (t: Track) => (t.rcs / 0.5) * 0.3 + (t.speed / 40) * 0.3 + 0.4;
    return score(b) - score(a);
  })[0];
  const counts: [string, number, string][] = [
    ["TOTAL", tracks.length, COLORS.txtHi],
    ["DRONE", tracks.filter((t) => t.type === "DRONE").length, COLORS.red],
    ["BIRD", tracks.filter((t) => t.type === "BIRD").length, COLORS.amber],
    ["UNK", tracks.filter((t) => t.type === "UNK").length, COLORS.txtMid],
  ];
  const lastAlert = alerts[alerts.length - 1];

  return (
    <div style={{ flexShrink: 0, borderTop: `1px solid ${COLORS.bdMid}`, background: "#040a07" }}>
      <div
        style={{
          padding: "4px 10px 3px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${COLORS.bdDim}`,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-cond)",
            fontWeight: 700,
            fontSize: "9px",
            color: COLORS.txtLo,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          ASP Summary
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: COLORS.green }}>
          LIVE
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          borderBottom: `1px solid ${COLORS.bdDim}`,
        }}
      >
        {counts.map(([lbl, cnt, col]) => (
          <div
            key={lbl}
            style={{
              padding: "4px 6px",
              borderRight: `1px solid ${COLORS.bdDim}`,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "16px",
                fontWeight: 700,
                color: col,
                lineHeight: 1,
              }}
            >
              {cnt}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "7px",
                color: COLORS.txtLo,
                letterSpacing: "0.1em",
                marginTop: "1px",
              }}
            >
              {lbl}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ padding: "4px 8px", borderRight: `1px solid ${COLORS.bdDim}` }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "7px",
              color: COLORS.txtLo,
              letterSpacing: "0.1em",
              marginBottom: "2px",
            }}
          >
            TOP THREAT
          </div>
          {topThreat ? (
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "5px", height: "5px", background: COLORS.red, flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: COLORS.red,
                  fontWeight: 600,
                }}
              >
                {topThreat.id}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: COLORS.txtMid }}>
                {topThreat.type} @ {topThreat.range.toFixed(1)}km
              </span>
            </div>
          ) : (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: COLORS.txtLo }}>
              NONE
            </span>
          )}
        </div>
        <div style={{ padding: "4px 8px" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "7px",
              color: COLORS.txtLo,
              letterSpacing: "0.1em",
              marginBottom: "2px",
            }}
          >
            CI FUSION
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: activeCnt >= 3 ? COLORS.green : COLORS.amber,
                boxShadow: `0 0 4px ${activeCnt >= 3 ? COLORS.green : COLORS.amber}`,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: activeCnt >= 3 ? COLORS.green : COLORS.amber,
                fontWeight: 600,
              }}
            >
              {activeCnt >= 3 ? "CONVERGED" : "DEGRADED"}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: COLORS.txtLo }}>
              {activeCnt}/5 NODE
            </span>
          </div>
        </div>
      </div>
      {lastAlert && (
        <div
          style={{
            padding: "3px 8px",
            borderTop: `1px solid ${COLORS.bdDim}`,
            display: "flex",
            gap: "6px",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "7px",
              color: COLORS.txtLo,
              flexShrink: 0,
            }}
          >
            {lastAlert.time}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "8px",
              color: COLORS.txtMid,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {lastAlert.msg}
          </span>
        </div>
      )}
    </div>
  );
}
