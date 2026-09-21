import type { Vec3 } from "./uav";

export type Formation = "WEDGE" | "LINE-ABREAST" | "CIRCULAR" | "DIAMOND";
export type MissionMode =
  | "DETECT+TRACK"
  | "360° COVER"
  | "SURVEILLANCE"
  | "STANDBY"
  | "RTH";

export interface Sector {
  // Azimuth wedge from this drone's slot, both in degrees 0–360
  azStartDeg: number;
  azEndDeg: number;
}

export interface Waypoint {
  id: string;
  pos: Vec3;
  label?: string;
  // Optional drones constrained to this waypoint
  droneIds?: number[];
}

export interface Mission {
  name: string;
  formation: Formation;
  mode: MissionMode;
  basePos: Vec3; // RTH base in metres-from-swarm-centre frame
  waypoints: Waypoint[];
  // Per-drone sector assignment, indexed by slotIdx
  sectorsBySlot: Sector[];
}
