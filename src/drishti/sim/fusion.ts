// Multi-source measurement fusion → fused Track.
// Simple covariance-intersection-style weighted average (snr-weighted).
//
// Tracks persist across ticks: if a target wasn't detected this tick we
// still emit its prior as COASTING (predicted forward, decayed confidence)
// until COAST_TIMEOUT_SEC elapses, then we drop it. This kills the flicker
// caused by FoV gaps or missed detection rolls.

import type { Track, TrackState } from "@/drishti/types/track";
import type { Target } from "@/drishti/types/target";
import type { TargetType } from "@/drishti/types/target";
import type { Measurement } from "./radar";

const COAST_TIMEOUT_SEC = 5;
// EMA smoothing factors — kill measurement-noise jitter in displayed pos/vel
// and downstream threat scores. Lower = smoother / more lag.
const ALPHA_POS = 0.35;
const ALPHA_VEL = 0.2;
const ALPHA_CONF = 0.15;

export interface PrevTrack {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rcs: number;
  type: TargetType;
  history: { x: number; y: number }[];
  // Seconds since last successful measurement update; 0 means just updated.
  ageSec: number;
  contributors: number[];
  confidence: number;
}

// Combine all measurements for a target into one fused estimate.
export function fuse(measurements: Measurement[]): { x: number; y: number; z: number; weight: number } | null {
  if (measurements.length === 0) return null;
  let wsum = 0;
  let sx = 0;
  let sy = 0;
  let sz = 0;
  for (const m of measurements) {
    const w = Math.min(1e3, Math.pow(10, m.snrDb / 10));
    wsum += w;
    sx += m.x * w;
    sy += m.y * w;
    sz += m.z * w;
  }
  return { x: sx / wsum, y: sy / wsum, z: sz / wsum, weight: wsum };
}

// Build/update tracks from the current measurement batch + prior tracks.
// `prior` is mutated in place to carry forward the next-tick state.
export function updateTracks(
  targets: Target[],
  measurements: Measurement[],
  prior: Map<string, PrevTrack>,
  dt: number,
): Track[] {
  const byTarget = new Map<string, Measurement[]>();
  for (const m of measurements) {
    const arr = byTarget.get(m.targetId) ?? [];
    arr.push(m);
    byTarget.set(m.targetId, arr);
  }

  // 1. Update entries that got a measurement.
  //    Position is EMA-smoothed (kills measurement-noise jitter on the PPI
  //    and TRACKS columns). Velocity is taken from ground-truth Doppler with
  //    a small noise term — derivative of a 30 m-noisy position over a 0.1 s
  //    tick would otherwise spike velocity by ~300 m/s, which is what was
  //    making the threat-panel sort thrash.
  for (const [tgtId, ms] of byTarget) {
    const fused = fuse(ms);
    if (!fused) continue;
    const tgt = targets.find((t) => t.id === tgtId);
    if (!tgt) continue;
    const prev = prior.get(tgtId);
    // EMA-blend position with prior
    const x = prev ? prev.x * (1 - ALPHA_POS) + fused.x * ALPHA_POS : fused.x;
    const y = prev ? prev.y * (1 - ALPHA_POS) + fused.y * ALPHA_POS : fused.y;
    const z = prev ? prev.z * (1 - ALPHA_POS) + fused.z * ALPHA_POS : fused.z;
    // Doppler-equivalent velocity: ground-truth with ±0.5 m/s noise, then EMA.
    const rawVx = tgt.vel.x + (Math.random() - 0.5);
    const rawVy = tgt.vel.y + (Math.random() - 0.5);
    const rawVz = tgt.vel.z + (Math.random() - 0.5);
    const vx = prev ? prev.vx * (1 - ALPHA_VEL) + rawVx * ALPHA_VEL : rawVx;
    const vy = prev ? prev.vy * (1 - ALPHA_VEL) + rawVy * ALPHA_VEL : rawVy;
    const vz = prev ? prev.vz * (1 - ALPHA_VEL) + rawVz * ALPHA_VEL : rawVz;
    const confidenceRaw = Math.min(0.98, 0.55 + Math.log10(fused.weight) / 5);
    const confidence = prev
      ? prev.confidence * (1 - ALPHA_CONF) + confidenceRaw * ALPHA_CONF
      : confidenceRaw;
    const history = prev
      ? [...prev.history.slice(-19), { x, y }]
      : [{ x, y }];
    prior.set(tgtId, {
      x,
      y,
      z,
      vx,
      vy,
      vz,
      rcs: tgt.rcs,
      type: tgt.type,
      history,
      ageSec: 0,
      contributors: ms.map((m) => m.droneId),
      confidence,
    });
  }

  // 2. Age out entries without a measurement this tick — predict forward,
  //    drop when stale.
  for (const [id, p] of prior) {
    if (byTarget.has(id)) continue;
    const newAge = p.ageSec + dt;
    if (newAge > COAST_TIMEOUT_SEC) {
      prior.delete(id);
      continue;
    }
    prior.set(id, {
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      z: p.z + p.vz * dt,
      ageSec: newAge,
      // Decay confidence linearly toward 0.3 over the timeout window.
      confidence: Math.max(0.3, p.confidence * (1 - dt / COAST_TIMEOUT_SEC)),
    });
  }

  // 3. Emit tracks from the prior map.
  const tracks: Track[] = [];
  for (const [id, p] of prior) {
    const range = Math.sqrt(p.x * p.x + p.y * p.y) / 1000;
    const azimuth = ((Math.atan2(p.x, p.y) * 180) / Math.PI + 360) % 360;
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    const state: TrackState =
      p.ageSec === 0 ? "TRACK" : p.ageSec < COAST_TIMEOUT_SEC * 0.7 ? "COASTING" : "LOST";
    tracks.push({
      id,
      x: p.x,
      y: p.y,
      z: p.z,
      vx: p.vx,
      vy: p.vy,
      vz: p.vz,
      range,
      azimuth,
      speed,
      rcs: p.rcs,
      type: p.type,
      state,
      confidence: p.confidence,
      history: p.history,
      contributors: p.contributors,
    });
  }
  return tracks;
}
