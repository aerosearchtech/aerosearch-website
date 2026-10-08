// Single source of colour and layout constants for the detection page.

// Canvas colours are resolved from the stylesheet so the map follows the theme.
// COLORS is read every frame; syncTheme() refills it when the theme changes.
const CANVAS_TOKENS = {
  mapVoid: '--stage',
  panel: '--panel',
  text: '--ink',
  muted: '--sub',
  accent: '--accent',
  miss: '--miss',
  alarm: '--alarm',
  confirmed: '--confirmed',
  representative: '--representative',
  measured: '--measured',
  shadow: '--drop-shadow',
};

export const COLORS = {};

export function syncTheme() {
  const style = getComputedStyle(document.documentElement);
  Object.entries(CANVAS_TOKENS).forEach(([name, token]) => {
    COLORS[name] = style.getPropertyValue(token).trim();
  });
}

export const THEME_KEY = 'survey-theme';

export const SENSORS = {
  rgb: { label: 'RGB', color: '#4ea3ff' },
  thermal: { label: 'Thermal', color: '#ff8a3d' },
  emi: { label: 'EMI', color: '#3ddc84' },
  mag: { label: 'Magnetic', color: '#c678dd' },
};

export const SENSOR_KEYS = Object.keys(SENSORS);

// The tile pyramid and survey manifest are shared with the layer explorer.
// Packaging for the website rewrites this one line when the folders move.
export const ASSET_BASE = '../viewer/assets';

// Survey replay: one pass per sensor, flown in this order. Lane count and swath
// reflect how each payload is actually flown - a camera sees a wide strip from
// altitude, a coil or magnetometer sweeps a narrow line and needs many more.
// Pass duration is set against the length of track each sensor actually flies,
// so the camera reads as fast and wide and the coils as slow and narrow.
export const PASSES = [
  { sensor: 'rgb', lanes: 5, swathM: 3.5, seconds: 8, seed: 0x5eed01 },
  { sensor: 'thermal', lanes: 6, swathM: 2.8, seconds: 10, seed: 0x5eed02 },
  { sensor: 'emi', swathM: 2.2, seconds: 12, seed: 0x5eed03 },
  { sensor: 'mag', instant: true, seconds: 4, seed: 0x5eed04 },
];

// Full-field rasters shared with the layer explorer.
export const SHARED_BASE = '../assets';

// Surveys that published their own sample positions fly the recorded track
// rather than a synthetic lawnmower, so spacing, extent and drift are the real
// ones. EMI published a line id per sample. The magnetic product is a gridded
// surface with no flight lines in it, so its pass presents the whole grid at
// once rather than animating a path that was never recorded.
export const MEASURED_TRACKS = {
  emi: { kind: 'lines', points: `${SHARED_BASE}/emi_points.json` },
};

// How the readout names what a pass covered.
export const TRACK_LABELS = {
  lines: 'recorded lines',
  synthetic: 'lanes',
  instant: 'full-field gridded product',
};

// How far back the heading is read when a line is carried out to the field edge.
export const TRACK = { headingSamples: 8 };

// A real airframe does not fly a ruled line. Lateral error is a slow random walk
// plus a low-frequency oscillation, both in metres of cross-track offset.
export const DRIFT = {
  stepM: 0.25,
  walkM: 0.014,
  damping: 0.96,
  maxM: 0.25,
  sineM: 0.09,
  periodM: 17,
  speedJitter: 0.07,
};

// Rendered response surface each pass paints in behind the aircraft, over the
// RGB mosaic the opening pass builds.
export const SENSOR_LAYERS = {
  thermal: 'thermal.jpg',
  emi: 'emi.png',
  mag: 'magdrone.png',
};

export const REPLAY = {
  trackWidth: 1.5,
  swathAlpha: 0.16,
  // The swath is an instantaneous footprint, so it trails the aircraft over this
  // many metres rather than painting the whole flown track.
  swathTrailM: 7,
  doneTrackAlpha: 0.12,
  // Imagery ahead of the aircraft is context, not acquired data.
  ghostAlpha: 0.08,
  layerAlpha: 0.88,
  popMs: 420,
  fusedMs: 700,
  minSensorsToFuse: 2,
  speeds: [0.5, 1, 2],
  overlayFont: '10px Segoe UI',
  recordFps: 30,
  recordBitrate: 6000000,
};

// Why a sensor fired where there was no reported target.
export const CAUSE_LABELS = {
  clutter: 'buried clutter',
  control: 'control hole',
  background: 'open ground',
};

export const MAP = {
  tileSize: 256,
  markerRadius: 7,
  ringWidth: 3,
  // Click tolerance when picking a target, in field pixels.
  pickRadiusPx: 24,
  minScale: 0.3,
  maxScale: 14,
  zoomStep: 1.15,
};

export const CLASS_LABELS = {
  ordnance: 'Ordnance',
  minimum_metal: 'Minimum metal',
  clutter: 'Clutter',
  control: 'Control / blank',
};
