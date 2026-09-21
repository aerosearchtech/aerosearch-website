// Per-drone mission FSM.
//
//   PATROL  ── battery≤25% or comms-loss or manual RTH ──>  RTH
//   PATROL  ── manual FAULT ──>  FAULT  (sticky)
//   RTH     ── reaches base ────────────────────────────>  RECOVERING
//   RECOVERING ── battery≥80% ───────────────────────────>  PATROL
//
// In MANUAL controlMode the drone follows manualWaypoint instead of the
// formation slot, but the same FSM rules still apply.

import type { UAV, Vec3 } from "@/drishti/types/uav";
import { steerToward, dist2D } from "./physics";
import { drainRate, shouldRTH, isRecharged } from "./battery";
import { SWARM, COMMS } from "@/drishti/theme/constants";

// Base position is fixed at swarm-centre + SWARM.baseRel.
export function basePos(swarmCentre: Vec3): Vec3 {
  return { x: swarmCentre.x + SWARM.baseRel.x, y: swarmCentre.y + SWARM.baseRel.y, z: 0 };
}

interface StepCtx {
  uav: UAV;
  slot: Vec3 | null;
  base: Vec3;
  dt: number;
  swarmCentre: Vec3;
  // Seconds since drone last had positive signal (set by comms layer)
  signalLossSec: number;
}

export function fsmStep(ctx: StepCtx): { uav: UAV; transition: string | null } {
  const { uav, slot, base, dt } = ctx;
  let next: UAV = uav;
  let transition: string | null = null;

  if (uav.status === "FAULT") return { uav, transition: null };

  // Comms-loss → RTH (only from PATROL/ACTIVE/STANDBY)
  if (
    (uav.status === "ACTIVE" || uav.status === "STANDBY") &&
    ctx.signalLossSec > COMMS.heartbeatTimeoutSec
  ) {
    next = { ...next, status: "RTH", slotIdx: null };
    transition = "COMMS_RTH";
  }

  // Battery → RTH
  if (next.status === "ACTIVE" && shouldRTH(next)) {
    next = { ...next, status: "RTH", slotIdx: null };
    transition = "BATTERY_RTH";
  }

  // Pick goal based on status
  let goal: Vec3;
  if (next.status === "RTH") {
    goal = base;
  } else if (next.status === "RECOVERING") {
    goal = { ...base, z: 0 };
  } else if (next.controlMode === "MANUAL" && next.manualWaypoint) {
    goal = next.manualWaypoint;
  } else if (slot) {
    goal = slot;
  } else {
    goal = next.pos;
  }

  // Steer
  const { pos, vel } = steerToward(next.pos, next.vel, goal, dt);
  next = { ...next, pos, vel };

  // Reached base → RECOVERING
  if (next.status === "RTH" && dist2D(next.pos, base) < 50) {
    next = { ...next, status: "RECOVERING", radarOn: false };
    transition = "ARRIVED_BASE";
  }

  // Recharging or draining
  if (next.status === "RECOVERING") {
    // 10% per second recharge
    next = { ...next, battery: Math.min(100, next.battery + 10 * dt) };
    if (isRecharged(next)) {
      next = { ...next, status: "ACTIVE", radarOn: true };
      transition = "REJOIN";
    }
  } else {
    const speed = Math.sqrt(next.vel.x * next.vel.x + next.vel.y * next.vel.y + next.vel.z * next.vel.z);
    const drain = drainRate(next, speed) * dt;
    next = { ...next, battery: Math.max(0, next.battery - drain) };
    // 0% → FAULT (failed in flight)
    if (next.battery <= 0 && next.status !== "FAULT") {
      next = { ...next, status: "FAULT", radarOn: false, signal: 0 };
      transition = "BATTERY_EXHAUSTED";
    }
  }

  return { uav: next, transition };
}
