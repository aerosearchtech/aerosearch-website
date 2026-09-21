"use client";

import { COLORS, DRONE_COLORS } from "@/drishti/theme/colors";
import { BATTERY, SWARM } from "@/drishti/theme/constants";
import type { UAV } from "@/drishti/types/uav";
import type { Vec3 } from "@/drishti/types/uav";

const BASE: Vec3 = { x: SWARM.baseRel.x, y: SWARM.baseRel.y, z: 0 };

function dist2D(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

interface Props {
  uavs: UAV[];
}

export function ResourceBudget({ uavs }: Props) {
  // Naive but believable: time-to-empty = battery% / drain%; time-to-RTH = distance/cruise.
  const drainPctSec =
    BATTERY.drainPropulsionPctSec + BATTERY.drainRadarPctSec + BATTERY.drainCommsPctSec; // approx total
  const cruiseMs = 20;
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "90px 1fr 80px 80px 80px",
          gap: "6px",
          padding: "4px 6px",
          borderBottom: `1px solid ${COLORS.bdMid}`,
          fontFamily: "var(--font-mono)",
          fontSize: "8px",
          color: COLORS.txtLo,
          letterSpacing: "0.1em",
        }}
      >
        <span>DRONE</span>
        <span>BATTERY</span>
        <span style={{ textAlign: "right" }}>ENDURANCE</span>
        <span style={{ textAlign: "right" }}>TO-RTH</span>
        <span style={{ textAlign: "right" }}>VERDICT</span>
      </div>
      {uavs.map((u, i) => {
        const dc = DRONE_COLORS[i] ?? COLORS.green;
        const enduranceSec = u.battery / drainPctSec;
        const distToBase = dist2D(u.pos, BASE);
        const rthSec = distToBase / cruiseMs;
        const reserve = enduranceSec - rthSec;
        const ok = reserve > 30 && u.status !== "FAULT";
        const marginal = reserve > 0 && reserve <= 30;
        const verdict = u.status === "FAULT" ? "FAULT" : ok ? "OK" : marginal ? "TIGHT" : "INSUFFICIENT";
        const verdictCol = u.status === "FAULT" ? COLORS.red : ok ? COLORS.green : marginal ? COLORS.amber : COLORS.red;
        return (
          <div
            key={u.id}
            style={{
              display: "grid",
              gridTemplateColumns: "90px 1fr 80px 80px 80px",
              gap: "6px",
              padding: "4px 6px",
              alignItems: "center",
              borderBottom: `1px solid ${COLORS.bdDim}`,
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: dc, fontWeight: 600 }}>
              {u.callsign}
            </span>
            <div style={{ height: "8px", background: "#0a1810", border: `1px solid ${COLORS.bdDim}`, position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${u.battery}%`,
                  background: u.battery > 40 ? COLORS.green : u.battery > 20 ? COLORS.amber : COLORS.red,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: `${BATTERY.rthThresholdPct}%`,
                  top: -2,
                  bottom: -2,
                  width: 0,
                  borderLeft: `1px dashed ${COLORS.amber}`,
                }}
              />
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: COLORS.txtMid, textAlign: "right" }}>
              {Math.round(enduranceSec / 60)}m {Math.round(enduranceSec % 60)}s
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: COLORS.txtMid, textAlign: "right" }}>
              {Math.round(rthSec / 60)}m {Math.round(rthSec % 60)}s
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: verdictCol,
                fontWeight: 700,
                textAlign: "right",
              }}
            >
              {verdict}
            </span>
          </div>
        );
      })}
    </div>
  );
}
