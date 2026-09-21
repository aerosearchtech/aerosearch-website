// Per-device sensor fusion: what each payload saw, and what the fused verdict
// says to do about it. Only built when a device is actually selected.

import { CHANNEL_LABEL } from '../canvas/sensors';
import {
  CHANNEL_STRONG,
  CONF_CONFIRMED,
  CONF_PROBABLE,
  MINE_SPECS,
  SENSOR_CHANNELS,
} from '../constants';
import { chainage } from '../geom';
import { response } from '../sensing';
import type { Palette } from '../theme';
import type { SensorTag } from '../types';
import type { ChannelTile, FusionView, State } from './types';

export function deriveFusion(s: State, p: Palette): FusionView | null {
  const mine = s.field.mines.find((m) => m.id === s.selectedMineId);
  if (!mine) return null;

  const spec = MINE_SPECS[mine.type];
  const color = p.mine[mine.type];
  const channels: ChannelTile[] = SENSOR_CHANNELS.map((ch) => {
    const v = response(mine, ch.id as SensorTag);
    return {
      key: ch.id,
      label: CHANNEL_LABEL[ch.id],
      name: ch.name,
      pct: Math.round(v * 100),
      strong: v >= CHANNEL_STRONG,
      contributed: mine.sensors.includes(ch.id),
    };
  });

  const fused = Math.round(mine.confidence * 100);
  const seen = channels.filter((c) => c.strong).length;
  const e = 4200 + Math.round(mine.x);
  const n = 6450 + Math.round(s.field.depthM - mine.y);

  return {
    id: mine.id,
    model: mine.model,
    typeLabel: spec.label,
    short: spec.short,
    sev: spec.sev,
    color,
    sevBg: `${color}22`,
    grid: `43R FN ${e} ${n}`,
    depth: mine.depthM > 0 ? `${mine.depthM.toFixed(2)} m` : 'SURFACE',
    chainageM: Math.round(chainage(mine, s.routes.find((r) => r.id === s.selectedRouteId)?.path ?? [])),
    channels,
    fused,
    fusedColor: fused >= CONF_CONFIRMED ? p.gn : fused >= CONF_PROBABLE ? p.am : p.rd,
    agreement: `${seen} OF ${channels.length} CHANNELS`,
    // The panel is a decision surface, so it ends on the action, not the score.
    verdict:
      fused >= CONF_CONFIRMED
        ? `CONFIRMED · task ${spec.short} charge · ${spec.minutesToClear} min`
        : fused >= CONF_PROBABLE
          ? `PROBABLE · re-image before tasking`
          : `WEAK · insufficient for tasking`,
  };
}
