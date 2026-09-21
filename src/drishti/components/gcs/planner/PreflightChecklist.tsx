"use client";

import { COLORS, DRONE_COLORS } from "@/drishti/theme/colors";
import type { UAV } from "@/drishti/types/uav";

interface Check {
  label: string;
  pass: (uav: UAV) => boolean;
  value: (uav: UAV) => string;
}

const CHECKS: Check[] = [
  { label: "IMU", pass: () => true, value: () => "OK" },
  { label: "BARO", pass: () => true, value: () => "OK" },
  { label: "GNSS", pass: (u) => u.navMode === "GPS", value: (u) => u.navMode },
  { label: "RADAR", pass: (u) => u.radarOn, value: (u) => (u.radarOn ? "ON" : "OFF") },
  { label: "COMMS", pass: (u) => u.signal >= 50, value: (u) => `${Math.round(u.signal)}%` },
  { label: "BATT", pass: (u) => u.battery >= 50, value: (u) => `${Math.round(u.battery)}%` },
];

// Computes pre-flight readiness for the whole swarm.
// Returns true iff every active drone passes every check.
export function isSwarmReady(uavs: UAV[]): boolean {
  const eligible = uavs.filter((u) => u.status === "ACTIVE" || u.status === "STANDBY");
  if (eligible.length === 0) return false;
  return eligible.every((u) => CHECKS.every((c) => c.pass(u)));
}

export function PreflightChecklist({ uavs }: { uavs: UAV[] }) {
  const allReady = isSwarmReady(uavs);
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `90px repeat(${CHECKS.length}, 1fr) 60px`,
          gap: "4px",
          padding: "4px 6px",
          borderBottom: `1px solid ${COLORS.bdMid}`,
          fontFamily: "var(--font-mono)",
          fontSize: "8px",
          color: COLORS.txtLo,
          letterSpacing: "0.1em",
        }}
      >
        <span>DRONE</span>
        {CHECKS.map((c) => (
          <span key={c.label} style={{ textAlign: "center" }}>{c.label}</span>
        ))}
        <span style={{ textAlign: "right" }}>READY</span>
      </div>
      {uavs.map((u, i) => {
        const dc = DRONE_COLORS[i] ?? COLORS.green;
        const checks = CHECKS.map((c) => ({ pass: c.pass(u), value: c.value(u) }));
        const ready = checks.every((c) => c.pass) && (u.status === "ACTIVE" || u.status === "STANDBY");
        const fault = u.status === "FAULT";
        return (
          <div
            key={u.id}
            style={{
              display: "grid",
              gridTemplateColumns: `90px repeat(${CHECKS.length}, 1fr) 60px`,
              gap: "4px",
              padding: "4px 6px",
              alignItems: "center",
              borderBottom: `1px solid ${COLORS.bdDim}`,
              opacity: fault ? 0.5 : 1,
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: dc, fontWeight: 600 }}>
              {u.callsign}
            </span>
            {checks.map((c, k) => (
              <span
                key={k}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  textAlign: "center",
                  color: fault ? COLORS.txtLo : c.pass ? COLORS.green : COLORS.amber,
                  fontWeight: 600,
                }}
              >
                {fault ? "—" : c.value}
              </span>
            ))}
            <span
              style={{
                textAlign: "right",
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                fontWeight: 700,
                color: fault ? COLORS.red : ready ? COLORS.green : COLORS.amber,
              }}
            >
              {fault ? "FAULT" : ready ? "✓ GO" : "✗ HOLD"}
            </span>
          </div>
        );
      })}
      <div
        style={{
          padding: "5px 8px",
          borderTop: `1px solid ${COLORS.bdMid}`,
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: allReady ? COLORS.green : COLORS.amber,
          letterSpacing: "0.1em",
          fontWeight: 700,
        }}
      >
        {allReady ? "● SWARM READY FOR LAUNCH" : "○ SWARM NOT READY — RESOLVE HOLDS"}
      </div>
    </div>
  );
}
