import type { EodTeam, MapLayer, MineType, Phase, Point, RouteProfileId, SensorTag, Severity, TaskState, Weights } from './types';

/** Area of interest and search grid. */
export const AOI_WIDTH_M = 520;
export const AOI_DEPTH_M = 340;
export const CELL_M = 2;
export const GRID_W = Math.round(AOI_WIDTH_M / CELL_M);
export const GRID_H = Math.round(AOI_DEPTH_M / CELL_M);

/** Operation phases in doctrinal order. */
export interface PhaseSpec {
  id: Phase;
  label: string;
  caption: string;
}

export const PHASES: PhaseSpec[] = [
  { id: 'detect', label: 'DETECT', caption: 'Airborne survey result' },
  { id: 'breach', label: 'BREACH', caption: 'Corridor lane plan' },
  { id: 'neutralise', label: 'NEUTRALISE', caption: 'Clearance & proofing' },
];

/** Map layer each phase opens on. */
export const PHASE_LAYER: Record<Phase, MapLayer> = {
  detect: 'coverage',
  breach: 'hazard',
  // Clearance reads against the hazard field: the operator is looking at what
  // the lane threads through, not at an unweighted plot of every contact.
  neutralise: 'hazard',
};

/**
 * Obstacle layout, to Soviet/Russian doctrine: anti-tank rows at 4–5.5 m mine
 * spacing giving 750–1,000 mines per kilometre of front, two to four rows to a
 * belt with 20–40 m between rows, laid as staggered panels rather than one
 * continuous line so a gap in one row does not open a gap through the belt.
 */
export const BELT = {
  /** Fraction of the AO width each belt centre sits at. */
  centres: [0.28, 0.6],
  rowsPerBelt: 3,
  rowSpacingM: { min: 22, max: 34 },
  /** Mine interval within an anti-tank row. */
  atSpacingM: { min: 4, max: 5.5 },
  /** Protective anti-personnel rows tied to each belt, on the enemy side. */
  apRowsPerBelt: 2,
  apSpacingM: { min: 2.2, max: 3.4 },
  apOffsetM: { min: 6, max: 16 },
  /** Panels: laid stretches and the gaps between them, along the front. */
  panelM: { min: 38, max: 82 },
  gapM: { min: 9, max: 22 },
} as const;

/** Scatterable PFM-1 delivered by rocket cassette — long, narrow footprints. */
export const STRIKE = {
  count: { min: 2, max: 4 },
  alongM: { min: 60, max: 110 },
  acrossM: { min: 16, max: 34 },
  submunitions: { min: 26, max: 52 },
} as const;

/** Corridor widths the breaching detachment can work with. */
export const CORRIDOR_WIDTHS_M = [3, 6, 9] as const;
/** Share of the view height the corridor should fill when the map frames it. */
export const LANE_FRAME_FRACTION = 0.14;
export const DEFAULT_CORRIDOR_WIDTH_M = 6;

/** Extra standoff beyond the corridor edge that still has to be cleared. */
export const CLEAR_MARGIN_M = 1.5;

/** Per-type clearance/hazard characteristics. */
export interface MineSpec {
  label: string;
  short: string;
  sev: Severity;
  models: string[];
  clearRadiusM: number; // effective hazard radius used for the risk kernel
  riskWeight: number; // relative cost of having to neutralise one
  minutesToClear: number; // manual breaching effort per device
}

export const MINE_SPECS: Record<MineType, MineSpec> = {
  at: {
    label: 'Anti-tank',
    short: 'AT',
    sev: 'CRITICAL',
    models: ['TM-62M', 'TM-57', 'Type 72'],
    clearRadiusM: 6,
    riskWeight: 1.0,
    minutesToClear: 25,
  },
  ap: {
    label: 'Anti-personnel',
    short: 'AP',
    sev: 'HIGH',
    models: ['PMA-2', 'PMN-2', 'M14'],
    clearRadiusM: 3.5,
    riskWeight: 0.7,
    minutesToClear: 15,
  },
  pfm1: {
    label: 'PFM-1 scatterable',
    short: 'PFM',
    sev: 'MEDIUM',
    models: ['PFM-1 «Butterfly»'],
    clearRadiusM: 2.5,
    riskWeight: 0.55,
    minutesToClear: 10,
  },
  uxo: {
    label: 'UXO / submunition',
    short: 'UXO',
    sev: 'LOW',
    models: ['OZM-72', 'AO-2.5RT', 'M18A1'],
    clearRadiusM: 5,
    riskWeight: 0.85,
    minutesToClear: 30,
  },
};

