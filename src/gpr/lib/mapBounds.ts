// Map extent in the local metric frame: the survey area on load, then zoom and pan.
import { MAP_FIT_PAD_M, MAP_MIN_SPAN_M } from './constants';
import { lineTraceIndices } from './cscan';
import { extent } from './extent';
import type { Bounds, FlightMeta } from './types';

// Survey lines and surveyed objects, padded; the whole track when there are no lines.
export function surveyBounds(meta: FlightMeta): Bounds {
  const traces = lineTraceIndices(meta);
  const idx = traces.length ? traces : meta.x.map((_, i) => i);
  const targets = meta.targets ?? [];
  const [minX, maxX] = extent([...idx.map((i) => meta.x[i]), ...targets.map((t) => t.x)]);
  const [minY, maxY] = extent([...idx.map((i) => meta.y[i]), ...targets.map((t) => t.y)]);
  const pad = MAP_FIT_PAD_M;
  return { minX: minX - pad, maxX: maxX + pad, minY: minY - pad, maxY: maxY + pad };
}

// Zoom by `factor` around the world point `at`; refuses to zoom in past MAP_MIN_SPAN_M.
export function zoomBounds(b: Bounds, [x, y]: [number, number], factor: number): Bounds {
  if (factor < 1 && Math.min(b.maxX - b.minX, b.maxY - b.minY) * factor < MAP_MIN_SPAN_M) return b;
  return {
    minX: x - (x - b.minX) * factor,
    maxX: x + (b.maxX - x) * factor,
    minY: y - (y - b.minY) * factor,
    maxY: y + (b.maxY - y) * factor,
  };
}

export const panBounds = (b: Bounds, dx: number, dy: number): Bounds => ({
  minX: b.minX + dx,
  maxX: b.maxX + dx,
  minY: b.minY + dy,
  maxY: b.maxY + dy,
});

export const containsPoint = (b: Bounds, x: number, y: number): boolean =>
  x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY;

export const centerOn = (b: Bounds, x: number, y: number): Bounds =>
  panBounds(b, x - (b.minX + b.maxX) / 2, y - (b.minY + b.maxY) / 2);
