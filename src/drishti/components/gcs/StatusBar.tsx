"use client";

import { COLORS } from "@/drishti/theme/colors";
import type { UAV } from "@/drishti/types/uav";

interface Props {
  uavs: UAV[];
  radarTimeSec: number;
  revisitSec: number;
  latencyMs: number;
  gnssCount: number; // drones with GPS lock
  windKt: number;
  swarmMoving: boolean;
  swarmSpd: number;
}

const fmtT = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export function StatusBar({
  uavs,
  radarTimeSec,
  revisitSec,
  latencyMs,
  gnssCount,
  windKt,
  swarmMoving,
  swarmSpd,
}: Props) {
  const activeCnt = uavs.filter((u) => u.status === "ACTIVE").length;
  const avgBatt = Math.round(uavs.reduce((a, u) => a + u.battery, 0) / uavs.length);
  const radarCnt = uavs.filter((u) => u.radarOn).length;

  const cells: { label: string; value: string; col: string }[] = [
    {
      label: "NODES",
      value: `${activeCnt}/5 ACTIVE`,
      col: activeCnt === 5 ? COLORS.green : activeCnt >= 3 ? COLORS.amber : COLORS.red,
    },
    { label: "RADAR TX", value: `${radarCnt} NODES / ${fmtT(radarTimeSec)}`, col: COLORS.green },
    {
      label: "AVG BATT",
      value: `${avgBatt}%`,
      col: avgBatt > 40 ? COLORS.green : avgBatt > 20 ? COLORS.amber : COLORS.red,
    },
    {
      label: "REVISIT",
      value: `${revisitSec.toFixed(1)}s`,
      col: revisitSec < 10 ? COLORS.green : COLORS.amber,
    },
    { label: "MANET", value: `${latencyMs}ms / OLSR`, col: COLORS.green },
    {
      label: "GNSS",
      value: gnssCount === 5 ? "5/5 LOCK" : gnssCount > 2 ? `${gnssCount}/5 PART` : "JAMMED",
      col: gnssCount === 5 ? COLORS.green : gnssCount > 2 ? COLORS.amber : COLORS.red,
    },
    {
      label: "BK-LINK",
      value: gnssCount === 0 ? "SATCOM ACTV" : "STBY",
      col: gnssCount === 0 ? COLORS.blue : COLORS.amber,
    },
    {
      label: "MODE",
      value: swarmMoving ? `MOVING ${swarmSpd}m/s` : "STATIC HOVER",
      col: swarmMoving ? COLORS.green : COLORS.txtMid,
    },
    { label: "WIND", value: `${windKt}kt`, col: windKt < 10 ? COLORS.green : COLORS.amber },
  ];

  return (
    <div
      style={{
        gridColumn: "1 / -1",
        display: "flex",
        alignItems: "center",
        background: "#040a07",
        borderTop: `1px solid ${COLORS.bdDim}`,
        overflow: "hidden",
      }}
    >
      {cells.map(({ label, value, col }) => (
        <div
          key={label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "0 14px",
            height: "100%",
            borderRight: `1px solid ${COLORS.bdDim}`,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              fontSize: "8px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: COLORS.txtLo,
            }}
          >
            {label}
          </span>
          <span style={{ fontSize: "11px", fontWeight: 600, color: col }}>{value}</span>
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <div
        style={{
          padding: "0 14px",
          height: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "8px",
            color: COLORS.txtLo,
            letterSpacing: "0.1em",
          }}
        >
          MBC-3 © Aerosearch Tech 2026
        </span>
      </div>
    </div>
  );
}
