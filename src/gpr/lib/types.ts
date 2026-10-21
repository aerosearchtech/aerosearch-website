export interface SurveyLine {
  id: number;
  name?: string; // source profile file
  start: number;
  end: number;
  lengthM: number;
  direction: 1 | -1;
}

export interface FlightIndexEntry {
  id: string;
  group: string;
  label: string;
  nTraces: number;
  targets: number;
}

// Operator event mark recorded on a trace (e.g. passing over a known target).
export interface TraceMark {
  trace: number;
  value: number;
}

// Published per-profile interpretation score: 0 not, 1 possibly, 2 most likely detected.
export type DetectionScore = 0 | 1 | 2;

// A survey line passing within reach of a buried target, at its closest trace.
export interface TargetPass {
  line: number;
  trace: number;
  offsetM: number;
  score: DetectionScore | null;
}

// Surveyed buried object; evaluation fields are null when it was not evaluated.
export interface Target {
  no: number | null;
  name: string;
  x: number;
  y: number;
  depthM: [number, number] | null;
  size: string | null;
  gpr: boolean | null;
  mag: boolean | null;
  passes: TargetPass[];
}

export interface Truth {
  source?: string;
  quote?: string;
}

// Total-field anomaly on the local metric grid; null where not surveyed.
export interface MagneticGrid {
  kind: 'grid';
  unit: string;
  width: number;
  height: number;
  minX: number;
  maxY: number;
  cellM: number;
  vmin: number;
  vmax: number;
  values: (number | null)[];
  source?: string;
}

// Rendered anomaly map without values, placed by three local-frame corners.
export interface MagneticImage {
  kind: 'image';
  src: string;
  nw: [number, number];
  ne: [number, number];
  sw: [number, number];
  source?: string;
}

export type MagneticLayer = MagneticGrid | MagneticImage;

export type MapLayer = 'gpr' | 'mag';

// Mirrors the JSON written by scripts/export_gpr.py (and export_site.py).
export interface FlightMeta {
  id: string;
  group: string;
  label: string;
  note?: string;
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
  marks?: TraceMark[];
  defaults?: Partial<ProcessingParams>; // processing suited to this dataset (e.g. already filtered)
  targets?: Target[];
  truth?: Truth;
  magnetic?: MagneticLayer;
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

// Axis-aligned extent in the local metric frame (metres east/north of the origin).
export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
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
