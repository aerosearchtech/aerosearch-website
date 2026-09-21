// Sensor physics: how strongly each channel responds to a device, and the
// fused confidence that follows. Kept out of the canvas layer because the
// field generator, the derive layer and the tile renderer all need it, and
// because it is the model — not a drawing detail.

import {
  CHANNEL_STRONG,
  CORROBORATION_FLOOR,
  SENSOR_CHANNELS,
  SENSOR_RESPONSE,
  SURFACE_CHANNELS,
  SURFACE_SIGHT_DEPTH_M,
} from './constants';
import type { Mine, SensorTag } from './types';

/**
 * How strongly one channel responds to one device, 0..1.
 *
 * This is why the fusion panel shows every tile instead of one number: an
 * all-plastic PFM-1 lights the camera and polarimeter and leaves the
 * magnetometer flat, a steel-cased TM-62M does the reverse. Depth attenuates
 * only the channels that look at the surface; `quality` is the local luck of
 * the fix — soil, clutter, look angle.
 */
export function response(mine: Mine, key: SensorTag): number {
  const base = SENSOR_RESPONSE[key][mine.type];
  const surface = SURFACE_CHANNELS.includes(key);
  const fade = surface ? Math.max(0, 1 - mine.depthM / SURFACE_SIGHT_DEPTH_M) : 1;
  return Math.max(0, Math.min(1, base * fade * mine.quality));
}

/**
 * Late-stage decision fusion across every channel, 0..1.
 *
 * The strongest channel sets the ceiling and corroboration from the others
 * closes the gap to it. A plain weighted mean would be wrong in the case that
 * matters most: GPR alone on a plastic AP mine is a real detection, and
 * averaging it against three channels that physically cannot see the device
 * would report it as a weak one.
 */
export function fusedConfidence(mine: Mine): number {
  const r = SENSOR_CHANNELS.map((ch) => ({ v: response(mine, ch.id), w: ch.weight }));
  const best = r.reduce((a, b) => (b.v > a.v ? b : a));
  const rest = r.filter((x) => x !== best);
  const den = rest.reduce((a, x) => a + x.w, 0);
  const corr = den > 0 ? rest.reduce((a, x) => a + x.v * x.w, 0) / den : 0;
  return best.v * (CORROBORATION_FLOOR + (1 - CORROBORATION_FLOOR) * corr);
}

/**
 * Channels that contributed to the fix. A device is on the map because
 * something saw it, so the strongest channel is returned even when none of
 * them cleared the threshold on its own.
 */
export function contributors(mine: Mine): SensorTag[] {
  const hit = SENSOR_CHANNELS.filter((ch) => response(mine, ch.id) >= CHANNEL_STRONG);
  if (hit.length) return hit.map((ch) => ch.id);
  return [SENSOR_CHANNELS.reduce((a, b) => (response(mine, b.id) > response(mine, a.id) ? b : a)).id];
}
