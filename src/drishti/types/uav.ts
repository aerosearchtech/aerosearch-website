// One UAS in the swarm.

export type UAVStatus = "ACTIVE" | "STANDBY" | "FAULT" | "RTH" | "RECOVERING";
export type NavMode = "GPS" | "INS" | "UWB";
export type ControlMode = "AUTO" | "MANUAL";

export interface Vec3 {
  x: number; // east, metres from swarm centre
  y: number; // north, metres
  z: number; // altitude AGL, metres
}

export interface UAV {
  id: number;
  callsign: string;
  role: "LEAD" | "WING-L" | "WING-R" | "REAR-L" | "REAR-R" | "FREE";
  pos: Vec3;
  vel: Vec3;
  battery: number; // 0–100
  signal: number; // 0–100 (link quality to GCS)
  status: UAVStatus;
  navMode: NavMode;
  controlMode: ControlMode;
  radarOn: boolean;
  // Index of formation slot this drone is assigned to (null if free / RTH)
  slotIdx: number | null;
  // Per-drone manual waypoint (if controlMode === 'MANUAL')
  manualWaypoint?: Vec3 | null;
  // Sub-swarm group (1 or 2) — used by SPLIT/MERGE
  groupId: 1 | 2;
}
