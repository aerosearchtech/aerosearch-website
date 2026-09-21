import { CELL_M, GRID_H, GRID_W, MINE_SPECS, RISK_KERNEL_SPAN } from "./constants";
import type { Minefield } from "./types";

export interface RiskField {
  /** Per-cell hazard density; sum of Gaussian kernels, one per detected device. */
  risk: Float32Array;
  max: number;
}

export const cellIndex = (cx: number, cy: number): number => cy * GRID_W + cx;
export const toCellX = (xM: number): number => Math.floor(xM / CELL_M);
export const toCellY = (yM: number): number => Math.floor(yM / CELL_M);
export const toMetresX = (cx: number): number => (cx + 0.5) * CELL_M;
export const toMetresY = (cy: number): number => (cy + 0.5) * CELL_M;

/** Stamps each device's hazard kernel into the grid. */
export function buildRiskField(field: Minefield): RiskField {
  const risk = new Float32Array(GRID_W * GRID_H);
  for (const m of field.mines) {
    const spec = MINE_SPECS[m.type];
    const sigma = spec.clearRadiusM;
    const span = sigma * RISK_KERNEL_SPAN;
    const amp = spec.riskWeight * m.confidence;
    const x0 = Math.max(0, toCellX(m.x - span));
    const x1 = Math.min(GRID_W - 1, toCellX(m.x + span));
    const y0 = Math.max(0, toCellY(m.y - span));
    const y1 = Math.min(GRID_H - 1, toCellY(m.y + span));
    const inv = 1 / (2 * sigma * sigma);
    for (let cy = y0; cy <= y1; cy++) {
      const dy = toMetresY(cy) - m.y;
      for (let cx = x0; cx <= x1; cx++) {
        const dx = toMetresX(cx) - m.x;
        risk[cellIndex(cx, cy)] += amp * Math.exp(-(dx * dx + dy * dy) * inv);
      }
    }
  }
  let max = 0;
  for (let i = 0; i < risk.length; i++) if (risk[i] > max) max = risk[i];
  return { risk, max };
}

/** Separable box mean of radius r cells — clamped at the AOI edges. */
function boxMean(src: Float32Array, r: number): Float32Array {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  for (let y = 0; y < GRID_H; y++) {
    const row = y * GRID_W;
    for (let x = 0; x < GRID_W; x++) {
      const a = Math.max(0, x - r);
      const b = Math.min(GRID_W - 1, x + r);
      let s = 0;
      for (let k = a; k <= b; k++) s += src[row + k];
      tmp[row + x] = s / (b - a + 1);
    }
  }
  for (let x = 0; x < GRID_W; x++) {
    for (let y = 0; y < GRID_H; y++) {
      const a = Math.max(0, y - r);
      const b = Math.min(GRID_H - 1, y + r);
      let s = 0;
      for (let k = a; k <= b; k++) s += tmp[k * GRID_W + x];
      out[y * GRID_W + x] = s / (b - a + 1);
    }
  }
  return out;
}

/**
 * Mean of a grid over the band a corridor of the given width actually sweeps
 * when its centreline passes through each cell. Applied to the hazard field it
 * gives the route-search cost surface; applied to the survey field it gives how
 * well the ground under that corridor is actually known.
 */
export function sweptMean(grid: Float32Array, corridorWidthM: number): Float32Array {
  const r = Math.max(1, Math.round(corridorWidthM / 2 / CELL_M));
  return boxMean(grid, r);
}
