// Plan-view depth slice: RMS amplitude in a depth window below the surface,
// Gaussian-splatted from survey-line traces onto a regular metric grid.
import { CSCAN } from './constants';
import { extent } from './extent';
import type { CScanGrid, DepthSlice, FlightMeta, MagneticGrid, Processed } from './types';

export const lineTraceIndices = (meta: FlightMeta): number[] =>
  meta.lines.flatMap((l) => Array.from({ length: l.end - l.start + 1 }, (_, k) => l.start + k));

// Grid value at a local-frame point; NaN outside the grid or its coverage.
export function gridAt(g: CScanGrid, x: number, y: number): number {
  const gx = Math.round((x - g.minX) / g.cellM);
  const gy = Math.round((g.maxY - y) / g.cellM);
  if (gx < 0 || gy < 0 || gx >= g.width || gy >= g.height) return NaN;
  return g.values[gy * g.width + gx];
}

// Exported magnetometer grid (nulls for no coverage) in C-scan grid form.
export const magneticGrid = (m: MagneticGrid): CScanGrid => ({
  width: m.width,
  height: m.height,
  minX: m.minX,
  maxY: m.maxY,
  cellM: m.cellM,
  values: Float32Array.from(m.values, (v) => v ?? NaN),
  vmin: m.vmin,
  vmax: m.vmax,
});

export interface SliceRows {
  offsetRows: number;
  countRows: number;
}

// Depth window below the surface expressed in sample rows.
export function sliceRows(slice: DepthSlice, dtNs: number, velocity: number): SliceRows {
  const rowsPerM = 2 / (velocity * dtNs);
  return {
    offsetRows: Math.round(slice.depthM * rowsPerM),
    countRows: Math.max(1, Math.round(slice.thicknessM * rowsPerM)),
  };
}

function percentile(values: number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(q * (sorted.length - 1))];
}

export function computeCScan(
  meta: FlightMeta,
  p: Processed,
  slice: DepthSlice,
  velocity: number,
): CScanGrid | null {
  const traces = lineTraceIndices(meta);
  if (!traces.length) return null;

  const { offsetRows, countRows } = sliceRows(slice, meta.dtNs, velocity);
  const { cellM, sigmaM, minWeight } = CSCAN;
  const pad = 3 * sigmaM;
  const xs = traces.map((i) => meta.x[i]);
  const ys = traces.map((i) => meta.y[i]);
  const [x0, x1] = extent(xs);
  const [y0, y1] = extent(ys);
  const minX = x0 - pad;
  const maxY = y1 + pad;
  const width = Math.ceil((x1 + pad - minX) / cellM) + 1;
  const height = Math.ceil((maxY - (y0 - pad)) / cellM) + 1;

  const sum = new Float32Array(width * height);
  const wsum = new Float32Array(width * height);
  const radius = Math.ceil(pad / cellM);
  const inv2s2 = 1 / (2 * sigmaM * sigmaM);

  for (const i of traces) {
    const r0 = p.surfaceRow[i] + offsetRows;
    const r1 = Math.min(p.nRows, r0 + countRows);
    if (r0 >= r1) continue;
    let energy = 0;
    for (let r = r0; r < r1; r++) energy += p.data[i * p.nRows + r] ** 2;
    const rms = Math.sqrt(energy / (r1 - r0));

    const gx = (meta.x[i] - minX) / cellM;
    const gy = (maxY - meta.y[i]) / cellM;
    const cx = Math.round(gx);
    const cy = Math.round(gy);
    for (let y = Math.max(0, cy - radius); y <= Math.min(height - 1, cy + radius); y++) {
      for (let x = Math.max(0, cx - radius); x <= Math.min(width - 1, cx + radius); x++) {
        const w = Math.exp(-((x - gx) ** 2 + (y - gy) ** 2) * cellM * cellM * inv2s2);
        sum[y * width + x] += w * rms;
        wsum[y * width + x] += w;
      }
    }
  }

  const values = new Float32Array(width * height);
  const valid: number[] = [];
  for (let k = 0; k < values.length; k++) {
    values[k] = wsum[k] >= minWeight ? sum[k] / wsum[k] : NaN;
    if (!Number.isNaN(values[k])) valid.push(values[k]);
  }
  if (!valid.length) return null;
  return {
    width,
    height,
    minX,
    maxY,
    cellM,
    values,
    vmin: percentile(valid, CSCAN.lowPercentile),
    vmax: percentile(valid, CSCAN.highPercentile),
  };
}
