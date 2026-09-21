import type { Vec3 } from "./uav";

export type TargetType = "DRONE" | "BIRD" | "UNK" | "REFLECTOR";

export interface Target {
  id: string; // e.g. "T-001"
  pos: Vec3;
  vel: Vec3;
  rcs: number; // m²
  type: TargetType;
  // Ground-truth, not what the swarm sees
}
