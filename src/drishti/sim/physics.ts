// 3D kinematic integration for UAVs and targets.

import type { Vec3 } from "@/drishti/types/uav";

// Steering: accelerate toward goal, capped.
const MAX_ACCEL_MS2 = 3;
const MAX_SPEED_MS = 25;

export function steerToward(pos: Vec3, vel: Vec3, goal: Vec3, dt: number): { pos: Vec3; vel: Vec3 } {
  const dx = goal.x - pos.x;
  const dy = goal.y - pos.y;
  const dz = goal.z - pos.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (dist < 0.5) {
    // Snap & dampen
    return { pos: { ...goal }, vel: { x: vel.x * 0.6, y: vel.y * 0.6, z: vel.z * 0.6 } };
  }
  // Desired velocity capped at MAX_SPEED, pointing at goal
  const desired = {
    x: (dx / dist) * Math.min(MAX_SPEED_MS, dist),
    y: (dy / dist) * Math.min(MAX_SPEED_MS, dist),
    z: (dz / dist) * Math.min(MAX_SPEED_MS, dist),
  };
  const dvx = desired.x - vel.x;
  const dvy = desired.y - vel.y;
  const dvz = desired.z - vel.z;
  const dvm = Math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz);
  const cap = MAX_ACCEL_MS2 * dt;
  const k = dvm > cap ? cap / dvm : 1;
  const nvel = {
    x: vel.x + dvx * k,
    y: vel.y + dvy * k,
    z: vel.z + dvz * k,
  };
  const npos = {
    x: pos.x + nvel.x * dt,
    y: pos.y + nvel.y * dt,
    z: pos.z + nvel.z * dt,
  };
  return { pos: npos, vel: nvel };
}

export function integrate(pos: Vec3, vel: Vec3, dt: number): Vec3 {
  return {
    x: pos.x + vel.x * dt,
    y: pos.y + vel.y * dt,
    z: pos.z + vel.z * dt,
  };
}

export function dist2D(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function dist3D(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
