// Domain model for the breach-corridor planner.

export type MineType = 'at' | 'ap' | 'pfm1' | 'uxo';
export type SensorTag = 'RGB' | 'LIDAR' | 'POL' | 'LWIR' | 'MAG' | 'EMI' | 'GPR';
export type RouteProfileId = 'safest' | 'balanced' | 'direct';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type MapLayer = 'terrain' | 'hazard' | 'coverage' | 'devices';
export type FixStatus = 'CONFIRMED' | 'PROBABLE';

/** Operation phases, in the doctrinal order: detect -> breach -> proof. */
export type Phase = 'detect' | 'breach' | 'neutralise';

/** Lifecycle of one device on the clearance task board. */
export type TaskState = 'pending' | 'working' | 'neutralised' | 'proofed';

export interface Point {
  x: number; // metres, AOI frame (0 = west edge)
  y: number; // metres, AOI frame (0 = friendly / near edge)
}

export interface Mine {
  id: string;
  x: number;
  y: number;
  type: MineType;
  model: string; // device designation, e.g. "TM-62M"
  confidence: number; // 0..1 fused detection confidence, follows from the channels
  depthM: number; // burial depth below surface
  quality: number; // 0..1 local detection conditions: soil, clutter, look angle
  sensors: SensorTag[]; // payloads that contributed to the fix
}

export interface Minefield {
  seed: number;
  widthM: number;
  depthM: number;
  mines: Mine[];
}

/** Per-channel result of the airborne survey that produced the device plot. */
export interface ChannelCoverage {
  id: SensorTag;
  name: string;
  swathM: number;
  lineSpacingM: number;
  passes: number;
  coveragePct: number; // cells surveyed to a usable standard
  meanQuality: number; // 0..1 mean detection quality over the AO
  fixShare: number; // share of mapped devices this channel contributed to
}

export interface SurveyField {
  seed: number;
  /** Fused per-cell detection quality, 0 = unswept ground, 1 = fully assured. */
  quality: Float32Array;
  channels: ChannelCoverage[];
  meanQuality: number;
  sweptPct: number;
  ageMin: number; // minutes since the survey closed
}

export interface RouteMetrics {
  lengthM: number;
  minesToClear: number;
  turns: number;
  tortuosity: number; // path length / straight-line distance
  minesPer100m: number;
  clearanceMin: number; // blast edge of the closest bypassed device to the lane edge, m
  minutesToClear: number;
  surveyMean: number; // 0..1 mean survey quality over the corridor band
  unsweptM: number; // metres of lane running through under-surveyed ground
  score: number; // 0..1 composite, lower is better
}

export interface Route {
  id: string;
  label: string;
  profile: RouteProfileId;
  path: Point[];
  mineIds: string[];
  metrics: RouteMetrics;
}

export interface Weights {
  risk: number; // aversion to mapped mine density
  resid: number; // aversion to residual risk in under-surveyed ground
  length: number; // aversion to distance
  turn: number; // aversion to convolution
}

export interface EodTeam {
  id: string;
  name: string;
  callsign: string;
}

export interface LogEntry {
  time: string;
  text: string;
  color: string;
}
