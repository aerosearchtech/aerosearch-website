// Clearance playback. Turns the clearance plan and a playback position into the
// airframes on the map, the state every device reads as, and the tallies the
// transport strip carries.

import { EOD_TEAMS, NEUT_SHOT_DEVICES, TASK_STATE_LABEL } from '../constants';
import { padPoint } from '../surveyRun';
import {
  buildClearance,
  crewAt,
  missionAt,
  shotAt,
  statesAt,
  type ClearancePlan,
  type ClearPhase,
  type ClearTarget,
} from '../clearanceRun';
import { chainage } from '../geom';
import type { Palette } from '../theme';
import type { Mine, Point, Route, TaskState } from '../types';
import { teamColor } from './neutralise';
import type { ClearanceView, DroneRow, State, TaskRow } from './types';

const PHASE_LABEL: Record<ClearPhase, string> = {
  HOLD: 'HOLDING',
  TRANSIT: 'IN TRANSIT',
  PLACING: 'PLACING CHARGE',
  REARM: 'RELOADING RACK',
  STANDOFF: 'STANDOFF — SHOT',
  DONE: 'SORTIE COMPLETE',
};

const DRONE_STATE: Record<ClearPhase, DroneRow['state']> = {
  HOLD: 'staged',
  TRANSIT: 'transit',
  PLACING: 'placing',
  REARM: 'rearm',
  STANDOFF: 'standoff',
  DONE: 'complete',
};

const hoursStr = (sec: number): string => {
  const h = sec / 3600;
  return h < 1 ? `${Math.round(sec / 60)} min` : `${h.toFixed(1)} h`;
};

const lerp = (a: Point, b: Point, k: number): Point => ({
  x: a.x + (b.x - a.x) * Math.max(0, Math.min(1, k)),
  y: a.y + (b.y - a.y) * Math.max(0, Math.min(1, k)),
});

/**
 * The lane's clearance plan, built whether or not anything is flying. Before the
 * run it is the forecast the operator is quoted; during it, the thing being
 * played back. One plan means the estimate and the outcome cannot disagree.
 */
export function buildLanePlan(s: State, mines: Mine[], route: Route | null): ClearancePlan | null {
  if (!route) return null;
  const targets: ClearTarget[] = mines.map((m) => ({
    id: m.id,
    teamId: s.taskTeams[m.id] ?? null,
    chainageM: chainage(m, route.path),
    confidence: m.confidence,
  }));
  return buildClearance(targets);
}

export function deriveClearance(
  s: State,
  p: Palette,
  plan: ClearancePlan | null,
  mines: Mine[],
): ClearanceView | null {
  if (s.clearanceS === null || !plan) return null;

  const at = new Map<string, Point>(mines.map((m) => [m.id, { x: m.x, y: m.y }]));
  const t = Math.min(s.clearanceS, plan.screenS);
  const done = t >= plan.screenS;
  const mission = missionAt(plan, t);

  const states = statesAt(plan, mission);
  const falseAlarms = new Set(plan.stops.filter((k) => k.falseAlarm).map((k) => k.id));
  const shot = shotAt(plan, mission);

  const flying = EOD_TEAMS.filter((t0) => plan.stops.some((k) => k.teamId === t0.id));

  const drones: DroneRow[] = flying.map((t0, i) => {
    const c = crewAt(plan, t0.id, mission);
    // Each sortie owns a pad, so a lane-wide standoff parks them abreast rather
    // than stacking three airframes on one point.
    const pad = padPoint(i, flying.length);
    const target = c.stop ? (at.get(c.stop.id) ?? s.start) : s.start;
    // Standing off and reloading both put the airframe back on the station; the
    // transit legs are drawn from the lane entry so the run reads as a sortie.
    const pos =
      c.phase === 'STANDOFF' || c.phase === 'REARM'
        ? pad
        : c.phase === 'TRANSIT'
          ? lerp(s.start, target, c.k)
          : c.phase === 'HOLD'
            ? s.start
            : target;

    return {
      id: t0.id,
      name: t0.name,
      callsign: t0.callsign,
      color: teamColor(p, t0.id),
      at: pos,
      from: s.start,
      targetId: c.phase === 'TRANSIT' || c.phase === 'PLACING' ? (c.stop?.id ?? null) : null,
      state: DRONE_STATE[c.phase],
      stateLabel: PHASE_LABEL[c.phase],
      charges: c.charges,
    };
  });

  const proofed = [...states.values()].filter((v) => v === 'proofed').length;
  const working = drones.filter((d) => d.state === 'transit' || d.state === 'placing').length;

  return {
    headline: done
      ? 'LANE CLEARED'
      : shot
        ? `SHOT ${shot.index + 1} OF ${plan.shots.length} — LANE STANDOFF`
        : working
          ? `${working} AIRFRAME${working > 1 ? 'S' : ''} ON TASK`
          : 'REARMING',
    headColor: done ? p.gn : shot ? p.rd : p.am,
    drones,
    states,
    falseAlarms,
    charges: plan.charges,
    chargesPlaced: plan.stops.filter((k) => !k.falseAlarm && k.doneS <= mission).length,
    falseAlarmCount: plan.falseAlarms,
    falseAlarmsFound: plan.stops.filter((k) => k.falseAlarm && k.doneS <= mission).length,
    tasked: plan.tasked,
    proofed,
    shots: plan.shots.length,
    shotDevices: NEUT_SHOT_DEVICES,
    standoff: !!shot,
    missionS: mission,
    missionStr: hoursStr(mission),
    totalStr: hoursStr(plan.missionS),
    progressPct: (t / plan.screenS) * 100,
    barW: `${(t / plan.screenS) * 100}%`,
    playing: s.clearancePlaying,
    done,
  };
}

/**
 * Rewrites the board from the plan. Effort is always the flown figure — the
 * minutes an airframe spends on that contact, not the manual rate it replaces.
 * While a run is loaded the plan also owns every device's state, so the board
 * and the airframes can never disagree on screen.
 */
export function applyPlan(
  tasks: TaskRow[],
  plan: ClearancePlan,
  run: ClearanceView | null,
  p: Palette,
): TaskRow[] {
  const stops = new Map(plan.stops.map((k) => [k.id, k]));

  return tasks.map((k) => {
    const stop = stops.get(k.id);
    const effortMin = stop ? (stop.doneS - stop.startS + stop.rearmS) / 60 : 0;
    const flown = { ...k, effortMin, effort: `${effortMin.toFixed(1)} min` };
    if (!run) return flown;

    const state: TaskState = run.states.get(k.id) ?? 'pending';
    const nothing = run.falseAlarms.has(k.id) && state === 'proofed';
    const color = nothing ? p.gnPale : p.state[state];
    return {
      ...flown,
      state,
      stateLabel: nothing ? 'NO DEVICE' : TASK_STATE_LABEL[state],
      stateColor: color,
      markerColor: color,
      falseAlarm: nothing,
    };
  });
}
