// Survey playback. Turns the run plan and a playback position into everything
// the map and the transport strip need: where each airframe is, what it is
// doing, how much of the AO has been swept, and which fixes the operator is
// allowed to have yet.

import { AOI_DEPTH_M, LOW_CHARGE, SENSOR_CHANNELS, SURVEY_CALLSIGNS } from '../constants';
import {
  buildRun,
  cuedAt,
  dutyAt,
  legProgress,
  missionAt,
  padPoint,
  rasterAt,
  sweptBand,
  transitAt,
  type Duty,
} from '../surveyRun';
import type { Palette } from '../theme';
import type { Mine, Point, SensorTag } from '../types';
import type { RunBand, RunChannelRow, RunPadRow, RunView, State, SurveyDroneRow } from './types';

/** The airframe each channel actually flies on — POL shares the thermal pass. */
const HOST_OF: Record<SensorTag, SensorTag> = Object.fromEntries(
  SENSOR_CHANNELS.map((c) => [c.id, c.ridesWith ?? c.id]),
) as Record<SensorTag, SensorTag>;

/** Airframes on one channel fly as lettered elements of the same flight. */
const FLIGHT = 'ABCDEFGH';

const hoursStr = (sec: number): string => {
  const h = sec / 3600;
  return h < 1 ? `${Math.round(sec / 60)} min` : `${h.toFixed(1)} h`;
};

const inside = (bands: RunBand[], y: number): boolean =>
  bands.some((b) => y >= b.y0 && y <= b.y1);

/**
 * Ground anything has flown over, as merged depth intervals. A device is
 * revealed by whichever channel resolves it, so the veil has to lift wherever
 * *any* channel has been — tracking one channel leaves fixes standing on ground
 * the map still shows as unsurveyed.
 */
function sweptUnion(bandsOf: Map<SensorTag, RunBand[]>): RunBand[] {
  const all = [...bandsOf.values()]
    .flat()
    .filter((b) => b.y1 > b.y0)
    .sort((a, b) => a.y0 - b.y0);
  const out: RunBand[] = [];
  for (const b of all) {
    const last = out[out.length - 1];
    if (last && b.y0 <= last.y1) last.y1 = Math.max(last.y1, b.y1);
    else out.push({ ...b });
  }
  return out;
}

/**
 * A device exists once a channel that can resolve it has flown over its
 * northing. GPR is cued rather than flown, so it discovers nothing — a device
 * only its ground-penetrating return would resolve is one this concept of
 * operations misses, and it correctly never appears.
 */
function seen(m: Mine, bandsOf: Map<SensorTag, RunBand[]>): boolean {
  for (const id of m.sensors) {
    if (id === 'GPR') continue;
    const bands = bandsOf.get(HOST_OF[id]);
    if (bands && inside(bands, m.y)) return true;
  }
  return false;
}

