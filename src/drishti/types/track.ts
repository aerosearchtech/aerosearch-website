import type { TargetType } from "./target";

export type TrackState = "TRACK" | "COASTING" | "LOST";

export interface Track {
  id: string;
  // Cartesian metres from swarm centre (fused position)
  x: number;
  y: number;
  z: number;
  // Velocity m/s
  vx: number;
  vy: number;
  vz: number;
  // Polar projections (cached for UI)
  range: number; // km from swarm centre (horizontal)
  azimuth: number; // 0–360°
  speed: number; // m/s magnitude
  rcs: number;
  type: TargetType;
  state: TrackState;
  confidence: number; // 0–1 fused CI confidence
  // History dots (recent positions), oldest first
  history: { x: number; y: number }[];
  // IDs of drones contributing to this fused track
  contributors: number[];
}
