// Per-channel sensor imagery for the fusion panel.
//
// Some channels photograph the ground and the rest are instrument plots, and
// they are produced differently for that reason. RGB and thermal are
// representative plates: canvas primitives cannot fake soil, stones and
// vegetation, and any attempt reads as coloured noise. GPR, magnetometer and
// EMI are *drawn* products in real life — a B-scan is amplitude against
// position and two-way travel time, a mag map is a gridded dipole field, an EMI
// map is apparent conductivity along tight survey lines — so drawing them lands
// as authentic and, more importantly, lets them respond to the device selected.
// Polarimetry sits between the two: it is derived from the EO plate, because
// that is the physical relationship it has to the camera.
//
// None of this is a return from the simulated field. It is representative
// imagery keyed to the device's own class, burial depth and fix confidence.

import { mulberry32 } from '../rng';
import { response } from '../sensing';
import { SENSOR_RAMP } from '../theme';
import type { Mine, SensorTag } from '../types';

/** Plate-backed channels; the rest are drawn. */
const PLATE: Partial<Record<SensorTag, string>> = {
  RGB: '/sensors/rgb.webp',
  LWIR: '/sensors/lwir.webp',
};

export const CHANNEL_LABEL: Record<SensorTag, string> = {
  RGB: 'EO FRAME',
  LIDAR: 'LiDAR RELIEF',
  POL: 'POLARIMETRIC DoLP',
  LWIR: 'THERMAL ΔT',
  MAG: 'MAG ANOMALY',
  EMI: 'EMI CONDUCTIVITY',
  GPR: 'GPR B-SCAN',
};

const cache: Partial<Record<string, HTMLImageElement>> = {};

function plate(src: string, onReady: () => void): HTMLImageElement {
  let im = cache[src];
  if (!im) {
    im = new Image();
    im.src = src;
    cache[src] = im;
  }
  if (!im.complete) im.addEventListener('load', onReady, { once: true });
  return im;
}

/** Stable per-device noise, so a tile does not shimmer between redraws. */
function seedOf(mine: Mine, key: SensorTag): () => number {
  let h = 0;
  for (const ch of mine.id + key) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
  return mulberry32(h);
}

interface Ctx {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  v: number;
  rnd: () => number;
}

/**
 * Radargram: horizontal soil stratigraphy, plus the reflector hyperbola a point
 * target throws. Apex sits at the device's real burial depth, and the limbs
 * follow t(x) = sqrt(t0^2 + (2x/v)^2) — the shape an operator looks for.
 */
