"use client";

import { useEffect, useRef } from "react";
import { COLORS } from "@/drishti/theme/colors";
import { RADAR } from "@/drishti/theme/constants";
import type { Track } from "@/drishti/types/track";

interface Props {
  tracks: Track[];
  swarmAltM: number;
  maxRangeKm: number;
}

function ElevationView({ tracks, swarmAltM, maxRangeKm }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const W = c.width;
    const H = c.height;
    const PAD = { l: 28, r: 8, t: 8, b: 18 };
    const plotW = W - PAD.l - PAD.r;
    const plotH = H - PAD.t - PAD.b;
    const maxAlt = 2000;
    const toX = (km: number) => PAD.l + (km / maxRangeKm) * plotW;
    const toY = (alt: number) => PAD.t + (1 - alt / maxAlt) * plotH;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    // Detection band
    const bandTop = toY(Math.min(maxAlt, swarmAltM + RADAR.detectAltHalfM));
    const bandBot = toY(Math.max(0, swarmAltM - RADAR.detectAltHalfM));
    ctx.fillStyle = "rgba(0,80,30,0.12)";
    ctx.fillRect(PAD.l, bandTop, plotW, bandBot - bandTop);

    // Swarm alt line
    const sy = toY(swarmAltM);
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = "rgba(0,200,60,0.4)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(PAD.l, sy);
    ctx.lineTo(PAD.l + plotW, sy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Grid
    ctx.strokeStyle = "rgba(0,50,20,0.6)";
    ctx.lineWidth = 0.4;
    [500, 1000, 1500, 2000].forEach((alt) => {
      const y = toY(alt);
      ctx.beginPath();
      ctx.moveTo(PAD.l, y);
      ctx.lineTo(PAD.l + plotW, y);
      ctx.stroke();
      ctx.fillStyle = "rgba(0,80,30,0.8)";
      ctx.font = '7px "IBM Plex Mono"';
      ctx.fillText(`${alt}m`, 2, y + 3);
    });
    [1, 2, 3, 4, 5]
      .filter((k) => k <= maxRangeKm)
      .forEach((km) => {
        const x = toX(km);
        ctx.beginPath();
        ctx.moveTo(x, PAD.t);
        ctx.lineTo(x, PAD.t + plotH);
        ctx.stroke();
      });

    // Axes
    ctx.strokeStyle = "rgba(0,100,40,0.6)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(PAD.l, PAD.t);
    ctx.lineTo(PAD.l, PAD.t + plotH);
    ctx.lineTo(PAD.l + plotW, PAD.t + plotH);
    ctx.stroke();

    // X labels
    ctx.fillStyle = "rgba(0,80,30,0.8)";
    ctx.font = '7px "IBM Plex Mono"';
    [1, 2, 3, 4, 5]
      .filter((k) => k <= maxRangeKm)
      .forEach((km) => {
        ctx.fillText(`${km}km`, toX(km) - 8, H - 4);
      });

    // Target dots
    tracks.forEach((t) => {
      const x = toX(t.range);
      const y = toY(t.z);
      const col =
        t.type === "DRONE" ? COLORS.red : t.type === "BIRD" ? COLORS.amber : COLORS.txtHi;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = col + "99";
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.font = '7px "IBM Plex Mono"';
      ctx.fillText(t.id, x + 5, y + 3);
    });

    ctx.fillStyle = "rgba(0,150,60,0.6)";
    ctx.font = '7px "IBM Plex Mono"';
    ctx.fillText("ALT (m)", 2, PAD.t + 10);
    ctx.fillText(`SWARM: ${Math.round(swarmAltM)}m`, PAD.l + 4, sy - 3);
  }, [tracks, swarmAltM, maxRangeKm]);

  return <canvas ref={canvasRef} width={278} height={130} style={{ display: "block", width: "100%" }} />;
}

const RADAR_PARAMS: [string, string][] = [
  ["TYPE", "X-BAND FMCW"],
  ["FREQ", `${RADAR.freqGhzMin}–${RADAR.freqGhzMax} GHz`],
  ["BW", `${RADAR.bandwidthMHz} MHz`],
  ["RANGE RES", `${RADAR.rangeResolutionM} m`],
  ["AZIMUTH RES", "3°–5°"],
  ["TX PWR", `${RADAR.txPowerWMin}–${RADAR.txPowerWMax} W`],
];

export function ElevTab({ tracks, swarmAltM, maxRangeKm }: Props) {
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div
        style={{
          padding: "6px 8px 4px",
          fontFamily: "var(--font-mono)",
          fontSize: "8px",
          color: COLORS.txtLo,
          letterSpacing: "0.1em",
        }}
      >
        RANGE vs ALTITUDE — TARGET DISTRIBUTION
      </div>
      <ElevationView tracks={tracks} swarmAltM={swarmAltM} maxRangeKm={maxRangeKm} />
      <div
        style={{
          padding: "4px 8px",
          fontFamily: "var(--font-mono)",
          fontSize: "8px",
          color: COLORS.txtLo,
        }}
      >
        <span style={{ color: "rgba(0,200,60,0.4)" }}>━━</span> SWARM ALT&nbsp;&nbsp;
        <span style={{ color: "rgba(0,80,30,0.6)" }}>█</span> DETECTION BAND ±500m
      </div>
      <div style={{ padding: "4px 8px", borderTop: `1px solid ${COLORS.bdDim}` }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "8px",
            color: COLORS.txtLo,
            letterSpacing: "0.1em",
            marginBottom: "4px",
          }}
        >
          RADAR PARAMETERS
        </div>
        {RADAR_PARAMS.map(([k, v]) => (
          <div
            key={k}
            style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}
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
  );
}
