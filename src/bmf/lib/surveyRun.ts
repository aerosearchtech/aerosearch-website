// Survey playback timeline.
//
// The swarm launches together and each channel flies its own raster at its own
// speed, deconflicted by altitude — RGB at 40 m is finished long before the EMI
// coil at 1.2 m has worked a third of the way in. GPR is the exception: it does
// not raster at all, it launches once the first cues land and works the anomaly
// list the other channels build. The counterfactual — GPR rastering the whole
// AO — is costed here too, because the gap between the two is the argument.
//
// Putting more than one airframe on a channel splits the AO into that many
// depth bands, each flown independently, so mission time divides by the count.
// Screen time divides with it, floored so a pass stays watchable.
//
// No airframe flies the whole AO on one pack. Each breaks track when its pack
// is spent, dashes to the swap station, takes a fresh pack and returns to the
// line it left. That turnaround is charged to the mission clock, so the hours
// quoted are the hours the survey takes, not the hours it is airborne.
//
// Screen time is budgeted per channel rather than scaled from mission time:
// real proportion would give RGB under a second and leave GPR grinding for the
// rest of the run. Mission hours reported to the operator stay true.

import {
  AOI_DEPTH_M,
  AOI_WIDTH_M,
  ENDURANCE_MIN,
  GPR_POINT_S,
  GPR_START_S,
  LAUNCH_POINT,
  PAD_PITCH_M,
  RTH_SPEED_MS,
  RUN_SECONDS_BY_CHANNEL,
  SENSOR_CHANNELS,
  SWAP_MIN,
  type SurveyWave,
} from './constants';
import type { Mine, Point, SensorTag } from './types';

/** Depth of the band a cued GPR node clears before stepping in. */
const GPR_BAND_M = 40;

/**
 * Shortest a single traverse may take on screen. The dense channels fly
 * hundreds of lines; animated honestly they blur into a flicker the eye cannot
 * follow, so the plot flies fewer, slower passes. Line counts quoted to the
 * operator stay the real ones.
 */
const MIN_TRAVERSE_S = 2.5;

/** However many airframes go on a channel, its pass stays this watchable. */
const MIN_SPAN_S = 12;

/**
 * Turnarounds animated per airframe. A dense channel really swaps packs dozens
 * of times; played at true frequency that is a strobe, not a turnaround, so the
 * plot flies a few long cycles instead of many short ones. The off-task share
 * of the run is preserved exactly, and the pack count quoted stays the real one.
 */
const SHOWN_SORTIES = 3;

/**
 * One leg of the run home, costed from the middle of the AO. Where an airframe
 * breaks track is not known when the plan is built, so the mean is used — over
 * dozens of turnarounds the near and far ends average out.
 */
const TRANSIT_S =
  Math.hypot(AOI_WIDTH_M / 2 - LAUNCH_POINT.x, AOI_DEPTH_M / 2 - LAUNCH_POINT.y) / RTH_SPEED_MS;

const SWAP_S = SWAP_MIN * 60;

/** Mission seconds one turnaround costs: home, pack exchanged, back on task. */
export const TURN_S = 2 * TRANSIT_S + SWAP_S;

/** On-task seconds a channel gets out of one pack, after the run home. */
const packS = (id: SensorTag): number => ENDURANCE_MIN[id] * 60 - 2 * TRANSIT_S;

/** Packs one airframe burns to do a given amount of work on task. */
const sortiesFor = (workS: number, id: SensorTag): number =>
  workS > 0 ? Math.max(1, Math.ceil(workS / packS(id))) : 0;

/** Work plus the turnarounds it forces — the mission time actually elapsed. */
const withPacks = (workS: number, id: SensorTag): number =>
  workS + Math.max(0, sortiesFor(workS, id) - 1) * TURN_S;

export type PayloadCounts = Record<SensorTag, number>;

/** What an airframe is doing at a point in its task. */
export type FlightState = 'FLY' | 'RTH' | 'SWAP' | 'OUT';

export interface Duty {
  /** 0..1 of this airframe's band actually surveyed. Frozen while off task. */
  work: number;
  state: FlightState;
  /** 0..1 through the current transit or pack exchange. */
  k: number;
  /** Pack this airframe is on, 1-based. */
  sortie: number;
  /** Usable charge left, 0..1. The reserve that flies it home is not counted. */
  charge: number;
}

export interface ChannelLeg {
  id: SensorTag;
  wave: SurveyWave;
  /** Airframes on this channel, each flying one depth band. */
  count: number;
  /** Lines the channel really flies at its physical line pitch, all bands. */
  lines: number;
  /** Lines one airframe animates inside its own band. */
  linesEach: number;
  /** Mission seconds one airframe spends on task, turnarounds excluded. */
  workS: number;
  /** Packs one airframe burns through, 0 if the sensor rides another's pass. */
  sorties: number;
  /** Mission seconds on task and turning around, 0 if the sensor rides. */
  missionS: number;
  /** Screen seconds this airframe launches and lands. */
  startS: number;
  endS: number;
}

