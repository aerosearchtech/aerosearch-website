"use client";

import { useEffect, useRef } from "react";
import { COLORS, DRONE_COLORS } from "@/drishti/theme/colors";
import type { UAV } from "@/drishti/types/uav";

interface Props {
  uav: UAV;
  idx: number;
  zuluTime: string;
  mode?: "DAY" | "NIGHT";
}

// Simulated EO/IR sensor feed. Pure visual — no real camera.
export function SensorVideoTile({ uav, idx, zuluTime, mode = "NIGHT" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const dc = DRONE_COLORS[idx] ?? COLORS.green;

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    const fit = () => {
      const parent = c.parentElement;
      if (!parent) return;
      const r = parent.getBoundingClientRect();
      const w = Math.floor(r.width);
      const h = 220;
      const dpr = Math.max(2, window.devicePixelRatio || 1);
      c.width = w * dpr;
      c.height = h * dpr;
      c.style.width = w + "px";
      c.style.height = h + "px";
      const ctx = c.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (c.parentElement) ro.observe(c.parentElement);

    const isDay = mode === "DAY";
    const palette = isDay
      ? { skyTop: "#4a6fa5", skyBot: "#7a9cc6", gndTop: "#3d5c2e", gndBot: "#2a4020", horizon: "rgba(60,80,50,0.5)", grid: "rgba(60,80,50,0.2)", dots: "rgba(50,80,40,0.3)", noise: "rgba(200,200,180,0.04)", scanline: "rgba(255,255,255,0.03)", hud: "rgba(20,40,30,0.9)", hudHi: "#1a2e20" }
      : { skyTop: "#021a14", skyBot: "#062418", gndTop: "#0a1c10", gndBot: "#03100a", horizon: "rgba(0,200,80,0.35)", grid: "rgba(0,200,80,0.12)", dots: "rgba(80,160,100,0.18)", noise: "rgba(120,255,160,0.06)", scanline: "rgba(0,0,0,0.08)", hud: "rgba(200,255,210,0.85)", hudHi: dc };

    const draw = () => {
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const W = c.clientWidth;
      const H = c.clientHeight;
      const t = performance.now() / 1000;
      const horizonY = H * 0.55 + Math.sin(t * 0.7) * 6;

      const sky = ctx.createLinearGradient(0, 0, 0, horizonY);
      sky.addColorStop(0, palette.skyTop);
      sky.addColorStop(1, palette.skyBot);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, horizonY);
      const ground = ctx.createLinearGradient(0, horizonY, 0, H);
      ground.addColorStop(0, palette.gndTop);
      ground.addColorStop(1, palette.gndBot);
      ctx.fillStyle = ground;
      ctx.fillRect(0, horizonY, W, H - horizonY);

      ctx.strokeStyle = palette.horizon;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(W, horizonY);
      ctx.stroke();

      ctx.strokeStyle = palette.grid;
      ctx.lineWidth = 0.5;
      for (let i = 1; i <= 8; i++) {
        const y = horizonY + (i / 8) * (H - horizonY);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      const cx = W / 2;
      for (let i = -6; i <= 6; i++) {
        const x = cx + (i / 6) * W * 0.4;
        ctx.beginPath();
        ctx.moveTo(x, horizonY);
        ctx.lineTo(cx + (i / 6) * W * 1.2, H);
        ctx.stroke();
      }

      const pan = (t * 4) % 60;
      ctx.fillStyle = palette.dots;
      for (let i = 0; i < 8; i++) {
        const x = ((i * 90 + pan) % (W + 90)) - 30;
        const y = horizonY + 5 + (i % 3) * 18;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = palette.scanline;
      for (let y = 0; y < H; y += 3) {
        ctx.fillRect(0, y, W, 1);
      }

      ctx.fillStyle = palette.noise;
      for (let i = 0; i < 80; i++) {
        ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
      }

      ctx.strokeStyle = isDay ? "#1a2e20" : dc;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(cx - 18, H / 2);
      ctx.lineTo(cx - 5, H / 2);
      ctx.moveTo(cx + 5, H / 2);
      ctx.lineTo(cx + 18, H / 2);
      ctx.moveTo(cx, H / 2 - 18);
      ctx.lineTo(cx, H / 2 - 5);
      ctx.moveTo(cx, H / 2 + 5);
      ctx.lineTo(cx, H / 2 + 18);
      ctx.stroke();
      const b = 10;
      [
        [16, 16],
        [W - 16 - b, 16],
        [16, H - 16 - b],
        [W - 16 - b, H - 16 - b],
      ].forEach(([x, y], i) => {
        ctx.beginPath();
        const dx = i % 2 === 0 ? 1 : -1;
        const dy = i < 2 ? 1 : -1;
        const sx = i % 2 === 0 ? (x as number) : (x as number) + b;
        const sy = i < 2 ? (y as number) : (y as number) + b;
        ctx.moveTo(sx + dx * b, sy);
        ctx.lineTo(sx, sy);
        ctx.lineTo(sx, sy + dy * b);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;

      ctx.fillStyle = palette.hudHi;
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.fillText(`${uav.callsign} · ${isDay ? "EO" : "IR"}`, 12, 18);
      ctx.fillStyle = palette.hud;
      ctx.fillText(`ZULU ${zuluTime}`, 12, 32);
      ctx.fillText(`ALT ${Math.round(uav.pos.z)}m AGL`, 12, 46);
      ctx.fillText(`HDG ${String(Math.round(((Math.atan2(uav.vel.x, uav.vel.y) * 180) / Math.PI + 360) % 360)).padStart(3, "0")}°`, 12, 60);
      ctx.fillText("FOV 24°", W - 60, 18);
      ctx.fillText("ZOOM 2.0×", W - 70, 32);

      const rec = Math.sin(t * 3) > 0;
      if (rec) {
        ctx.fillStyle = COLORS.red;
        ctx.beginPath();
        ctx.arc(W - 18, H - 18, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.red;
        ctx.fillText("REC", W - 40, H - 14);
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      ro.disconnect();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uav.id, mode]);

  return (
    <div
      style={{
        position: "relative",
        background: COLORS.bg,
        border: `1px solid ${COLORS.bdMid}`,
        overflow: "hidden",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "220px" }} />
    </div>
  );
}
