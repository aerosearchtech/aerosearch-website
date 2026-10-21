import type { DepthSlice, DisplaySettings, Margins, ProcessingParams } from './types';

export const DATA_DIR = '/demos/gpr/data';
export const THEME_STORAGE_KEY = 'gpr-viewer-theme';

export const LIGHT_SPEED_M_PER_NS = 0.2998;
export const EARTH_M_PER_DEG = 111_320;

export const DEFAULT_PARAMS: ProcessingParams = {
  dewowNs: 10,
  backgroundTraces: 301,
  gainDbPerNs: 0.3,
  flatten: true,
  permittivity: 6,
};

export const PARAM_LIMITS = {
  dewowNs: { min: 0, max: 30, step: 1 },
  backgroundTraces: { min: 0, max: 2001, step: 50 },
  gainDbPerNs: { min: 0, max: 1.5, step: 0.05 },
  permittivity: { min: 1, max: 30, step: 0.5 },
  contrast: { min: 0.5, max: 8, step: 0.1 },
  depthM: { min: 0, max: 1.5, step: 0.02 },
  thicknessM: { min: 0.04, max: 0.5, step: 0.02 },
  overlayOpacity: { min: 0, max: 1, step: 0.05 },
} as const;

export const DEFAULT_DISPLAY: DisplaySettings = { colormap: 'diverging', contrast: 2 };
export const DEFAULT_SLICE: DepthSlice = { depthM: 0.2, thicknessM: 0.1 };

export const FLATTEN_ABOVE_SAMPLES = 40; // air rows kept above the surface when flattened
export const CLIP_PERCENTILE = 0.99;
export const LUT_SIZE = 256;
export const IMAGE_TILE_PX = 8192; // radargram strip width; browsers cap a canvas side at ~32k px

export const DEFAULT_VIEW_ROWS = 320;
export const MIN_VIEW_TRACES = 40;
export const MIN_VIEW_ROWS = 24;
export const ZOOM_STEP = 1.2;

export const CSCAN = {
  cellM: 0.1,
  sigmaM: 0.35, // splat radius; lines are flown 1 m apart
  minWeight: 0.05,
  lowPercentile: 0.02,
  highPercentile: 0.99,
} as const;

export const MAP_HOVER_RADIUS_M = 1.5;
export const MAP_FIT_PAD_M = 3; // margin around the survey area when the map opens
export const MAP_MIN_SPAN_M = 4; // closest map zoom
export const MAP_DRAG_PX = 3; // pointer travel that turns a click into a pan
export const MAP_SCALE_BAR_M = 5;

// Shared plot margins so the B-scan, A-scan and altitude strip line up.
export const BSCAN_MARGIN: Margins = { left: 56, right: 56, top: 22, bottom: 30 };
export const ASCAN_WIDTH = 132;
export const ASCAN_MARGIN: Margins = { left: 8, right: 12, top: 22, bottom: 30 };
// Altitude strip spans B-scan + A-scan; its right margin hosts the series labels.
export const ALT_MARGIN: Margins = { left: 56, right: BSCAN_MARGIN.right + ASCAN_WIDTH, top: 10, bottom: 22 };
// Overview strip under the B-scan; its plot spans exactly the B-scan plot width.
export const OVERVIEW_HEIGHT = 50;
export const OVERVIEW_MARGIN: Margins = { left: BSCAN_MARGIN.left, right: ALT_MARGIN.right, top: 4, bottom: 10 };
export const MAP_MARGIN: Margins = { left: 14, right: 14, top: 14, bottom: 40 };

export const MARK_LABEL_GAP_PX = 28; // closer B-scan marks share one label
// Buried-target overlays.
export const TARGET_VIEW_M = 12; // along-track span shown when jumping to a target
export const TARGET_PIN_PX = 5;
export const TARGET_HIT_PX = 10; // map click/hover radius around a pin
export const MARK_MATCH_M = 1; // an interpreter mark this close to a target counts as on it

export const KEY_PAN_FRACTION = 0.25; // arrow keys pan a quarter of the visible window

// Satellite basemap (Esri World Imagery, Web Mercator XYZ tiles).
export const BASEMAP = {
  url: (z: number, x: number, y: number): string =>
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
  maxZoom: 19,
  maxTiles: 64,
  gridAlpha: 0.85, // C-scan opacity over imagery
  attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
} as const;
