"use client";

import { useEffect, useRef } from "react";
import { COLORS } from "@/drishti/theme/colors";
import type { Track } from "@/drishti/types/track";

interface Props {
  track: Track;
  maxRangeKm: number;
}

export function RangeDoppler({ track, maxRangeKm }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const W = c.width;
    const H = c.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#020705";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(0,80,30,0.8)";
    ctx.font = '8px "IBM Plex Mono"';
    ctx.fillText("RANGE (km)", W / 2 - 20, H - 4);
    ctx.save();
    ctx.translate(10, H / 2 + 20);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("DOPPLER (m/s)", 0, 0);
    ctx.restore();

    const PAD = { l: 22, r: 6, t: 10, b: 18 };
    const PW = W - PAD.l - PAD.r;
    const PH = H - PAD.t - PAD.b;

    ctx.strokeStyle = "rgba(0,50,20,0.5)";
    ctx.lineWidth = 0.4;
    for (let i = 0; i <= 4; i++) {
      const x = PAD.l + (i / 4) * PW;
      ctx.beginPath();
      ctx.moveTo(x, PAD.t);
      ctx.lineTo(x, PAD.t + PH);
      ctx.stroke();
      const km = ((i / 4) * maxRangeKm).toFixed(1);
      ctx.fillStyle = "rgba(0,80,30,0.8)";
      ctx.font = '7px "IBM Plex Mono"';
      ctx.fillText(`${km}`, x - 6, H - 6);
    }
    for (let i = 0; i <= 4; i++) {
      const y = PAD.t + (i / 4) * PH;
      ctx.beginPath();
      ctx.moveTo(PAD.l, y);
      ctx.lineTo(PAD.l + PW, y);
      ctx.stroke();
      const dop = ((2 - i) * 20).toFixed(0);
      ctx.fillStyle = "rgba(0,80,30,0.8)";
      ctx.font = '7px "IBM Plex Mono"';
      ctx.fillText(`${dop}`, 1, y + 3);
    }

    ctx.strokeStyle = "rgba(0,100,40,0.5)";
    ctx.lineWidth = 0.8;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(PAD.l, PAD.t + PH / 2);
    ctx.lineTo(PAD.l + PW, PAD.t + PH / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const targetRange = track.range;
    const targetDop = track.speed;
    const tx = PAD.l + (targetRange / maxRangeKm) * PW;
    const ty = PAD.t + PH / 2 - (targetDop / 40) * PH * 0.8;

    const rng = (s: number) => {
      const x = Math.sin(s * 9301 + 49297) * 233280;
      return x - Math.floor(x);
    };
    for (let i = 0; i < 60; i++) {
      const cx2 = PAD.l + rng(i * 3) * PW;
      const cy2 = PAD.t + PH / 2 + (rng(i * 3 + 1) - 0.5) * PH * 0.4;
      const intensity = rng(i * 3 + 2) * 0.3;
      ctx.fillStyle = `rgba(0,150,50,${intensity})`;
      ctx.beginPath();
      ctx.arc(cx2, cy2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const grd = ctx.createRadialGradient(tx, ty, 0, tx, ty, 18);
    const col =
      track.type === "DRONE"
        ? "255,50,50"
        : track.type === "BIRD"
          ? "255,160,0"
          : "150,255,200";
    grd.addColorStop(0, `rgba(${col},0.9)`);
    grd.addColorStop(0.3, `rgba(${col},0.4)`);
    grd.addColorStop(1, `rgba(${col},0)`);
    ctx.beginPath();
    ctx.arc(tx, ty, 18, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    if (track.type === "DRONE") {
      const propRPM = 8000 + rng(7) * 4000;
      const propDopSmear = (propRPM / 60) * 0.3 * 2 * 0.3;
      for (let k = 0; k < 20; k++) {
        const offset = (k / 20 - 0.5) * propDopSmear;
        const sy2 = ty + (offset / 40) * PH * 0.8;
        const alpha = (1 - Math.abs(k / 10 - 1)) * 0.4;
        ctx.beginPath();
        ctx.arc(tx, sy2, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,120,50,${alpha})`;
        ctx.fill();
      }
      ctx.fillStyle = "rgba(255,120,50,0.7)";
      ctx.font = '7px "IBM Plex Mono"';
      ctx.fillText("µ-DOP", tx + 8, ty - 12);
    }

    const labelCol =
      track.type === "DRONE" ? COLORS.red : track.type === "BIRD" ? COLORS.amber : COLORS.txtHi;
    ctx.fillStyle = labelCol;
    ctx.font = 'bold 8px "IBM Plex Mono"';
    ctx.fillText(track.id, tx + 6, ty - 3);
    ctx.font = '7px "IBM Plex Mono"';
    ctx.fillText(`${track.speed.toFixed(0)}m/s`, tx + 6, ty + 8);
    ctx.fillText(`RCS:${track.rcs.toFixed(2)}`, tx + 6, ty + 17);

    const dscr =
      track.type === "DRONE" ? 12.4 + rng(12) * 3 : track.type === "BIRD" ? 3.2 + rng(12) * 2 : 5.0;
    ctx.fillStyle = "rgba(0,200,80,0.8)";
    ctx.font = '8px "IBM Plex Mono"';
    ctx.fillText(`DSCR: ${dscr.toFixed(1)} dB`, PAD.l + 2, PAD.t + 9);
    ctx.fillStyle = dscr > 8 ? "rgba(0,200,80,0.6)" : "rgba(255,160,0,0.6)";
    ctx.fillText(dscr > 8 ? "▶ DRONE SIGNATURE" : "▶ AVIAN CLUTTER", PAD.l + 2, PAD.t + 18);
  }, [track, maxRangeKm]);

  return <canvas ref={canvasRef} width={260} height={160} style={{ display: "block", width: "100%", height: "auto" }} />;
}
