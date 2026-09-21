"use client";

import { COLORS, DRONE_COLORS } from "@/drishti/theme/colors";
import { RADAR } from "@/drishti/theme/constants";
import { AttGauge } from "./AttGauge";
import { DroneCommandSection } from "./DroneCommandSection";
import type { UAV } from "@/drishti/types/uav";
import type { MainToWorker } from "@/drishti/sim/protocol";

interface Props {
  uav: UAV;
  idx: number;
  send: (msg: MainToWorker) => void;
  onClose: () => void;
}

// Pseudo-random but stable telemetry seeded by drone id.
function makeSeed(id: number) {
  return id * 137;
}
function rng(n: number, seed: number) {
  const x = Math.sin(n + seed) * 10000;
  return x - Math.floor(x);
}

export function DroneDetailModal({ uav, idx, send, onClose }: Props) {
  const dc = DRONE_COLORS[idx] ?? COLORS.green;
  const seed = makeSeed(uav.id);
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
    ["BARO-1 (Bosch)", "NOMINAL", COLORS.green],
    ["BARO-2 (Bosch)", "NOMINAL", COLORS.green],
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
    ["TX POWER", `${txPwr.toFixed(0)}W`],
    ["PRF", `${prfHz} Hz`],
    ["LPI", "ENABLED"],
    ["ALGO", "GM-PHD FILTER"],
    ["FUSION", "COVARIANCE ∩"],
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(2,6,3,0.88)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLORS.panel,
          border: `1px solid ${dc}`,
          width: "680px",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: `0 0 40px ${dc}22`,
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#040a07",
            borderBottom: `1px solid ${COLORS.bdDim}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: dc,
                boxShadow: `0 0 8px ${dc}`,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-cond)",
                fontWeight: 700,
                fontSize: "16px",
                color: dc,
                letterSpacing: "0.1em",
              }}
            >
              {uav.callsign}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: COLORS.txtLo,
                letterSpacing: "0.12em",
              }}
            >
              TELEMETRY — DETAIL VIEW
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: COLORS.txtLo,
              fontSize: "14px",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
            }}
          >
            ✕ CLOSE
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "1px",
            background: COLORS.bdDim,
          }}
        >
          <div style={{ background: COLORS.panel, padding: "12px" }}>
            <div
              style={{
                fontFamily: "var(--font-cond)",
                fontSize: "11px",
                fontWeight: 700,
                color: COLORS.txtLo,
                letterSpacing: "0.15em",
                marginBottom: "10px",
              }}
            >
              ATTITUDE
            </div>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <AttGauge label="PITCH" value={pitch} unit="°" min={-10} max={10} color={dc} />
              <AttGauge label="ROLL" value={roll} unit="°" min={-15} max={15} color={dc} />
            </div>
            <div style={{ textAlign: "center", marginTop: "8px" }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "8px",
                  color: COLORS.txtLo,
                  letterSpacing: "0.1em",
                }}
              >
                HEADING
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "20px",
                  color: dc,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                }}
              >
                {Math.round(yaw).toString().padStart(3, "0")}°
              </div>
            </div>
            <div
              style={{
                marginTop: "8px",
                padding: "6px 8px",
                background: COLORS.card,
                border: `1px solid ${COLORS.bdDim}`,
              }}
            >
              {(
                [
                  ["ALT (AGL)", `${Math.round(uav.pos.z)}m`],
                  ["VELOCITY", `${(8 + Math.round(rng(7, seed) * 12))}m/s`],
                  ["VRATE", `${((rng(8, seed) - 0.5) * 2).toFixed(1)}m/s`],
                ] as const
              ).map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "2px",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: COLORS.txtLo }}>
                    {k}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      color: COLORS.txtHi,
                      fontWeight: 600,
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: COLORS.panel, padding: "12px" }}>
            <div
              style={{
                fontFamily: "var(--font-cond)",
                fontSize: "11px",
                fontWeight: 700,
                color: COLORS.txtLo,
                letterSpacing: "0.15em",
                marginBottom: "10px",
              }}
            >
              SYSTEM HEALTH
            </div>
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
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: COLORS.txtLo }}>
                  {lbl}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: col,
                      boxShadow: `0 0 4px ${col}`,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "8px",
                      color: col,
                      fontWeight: 600,
                    }}
                  >
                    {val}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: COLORS.panel, padding: "12px" }}>
            <div
              style={{
                fontFamily: "var(--font-cond)",
                fontSize: "11px",
                fontWeight: 700,
                color: COLORS.txtLo,
                letterSpacing: "0.15em",
                marginBottom: "10px",
              }}
            >
              RADAR PAYLOAD
            </div>
            {radarSpec.map(([k, v]) => (
              <div
                key={k}
                style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: COLORS.txtLo }}>
                  {k}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "8px",
                    color: COLORS.txtHi,
                    fontWeight: 600,
                  }}
                >
                  {v}
                </span>
              </div>
            ))}
            <div
              style={{
                marginTop: "8px",
                fontFamily: "var(--font-mono)",
                fontSize: "8px",
                color: COLORS.txtLo,
                letterSpacing: "0.1em",
                marginBottom: "4px",
              }}
            >
              POWER BUDGET
            </div>
            {(
              [
                ["PROPULSION", uav.battery * 0.6],
                ["RADAR", uav.battery * 0.3],
                ["COMMS", uav.battery * 0.1],
              ] as const
            ).map(([lbl, v]) => (
              <div key={lbl} style={{ marginBottom: "3px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "7px", color: COLORS.txtLo }}>
                    {lbl}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "7px", color: COLORS.green }}>
                    {Math.round(v)}%
                  </span>
                </div>
                <div style={{ height: "3px", background: "#0a1810", border: `1px solid ${COLORS.bdDim}` }}>
                  <div style={{ height: "100%", width: `${v}%`, background: COLORS.green }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <DroneCommandSection uav={uav} send={send} />

        <div
          style={{
            padding: "6px 14px",
            background: "#040a07",
            borderTop: `1px solid ${COLORS.bdDim}`,
            display: "flex",
            gap: "16px",
            alignItems: "center",
          }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: COLORS.txtLo }}>
            ROLE: <span style={{ color: COLORS.txtMid }}>{uav.role}</span>
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: COLORS.txtLo }}>
            SIGNAL:{" "}
            <span style={{ color: uav.signal > 70 ? COLORS.green : COLORS.amber }}>{Math.round(uav.signal)}%</span>
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: COLORS.txtLo }}>
            BATTERY:{" "}
            <span style={{ color: uav.battery > 40 ? COLORS.green : COLORS.amber }}>
              {Math.round(uav.battery)}%
            </span>
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: COLORS.txtLo, marginLeft: "auto" }}>
            PLATFORM: HYBRID VTOL / AEROMIND 6X / PX4
          </span>
        </div>
      </div>
    </div>
  );
}