export interface RunPlan {
  legs: ChannelLeg[];
  /** Mission seconds the concurrent survey takes — the slowest channel. */
  missionS: number;
  screenS: number;
  /** Anomalies the rastering channels hand to GPR. */
  cued: Mine[];
  /** The sampled track the cued nodes are animated along. */
  gprRoute: Point[];
  /** Mission seconds the same swarm would take with GPR rastering blind. */
  blindS: number;
}

/** Mission seconds to raster the AO at a given line pitch and ground speed. */
const rasterS = (spacingM: number, speedMs: number): number =>
  Math.ceil(AOI_DEPTH_M / spacingM) * (AOI_WIDTH_M / speedMs);

/** A riding sensor is flown by its host, so it inherits the host's count. */
const countOf = (id: SensorTag, counts: PayloadCounts): number => {
  const c = SENSOR_CHANNELS.find((x) => x.id === id)!;
  return Math.max(1, Math.floor(counts[c.ridesWith ?? id] ?? 1));
};

/** Screen seconds one airframe of a channel is on task for. */
const spanOf = (id: SensorTag, startS: number, n: number): number =>
  Math.max(MIN_SPAN_S, (RUN_SECONDS_BY_CHANNEL[id] - startS) / n);

function leg(id: SensorTag, cued: number, counts: PayloadCounts): ChannelLeg {
  const c = SENSOR_CHANNELS.find((x) => x.id === id)!;
  const n = countOf(id, counts);
  const startS = id === 'GPR' ? GPR_START_S : 0;
  const span = spanOf(id, startS, n);

  const lines = c.ridesWith ? 0 : Math.ceil(AOI_DEPTH_M / c.physicalSpacingM);
  const workS = c.ridesWith
    ? 0
    : (id === 'GPR' ? cued * GPR_POINT_S : rasterS(c.physicalSpacingM, c.speedMs)) / n;
  const sorties = sortiesFor(workS, id);
  const missionS = withPacks(workS, id);

  // A 1 m line pitch is finer than the plot can resolve, so the airframe is
  // animated over the display grid while the clock costs the real one — and
  // never so fast that a traverse stops reading as a pass. Only the share of
  // the span spent on task is available to fly lines in.
  const duty = missionS > 0 ? workS / missionS : 1;
  const grid = c.ridesWith ? 0 : Math.ceil(AOI_DEPTH_M / c.lineSpacingM);
  const linesEach = c.ridesWith
    ? 0
    : Math.max(1, Math.min(Math.ceil(grid / n), Math.floor((span * duty) / MIN_TRAVERSE_S)));

  return {
    id: c.id,
    wave: c.wave,
    count: n,
    lines,
    linesEach,
    workS,
    sorties,
    missionS,
    startS,
    endS: startS + span,
  };
}

/**
 * A channel is worth cueing GPR onto when something above it already saw the
 * device. Cueing is only as good as the cue: anything the rastering channels
 * miss entirely never gets a GPR look, which is a real limit of the approach.
 */
const isCued = (m: Mine): boolean => m.sensors.some((s) => s !== 'GPR');

export function buildRun(mines: Mine[], counts: PayloadCounts): RunPlan {
  // Worked in depth bands and alternating across the frontage: the cued node
  // still flies a route, it just flies it between anomalies instead of lines.
  const band = (m: Mine): number => Math.floor(m.y / GPR_BAND_M);
  const cued = mines
    .filter(isCued)
    .sort((a, b) => band(a) - band(b) || (band(a) % 2 === 0 ? a.x - b.x : b.x - a.x));

  const legs = SENSOR_CHANNELS.map((c) => leg(c.id, cued.length, counts));
  const gpr = SENSOR_CHANNELS.find((c) => c.id === 'GPR')!;
  const gprLeg = legs.find((l) => l.id === 'GPR')!;

  // Hundreds of anomalies cannot be visited one by one on screen without the
  // airframe reducing to a jitter, so the plot flies a sampled track through
  // them — the same coarsening the rasters get. The tally stays the real one.
  const stops = Math.max(2, Math.min(cued.length, gprLeg.linesEach * gprLeg.count));
  const gprRoute: Point[] = Array.from({ length: stops }, (_, i) => {
    const m = cued[Math.round((i / (stops - 1)) * (cued.length - 1))];
    return { x: m?.x ?? 0, y: m?.y ?? 0 };
  });

  // Flights overlap, so the survey costs its slowest element, not their sum.
  const slowest = (extra: number): number => Math.max(extra, ...legs.map((l) => l.missionS));

  return {
    legs,
    gprRoute,
    missionS: slowest(0),
    screenS: Math.max(...legs.map((l) => l.endS)),
    cued,
    // Same swarm, same channels, same packs — the only change is GPR rastering
    // the AO instead of being cued onto what the other channels already found.
    blindS: slowest(withPacks(rasterS(gpr.physicalSpacingM, gpr.speedMs) / gprLeg.count, 'GPR')),
  };
}

