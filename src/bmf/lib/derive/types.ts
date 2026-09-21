// View-model shapes shared by the phase derivations. Components consume these
// only — they never reach into store state directly.

import type { BreachForce, SurveyWave } from '../constants';
import type { DensityStats } from '../density';
import type { Mine, Phase, Point, Route, SensorTag, Severity, TaskState } from '../types';
import type { useGcs } from '../store';

export type State = ReturnType<typeof useGcs.getState>;

export interface Kpi {
  label: string;
  val: string;
  unit: string;
  color: string;
}

export interface PhaseTab {
  id: Phase;
  label: string;
  caption: string;
  active: boolean;
  status: string;
  statusColor: string;
}

export interface OptionCard {
  id: string;
  label: string;
  tag: string;
  caption: string;
  color: string;
  rowBg: string;
  best: boolean;
  selected: boolean;
  mines: number;
  lengthM: number;
  turns: number;
  effort: string;
  conf: number;
  confW: string;
  unswept: boolean;
  unsweptM: number;
}

export interface TaskRow {
  id: string;
  seq: number;
  model: string;
  typeLabel: string;
  short: string;
  sev: Severity;
  color: string;
  rowBg: string;
  chainageM: number;
  depth: string;
  conf: number;
  confW: string;
  sensors: string[];
  status: string;
  statusColor: string;
  effort: string;
  effortMin: number;
  state: TaskState;
  stateLabel: string;
  stateColor: string;
  /** Colour the map marker takes in the current phase. */
  markerColor: string;
  /** Resolved as nothing there — no charge was expended on it. */
  falseAlarm: boolean;
  teamId: string | null;
  teamName: string;
  teamColor: string;
}

export interface CompareRow {
  id: string;
  label: string;
  tag: string;
  color: string;
  mines: number;
  mineW: string;
  lengthM: number;
  turns: number;
  conf: number;
  best: boolean;
}

export interface BarRow {
  key: string;
  label: string;
  detail: string;
  color: string;
  value: number;
  width: string;
}

export interface ChannelRow {
  id: SensorTag;
  name: string;
  color: string;
  coveragePct: number;
  coverageW: string;
  quality: number;
  fixShare: number;
  fixW: string;
  passes: number;
  swathM: number;
  lineSpacingM: number;
  /** Swath narrower than the line spacing — unswept strips between passes. */
  holiday: boolean;
}

export interface InventoryRow {
  id: string;
  model: string;
  short: string;
  typeLabel: string;
  sev: Severity;
  color: string;
  rowBg: string;
  conf: number;
  confW: string;
  depth: string;
  sensors: string[];
  grid: string;
  status: string;
  statusColor: string;
}

export interface LogLine {
  time: string;
  text: string;
  color: string;
}

export interface DensityRow {
  key: string;
  label: string;
  value: string;
  unit: string;
  color: string;
  note?: string;
}

export interface DetectView {
  density: DensityStats;
  densityRows: DensityRow[];
  channels: ChannelRow[];
  inventory: InventoryRow[];
  classTally: BarRow[];
  confBins: BarRow[];
  surveyLog: LogLine[];
  meanConf: number;
  sweptPct: number;
  /** Devices the survey has actually fixed so far. */
  mapped: number;
  meanQuality: number;
  ageStr: string;
  /** Unit for ageStr — a survey still flying is LIVE, not an age. */
  ageUnit: string;
  channelsUp: number;
}

export interface TeamRow {
  id: string;
  name: string;
  callsign: string;
  color: string;
  assigned: number;
  done: number;
  /** Flown minutes still outstanding for this sortie. */
  minutes: number;
  /** Flown minutes the whole sortie takes, launch to its last device proofed. */
  minutesTotal: number;
  loadW: string;
}

export interface GateRow {
  label: string;
  detail: string;
  pass: boolean;
}

/** A neutralisation drone on task: where it is and what it is doing. */
export interface DroneRow {
  id: string;
  name: string;
  callsign: string;
  color: string;
  /** World position — the device it is working, or the staging point. */
  at: Point;
  from: Point;
  targetId: string | null;
  state: 'staged' | 'transit' | 'placing' | 'rearm' | 'standoff' | 'complete';
  stateLabel: string;
  charges: number;
}

export interface NeutraliseView {
  teams: TeamRow[];
  drones: DroneRow[];
  tally: BarRow[];
  gate: GateRow[];
  certified: boolean;
  progressPct: number;
  proofedPct: number;
  remainingMin: number;
  timeToOpenStr: string;
  committed: number;
  unassigned: number;
}

/** Live clearance playback, null when none is running. */
export interface ClearanceView {
  headline: string;
  headColor: string;
  drones: DroneRow[];
  /** The plan's verdict on every device, which overrides the manual board. */
  states: Map<string, TaskState>;
  /** Contacts that resolved as nothing there. */
  falseAlarms: Set<string>;
  /** Charges the whole lane needs, and how many are placed so far. */
  charges: number;
  chargesPlaced: number;
  /** False alarms the lane holds, and how many have been flown to yet. */
  falseAlarmCount: number;
  falseAlarmsFound: number;
  tasked: number;
  proofed: number;
  shots: number;
  shotDevices: number;
  standoff: boolean;
  /** Mission seconds flown so far, the clock the outstanding effort counts down. */
  missionS: number;
  missionStr: string;
  totalStr: string;
  progressPct: number;
  barW: string;
  playing: boolean;
  done: boolean;
}

