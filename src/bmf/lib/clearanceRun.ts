// Clearance playback timeline.
//
// Neutralisation is flown, not walked. Each sortie group is one charge-carrying
// airframe working its stretch of the lane in chainage order: hop to the
// contact, hover, place a charge, move on. A rack holds four charges, so the
// airframe goes home to reload before it can carry on.
//
// Two things make this more than a queue. A stretch is fired as one event, and
// firing does not parallelise — every airframe on the lane stands off while a
// shot goes in, so the shot is a global barrier rather than a per-team pause.
// And a contact is only a device with the probability the survey gave it: the
// airframe finds out when it arrives, and a false alarm costs the same approach
// but no charge and no shot.
//
// Screen time is a fixed budget like the survey's; mission hours stay true.

import {
  CHARGES_PER_SORTIE,
  CLEARANCE_SECONDS,
  EOD_TEAMS,
  NEUT_HOP_S,
  NEUT_PLACE_S,
  NEUT_SHOT_DEVICES,
  NEUT_SHOT_S,
  NEUT_TRANSIT_SPEED_MS,
  NEUT_TURNAROUND_S,
  SHOT_FIRE_K,
  SHOT_SCREEN_K,
  SHOT_PROOF_K,
} from './constants';
import type { TaskState } from './types';

/** What one airframe is doing at a point in the clearance. */
export type ClearPhase = 'HOLD' | 'TRANSIT' | 'PLACING' | 'REARM' | 'STANDOFF' | 'DONE';

/** One contact on one airframe's task list. */
export interface ClearStop {
  id: string;
  teamId: string;
  /** Mission second the airframe leaves the previous contact for this one. */
  startS: number;
  /** Mission second it arrives and begins the approach. */
  arriveS: number;
  /** Mission second the call is made: charge placed, or nothing there. */
  doneS: number;
  /** Nothing emplaced — the survey contact did not resolve as a device. */
  falseAlarm: boolean;
  /** Shot this device's charge is fired in, -1 for a false alarm. */
  shot: number;
  /** Mission seconds the airframe spends reloading after this contact. */
  rearmS: number;
}

export interface ClearShot {
  index: number;
  startS: number;
  endS: number;
  devices: string[];
}

/** One piece of the playback: a mission interval and the screen it is given. */
export interface ClearSpan {
  m0: number;
  m1: number;
  s0: number;
  s1: number;
}

export interface ClearancePlan {
  stops: ClearStop[];
  shots: ClearShot[];
  /** Piecewise map from screen seconds to mission seconds. */
  spans: ClearSpan[];
  /** Mission seconds from first launch to the last device proofed. */
  missionS: number;
  screenS: number;
  /** Charges expended — one per device that actually resolved. */
  charges: number;
  falseAlarms: number;
  /** Devices tasked, whether or not they turned out to be real. */
  tasked: number;
}

/** One contact as the planner needs it: where it is and how sure the survey is. */
export interface ClearTarget {
  id: string;
  teamId: string | null;
  chainageM: number;
  confidence: number;
}

/**
 * Whether a contact resolves as a real device. Fused confidence is already a
 * probability, so it is honoured rather than ignored: a contact carried at 62%
 * is nothing there roughly two times in five, and the airframe finds out only
 * by flying to it. Drawn from the device id so a replay resolves identically —
 * a lane that changed its mind between two runs would be worthless.
 */
export function isFalseAlarm(id: string, confidence: number): boolean {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296 >= confidence;
}

/** Mission seconds to fly between two points on the lane. */
const hopS = (fromM: number, toM: number, first: boolean): number =>
  first ? Math.abs(toM - fromM) / NEUT_TRANSIT_SPEED_MS : NEUT_HOP_S;

interface Airframe {
  teamId: string;
  /** Mission second this airframe is next free. */
  t: number;
  atM: number;
  charges: number;
  queue: ClearTarget[];
  cursor: number;
  launched: boolean;
}