export const MINE_TYPES: MineType[] = ['at', 'ap', 'pfm1', 'uxo'];

/**
 * Survey payloads. Swath narrower than the line spacing leaves holidays —
 * unswept strips that carry residual risk even where nothing was detected.
 */
export interface SensorChannel {
  id: SensorTag;
  name: string;
  aglM: number; // flight height above ground for this channel
  speedMs: number; // survey ground speed
  /** Swath and line spacing scaled up so the coverage overlay stays legible. */
  swathM: number;
  lineSpacingM: number;
  weight: number; // contribution to the fused survey quality
  dropouts: number; // aborted lines / comms loss / terrain shadow
  ridesWith?: SensorTag; // shares another channel's pass, so costs no extra flying
  /**
   * True swath and line spacing on the ground, from the measured sensor table
   * in `simulations/sim/config.py`. The swathM/lineSpacingM figures above are
   * scaled up so the coverage overlay stays legible; these are what the airframe
   * actually flies, and they are what every figure quoted to the operator uses.
   */
  physicalSwathM: number;
  physicalSpacingM: number;
  wave: SurveyWave;
  colorKey: 'bl' | 'mg' | 'or' | 'tl' | 'gn' | 'vt' | 'lm';
}

/**
 * Which sortie a channel flies on. The split is by height and speed: the aerial
 * wave covers ground fast enough to raster the whole AO, the magnetics wave is
 * slow but still affordable, and GPR is a tenth the speed again — so it is
 * never rastered, only cued onto anomalies the first two waves found.
 */
export type SurveyWave = 'aerial' | 'magnetics' | 'gpr';

/**
 * Ordered high-and-fast to low-and-slow, which is also the order they fly.
 * Polarimetric rides the thermal gimbal, so it shares the thermal line spacing
 * and dropouts and only differs in swath. EMI flies at magnetometer height on a
 * tighter swath, which is why it is the second most expensive channel to fly.
 */
export const SENSOR_CHANNELS: SensorChannel[] = [
  { id: 'RGB', name: 'Visual photogrammetry', aglM: 40, speedMs: 8, swathM: 46, lineSpacingM: 32, physicalSwathM: 41.0, physicalSpacingM: 32.8, wave: 'aerial', weight: 0.15, dropouts: 1, colorKey: 'bl' },
  { id: 'LIDAR', name: 'LiDAR bare-earth', aglM: 40, speedMs: 8, swathM: 46, lineSpacingM: 32, physicalSwathM: 41.0, physicalSpacingM: 32.8, wave: 'aerial', weight: 0.16, dropouts: 1, colorKey: 'lm' },
  { id: 'POL', name: 'Polarimetric DoLP', aglM: 18, speedMs: 4, swathM: 28, lineSpacingM: 32, physicalSwathM: 13.5, physicalSpacingM: 16.7, wave: 'aerial', weight: 0.18, dropouts: 2, ridesWith: 'LWIR', colorKey: 'mg' },
  { id: 'LWIR', name: 'Thermal LWIR', aglM: 20, speedMs: 4, swathM: 34, lineSpacingM: 32, physicalSwathM: 22.2, physicalSpacingM: 16.7, wave: 'aerial', weight: 0.2, dropouts: 2, colorKey: 'or' },
  { id: 'MAG', name: 'Magnetometer boom', aglM: 1.2, speedMs: 4, swathM: 12, lineSpacingM: 12, physicalSwathM: 3.0, physicalSpacingM: 3.0, wave: 'magnetics', weight: 0.3, dropouts: 2, colorKey: 'tl' },
  { id: 'EMI', name: 'EMI coil array', aglM: 1.2, speedMs: 4, swathM: 8, lineSpacingM: 8, physicalSwathM: 2.1, physicalSpacingM: 2.1, wave: 'magnetics', weight: 0.28, dropouts: 3, colorKey: 'gn' },
  { id: 'GPR', name: 'Ground-penetrating radar', aglM: 0.6, speedMs: 1, swathM: 8, lineSpacingM: 10, physicalSwathM: 0.5, physicalSpacingM: 0.5, wave: 'gpr', weight: 0.35, dropouts: 3, colorKey: 'vt' },
];

