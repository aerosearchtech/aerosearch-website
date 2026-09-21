// Single source of truth for the tactical dark-green palette.
// Hex values must not appear in components — import from here.

export const COLORS = {
  bg: "#030708",
  panel: "#050c09",
  card: "#070f0b",

  bdDim: "#0c1e13",
  bdMid: "#16382a",
  bdHi: "#2a6040",

  green: "#00e060",
  greenDim: "#006030",
  amber: "#ffa800",
  red: "#ff3333",
  blue: "#3d8cff",

  txtHi: "#c0ffd0",
  txtMid: "#60c880",
  txtLo: "#2e5c40",

  // Used by night-mode tints and accent overlays
  redBg: "#1a0000",
  redBd: "#3a0000",
  amberBg: "#160d00",
  amberBd: "#302000",
  blueBg: "#00101a",
  blueBd: "#002040",
  greenBg: "#001810",
  greenBd: "#003020",

  // Threat / track-type accents
  droneAccent: "#ff3333",
  birdAccent: "#ffa800",
  unkAccent: "#c0ffd0",
} as const;

// Per-drone accent colours, used by SwarmPanel cards and PPI FoV arcs.
// Index 0-4 are the canonical MBC-3 five; 5-7 added for swarm-scale demos.
export const DRONE_COLORS = [
  "#00e060",
  "#00c8ff",
  "#80ff00",
  "#ffa800",
  "#a060ff",
  "#ff60a0",
  "#60ffe0",
  "#ffe060",
] as const;

export type ColorKey = keyof typeof COLORS;