export function deriveRun(s: State, p: Palette): RunView | null {
  if (s.runS === null) return null;

  const plan = buildRun(s.field.mines, s.payloadCounts);
  const t = Math.min(s.runS, plan.screenS);
  const done = t >= plan.screenS;

  // Every airframe on a channel shares one pack cycle, and a riding sensor
  // inherits its host's — so the duty state is taken once per channel.
  const duty = new Map<SensorTag, Duty>();
  for (const l of plan.legs) duty.set(l.id, dutyAt(l, legProgress(l, t)));
  const dutyOf = (id: SensorTag): Duty => duty.get(HOST_OF[id])!;

  // Swept bands per channel, taken once rather than per device.
  const bandsOf = new Map<SensorTag, RunBand[]>();
  for (const l of plan.legs) {
    const w = dutyOf(l.id).work;
    bandsOf.set(l.id, Array.from({ length: l.count }, (_, k) => sweptBand(w, k, l.count)));
  }

  const visibleIds = new Set<string>();
  for (const m of s.field.mines) if (seen(m, bandsOf)) visibleIds.add(m.id);

  // One pad per committed airframe: the station is sized to the swarm, so an
  // airframe never queues for a slot on return.
  const flyingLegs = plan.legs.filter((l) => l.sorties > 0);
  const padsTotal = flyingLegs.reduce((a, l) => a + l.count, 0);
  const pads: RunPadRow[] = Array.from({ length: padsTotal }, (_, i) => ({
    at: padPoint(i, padsTotal),
    busy: false,
  }));

  const drones: SurveyDroneRow[] = [];
  const fronts: { y: number; color: string }[] = [];
  const progress = {} as Record<SensorTag, number>;
  let slot = 0;
  let onTask = 0;

  const channels: RunChannelRow[] = plan.legs.map((l) => {
    const c = SENSOR_CHANNELS.find((x) => x.id === l.id)!;
    const d = dutyOf(l.id);
    const prog = legProgress(l, t);
    const color = p[c.colorKey];
    const flying = prog > 0 && prog < 1 && !c.ridesWith;
    progress[c.id] = d.work;

    if (l.sorties > 0) {
      for (let k = 0; k < l.count; k++, slot++) {
        // The airframe is animated at the point in its band it has actually
        // worked to, so the track it rejoins after a swap is the one it left.
        const line: Point =
          c.id === 'GPR'
            ? cuedAt(plan.gprRoute, d.work, k, l.count)
            : rasterAt(l.linesEach, d.work, k, l.count);
        const pad = pads[slot].at;

        if (flying && d.state === 'SWAP') pads[slot].busy = true;
        if (flying && d.state === 'FLY') onTask++;

        if (flying) {
          drones.push({
            id: `${c.id}-${k}`,
            callsign:
              l.count > 1 ? `${SURVEY_CALLSIGNS[c.id]}${FLIGHT[k]}` : SURVEY_CALLSIGNS[c.id],
            mode: d.state === 'FLY' ? c.id : d.state,
            color,
            charge: d.charge,
            chargeColor: d.charge < LOW_CHARGE ? p.rd : color,
            at:
              d.state === 'FLY'
                ? line
                : d.state === 'SWAP'
                  ? pad
                  : transitAt(line, pad, d.state === 'RTH' ? d.k : 1 - d.k),
          });
          if (c.id !== 'GPR') fronts.push({ y: sweptBand(d.work, k, l.count).y1, color });
        }
      }
    }

    return {
      id: c.id,
      name: c.name,
      color,
      count: l.count,
      pct: Math.round(d.work * 100),
      barW: `${Math.round(d.work * 100)}%`,
      detail: c.ridesWith
        ? `RIDES ${c.ridesWith}`
        : c.id === 'GPR'
          ? `${plan.cued.length} CUED POINTS · PACK ${d.sortie}/${l.sorties}`
          : `${l.lines} LINES · ${c.speedMs} m/s · PACK ${d.sortie}/${l.sorties}`,
      flying,
    };
  });

  // Area swept is the same union the veil lifts from, so the KPI and the map
  // can never disagree about how much of the AO has been looked at.
  const swept = sweptUnion(bandsOf);
  const sweptK = swept.reduce((a, b) => a + (b.y1 - b.y0), 0) / AOI_DEPTH_M;

  return {
    headline: done
      ? 'SURVEY COMPLETE'
      : onTask
        ? `${onTask} AIRFRAME${onTask > 1 ? 'S' : ''} ON TASK`
        : drones.length
          ? 'TURNING ROUND'
          : 'LAUNCHING',
    headColor: done ? p.gn : (drones[0]?.color ?? p.am),
    drones,
    channels,
    swept,
    fronts,
    pads,
    padsBusy: pads.filter((x) => x.busy).length,
    visibleIds,
    progress,
    sweptK,
    found: visibleIds.size,
    total: s.field.mines.length,
    progressPct: (t / plan.screenS) * 100,
    barW: `${(t / plan.screenS) * 100}%`,
    missionStr: hoursStr(missionAt(plan, t)),
    cuedStr: hoursStr(plan.missionS),
    blindStr: hoursStr(plan.blindS),
    playing: s.runPlaying,
    done,
  };
}
