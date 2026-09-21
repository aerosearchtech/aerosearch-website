// Global numeric / string constants used across UI + sim.
// CLAUDE.md rule 9(iii) — no magic numbers in components.

export const MISSION = {
  name: "OP MEHAR — KESTREL SWARM",
  competition: "MBC-3",
  phase: "PHASE-I PREP",
  callsignPrefix: "KESTREL",
} as const;

export const SWARM = {
  size: 5,
  minSize: 2,
  maxSize: 8,
  defaultFormation: "WEDGE",
  // Base waypoint for RTH (relative to swarm-centre)
  baseRel: { x: 0, y: -1500 }, // metres, south of start point
  // Split-mode offsets — group 1 north of centre, group 2 south
  splitOffsetM: 1200,
} as const;

export const RADAR = {
  minRangeKm: 2,
  maxRangeKm: 5,
  rangeOptionsKm: [3, 5, 10] as const,
  fovDeg: 90,
  revisitTargetSec: 10,
  rangeResolutionM: 120,
  detectAzHalfDeg: 45,
  detectAltHalfM: 500,
  freqGhzMin: 9,
  freqGhzMax: 11,
  bandwidthMHz: 1.25,
  txPowerWMin: 40,
  txPowerWMax: 80,
  prfHzMin: 800,
  prfHzMax: 1200,
} as const;

export const BATTERY = {
  rthThresholdPct: 25,
  rechargedPct: 80,
  // %/sec drain rates
  drainPropulsionPctSec: 0.025,
  drainRadarPctSec: 0.012,
  drainCommsPctSec: 0.004,
} as const;

export const COMMS = {
  protocol: "OLSR",
  baseLatencyMs: 7,
  jitterMs: 4,
  signalLossRangeM: 6000,
  heartbeatTimeoutSec: 30,
} as const;

export const SIM = {
  tickMs: 100, // 10 Hz
  defaultSpeed: 1,
  speedOptions: [0.5, 1, 2, 4] as const,
} as const;

export const TARGET = {
  vMinMs: 10,
  vMaxMs: 40,
  rcsMin: 0.18,
  rcsMax: 0.55,
  initialCount: 5,
} as const;