/** Quality retained at the outer edge of a sensor swath. */
export const SWATH_EDGE_QUALITY = 0.55;

/** At or above this a cell counts as surveyed to a usable standard. */
export const SWEPT_THRESHOLD = 0.5;

/** Operator weight sliders (base weights, retuned live). */
export const DEFAULT_WEIGHTS: Weights = { risk: 0.6, resid: 0.35, length: 0.25, turn: 0.15 };

/** Generation profiles: each option is the base weights biased one way. */
export interface RouteProfile {
  id: RouteProfileId;
  label: string;
  caption: string;
  bias: Weights; // multipliers applied to the base weights
}

export const ROUTE_PROFILES: RouteProfile[] = [
  {
    id: 'safest',
    label: 'LANE-A',
    caption: 'Fewest devices to neutralise',
    bias: { risk: 2.2, resid: 1.6, length: 1.0, turn: 0.8 },
  },
  {
    id: 'balanced',
    label: 'LANE-B',
    caption: 'Best effort-to-exposure trade',
    bias: { risk: 1.0, resid: 1.0, length: 1.0, turn: 1.0 },
  },
  {
    id: 'direct',
    label: 'LANE-C',
    caption: 'Shortest, straightest breach',
    bias: { risk: 0.35, resid: 0.3, length: 2.0, turn: 2.4 },
  },
];

export const PROFILE_TAG: Record<RouteProfileId, string> = {
  safest: 'SAFEST',
  balanced: 'BALANCED',
  direct: 'DIRECT',
};

/** Diversity: a duplicate option is pushed off the ground already committed. */
export const DIVERSITY_RADIUS_MULT = 2.2; // x corridor half-width
export const DIVERSITY_PENALTY = 3.5;

/** Turn cost is charged per radian of heading change at a waypoint. */
export const TURN_COST_M_PER_RAD = 38;
/** A shortcut only replaces a deviation when it is this much cheaper. */
export const SHORTCUT_GAIN = 0.98;
/** Corner rounding: fraction of each leg cut away, and how many passes. */
export const SMOOTH_CUT = 0.25;
export const SMOOTH_PASSES = 2;

/** Risk kernel falls off to ~0 by this multiple of the clearance radius. */
export const RISK_KERNEL_SPAN = 2.2;

/** A heading change above this counts as a manoeuvre for the crew. */
export const TURN_THRESHOLD_RAD = 0.26; // ~15 deg

export const DEFAULT_SEED = 20260819;

/** Settle time before a re-plan fires, so slider drags stay responsive. */
export const SOLVE_DEBOUNCE_MS = 220;

/**
 * Default axis of advance: west to east, across the obstacle belts. The belts
 * are laid perpendicular to it, so the front the minefield covers is the AOI's
 * 340 m north-south dimension.
 */
export const DEFAULT_START = { x: 8, y: AOI_DEPTH_M * 0.5 };
export const DEFAULT_GOAL = { x: AOI_WIDTH_M - 8, y: AOI_DEPTH_M * 0.5 };

/** The front the obstacle covers, used for mines-per-km-of-front density. */
export const FRONT_M = AOI_DEPTH_M;

/** Manual clearance rate assumed when costing a full-field breach, m²/hour. */
export const MANUAL_CLEAR_RATE_M2_PER_HR = 25;

