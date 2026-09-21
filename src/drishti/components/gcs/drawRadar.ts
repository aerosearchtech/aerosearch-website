// Canvas rendering for the 2D Plan-Position Indicator (PPI).
// Ported from the mock's drawRadar(); pure function — no React.

import { COLORS, DRONE_COLORS } from "@/drishti/theme/colors";
import type { UAV } from "@/drishti/types/uav";
import type { Track } from "@/drishti/types/track";
import type { RadarTheme } from "@/drishti/types/tweaks";

export interface DrawCtx {
  sweepDeg: number;
  blipMap: Record<string, number>; // trackId -> lit timestamp
  maxRangeKm: number;
  theme: RadarTheme;
  dpr: number;
  showFovArcs: boolean;
  showCIEllipses: boolean;
  terrainImg: HTMLImageElement | null;
}

interface Accent {
  sweep: string;
  target: string;
  grid: string;
  ring: string;
  txt: string;
}

function accents(theme: RadarTheme): Accent {
  if (theme === "amber") {
    return {
      sweep: "#ffa800",
      target: "#ff3300",
      grid: "rgba(80,40,0,0.7)",
      ring: "rgba(60,30,0,0.6)",
      txt: "rgba(200,100,0,0.8)",
    };
  }
  if (theme === "blue") {
    return {
      sweep: "#3d8cff",
      target: "#ff3333",
      grid: "rgba(0,30,80,0.7)",
      ring: "rgba(0,20,60,0.6)",
      txt: "rgba(40,120,220,0.8)",
    };
  }
  return {
    sweep: "#00e060",
    target: "#ff3333",
    grid: "rgba(0,80,30,0.7)",
    ring: "rgba(0,50,20,0.6)",
    txt: "rgba(0,100,45,0.8)",
  };
}

