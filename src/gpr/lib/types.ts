export interface SurveyLine {
  id: number;
  start: number;
  end: number;
  lengthM: number;
  direction: 1 | -1;
}

export interface FlightIndexEntry {
  id: string;
  label: string;
  nTraces: number;
}

// Mirrors the JSON written by scripts/export_gpr.py.
export interface FlightMeta {
  id: string;
  label: string;
  source: string;
  radar: string;
  start: string;
  nTraces: number;
  nSamples: number;
  dtNs: number;
  traceRateHz: number;
  t0Sample: number;
  origin: { lat: number; lon: number };
  lines: SurveyLine[];
  x: number[];
  y: number[];
  alt: number[];
  surface: number[];
}

export interface Flight {
  meta: FlightMeta;
  raw: Int16Array;
}

export interface ProcessingParams {
  dewowNs: number;
  backgroundTraces: number;
  gainDbPerNs: number;
  flatten: boolean;
  permittivity: number;
}

export type ColormapName = 'diverging' | 'gray';

export interface DisplaySettings {
  colormap: ColormapName;
  contrast: number;
}

// Processed radargram, trace-major (nTraces x nRows).
export interface Processed {
  data: Float32Array;
  nTraces: number;
  nRows: number;
  zeroRow: number; // row of time zero for the TWT axis (surface when flattened)
  surfaceRow: Int32Array; // ground-reflection row of every trace
  flattened: boolean;
  clip: number; // robust amplitude scale
}

export interface View {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface Cursor {
  trace: number;
  row: number | null;
}

export interface DepthSlice {
  depthM: number;
  thicknessM: number;
}

export interface CScanGrid {
  width: number;
  height: number;
  minX: number;
  maxY: number;
  cellM: number;
  values: Float32Array; // NaN where no coverage
  vmin: number;
  vmax: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Margins {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface TooltipData {
  x: number;
  y: number;
  rows: [string, string][];
}