/**
 * What each lane width actually buys, to NATO breaching standards: a 1 m
 * footpath passes dismounted troops, 4.5 m is the minimum for the vehicles
 * conducting the assault, and 10 m allows two-way traffic.
 */
export interface BreachForce {
  label: string;
  detail: string;
  icons: ('soldier' | 'apc' | 'tank' | 'artillery')[];
}

export const BREACH_FORCE: Record<number, BreachForce> = {
  3: {
    label: 'DISMOUNTED',
    detail: 'Infantry in file · no vehicles',
    icons: ['soldier', 'soldier', 'soldier'],
  },
  6: {
    label: 'MOUNTED ASSAULT',
    detail: 'Above the 4.5 m assault minimum',
    icons: ['soldier', 'apc', 'apc'],
  },
  9: {
    label: 'TWO-WAY ARMOUR',
    detail: 'Near the 10 m two-way standard',
    icons: ['tank', 'apc', 'artillery'],
  },
};

/** EOD detachments available to work the lane. */
export const EOD_TEAMS: EodTeam[] = [
  { id: 'A', name: 'ALPHA', callsign: 'UAS-1' },
  { id: 'B', name: 'BRAVO', callsign: 'UAS-2' },
  { id: 'C', name: 'CHARLIE', callsign: 'UAS-3' },
];

/**
 * Neutralisation by drone-delivered charge. The devices are not lifted by hand:
 * an airframe flies out with a rack of charges, places one beside each device,
 * returns to reload, and a stretch is fired together once it is fully charged.
 * `MINE_SPECS[].minutesToClear` is the *manual* rate and is kept only as the
 * baseline this replaces — it is not what the swarm is costed at.
 *
 * Mirrored from `simulations/sim/config.py`, where they are marked ASSUMED:
 * engineering estimates rather than measured sortie data. Totals are most
 * sensitive to NEUT_PLACE_S and NEUT_SHOT_S.
 */
export const CHARGES_PER_SORTIE = 4;
export const NEUT_TRANSIT_SPEED_MS = 12;
/** Approach, hover, place the charge beside a buried device, climb clear. */
export const NEUT_PLACE_S = 90;
/** Repositioning between two devices inside the same sortie. */
export const NEUT_HOP_S = 20;
/** Land, reload the rack, swap the pack. */
export const NEUT_TURNAROUND_S = 300;
/** Charges fired in one event — placed charges are not left armed. */
export const NEUT_SHOT_DEVICES = 12;
/**
 * Withdraw to safe distance, fire, wait for settle, re-enter and proof. Does
 * not parallelise: one shot at a time on one lane, so every airframe stands off.
 */
export const NEUT_SHOT_S = 1500;
/** Fraction of the shot spent withdrawing and firing, then settling. */
export const SHOT_FIRE_K = 0.4;
export const SHOT_PROOF_K = 0.7;

/** Wall-clock seconds the clearance playback runs for. */
export const CLEARANCE_SECONDS = 48;

/**
 * Screen share the shots get, however long they really take. A shot is most of
 * the clearance clock — withdraw, fire, settle, re-enter, on one lane at a time
 * — so played in proportion it is half a minute of a still picture. The mission
 * hours quoted stay the real ones; only the pacing is budgeted.
 */
export const SHOT_SCREEN_K = 0.18;

export const TASK_STATE_ORDER: TaskState[] = ['pending', 'working', 'neutralised', 'proofed'];

export const TASK_STATE_LABEL: Record<TaskState, string> = {
  pending: 'PENDING',
  working: 'WORKING',
  neutralised: 'NEUTRALISED',
  proofed: 'PROOFED',
};

/** Lane certification thresholds. */
export const PROOF_MIN_SURVEY = 0.55;
export const PROOF_MAX_UNSWEPT_M = 40;
// Blast-edge standoff is guaranteed to exceed CLEAR_MARGIN_M by the clearance
// rule, so this gate is a plan-integrity assertion: it catches a lane that was
// edited after tasking, not an independent margin test.
export const PROOF_MIN_STANDOFF_M = CLEAR_MARGIN_M;

