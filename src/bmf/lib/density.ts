// Obstacle density, measured from the detected plot rather than taken from the
// generator — this is what the survey can actually claim to know.
//
// Densities are reported the way engineer doctrine states them: mines per
// kilometre of front (Soviet/Russian anti-tank rows run 750–1,000/km, and
// reached 1,500–2,000/km on armoured approaches at Kursk), alongside an areal
// figure for comparison with modern reporting.

import { AOI_DEPTH_M, AOI_WIDTH_M, FRONT_M } from './constants';
import type { Mine, Minefield, MineType } from './types';

/** Cell size for the bucketed nearest-neighbour and peak-density passes. */
const BUCKET_M = 12;
/** Gap above which consecutive anti-tank rows count as separate rows/belts. */
const ROW_GAP_M = 12;
const BELT_GAP_M = 60;

export interface DensityStats {
  total: number;
  areaHa: number;
  perKmFront: Record<MineType, number>;
  perKmFrontAll: number;
  per100m2: number;
  peakPer100m2: number;
  meanSpacingM: number;
  rowCount: number;
  beltCount: number;
  obstacleDepthM: number;
  frontM: number;
}

/** 1-D clustering of a sorted axis, used to count laid rows and belts. */
function clusters(sorted: number[], gapM: number): number {
  if (!sorted.length) return 0;
  let n = 1;
  for (let i = 1; i < sorted.length; i++) if (sorted[i] - sorted[i - 1] > gapM) n++;
  return n;
}

/** Mean distance to the nearest other device, bucketed so it stays O(n). */
function meanNearest(mines: Mine[]): number {
  const cols = Math.ceil(AOI_WIDTH_M / BUCKET_M);
  const rows = Math.ceil(AOI_DEPTH_M / BUCKET_M);
  const buckets: Mine[][] = Array.from({ length: cols * rows }, () => []);
  const at = (m: Mine): number =>
    Math.min(rows - 1, Math.floor(m.y / BUCKET_M)) * cols +
    Math.min(cols - 1, Math.floor(m.x / BUCKET_M));
  for (const m of mines) buckets[at(m)].push(m);

  let sum = 0;
  let counted = 0;
  for (const m of mines) {
    const bx = Math.min(cols - 1, Math.floor(m.x / BUCKET_M));
    const by = Math.min(rows - 1, Math.floor(m.y / BUCKET_M));
    let best = Infinity;
    for (let y = Math.max(0, by - 1); y <= Math.min(rows - 1, by + 1); y++) {
      for (let x = Math.max(0, bx - 1); x <= Math.min(cols - 1, bx + 1); x++) {
        for (const o of buckets[y * cols + x]) {
          if (o === m) continue;
          const d = Math.hypot(o.x - m.x, o.y - m.y);
          if (d < best) best = d;
        }
      }
    }
    if (Number.isFinite(best)) {
      sum += best;
      counted++;
    }
  }
  return counted ? sum / counted : 0;
}

/** Densest 100 m² anywhere in the AO, on a 10 m grid. */
function peakPer100m2(mines: Mine[]): number {
  const cols = Math.ceil(AOI_WIDTH_M / 10);
  const rows = Math.ceil(AOI_DEPTH_M / 10);
  const counts = new Uint16Array(cols * rows);
  let peak = 0;
  for (const m of mines) {
    const i =
      Math.min(rows - 1, Math.floor(m.y / 10)) * cols + Math.min(cols - 1, Math.floor(m.x / 10));
    counts[i]++;
    if (counts[i] > peak) peak = counts[i];
  }
  return peak;
}

export function computeDensity(field: Minefield): DensityStats {
  const mines = field.mines;
  const areaM2 = AOI_WIDTH_M * AOI_DEPTH_M;
  const frontKm = FRONT_M / 1000;

  const perKmFront = { at: 0, ap: 0, pfm1: 0, uxo: 0 } as Record<MineType, number>;
  for (const m of mines) perKmFront[m.type]++;
  (Object.keys(perKmFront) as MineType[]).forEach((k) => {
    perKmFront[k] = perKmFront[k] / frontKm;
  });

  const atX = mines
    .filter((m) => m.type === 'at')
    .map((m) => m.x)
    .sort((a, b) => a - b);
  const lo = atX[Math.floor(atX.length * 0.05)] ?? 0;
  const hi = atX[Math.floor(atX.length * 0.95)] ?? 0;

  return {
    total: mines.length,
    areaHa: areaM2 / 10000,
    perKmFront,
    perKmFrontAll: mines.length / frontKm,
    per100m2: (mines.length / areaM2) * 100,
    peakPer100m2: peakPer100m2(mines),
    meanSpacingM: meanNearest(mines),
    rowCount: clusters(atX, ROW_GAP_M),
    beltCount: clusters(atX, BELT_GAP_M),
    obstacleDepthM: Math.max(0, hi - lo),
    frontM: FRONT_M,
  };
}