export interface ChannelTile {
  key: SensorTag;
  label: string;
  name: string;
  pct: number;
  strong: boolean;
  contributed: boolean;
}

/** One device opened up: what every payload saw and what follows from it. */
export interface FusionView {
  id: string;
  model: string;
  typeLabel: string;
  short: string;
  sev: Severity;
  color: string;
  sevBg: string;
  grid: string;
  depth: string;
  chainageM: number;
  channels: ChannelTile[];
  fused: number;
  fusedColor: string;
  agreement: string;
  verdict: string;
}

export interface ViewModel {
  phase: Phase;
  phases: PhaseTab[];
  classText: string;
  classBg: string;
  clockStr: string;
  statusText: string;
  statusColor: string;
  kpis: Kpi[];
  options: OptionCard[];
  tasks: TaskRow[];
  compare: CompareRow[];
  selected: Route | null;
  selectedMines: Mine[];
  totalDevices: number;
  corridorWidthM: number;
  breachForce: BreachForce;
  laneHours: string;
  fieldHours: string;
  savedPct: number;
  solveMs: number;
  planning: boolean;
  detect: DetectView;
  neutralise: NeutraliseView;
  fusion: FusionView | null;
  preflight: PreflightView;
  /** Live survey playback, null when no run is loaded. */
  run: RunView | null;
  /** Live clearance playback, null when none is running. */
  clearance: ClearanceView | null;
}

export const hm = (minutes: number): string =>
  `${Math.floor(minutes / 60)}h ${String(Math.round(minutes % 60)).padStart(2, '0')}m`;

export const pad = (s: number): string => String(s).padStart(2, '0');

export interface PayloadRow {
  id: SensorTag;
  /** Airframes on this channel. Slaved to the host when the sensor rides. */
  count: number;
  name: string;
  agl: string;
  speed: string;
  /** Usable on-task minutes per pack, the host's when the sensor rides. */
  pack: string;
  color: string;
  rides: string | null;
}

export interface TempoRow {
  id: SensorTag;
  /** Airframes on this channel. A riding sensor has no row of its own. */
  count: number;
  /** How the channel is flown when it is not a plain raster of the AO. */
  note: string | null;
  hours: string;
  color: string;
  /** The channel that sets the survey's length — everything else finishes inside it. */
  critical: boolean;
}

export interface PreflightView {
  areaHa: string;
  areaKm2: string;
  vertices: number;
  axisM: number;
  widthM: number;
  columnLabel: string;
  columnPlatform: string;
  blockingM: number;
  channels: PayloadRow[];
  /** Total airframes the apportionment puts in the air. */
  airframes: number;
  /** Per-channel survey cost for the committed apportionment. */
  tempo: TempoRow[];
  /** Flying time the whole survey takes — channels overlap, so the slowest one. */
  tempoTotal: string;
  tempoDays: string;
  /** Name of the critical channel, for the line under the total. */
  criticalId: SensorTag;
}

/** A depth interval that has been swept, in metres from the near edge. */
export interface RunBand {
  y0: number;
  y1: number;
}

export interface SurveyDroneRow {
  id: string;
  callsign: string;
  /** The channel when on task, otherwise what the airframe is doing instead. */
  mode: string;
  color: string;
  /** Usable pack charge left, 0..1. */
  charge: number;
  chargeColor: string;
  at: Point;
}

/** A pad on the swap station apron. */
export interface RunPadRow {
  at: Point;
  busy: boolean;
}

export interface RunChannelRow {
  id: SensorTag;
  name: string;
  color: string;
  /** Airframes apportioned to this channel. */
  count: number;
  pct: number;
  barW: string;
  detail: string;
  flying: boolean;
}

export interface RunView {
  headline: string;
  headColor: string;
  drones: SurveyDroneRow[];
  channels: RunChannelRow[];
  /** Ground anything has flown over. Everything else is still unlooked-at. */
  swept: RunBand[];
  /** Northing of each rastering airframe's sweep front. */
  fronts: { y: number; color: string }[];
  /** The swap station apron, one pad per committed airframe. */
  pads: RunPadRow[];
  padsBusy: number;
  visibleIds: Set<string>;
  /** 0..1 completion per channel, for the coverage panel and survey log. */
  progress: Record<SensorTag, number>;
  /** Fraction of the AO anything has flown over yet. */
  sweptK: number;
  found: number;
  total: number;
  progressPct: number;
  barW: string;
  missionStr: string;
  /** What a blind full-stack raster of the same AO would have cost. */
  blindStr: string;
  cuedStr: string;
  playing: boolean;
  done: boolean;
}