export const OPERATION_NAME = 'OP IRON-GATE';
export const AO_NAME = 'AO RANN-3';
export const CLASSIFICATION = 'CONFIDENTIAL';

/**
 * How strongly each payload responds to each device class, 0..1.
 *
 * This is the reason the fusion panel shows every channel rather than one
 * verdict. Magnetometer reads ferrous mass, so a steel-cased TM-62M lights it
 * and a 100 g plastic PMA-2 barely moves it; a PFM-1 is all plastic and leaves
 * it flat. EMI reads conductivity rather than ferrous mass, so it still finds
 * the striker and detonator inside a minimum-metal mine — which is the whole
 * reason it is carried alongside the magnetometer rather than instead of it.
 * GPR reads dielectric contrast and sees all of them. Polarimetry separates
 * smooth man-made surfaces from rough soil, so it peaks exactly where the
 * metal channels fail: a plastic PFM-1 lying on the surface.
 */
export const SENSOR_RESPONSE: Record<SensorTag, Record<MineType, number>> = {
  RGB: { at: 0.45, ap: 0.5, pfm1: 0.88, uxo: 0.6 },
  // Micro-relief, not the object: LiDAR reads the spoil and tamping a laying
  // party leaves, so it is strongest on the devices that disturb most ground
  // and weakest on a surface-scattered mine that disturbed none.
  LIDAR: { at: 0.62, ap: 0.42, pfm1: 0.3, uxo: 0.55 },
  POL: { at: 0.55, ap: 0.5, pfm1: 0.92, uxo: 0.6 },
  LWIR: { at: 0.7, ap: 0.5, pfm1: 0.75, uxo: 0.65 },
  MAG: { at: 0.95, ap: 0.22, pfm1: 0.05, uxo: 0.95 },
  EMI: { at: 0.92, ap: 0.55, pfm1: 0.25, uxo: 0.95 },
  GPR: { at: 0.85, ap: 0.8, pfm1: 0.7, uxo: 0.8 },
};

/**
 * Channels that look at the surface, so burial depth blinds them outright.
 * The three sub-surface channels are indifferent to it over these depths.
 */
export const SURFACE_CHANNELS: SensorTag[] = ['RGB', 'LIDAR', 'POL', 'LWIR'];

/** Above this a channel counts as having actually seen the device. */
export const CHANNEL_STRONG = 0.5;

/** Burial depth at which the surface-looking channels lose the device. */
export const SURFACE_SIGHT_DEPTH_M = 0.15;

/**
 * Share of the strongest channel's score that stands on its own, before
 * corroboration from the other channels closes the remaining gap.
 */
export const CORROBORATION_FLOOR = 0.78;

/**
 * Local detection conditions for one fix — soil moisture, clutter, look angle.
 * The luck of the individual device, drawn once when the field is generated.
 */
export const FIX_QUALITY = { min: 0.62, max: 1 };

/**
 * Fused-confidence tiers, percent. A device only reads CONFIRMED when more
 * than one channel carries it, which in practice means a metal case — you do
 * not confirm a plastic mine from the air.
 */
export const CONF_CONFIRMED = 80;
export const CONF_PROBABLE = 50;

/** What the lane is being opened for. Keyed by the widths the router supports. */
export const COLUMN_PROFILES: Record<number, { label: string; platform: string }> = {
  3: { label: 'Dismounted file', platform: 'Foot assault · marked lane' },
  6: { label: 'Mechanised / armoured', platform: 'BMP-2 · T-90 · single file' },
  9: { label: 'Two-way / recovery', platform: 'Sustained traffic · ARV · bridging' },
};

