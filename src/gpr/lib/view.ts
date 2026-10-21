import { DEFAULT_VIEW_ROWS, MIN_VIEW_ROWS, MIN_VIEW_TRACES } from './constants';
import type { FlightMeta, View } from './types';

export const fullView = (meta: FlightMeta): View => ({
  x0: 0,
  x1: meta.nTraces,
  y0: 0,
  y1: Math.min(meta.nSamples, DEFAULT_VIEW_ROWS),
});

function clampRange(a: number, b: number, max: number, minSpan: number): [number, number] {
  const span = Math.min(max, Math.max(minSpan, b - a));
  const start = Math.max(0, Math.min(max - span, a));
  return [start, start + span];
}

export function clampView(v: View, meta: FlightMeta): View {
  const [x0, x1] = clampRange(v.x0, v.x1, meta.nTraces, MIN_VIEW_TRACES);
  const [y0, y1] = clampRange(v.y0, v.y1, meta.nSamples, MIN_VIEW_ROWS);
  return { x0, x1, y0, y1 };
}

// Zoom one axis by `factor` around the data coordinate `at`.
export function zoomAxis(a: number, b: number, at: number, factor: number): [number, number] {
  return [at - (at - a) * factor, at + (b - at) * factor];
}
