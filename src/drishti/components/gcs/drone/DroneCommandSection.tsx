"use client";

import { useState } from "react";
import { COLORS } from "@/drishti/theme/colors";
import type { UAV } from "@/drishti/types/uav";
import type { MainToWorker } from "@/drishti/sim/protocol";

interface Props {
  uav: UAV;
  send: (msg: MainToWorker) => void;
}

export function DroneCommandSection({ uav, send }: Props) {
  const [wx, setWx] = useState("0");
  const [wy, setWy] = useState("0");
  const [wz, setWz] = useState(String(Math.round(uav.pos.z)));

  const applyWaypoint = () => {
    const x = Number.parseFloat(wx);
    const y = Number.parseFloat(wy);
    const z = Number.parseFloat(wz);
    if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) return;
    send({ kind: "SET_MANUAL_WAYPOINT", droneId: uav.id, waypoint: { x, y, z } });
  };

  return (
    <div
      style={{
        padding: "10px 14px",
        background: "#040a07",
        borderTop: `1px solid ${COLORS.bdDim}`,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "var(--font-cond)",
            fontSize: "10px",
            fontWeight: 700,
            color: COLORS.txtLo,
            letterSpacing: "0.15em",
            marginBottom: "6px",
          }}
        >
          MISSION CONTROL
        </div>
        <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
          {(["AUTO", "MANUAL"] as const).map((m) => (
            <button
              key={m}
              onClick={() => send({ kind: "SET_CONTROL_MODE", droneId: uav.id, mode: m })}
              style={{
                flex: 1,
                fontFamily: "var(--font-mono)",
                fontSize: "8px",
                padding: "5px 4px",
                letterSpacing: "0.1em",
                background: uav.controlMode === m ? COLORS.greenBg : COLORS.card,
                color: uav.controlMode === m ? COLORS.green : COLORS.txtLo,
                border: `1px solid ${uav.controlMode === m ? COLORS.bdHi : COLORS.bdDim}`,
                cursor: "pointer",
              }}
            >
              {m}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
          <button
            onClick={() => send({ kind: "RTH_DRONE", droneId: uav.id })}
            disabled={uav.status === "RTH" || uav.status === "FAULT"}
            style={{
              flex: 1,
              fontFamily: "var(--font-mono)",
              fontSize: "8px",
              padding: "5px 4px",
              letterSpacing: "0.1em",
              background: COLORS.amberBg,
              color: COLORS.amber,
              border: `1px solid ${COLORS.amberBd}`,
              cursor: "pointer",
              opacity: uav.status === "RTH" || uav.status === "FAULT" ? 0.4 : 1,
            }}
          >
            ⚠ RTH THIS DRONE
          </button>
          <button
            onClick={() => send({ kind: "SET_DRONE_RADAR", droneId: uav.id, on: !uav.radarOn })}
            disabled={uav.status === "FAULT"}
            style={{
              flex: 1,
              fontFamily: "var(--font-mono)",
              fontSize: "8px",
              padding: "5px 4px",
              letterSpacing: "0.1em",
              background: uav.radarOn ? COLORS.greenBg : COLORS.card,
              color: uav.radarOn ? COLORS.green : COLORS.txtLo,
              border: `1px solid ${uav.radarOn ? COLORS.bdHi : COLORS.bdDim}`,
              cursor: "pointer",
              opacity: uav.status === "FAULT" ? 0.4 : 1,
            }}
          >
            {uav.radarOn ? "● RADAR ON" : "○ RADAR OFF"}
          </button>
        </div>
      </div>

      <div>
        <div
          style={{
            fontFamily: "var(--font-cond)",
            fontSize: "10px",
            fontWeight: 700,
            color: COLORS.txtLo,
            letterSpacing: "0.15em",
            marginBottom: "6px",
          }}
        >
          MANUAL WAYPOINT
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 8px", alignItems: "center" }}>
          {(
            [
              ["X (m E)", wx, setWx],
              ["Y (m N)", wy, setWy],
              ["Z (m AGL)", wz, setWz],
            ] as const
          ).map(([lbl, val, setVal]) => (
            <Row key={lbl} label={lbl} value={val} onChange={setVal} />
          ))}
        </div>
        <button
          onClick={applyWaypoint}
          disabled={uav.status === "FAULT"}
          style={{
            marginTop: "6px",
            width: "100%",
            fontFamily: "var(--font-mono)",
            fontSize: "8px",
            padding: "5px 4px",
            letterSpacing: "0.1em",
            background: COLORS.greenBg,
            color: COLORS.green,
            border: `1px solid ${COLORS.bdHi}`,
            cursor: "pointer",
            opacity: uav.status === "FAULT" ? 0.4 : 1,
          }}
        >
          ▶ APPLY WAYPOINT
        </button>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: COLORS.txtLo }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          padding: "2px 6px",
          background: COLORS.bg,
          color: COLORS.txtHi,
          border: `1px solid ${COLORS.bdMid}`,
          outline: "none",
        }}
      />
    </>
  );
}
