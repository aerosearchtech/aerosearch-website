// Pre-flight mission planning: what the operator commits to before anything
// flies — the AO boundary, the lane the column needs, and what surveying that
// AO is going to cost with the payloads the operator has committed.

import {
  AOI_DEPTH_M,
  AOI_WIDTH_M,
  CLEAR_MARGIN_M,
  COLUMN_PROFILES,
  ENDURANCE_MIN,
  FLYING_HOURS_PER_DAY,
  MINE_SPECS,
  SENSOR_CHANNELS,
} from '../constants';
import { buildRun } from '../surveyRun';
import type { Palette } from '../theme';
import { hm, type PayloadRow, type PreflightView, type State, type TempoRow } from './types';

/**
 * Row pitch at which an anti-tank belt leaves no gap a lane of this width can
 * thread: two clearance radii, plus the lane, plus standoff either side. Below
 * this pitch every lane must neutralise something, which is the finding the
 * corridor search exists to work around.
 */
export function blockingIntervalM(widthM: number): number {
  return 2 * (MINE_SPECS.at.clearRadiusM + widthM / 2 + CLEAR_MARGIN_M);
}

const hours = (h: number): string => (h < 10 ? `${h.toFixed(1)} h` : `${Math.round(h)} h`);

export function derivePreflight(s: State, p: Palette): PreflightView {
  const areaHa = (AOI_WIDTH_M * AOI_DEPTH_M) / 10_000;
  const profile = COLUMN_PROFILES[s.corridorWidthM] ?? COLUMN_PROFILES[6];

  // Costed by the same model that flies the run, so the figure quoted before
  // launch is the figure the survey comes in on. Channels overlap in the air,
  // so the survey costs its slowest one rather than their sum — which is why
  // putting a second airframe on the critical channel is what buys time, and
  // a third on any other buys nothing.
  const plan = buildRun(s.field.mines, s.payloadCounts);
  const flown = plan.legs.filter((l) => l.missionS > 0);
  const criticalId = flown.reduce((a, b) => (b.missionS > a.missionS ? b : a)).id;

  const tempo: TempoRow[] = flown.map((l) => {
    const rides = SENSOR_CHANNELS.filter((c) => c.ridesWith === l.id).map((c) => `+${c.id}`);
    return {
      id: l.id,
      count: l.count,
      note: l.id === 'GPR' ? `${plan.cued.length} CUED` : rides.join(' ') || null,
      hours: hours(l.missionS / 3600),
      color: p[SENSOR_CHANNELS.find((c) => c.id === l.id)!.colorKey],
      critical: l.id === criticalId,
    };
  });

  const channels: PayloadRow[] = SENSOR_CHANNELS.map((c) => ({
    id: c.id,
    count: s.payloadCounts[c.ridesWith ?? c.id] ?? 1,
    name: c.name,
    agl: `${c.aglM} m`,
    speed: `${c.speedMs} m/s`,
    pack: `${ENDURANCE_MIN[c.ridesWith ?? c.id]} min`,
    color: p[c.colorKey],
    rides: c.ridesWith ? `RIDES ${c.ridesWith}` : null,
  }));

  return {
    areaHa: areaHa.toFixed(1),
    areaKm2: (areaHa / 100).toFixed(2),
    vertices: 4,
    axisM: AOI_WIDTH_M,
    widthM: s.corridorWidthM,
    columnLabel: profile.label,
    columnPlatform: profile.platform,
    blockingM: Math.round(blockingIntervalM(s.corridorWidthM)),
    channels,
    // A riding sensor adds no airframe — it is carried by its host.
    airframes: channels.filter((c) => !c.rides).reduce((a, c) => a + c.count, 0),
    tempo,
    tempoTotal: hm(plan.missionS / 60),
    tempoDays: (plan.missionS / 3600 / FLYING_HOURS_PER_DAY).toFixed(1),
    criticalId,
  };
}