/**
 * Walks every airframe forward together. The loop always advances whichever is
 * furthest behind, so the shot barrier lands at a single mission second for all
 * of them rather than at three different ones.
 */
export function buildClearance(targets: ClearTarget[]): ClearancePlan {
  const tasked = targets.filter((t) => t.teamId);

  const crews: Airframe[] = EOD_TEAMS.map((t) => ({
    teamId: t.id,
    t: 0,
    atM: 0,
    charges: CHARGES_PER_SORTIE,
    queue: tasked
      .filter((k) => k.teamId === t.id)
      .sort((a, b) => a.chainageM - b.chainageM),
    cursor: 0,
    launched: false,
  })).filter((c) => c.queue.length > 0);

  const stops: ClearStop[] = [];
  const shots: ClearShot[] = [];
  let pending: string[] = [];
  let charges = 0;
  let falseAlarms = 0;

  /** Every airframe stands off, the stretch fires, then the lane is re-entered. */
  const fire = (): void => {
    if (!pending.length) return;
    const startS = Math.max(...crews.map((c) => c.t));
    const endS = startS + NEUT_SHOT_S;
    shots.push({ index: shots.length, startS, endS, devices: pending });
    for (const c of crews) {
      c.t = Math.max(c.t, endS);
      c.atM = 0;
      // Re-entry after a shot starts from the lane entry, not from where the
      // airframe was standing when it withdrew.
      c.launched = false;
    }
    pending = [];
  };

  for (;;) {
    const next = crews
      .filter((c) => c.cursor < c.queue.length)
      .sort((a, b) => a.t - b.t)[0];
    if (!next) break;

    const target = next.queue[next.cursor++];
    const startS = next.t;
    const arriveS = startS + hopS(next.atM, target.chainageM, !next.launched);
    const doneS = arriveS + NEUT_PLACE_S;
    const falseAlarm = isFalseAlarm(target.id, target.confidence);

    next.t = doneS;
    next.atM = target.chainageM;
    next.launched = true;

    let rearmS = 0;
    let shot = -1;

    if (falseAlarm) {
      falseAlarms++;
    } else {
      charges++;
      next.charges--;
      shot = shots.length;
      pending.push(target.id);
      // A rack of four is a rack of four: the fifth device waits for a reload.
      if (next.charges === 0) {
        rearmS = NEUT_TURNAROUND_S;
        next.t += rearmS;
        next.charges = CHARGES_PER_SORTIE;
        next.atM = 0;
        next.launched = false;
      }
    }

    stops.push({ id: target.id, teamId: next.teamId, startS, arriveS, doneS, falseAlarm, shot, rearmS });
    if (pending.length >= NEUT_SHOT_DEVICES) fire();
  }

  fire();

  const missionS = Math.max(
    0,
    ...stops.map((k) => k.doneS + k.rearmS),
    ...shots.map((k) => k.endS),
  );

  return {
    stops,
    shots,
    spans: spansOf(shots, missionS, CLEARANCE_SECONDS),
    missionS,
    screenS: CLEARANCE_SECONDS,
    charges,
    falseAlarms,
    tasked: tasked.length,
  };
}

/**
 * Splits the playback so the flying gets most of the screen and the shots get a
 * fixed slice between them, however long they really take. Without this the one
 * event that dominates the clock also dominates the picture, and the picture is
 * a lane with nothing on it.
 */
function spansOf(shots: ClearShot[], missionS: number, screenS: number): ClearSpan[] {
  const shotM = shots.reduce((a, k) => a + (k.endS - k.startS), 0);
  const workM = Math.max(1e-6, missionS - shotM);
  const workScreen = screenS * (shots.length ? 1 - SHOT_SCREEN_K : 1);
  const perShot = shots.length ? (screenS - workScreen) / shots.length : 0;

  const spans: ClearSpan[] = [];
  let m = 0;
  let sc = 0;
  for (const shot of shots) {
    const ds = ((shot.startS - m) / workM) * workScreen;
    spans.push({ m0: m, m1: shot.startS, s0: sc, s1: sc + ds });
    m = shot.startS;
    sc += ds;
    spans.push({ m0: m, m1: shot.endS, s0: sc, s1: sc + perShot });
    m = shot.endS;
    sc += perShot;
  }
  spans.push({ m0: m, m1: missionS, s0: sc, s1: screenS });
  return spans;
}

