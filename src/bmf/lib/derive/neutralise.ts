// NEUTRALISE & PROOF phase: who is working which device, how much effort is
// still outstanding, and whether the lane may be certified open.

import {
  CHARGES_PER_SORTIE,
  EOD_TEAMS,
  PROOF_MAX_UNSWEPT_M,
  PROOF_MIN_STANDOFF_M,
  PROOF_MIN_SURVEY,
  TASK_STATE_LABEL,
  TASK_STATE_ORDER,
} from '../constants';
import type { ClearancePlan } from '../clearanceRun';
import type { Palette } from '../theme';
import type {
  BarRow,
  ClearanceView,
  DroneRow,
  GateRow,
  NeutraliseView,
  State,
  TaskRow,
  TeamRow,
} from './types';
import { hm } from './types';

const TEAM_COLOR_KEYS = ['gn', 'tl', 'vt'] as const;

export const teamColor = (p: Palette, teamId: string | null): string => {
  const i = EOD_TEAMS.findIndex((t) => t.id === teamId);
  return i < 0 ? p.tx3 : p[TEAM_COLOR_KEYS[i % TEAM_COLOR_KEYS.length]];
};

const DRONE_STATE_LABEL: Record<DroneRow['state'], string> = {
  staged: 'STAGED',
  transit: 'IN TRANSIT',
  placing: 'PLACING CHARGE',
  rearm: 'RELOADING RACK',
  standoff: 'STANDOFF — SHOT',
  complete: 'SORTIE COMPLETE',
};

/**
 * Places each flight's drone on the device it is currently working. A task in
 * WORKING has the drone over it placing its charge; anything still PENDING has
 * the drone inbound from the lane entry.
 */
function deriveDrones(s: State, p: Palette, tasks: TaskRow[]): DroneRow[] {
  return EOD_TEAMS.map((t, i) => {
    const color = p[TEAM_COLOR_KEYS[i % TEAM_COLOR_KEYS.length]];
    const mine = tasks
      .filter((k) => k.teamId === t.id)
      .sort((a, b) => a.chainageM - b.chainageM);
    const active = mine.find((k) => k.state !== 'proofed') ?? null;
    const done = mine.filter((k) => k.state === 'proofed').length;
    const target = active ? s.field.mines.find((x) => x.id === active.id) ?? null : null;

    const state: DroneRow['state'] = !mine.length
      ? 'staged'
      : !active
        ? 'complete'
        : active.state === 'pending'
          ? 'transit'
          : 'placing';

    return {
      id: t.id,
      name: t.name,
      callsign: t.callsign,
      color,
      at: target ? { x: target.x, y: target.y } : s.start,
      from: s.start,
      targetId: active?.id ?? null,
      state,
      stateLabel: DRONE_STATE_LABEL[state],
      charges: Math.max(0, CHARGES_PER_SORTIE - done),
    };
  });
}

/**
 * Mission second each airframe finishes on: its last contact, or the shot that
 * contact's charge goes in with, whichever is later. A crew that has placed its
 * last charge is not finished until the stretch has been fired and proofed.
 */
function finishByTeam(plan: ClearancePlan): Map<string, number> {
  const out = new Map<string, number>();
  for (const k of plan.stops) {
    const shot = plan.shots[k.shot];
    const end = Math.max(k.doneS + k.rearmS, shot ? shot.endS : 0);
    out.set(k.teamId, Math.max(out.get(k.teamId) ?? 0, end));
  }
  return out;
}

/**
 * Effort here is the flown figure, not the manual rate the swarm replaces: what
 * remains is what the airframes still have to fly, counted down against the
 * clearance's own clock. The manual baseline stays where it belongs, on the
 * BREACH comparison.
 */
export function deriveNeutralise(
  s: State,
  p: Palette,
  tasks: TaskRow[],
  plan: ClearancePlan | null,
  clearance: ClearanceView | null,
): NeutraliseView {
  const m = s.routes.find((r) => r.id === s.selectedRouteId)?.metrics ?? null;
  const flownS = clearance?.missionS ?? 0;
  const left = (endS: number): number => Math.max(0, endS - flownS) / 60;
  const finish = plan ? finishByTeam(plan) : new Map<string, number>();

  const teams: TeamRow[] = EOD_TEAMS.map((t, i) => {
    const mine = tasks.filter((k) => k.teamId === t.id);
    const endS = finish.get(t.id) ?? 0;
    const minutes = left(endS);
    return {
      id: t.id,
      name: t.name,
      callsign: t.callsign,
      color: p[TEAM_COLOR_KEYS[i % TEAM_COLOR_KEYS.length]],
      assigned: mine.length,
      done: mine.filter((k) => k.state === 'proofed').length,
      minutes,
      minutesTotal: endS / 60,
      loadW: `${tasks.length ? (mine.length / tasks.length) * 100 : 0}%`,
    };
  });

  const total = tasks.length;
  const tally: BarRow[] = TASK_STATE_ORDER.map((st) => {
    const n = tasks.filter((k) => k.state === st).length;
    return {
      key: st,
      label: TASK_STATE_LABEL[st],
      detail: `${n}`,
      color: p.state[st],
      value: n,
      width: `${total ? (n / total) * 100 : 0}%`,
    };
  });

  const proofed = tasks.filter((k) => k.state === 'proofed').length;
  const cleared = tasks.filter((k) => k.state === 'neutralised' || k.state === 'proofed').length;
  const remainingMin = plan ? left(plan.missionS) : 0;

  const committed = teams.filter((t) => t.assigned > 0).length;
  const unassigned = tasks.filter((k) => !k.teamId).length;

  const gate: GateRow[] = [
    {
      label: 'ALL DEVICES PROOFED',
      detail: `${proofed} / ${total}`,
      pass: total > 0 && proofed === total,
    },
    {
      label: 'EVERY TASK ASSIGNED',
      detail: unassigned ? `${unassigned} UNASSIGNED` : `${committed} TEAM${committed === 1 ? '' : 'S'}`,
      pass: total > 0 && unassigned === 0,
    },
    {
      label: `LANE SURVEY ≥ ${Math.round(PROOF_MIN_SURVEY * 100)}%`,
      detail: `${Math.round((m?.surveyMean ?? 0) * 100)}%`,
      pass: (m?.surveyMean ?? 0) >= PROOF_MIN_SURVEY,
    },
    {
      label: `UNSWEPT RUN ≤ ${PROOF_MAX_UNSWEPT_M} m`,
      detail: `${Math.round(m?.unsweptM ?? 0)} m`,
      pass: !!m && m.unsweptM <= PROOF_MAX_UNSWEPT_M,
    },
    {
      label: `STANDOFF ≥ ${PROOF_MIN_STANDOFF_M.toFixed(1)} m`,
      detail: `${(m?.clearanceMin ?? 0).toFixed(1)} m`,
      pass: (m?.clearanceMin ?? 0) >= PROOF_MIN_STANDOFF_M,
    },
  ];

  return {
    teams,
    // A live clearance flies the airframes; otherwise they sit on the board.
    drones: clearance ? clearance.drones : deriveDrones(s, p, tasks),
    tally,
    gate,
    certified: !!m && gate.every((g) => g.pass),
    progressPct: total ? (cleared / total) * 100 : 0,
    proofedPct: total ? (proofed / total) * 100 : 0,
    remainingMin,
    // The plan already flies the sorties in parallel — dividing again would
    // count the concurrency twice. Nothing tasked means nothing scheduled, and
    // a lane with devices on it must not read as zero minutes from open.
    timeToOpenStr: committed ? hm(remainingMin) : '—',
    committed,
    unassigned,
  };
}