export function drawRadar(canvas: HTMLCanvasElement, uavs: UAV[], tracks: Track[], ctx2: DrawCtx): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = ctx2.dpr;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(cx, cy) - 22;
  const maxM = ctx2.maxRangeKm * 1000;
  const sc = R / maxM;
  const A = accents(ctx2.theme);

  // Clear
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();

  if (ctx2.terrainImg) {
    const sz = R * 2;
    ctx.drawImage(ctx2.terrainImg, cx - R, cy - R, sz, sz);
    ctx.fillStyle = "rgba(0,10,5,0.55)";
    ctx.fillRect(0, 0, w, h);
  }

  // Inner glow
  const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  bgGrad.addColorStop(0, "rgba(0,40,15,0.3)");
  bgGrad.addColorStop(0.6, "rgba(0,20,8,0.2)");
  bgGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Range rings
  for (let km = 1; km <= ctx2.maxRangeKm; km++) {
    const r = (km / ctx2.maxRangeKm) * R;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = A.ring;
    ctx.lineWidth = km === ctx2.maxRangeKm ? 1 : 0.5;
    ctx.stroke();
    ctx.fillStyle = A.txt;
    ctx.font = '9px "IBM Plex Mono"';
    ctx.fillText(`${km}km`, cx + r * Math.sin(0.05) + 3, cy - r * Math.cos(0.05) - 3);
  }

  // Azimuth lines
  for (let deg = 0; deg < 360; deg += 30) {
    const rad = ((deg - 90) * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(cx + 18 * Math.cos(rad), cy + 18 * Math.sin(rad));
    ctx.lineTo(cx + R * Math.cos(rad), cy + R * Math.sin(rad));
    ctx.strokeStyle = A.grid;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    if (deg % 90 === 0) {
      const lx = cx + (R - 18) * Math.cos(rad);
      const ly = cy + (R - 18) * Math.sin(rad);
      const labels = ["N", "E", "S", "W"] as const;
      ctx.fillStyle = A.sweep;
      ctx.font = 'bold 10px "IBM Plex Mono"';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(labels[deg / 90] ?? "", lx, ly);
    } else {
      const lx = cx + (R - 14) * Math.cos(rad);
      const ly = cy + (R - 14) * Math.sin(rad);
      ctx.fillStyle = A.txt;
      ctx.font = '7px "IBM Plex Mono"';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${deg}`, lx, ly);
    }
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // Sweep trail
  const sweepRad = ((ctx2.sweepDeg - 90) * Math.PI) / 180;
  const trailDeg = (50 * Math.PI) / 180;
  for (let i = 0; i < 16; i++) {
    const frac = i / 16;
    const sa = sweepRad - trailDeg * (1 - frac);
    const ea = sweepRad - trailDeg * (1 - frac - 1 / 16);
    const alpha = Math.pow(frac, 1.5) * 0.07;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, sa, ea);
    ctx.closePath();
    const rgb =
      ctx2.theme === "amber" ? "200,100,0" : ctx2.theme === "blue" ? "30,100,255" : "0,200,80";
    ctx.fillStyle = `rgba(${rgb},${alpha})`;
    ctx.fill();
  }

  // Sweep line
  const sg = ctx.createLinearGradient(cx, cy, cx + R * Math.cos(sweepRad), cy + R * Math.sin(sweepRad));
  sg.addColorStop(0, "rgba(0,220,80,0)");
  sg.addColorStop(0.35, "rgba(0,220,80,0.2)");
  sg.addColorStop(1, A.sweep);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + R * Math.cos(sweepRad), cy + R * Math.sin(sweepRad));
  ctx.strokeStyle = sg;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + R * Math.cos(sweepRad), cy + R * Math.sin(sweepRad), 3, 0, Math.PI * 2);
  ctx.fillStyle = A.sweep;
  ctx.fill();

  // FoV sector arcs per drone
  if (ctx2.showFovArcs) {
    uavs.forEach((uav, i) => {
      if (uav.status === "FAULT" || uav.status === "RTH") return;
      const dc = DRONE_COLORS[i] ?? COLORS.green;
      const outAz = Math.atan2(uav.pos.x, uav.pos.y);
      const halfFov = (45 * Math.PI) / 180;
      const startRad = outAz - halfFov - Math.PI / 2;
      const endRad = outAz + halfFov - Math.PI / 2;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, startRad, endRad);
      ctx.closePath();
      ctx.fillStyle = dc + "0d";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, R - 1, startRad, endRad);
      ctx.strokeStyle = dc + "55";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const midRad = (startRad + endRad) / 2;
      const lx = cx + (R - 18) * Math.cos(midRad);
      const ly = cy + (R - 18) * Math.sin(midRad);
      ctx.fillStyle = dc + "aa";
      ctx.font = 'bold 8px "IBM Plex Mono"';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`K${i + 1}`, lx, ly);
      ctx.restore();
    });
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  // UAV markers
  uavs.forEach((uav) => {
    if (uav.status === "RECOVERING") return;
    const ux = cx + uav.pos.x * sc;
    const uy = cy - uav.pos.y * sc;
    const col =
      uav.status === "ACTIVE"
        ? A.sweep
        : uav.status === "FAULT"
          ? COLORS.red
          : uav.status === "RTH"
            ? COLORS.amber
            : COLORS.blue;
    ctx.beginPath();
    ctx.moveTo(ux, uy - 5);
    ctx.lineTo(ux - 3.5, uy + 3);
    ctx.lineTo(ux + 3.5, uy + 3);
    ctx.closePath();
    ctx.fillStyle = col + "30";
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
  });

  // Tracks: history, vel vector, blip, label
  const now = Date.now();
  tracks.forEach((t) => {
    const px = cx + t.x * sc;
    const py = cy - t.y * sc;
    const dist = Math.sqrt(t.x * t.x + t.y * t.y);
    if (dist > maxM * 1.05) return;

    const age = now - (ctx2.blipMap[t.id] ?? 0);
    const lit = age < 2800;
    const litA = lit ? Math.max(0.15, 1 - age / 2800) : 0.12;

    t.history.slice(-18).forEach((p, i, arr) => {
      const hx = cx + p.x * sc;
      const hy = cy - p.y * sc;
      const a = ((i + 1) / arr.length) * 0.45 * litA;
      ctx.beginPath();
      ctx.arc(hx, hy, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,200,80,${a})`;
      ctx.fill();
    });

    if (lit) {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + t.vx * 5 * sc, py - t.vy * 5 * sc);
      ctx.strokeStyle =
        t.type === "DRONE"
          ? `rgba(255,50,50,${litA * 0.8})`
          : t.type === "BIRD"
            ? `rgba(255,160,0,${litA * 0.8})`
            : `rgba(200,255,220,${litA * 0.6})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.globalAlpha = litA;
    if (lit) {
      const glowC =
        t.type === "DRONE" ? "255,50,50" : t.type === "BIRD" ? "255,160,0" : "150,255,200";
      const grd = ctx.createRadialGradient(px, py, 0, px, py, 14);
      grd.addColorStop(0, `rgba(${glowC},0.4)`);
      grd.addColorStop(1, `rgba(${glowC},0)`);
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }

    const bs = Math.max(4, Math.min(9, t.rcs * 18));
    const bc =
      t.type === "DRONE" ? COLORS.red : t.type === "BIRD" ? COLORS.amber : COLORS.txtHi;
    ctx.beginPath();
    ctx.moveTo(px, py - bs);
    ctx.lineTo(px + bs, py);
    ctx.lineTo(px, py + bs);
    ctx.lineTo(px - bs, py);
    ctx.closePath();
    ctx.fillStyle = bc;
    ctx.fill();
    ctx.globalAlpha = 1;

    if (lit) {
      ctx.fillStyle = COLORS.txtHi;
      ctx.font = '9px "IBM Plex Mono"';
      ctx.textBaseline = "middle";
      ctx.fillText(t.id, px + bs + 4, py - 5);
      const spd = Math.round(Math.sqrt(t.vx * t.vx + t.vy * t.vy));
      ctx.fillStyle = "#80b890";
      ctx.font = '8px "IBM Plex Mono"';
      ctx.fillText(`${spd}m/s`, px + bs + 4, py + 5);
      ctx.textBaseline = "alphabetic";
    }
  });

  // Centre crosshair
  ctx.strokeStyle = "rgba(0,200,60,0.35)";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy);
  ctx.lineTo(cx + 14, cy);
  ctx.moveTo(cx, cy - 14);
  ctx.lineTo(cx, cy + 14);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0,200,60,0.5)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // CI covariance ellipses
  if (ctx2.showCIEllipses) {
    tracks.forEach((t) => {
      const px = cx + t.x * sc;
      const py = cy - t.y * sc;
      const dist = Math.sqrt(t.x * t.x + t.y * t.y);
      if (dist > maxM * 1.05) return;
      const uncert = (1 - t.confidence) * dist * 0.12;
      const rx = Math.max(8, uncert * sc);
      const ry = Math.max(4, uncert * sc * 0.45);
      const angle = Math.atan2(-(py - cy), px - cx);
      const col =
        t.type === "DRONE" ? COLORS.red : t.type === "BIRD" ? COLORS.amber : COLORS.txtHi;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, ry, rx, 0, 0, Math.PI * 2);
      ctx.strokeStyle = col + "44";
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });
  }

  // 120 m range-resolution indicator
  const res120px = (120 / maxM) * R;
  ctx.strokeStyle = COLORS.bdHi;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - res120px / 2, cy + R - 22);
  ctx.lineTo(cx + res120px / 2, cy + R - 22);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - res120px / 2, cy + R - 26);
  ctx.lineTo(cx - res120px / 2, cy + R - 18);
  ctx.moveTo(cx + res120px / 2, cy + R - 26);
  ctx.lineTo(cx + res120px / 2, cy + R - 18);
  ctx.stroke();
  ctx.fillStyle = COLORS.bdHi;
  ctx.font = '8px "IBM Plex Mono"';
  ctx.textAlign = "center";
  ctx.fillText("120m RES", cx, cy + R - 10);
  ctx.textAlign = "left";

  ctx.restore(); // end clip

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = "#1a4028";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ±45° detection sector (centred on North)
  const zoneHalfRad = (45 * Math.PI) / 180;
  const zoneCenter = -Math.PI / 2;
  const z1 = zoneCenter - zoneHalfRad;
  const z2 = zoneCenter + zoneHalfRad;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, R, z1, z2);
  ctx.closePath();
  ctx.fillStyle = "rgba(0,200,80,0.04)";
  ctx.fill();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = "rgba(0,180,60,0.35)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + R * Math.cos(z1), cy + R * Math.sin(z1));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + R * Math.cos(z2), cy + R * Math.sin(z2));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(0,160,50,0.5)";
  ctx.font = '7px "IBM Plex Mono"';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("±45° DETECT", cx, cy - R * 0.55);
  ctx.restore();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // Corner labels
  ctx.fillStyle = "#1a3020";
  ctx.font = '8px "IBM Plex Mono"';
  ctx.fillText(`MAX RANGE: ${ctx2.maxRangeKm}km`, 8, h - 8);
  ctx.fillText(`FMCW X-BAND`, w - 90, h - 8);
}