/**
 * The rate the system is measured at: a 100 x 1000 m block — 10 ha — surveyed
 * in two flying hours by a ten-airframe stack, 1 RGB / 1 LiDAR / 1 LWIR (POL
 * riding) / 2 MAG / 2 EMI / 3 GPR. This AO is 17.7 ha, so that stack should
 * quote a shade over three and a half hours.
 *
 * Nothing reads this constant; the tempo the operator is quoted is costed from
 * the sensors themselves in `surveyRun.ts`, channel by channel, so it moves
 * when the apportionment does — one of everything is far slower, which is the
 * point of apportioning at all. It is recorded here as the figure that model
 * is calibrated against: the ground-channel array widths above and the cued
 * GPR dwell below were set so the ten-airframe stack comes out on it. Retune
 * those, not a fudge factor, if the measured rate changes.
 */
export const SURVEY_ANCHOR = { areaHa: 10, hours: 2 };

/** Usable flying hours in a day, after crew rest, transit and battery cycling. */
export const FLYING_HOURS_PER_DAY = 6;

/**
 * Wall-clock seconds each airframe gets on screen. The whole swarm launches
 * together, so these are finish times, not a sequence — and they are ordered by
 * how long each channel really takes without being in proportion to it. A true
 * scale would put RGB under a second and leave GPR grinding for a quarter hour.
 * Retune here.
 */
export const RUN_SECONDS_BY_CHANNEL: Record<SensorTag, number> = {
  RGB: 30,
  LIDAR: 32,
  POL: 42,
  LWIR: 42,
  MAG: 52,
  EMI: 60,
  GPR: 60,
};

/** Most airframes the operator may put on one payload. */
export const MAX_AIRFRAMES = 4;

/** Apportionment the console opens on — one airframe per payload. */
export const DEFAULT_PAYLOAD_COUNTS: Record<SensorTag, number> = {
  RGB: 1,
  LIDAR: 1,
  POL: 1,
  LWIR: 1,
  MAG: 1,
  EMI: 1,
  GPR: 1,
};

/** GPR has nothing to fly to until the first cues land, so it launches late. */
export const GPR_START_S = 12;

/**
 * Mission seconds a cued GPR node spends on one anomaly: the hop in from the
 * last one, then a short cross-pattern over it deep enough to read the target.
 */
export const GPR_POINT_S = 55;

/**
 * Usable on-task minutes per pack, by channel. The low-and-slow airframes carry
 * the heavier sensor and fly a profile with no cruise efficiency to recover, so
 * they get the least of it. The reserve that flies the airframe home is held
 * back on top of these figures and is not on-task time.
 */
export const ENDURANCE_MIN: Record<SensorTag, number> = {
  RGB: 35,
  LIDAR: 35,
  POL: 30,
  LWIR: 30,
  MAG: 25,
  EMI: 25,
  GPR: 20,
};

/**
 * Autonomous swap station turnaround. The airframe lands on a pad, the station
 * exchanges the pack and it relaunches — nothing waits on a charge cycle and
 * nobody works forward of the line, which is why the survey holds ~80% duty.
 */
export const SWAP_MIN = 5;

/** The run to the pad is a dash, not a survey line, so it has its own speed. */
export const RTH_SPEED_MS = 12;

/** Swap station: friendly edge, on the axis of advance, one pad per airframe. */
export const LAUNCH_POINT: Point = { x: 6, y: AOI_DEPTH_M / 2 };

/** Pitch between pads across the station apron. */
export const PAD_PITCH_M = 12;

/** How long the download buttons confirm for after a report is issued. */
export const REPORT_ISSUED_MS = 4000;

/** Usable charge below which the pack reads low and the airframe is committed. */
export const LOW_CHARGE = 0.25;

/** Callsigns for the survey swarm, one airframe per payload. */
export const SURVEY_CALLSIGNS: Record<SensorTag, string> = {
  RGB: 'VAJRA-01',
  LIDAR: 'VAJRA-02',
  POL: 'VAJRA-03',
  LWIR: 'VAJRA-04',
  MAG: 'VAJRA-05',
  EMI: 'VAJRA-06',
  GPR: 'VAJRA-07',
};

export const WAVE_LABEL: Record<SurveyWave, string> = {
  aerial: 'AERIAL WAVE',
  magnetics: 'MAGNETICS WAVE',
  gpr: 'GPR · CUED',
};