/** Mission seconds elapsed at a point in the playback. */
export function missionAt(plan: ClearancePlan, screenS: number): number {
  if (plan.screenS <= 0) return 0;
  for (const sp of plan.spans) {
    if (screenS <= sp.s1) {
      const k = sp.s1 > sp.s0 ? (screenS - sp.s0) / (sp.s1 - sp.s0) : 1;
      return sp.m0 + (sp.m1 - sp.m0) * Math.max(0, Math.min(1, k));
    }
  }
  return plan.missionS;
}

/**
 * What each device reads as at this point. A charge sits placed but unfired
 * until its stretch goes in, which is why a lane can be fully charged and still
 * be closed — the operator sees the difference.
 */
export function statesAt(plan: ClearancePlan, missionS: number): Map<string, TaskState> {
  const out = new Map<string, TaskState>();
  for (const k of plan.stops) {
    if (missionS < k.arriveS) {
      out.set(k.id, 'pending');
    } else if (k.falseAlarm) {
      // Nothing there, so nothing to fire at: the contact closes on arrival.
      out.set(k.id, missionS < k.doneS ? 'working' : 'proofed');
    } else {
      const shot = plan.shots[k.shot];
      const fired = shot ? shot.startS + (shot.endS - shot.startS) * SHOT_FIRE_K : Infinity;
      const proofed = shot ? shot.startS + (shot.endS - shot.startS) * SHOT_PROOF_K : Infinity;
      out.set(k.id, missionS >= proofed ? 'proofed' : missionS >= fired ? 'neutralised' : 'working');
    }
  }
  return out;
}

/** The shot going in right now, if the lane is standing off. */
export const shotAt = (plan: ClearancePlan, missionS: number): ClearShot | null =>
  plan.shots.find((s) => missionS >= s.startS && missionS < s.endS) ?? null;

export interface CrewAt {
  phase: ClearPhase;
  /** The contact being worked, null when standing off or reloading. */
  stop: ClearStop | null;
  /** 0..1 through the current phase, for interpolating the transit. */
  k: number;
  charges: number;
  done: number;
}

/** What one airframe is doing at this point in the clearance. */
export function crewAt(plan: ClearancePlan, teamId: string, missionS: number): CrewAt {
  const mine = plan.stops.filter((k) => k.teamId === teamId);
  if (!mine.length) return { phase: 'HOLD', stop: null, k: 0, charges: CHARGES_PER_SORTIE, done: 0 };

  const done = mine.filter((k) => k.doneS <= missionS).length;
  const charges = CHARGES_PER_SORTIE - (mine.filter((k) => k.doneS <= missionS && !k.falseAlarm).length % CHARGES_PER_SORTIE);

  const shot = shotAt(plan, missionS);
  if (shot) return { phase: 'STANDOFF', stop: null, k: (missionS - shot.startS) / (shot.endS - shot.startS), charges, done };

  const active = mine.find((k) => missionS >= k.startS && missionS < k.doneS + k.rearmS);
  if (!active) {
    return missionS >= plan.missionS || done === mine.length
      ? { phase: 'DONE', stop: mine[mine.length - 1], k: 1, charges, done }
      : { phase: 'HOLD', stop: null, k: 0, charges, done };
  }

  if (missionS < active.arriveS) {
    return { phase: 'TRANSIT', stop: active, k: (missionS - active.startS) / Math.max(1, active.arriveS - active.startS), charges, done };
  }
  if (missionS < active.doneS) {
    return { phase: 'PLACING', stop: active, k: (missionS - active.arriveS) / NEUT_PLACE_S, charges, done };
  }
  return { phase: 'REARM', stop: active, k: (missionS - active.doneS) / Math.max(1, active.rearmS), charges, done };
}
