// Per-drone radar detection model.
// Outputs noisy measurements to feed the tracker/fusion.

import { RADAR } from "@/drishti/theme/constants";
import type { Target } from "@/drishti/types/target";
import type { UAV } from "@/drishti/types/uav";

export interface Measurement {
  targetId: string;
  droneId: number;
  // Noisy cartesian position estimate (m, swarm-centre frame)
  x: number;
  y: number;
  z: number;
  // SNR in dB
  snrDb: number;
}

// FoV is centred outward from swarm centre (along position vector from origin).
function outwardAzRad(uav: UAV): number {
  return Math.atan2(uav.pos.x, uav.pos.y);
}

function angDiff(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return Math.abs(d);
}

// Random gaussian via Box–Muller
function gauss(): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function detect(uavs: UAV[], targets: Target[], maxRangeKm: number): Measurement[] {
  const maxRangeM = maxRangeKm * 1000;
  const halfFov = (RADAR.fovDeg * Math.PI) / 180 / 2;
  const halfAlt = RADAR.detectAltHalfM;
  // SNR(R) ∝ RCS · (Rref/R)^4 — use SNR ≥ 10 dB at 2 km / 0.3 m² as anchor.
  const refRangeM = 2000;
  const refRCS = 0.3;
  const refSnrDb = 13;

  const measurements: Measurement[] = [];

  for (const uav of uavs) {
    if (!uav.radarOn || uav.status === "FAULT" || uav.status === "RTH") continue;
    const oAz = outwardAzRad(uav);
    for (const tgt of targets) {
      const dx = tgt.pos.x - uav.pos.x;
      const dy = tgt.pos.y - uav.pos.y;
      const dz = tgt.pos.z - uav.pos.z;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r > maxRangeM) continue;
      // FoV gate (horizontal)
      const tAz = Math.atan2(dx, dy);
      if (angDiff(tAz, oAz) > halfFov) continue;
      // Altitude band
      if (Math.abs(dz) > halfAlt) continue;
      // Range equation, in dB
      const snrDb = refSnrDb + 10 * Math.log10(tgt.rcs / refRCS) + 40 * Math.log10(refRangeM / Math.max(1, r));
      // Detection probability ~ logistic of SNR-threshold
      const pd = 1 / (1 + Math.exp(-(snrDb - 8) / 2));
      if (Math.random() > pd) continue;
      // Add Gaussian measurement noise (range, az). σR ≈ 30 m, σAz ≈ 1°.
      const noisyR = r + gauss() * 30;
      const noisyAz = tAz + gauss() * ((1 * Math.PI) / 180);
      const mx = uav.pos.x + noisyR * Math.sin(noisyAz);
      const my = uav.pos.y + noisyR * Math.cos(noisyAz);
      const mz = tgt.pos.z + gauss() * 30;
      measurements.push({ targetId: tgt.id, droneId: uav.id, x: mx, y: my, z: mz, snrDb });
    }
  }
  return measurements;
}