function drawGpr({ ctx, w, h, v, rnd }: Ctx, mine: Mine): void {
  const img = ctx.createImageData(w, h);
  const d = img.data;
  // Apex depth as a fraction of the trace window; 0.30 m of soil fills it.
  const apex = 0.16 + (mine.depthM / 0.3) * 0.5;
  const vel = 0.55; // metres per unit of the normalised time axis
  const drift = (rnd() - 0.5) * 0.18;

  // Pre-rolled bed structure, so stratigraphy is horizontal rather than noise.
  const beds = Array.from({ length: 7 }, () => ({
    t: rnd(), amp: (rnd() - 0.5) * 0.5, width: 3 + rnd() * 7,
  }));

  for (let y = 0; y < h; y++) {
    const t = y / h;
    let layer = 0;
    for (const b of beds) {
      const dy = (t - b.t) * h;
      layer += b.amp * Math.exp(-(dy * dy) / (b.width * b.width));
    }
    if (t < 0.09) layer += (1 - t / 0.09) * 1.2; // air/ground direct wave
    for (let x = 0; x < w; x++) {
      const dx = (x / w - 0.5 - drift) * 2;
      // Two-way travel time to the point reflector at this offset.
      const tt = Math.sqrt(apex * apex + (dx / vel) * (dx / vel));
      // Ringing wavelet in pixels: a few alternating bands about the arrival,
      // which is what an operator actually recognises, not a bare curve.
      const dt = (t - tt) * h;
      const env = Math.exp(-(dt * dt) / 210) * Math.exp(-Math.abs(dx) * 1.15);
      const hyper = Math.cos(dt * 0.42) * env * (0.35 + 0.65 * v);
      // Speckle correlated down-trace, as a real radargram is.
      const speckle = (rnd() - 0.5) * 0.30 + Math.sin(x * 2.7 + y * 0.11) * 0.05;
      const g = 0.48 + layer * 0.42 + hyper * 1.15 + speckle;
      const c = Math.max(0, Math.min(1, g));
      const i = (y * w + x) * 4;
      d[i] = SENSOR_RAMP.gprLo[0] + (SENSOR_RAMP.gprHi[0] - SENSOR_RAMP.gprLo[0]) * c;
      d[i + 1] = SENSOR_RAMP.gprLo[1] + (SENSOR_RAMP.gprHi[1] - SENSOR_RAMP.gprLo[1]) * c;
      d[i + 2] = SENSOR_RAMP.gprLo[2] + (SENSOR_RAMP.gprHi[2] - SENSOR_RAMP.gprLo[2]) * c;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * Total-field magnetic anomaly over a gridded survey. An induced dipole reads
 * as a positive lobe with a negative one alongside; amplitude falls as 1/r^3,
 * which is why a 100 g plastic AP mine leaves this tile essentially blank.
 */
function drawMag({ ctx, w, h, v, rnd }: Ctx): void {
  const img = ctx.createImageData(w, h);
  const d = img.data;
  const cx = 0.5 + (rnd() - 0.5) * 0.16;
  const cy = 0.52 + (rnd() - 0.5) * 0.16;
  const sep = 0.1; // dipole lobe separation, fraction of tile
  // Low-frequency geological background the survey has to see through.
  // Many small sources rather than a few broad ones: near-surface magnetic
  // soil reads as blotchy texture, and without it the tile looks scan-lined.
  const geo = Array.from({ length: 16 }, () => ({
    x: rnd(), y: rnd(), amp: (rnd() - 0.5) * 0.9, r: 0.05 + rnd() * 0.14,
  }));

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x / w - cx;
      const py = (y / h - cy) * (h / w);
      const rp = Math.hypot(px, py + sep) + 0.07;
      const rn = Math.hypot(px, py - sep) + 0.07;
      // Compressed rather than raw 1/r^3: without this the lobes saturate into
      // flat discs and the tile reads as a logo instead of a field.
      const dip = 0.0016 / (rp * rp * rp) - 0.0016 / (rn * rn * rn);
      let bg = 0;
      for (const g of geo) {
        const dd = Math.hypot(x / w - g.x, (y / h - g.y) * (h / w));
        bg += g.amp * Math.exp(-(dd * dd) / (g.r * g.r));
      }
      const stripe = Math.sin(y * 0.55) * 0.05 + (rnd() - 0.5) * 0.16;
      const s = Math.tanh(dip * v * 2.6 + bg * 0.85 + stripe);
      const ramp = s >= 0 ? SENSOR_RAMP.magHi : SENSOR_RAMP.magLo;
      const k = Math.abs(s);
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        d[i + c] = SENSOR_RAMP.magMid[c] + (ramp[c] - SENSOR_RAMP.magMid[c]) * k;
      }
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * Apparent-conductivity map from the coil array. Unlike the magnetometer this
 * is a single positive lobe, not a dipole — EMI reads how much conductive metal
 * is present, not which way it is magnetised. The heavy along-line striping is
 * real: the array flies tight lines a metre off the deck and every line carries
 * its own drift.
 */
function drawEmi({ ctx, w, h, v, rnd }: Ctx): void {
  const img = ctx.createImageData(w, h);
  const d = img.data;
  const cx = 0.5 + (rnd() - 0.5) * 0.14;
  const cy = 0.5 + (rnd() - 0.5) * 0.14;
  // Per-line offset. Present because it is the signature texture of EMI data,
  // but kept well under the anomaly so it reads as noise, not as the subject.
  const lines = Array.from({ length: 26 }, () => (rnd() - 0.5) * 0.1);
  const soil = Array.from({ length: 14 }, () => ({
    x: rnd(), y: rnd(), amp: rnd() * 0.4, r: 0.07 + rnd() * 0.15,
  }));

  for (let y = 0; y < h; y++) {
    const drift = lines[Math.floor((y / h) * lines.length) % lines.length];
    for (let x = 0; x < w; x++) {
      const px = x / w - cx;
      const py = (y / h - cy) * (h / w);
      // Coil response falls off far faster than a magnetic field does, which is
      // why EMI must be flown so low and why its swath is so narrow. A weak
      // responder leaves a genuinely faint spot here — that is the point.
      const target = v * Math.exp(-(px * px + py * py) * 70);
      let bg = 0;
      for (const g of soil) {
        const dd = Math.hypot(x / w - g.x, (y / h - g.y) * (h / w));
        bg += g.amp * Math.exp(-(dd * dd) / (g.r * g.r));
      }
      const k = Math.max(0, Math.min(1, 0.14 + target + bg * 0.42 + drift + (rnd() - 0.5) * 0.07));
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        d[i + c] = SENSOR_RAMP.emiLo[c] + (SENSOR_RAMP.emiHi[c] - SENSOR_RAMP.emiLo[c]) * k;
      }
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * Degree of linear polarisation over the same ground the camera saw.
 *
 * Derived from the EO plate rather than invented, because that is the physical
 * relationship: the polarimeter looks through the same optic at the same scene
 * and reports a different quantity. Smooth man-made surfaces polarise the light
 * they reflect and rough soil does not, so the scene flattens out and anything
 * manufactured stands proud of it.
 */
function drawPol(c: Ctx, repaint: () => void): void {
  const { ctx, w, h, v, rnd } = c;
  drawPlate(c, 'RGB', repaint, true);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  // Luminance first, so roughness can be measured against neighbours.
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    lum[i] = (d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114) / 255;
  }

  const cx = (0.5 + (rnd() - 0.5) * 0.22) * w;
  const cy = (0.5 + (rnd() - 0.5) * 0.22) * h;
  const rad = Math.min(w, h) * 0.13;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      // Rough ground scatters light in every orientation and depolarises it;
      // a smooth surface does not. So DoLP runs inverse to local texture, and
      // stones and vegetation stay dark while anything manufactured lifts.
      const gx = Math.abs(lum[i] - lum[y * w + Math.min(w - 1, x + 2)]);
      const gy = Math.abs(lum[i] - lum[Math.min(h - 1, y + 2) * w + x]);
      const rough = (gx + gy) * 0.5;
      const dd = Math.hypot(x - cx, y - cy) / rad;
      // Flat-topped rather than a soft glow: the casing has an edge.
      const target = v * Math.exp(-dd * dd * dd * dd * 1.6);
      const k = Math.max(0, Math.min(1, 0.5 - rough * 7 + target * 0.85));
      for (let ch = 0; ch < 3; ch++) {
        d[i * 4 + ch] = SENSOR_RAMP.polLo[ch] + (SENSOR_RAMP.polHi[ch] - SENSOR_RAMP.polLo[ch]) * k;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * Bare-earth hillshade. LiDAR does not see the device — it sees what putting the
 * device there did to the ground: a spoil mound over the excavation and the
 * scuffed rim around it, lit from the north-west the way a relief model is read.
 * Vegetation is stripped, which is the whole reason the channel is flown; what
 * is left is centimetres of micro-relief against natural undulation.
 */
function drawLidar({ ctx, w, h, v, rnd }: Ctx): void {
  const img = ctx.createImageData(w, h);
  const d = img.data;
  const cx = 0.5 + (rnd() - 0.5) * 0.14;
  const cy = 0.5 + (rnd() - 0.5) * 0.14;
  // Natural ground: a few broad undulations the disturbance has to stand out of.
  const relief = Array.from({ length: 9 }, () => ({
    x: rnd(), y: rnd(), amp: (rnd() - 0.5) * 0.5, r: 0.18 + rnd() * 0.3,
  }));

  /** Ground height at a point, 0..1 tile coordinates. */
  const zAt = (fx: number, fy: number): number => {
    let z = 0;
    for (const g of relief) {
      const dd = Math.hypot(fx - g.x, (fy - g.y) * (h / w));
      z += g.amp * Math.exp(-(dd * dd) / (g.r * g.r));
    }
    const dr = Math.hypot(fx - cx, (fy - cy) * (h / w));
    // Mound over the fill, ringed by the shallow scuff the digging left.
    z += v * 0.55 * Math.exp(-(dr * dr) / 0.0022);
    z -= v * 0.18 * Math.exp(-((dr - 0.085) * (dr - 0.085)) / 0.0016);
    return z;
  };

  const step = 1 / w;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const fx = x / w;
      const fy = y / h;
      const z = zAt(fx, fy);
      // North-west illumination: the slope towards the light sets the shade.
      const slope = (z - zAt(fx - step, fy - step)) / step;
      const k = Math.max(0, Math.min(1, 0.46 + slope * 0.055 + z * 0.22 + (rnd() - 0.5) * 0.05));
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        d[i + c] = SENSOR_RAMP.demLo[c] + (SENSOR_RAMP.demHi[c] - SENSOR_RAMP.demLo[c]) * k;
      }
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/** Representative plate, dimmed by how weakly this channel actually responded. */
function drawPlate(c: Ctx, key: SensorTag, repaint: () => void, raw = false): void {
  const { ctx, w, h, v } = c;
  const im = plate(PLATE[key]!, repaint);
  if (im.complete && im.naturalWidth) {
    const s = Math.max(w / im.naturalWidth, h / im.naturalHeight);
    const dw = im.naturalWidth * s;
    const dh = im.naturalHeight * s;
    ctx.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }
  if (raw) return;
  ctx.fillStyle = `rgba(4,7,12,${(0.62 - v * 0.46).toFixed(2)})`;
  ctx.fillRect(0, 0, w, h);
}

/** Paints one channel tile for one device. Safe to call on every resize. */
export function drawSensor(cv: HTMLCanvasElement, key: SensorTag, mine: Mine): void {
  const par = cv.parentElement;
  if (!par) return;
  const paint = (): void => {
    const w = par.clientWidth;
    const h = par.clientHeight;
    if (w < 2 || h < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const c: Ctx = {
      ctx,
      w: cv.width,
      h: cv.height,
      v: response(mine, key),
      rnd: seedOf(mine, key),
    };
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = SENSOR_RAMP.ink;
    ctx.fillRect(0, 0, c.w, c.h);

    if (key === 'GPR') drawGpr(c, mine);
    else if (key === 'LIDAR') drawLidar(c);
    else if (key === 'MAG') drawMag(c);
    else if (key === 'EMI') drawEmi(c);
    else if (key === 'POL') drawPol(c, paint);
    else drawPlate(c, key, paint);
  };
  paint();
}
