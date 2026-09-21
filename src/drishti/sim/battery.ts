import { BATTERY } from "@/drishti/theme/constants";
import type { UAV } from "@/drishti/types/uav";

// Per-second drain depends on radar TX, motion and comms activity.
export function drainRate(uav: UAV, speedMs: number): number {
  const propulsion =
    BATTERY.drainPropulsionPctSec * (0.4 + Math.min(2, speedMs / 10));
  const radar = uav.radarOn ? BATTERY.drainRadarPctSec : 0;
  const comms = BATTERY.drainCommsPctSec;
  return propulsion + radar + comms;
}

export function shouldRTH(uav: UAV): boolean {
  return uav.battery <= BATTERY.rthThresholdPct && uav.status !== "RTH" && uav.status !== "FAULT";
}

export function isRecharged(uav: UAV): boolean {
  return uav.battery >= BATTERY.rechargedPct;
}