/** Wall-clock length of the playback for a given apportionment. */
export const runTotalS = (counts: PayloadCounts): number =>
  Math.max(
    ...SENSOR_CHANNELS.map((c) => {
      const startS = c.id === 'GPR' ? GPR_START_S : 0;
      return startS + spanOf(c.id, startS, countOf(c.id, counts));
    }),
  );

/** 0..1 completion of one airframe's task at a point in the playback. */
export function legProgress(l: ChannelLeg, screenS: number): number {
  const span = l.endS - l.startS;
  if (span <= 0) return screenS >= l.endS ? 1 : 0;
  return Math.max(0, Math.min(1, (screenS - l.startS) / span));
}

/**
 * Where one airframe is in its pack cycle. Work advances only while it is on
 * task: the mission clock keeps running through the run home and the exchange,
 * and no ground is surveyed while it does.
 */
export function dutyAt(l: ChannelLeg, prog: number): Duty {
  if (l.sorties < 1) return { work: prog, state: 'FLY', k: prog, sortie: 1, charge: 1 };

  const shown = Math.min(l.sorties, SHOWN_SORTIES);
  const per = l.workS / shown;
  const turn = shown > 1 ? (l.missionS - l.workS) / (shown - 1) : 0;
  const cycle = per + turn;
  const elapsed = prog * l.missionS;
  const i = Math.min(shown - 1, Math.floor(elapsed / cycle));
  const u = elapsed - i * cycle;
  const flown = Math.min(u, per);
  const work = Math.min(1, (i * per + flown) / l.workS);
  // Reported against the real pack count, not the handful of cycles animated.
  const sortie = Math.min(l.sorties, Math.floor(work * l.sorties) + 1);

  if (u <= per) return { work, state: 'FLY', k: flown / per, sortie, charge: 1 - flown / per };

  // The three off-task phases keep their true proportions inside the stretched
  // turnaround, so the run home reads as a dash and the exchange as a wait.
  const scale = turn / TURN_S;
  const transit = TRANSIT_S * scale;
  const swap = SWAP_S * scale;
  const off = u - per;

  if (off < transit) return { work, state: 'RTH', k: off / transit, sortie, charge: 0 };
  if (off < transit + swap) {
    const k = (off - transit) / swap;
    return { work, state: 'SWAP', k, sortie, charge: k };
  }
  const k = Math.min(1, (off - transit - swap) / transit);
  return { work, state: 'OUT', k, sortie: sortie + 1, charge: 1 };
}

/** Mission seconds elapsed — the concurrent survey runs at its slowest leg. */
export function missionAt(plan: RunPlan, screenS: number): number {
  return Math.max(...plan.legs.map((l) => legProgress(l, screenS) * l.missionS));
}

/** The depth interval one airframe has swept inside its own band, in metres. */
export function sweptBand(work: number, band: number, bands: number): { y0: number; y1: number } {
  const h = AOI_DEPTH_M / bands;
  const y0 = band * h;
  return { y0, y1: y0 + work * h };
}

/**
 * Where a rastering airframe is at this point in its task. Lines run along the
 * frontage and step down its band, reversing each pass — the boustrophedon an
 * operator would actually programme, flown as one unbroken track.
 */
export function rasterAt(linesEach: number, t: number, band = 0, bands = 1): Point {
  const f = Math.max(0, Math.min(1, t));
  const line = Math.min(linesEach - 1, Math.floor(f * linesEach));
  const along = f * linesEach - line;
  const h = AOI_DEPTH_M / bands;
  return {
    x: (line % 2 === 0 ? along : 1 - along) * AOI_WIDTH_M,
    y: band * h + ((line + 0.5) / linesEach) * h,
  };
}

/**
 * Where a cued node is on its share of the track. It eases into each anomaly
 * and out again, so the flight reads as work on a point rather than a transit.
 * Nodes take contiguous slices of the route so they do not fly over each other.
 */
export function cuedAt(route: Point[], t: number, band = 0, bands = 1): Point {
  if (route.length < 2) return route[0] ?? { x: 0, y: 0 };
  const per = route.length / bands;
  const from = Math.floor(band * per);
  const slice = route.slice(from, Math.max(from + 2, Math.ceil((band + 1) * per)));
  const f = Math.max(0, Math.min(1, t)) * (slice.length - 1);
  const i = Math.min(slice.length - 2, Math.floor(f));
  const a = slice[i];
  const b = slice[i + 1] ?? a;
  const k = f - i;
  const e = k * k * (3 - 2 * k);
  return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e };
}

/** The pad one airframe owns on the station apron. */
export function padPoint(slot: number, pads: number): Point {
  return { x: LAUNCH_POINT.x, y: LAUNCH_POINT.y + (slot - (pads - 1) / 2) * PAD_PITCH_M };
}

/** Straight-line dash between the line an airframe left and its pad. */
export function transitAt(from: Point, to: Point, k: number): Point {
  const f = Math.max(0, Math.min(1, k));
  return { x: from.x + (to.x - from.x) * f, y: from.y + (to.y - from.y) * f };
}
