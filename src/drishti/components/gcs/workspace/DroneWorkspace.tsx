"use client";

import { useState } from "react";
import { COLORS, DRONE_COLORS } from "@/drishti/theme/colors";
import { RADAR } from "@/drishti/theme/constants";
import { AttGauge } from "../drone/AttGauge";
import { DroneCommandSection } from "../drone/DroneCommandSection";
import { SensorVideoTile } from "../drone/SensorVideoTile";
import { HistorySparklines, type HistorySample } from "../drone/HistorySparklines";
import type { UAV } from "@/drishti/types/uav";
import type { MainToWorker } from "@/drishti/sim/protocol";

interface Props {
  uav: UAV | null;
  idx: number;
  history: HistorySample[];
  zuluTime: string;
  send: (msg: MainToWorker) => void;
}

// Stable pseudo-random so static telemetry doesn't reshuffle each render.
function rng(n: number, seed: number): number {
  const x = Math.sin(n + seed) * 10000;
  return x - Math.floor(x);
}

export function DroneWorkspace({ uav, idx, history, zuluTime, send }: Props) {
  const [sensorMode, setSensorMode] = useState<"DAY" | "NIGHT">("NIGHT");

  if (!uav) {
    return (
      <div
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          background: COLORS.bg,
          color: COLORS.txtLo,
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          letterSpacing: "0.18em",
          padding: "40px",
          textAlign: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: "var(--font-cond)", fontSize: "24px", color: COLORS.txtMid, marginBottom: "8px" }}>
            DRONE OUTPUT
          </div>
          NO DRONE SELECTED
          <div style={{ marginTop: "12px", color: COLORS.txtLo, fontSize: "10px" }}>
            Click any KESTREL card in the left swarm panel to inspect it.
          </div>
        </div>
      </div>
    );
  }

  const dc = DRONE_COLORS[idx] ?? COLORS.green;
  const seed = uav.id * 137;
  const pitch = (rng(1, seed) - 0.5) * 4;
  const roll = (rng(2, seed) - 0.5) * 6;
  const yaw = rng(3, seed) * 360;
  const temp = 38 + rng(4, seed) * 12;
  const txPwr = RADAR.txPowerWMin + rng(5, seed) * (RADAR.txPowerWMax - RADAR.txPowerWMin);
  const prfHz = RADAR.prfHzMin + Math.round(rng(6, seed) * (RADAR.prfHzMax - RADAR.prfHzMin));

  const sysItems: [string, string, string][] = [
    ["IMU-1 (TDK)", "NOMINAL", COLORS.green],
    ["IMU-2 (TDK)", "NOMINAL", COLORS.green],
    ["IMU-3 (TDK)", "NOMINAL", COLORS.green],
    ["BARO (Bosch ×2)", "NOMINAL", COLORS.green],
    ["PX4 AUTOPILOT", "STABLE", COLORS.green],
    ["RADAR MODULE", uav.radarOn ? "TX ACTIVE" : "STANDBY", uav.radarOn ? COLORS.green : COLORS.amber],
    ["THERMAL", `${temp.toFixed(1)}°C`, temp < 55 ? COLORS.green : COLORS.amber],
    ["GNSS", uav.navMode, uav.navMode === "GPS" ? COLORS.green : COLORS.amber],
    ["FLIGHT CTL", "AeroMind 6X", COLORS.txtMid],
  ];

  const radarSpec: [string, string][] = [
    ["TYPE", "X-BAND FMCW"],
    ["FREQ", `${RADAR.freqGhzMin}–${RADAR.freqGhzMax} GHz`],
    ["BW", `${RADAR.bandwidthMHz} MHz`],
    ["RANGE RES", `${RADAR.rangeResolutionM} m`],
    ["AZ RES", "3°–5°"],
    ["TX POWER", `${txPwr.toFixed(0)} W`],
    ["PRF", `${prfHz} Hz`],
    ["LPI", "ENABLED"],
    ["ALGO", "GM-PHD FILTER"],
    ["FUSION", "COVARIANCE ∩"],
  ];

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        background: COLORS.bg,
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "8px 12px",
          background: COLORS.panel,
          border: `1px solid ${dc}`,
        }}
      >
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: dc,
            boxShadow: `0 0 8px ${dc}`,
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-cond)",
            fontWeight: 700,
            fontSize: "18px",
            color: dc,
            letterSpacing: "0.12em",
          }}
        >
          {uav.callsign}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: COLORS.txtMid }}>
          {uav.role}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: COLORS.txtLo }}>
          {uav.status}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: COLORS.txtLo, marginLeft: "auto" }}>
          PLATFORM: HYBRID VTOL · AEROMIND 6X · PX4
        </span>
      </div>

      {/* Row: Attitude + System Health */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <Card title="Attitude">
          <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "10px" }}>
            <AttGauge label="PITCH" value={pitch} unit="°" min={-10} max={10} color={dc} />
            <AttGauge label="ROLL" value={roll} unit="°" min={-15} max={15} color={dc} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: COLORS.txtLo, letterSpacing: "0.1em" }}>
                HEADING
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "22px",
                  color: dc,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                }}
              >
                {Math.round(yaw).toString().padStart(3, "0")}°
              </div>
            </div>
          </div>
          <Telemetry rows={[
            ["ALT (AGL)", `${Math.round(uav.pos.z)}m`],
            ["VELOCITY", `${(8 + Math.round(rng(7, seed) * 12))}m/s`],
            ["VRATE", `${((rng(8, seed) - 0.5) * 2).toFixed(1)}m/s`],
            ["BATTERY", `${Math.round(uav.battery)}%`],
            ["SIGNAL", `${Math.round(uav.signal)}%`],
          ]} />
        </Card>

        <Card title="System Health">
          {sysItems.map(([lbl, val, col]) => (
            <div
              key={lbl}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "3px 0",
                borderBottom: `1px solid ${COLORS.bdDim}`,
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: COLORS.txtLo }}>{lbl}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: col, boxShadow: `0 0 4px ${col}` }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: col, fontWeight: 600 }}>{val}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Sensor video — full width */}
      <Card
        title="Sensor Video Feed (EO/IR)"
        headerRight={
          <div style={{ display: "flex", gap: "1px" }}>
            {(["DAY", "NIGHT"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setSensorMode(m)}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "8px",
                  padding: "2px 8px",
                  letterSpacing: "0.1em",
                  background: sensorMode === m ? COLORS.greenBg : "transparent",
                  color: sensorMode === m ? COLORS.green : COLORS.txtLo,
                  border: `1px solid ${sensorMode === m ? COLORS.bdHi : COLORS.bdDim}`,
                  cursor: "pointer",
                }}
              >
                {m === "DAY" ? "☀ DAY" : "☾ NIGHT"}
              </button>
            ))}
          </div>
        }
      >
        <SensorVideoTile uav={uav} idx={idx} zuluTime={zuluTime} mode={sensorMode} />
      </Card>

      {/* History sparklines */}
      <Card title="History (last 3 min)">
        <HistorySparklines samples={history} />
      </Card>

      {/* Row: Radar payload + Power budget + Command */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <Card title="Radar Payload">
          {radarSpec.map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: COLORS.txtLo }}>{k}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: COLORS.txtHi, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </Card>

        <Card title="Power Budget">
          {(
            [
              ["PROPULSION", uav.battery * 0.6],
              ["RADAR", uav.battery * 0.3],
              ["COMMS", uav.battery * 0.1],
            ] as const
          ).map(([lbl, v]) => (
            <div key={lbl} style={{ marginBottom: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: COLORS.txtLo }}>{lbl}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: COLORS.green }}>{Math.round(v)}%</span>
              </div>
              <div style={{ height: "4px", background: "#0a1810", border: `1px solid ${COLORS.bdDim}`, marginTop: "2px" }}>
                <div style={{ height: "100%", width: `${v}%`, background: COLORS.green }} />
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Mission control */}
      <Card title="Mission Control" noPad>
        <DroneCommandSection uav={uav} send={send} />
      </Card>
    </div>
  );
}

function Card({ title, children, noPad, headerRight }: { title: string; children: React.ReactNode; noPad?: boolean; headerRight?: React.ReactNode }) {
  return (
    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.bdDim}` }}>
      <div
        style={{
          padding: "5px 12px",
          background: "#040a07",
          borderBottom: `1px solid ${COLORS.bdDim}`,
          fontFamily: "var(--font-cond)",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.18em",
          color: COLORS.txtLo,
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>{title}</span>
        {headerRight}
      </div>
      <div style={{ padding: noPad ? "0" : "10px 12px" }}>{children}</div>
    </div>
  );
}

function Telemetry({ rows }: { rows: [string, string][] }) {
  return (
    <div style={{ padding: "8px 10px", background: COLORS.card, border: `1px solid ${COLORS.bdDim}` }}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: COLORS.txtLo }}>{k}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: COLORS.txtHi, fontWeight: 600 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}
