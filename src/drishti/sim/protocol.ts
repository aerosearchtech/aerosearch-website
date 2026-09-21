// Worker ⇄ Main thread message protocol.

import type { UAV, Vec3, ControlMode } from "@/drishti/types/uav";
import type { Track } from "@/drishti/types/track";
import type { Alert } from "@/drishti/types/alert";
import type { Formation } from "@/drishti/types/mission";

export interface Snapshot {
  uavs: UAV[];
  tracks: Track[];
  alerts: Alert[];
  missionTimeSec: number;
  radarTimeSec: number;
  latencyMs: number;
  revisitSec: number;
  gnssCount: number;
  windKt: number;
  swarmMoving: boolean;
  swarmSpd: number;
  splitActive: boolean;
}

export type MainToWorker =
  | { kind: "INIT"; maxRangeKm: number; formation: Formation }
  | { kind: "SET_SIM_SPEED"; speed: number }
  | { kind: "SET_FORMATION"; formation: Formation }
  | { kind: "SET_RADAR_ON"; on: boolean }
  | { kind: "TOGGLE_GNSS_DENY" }
  | { kind: "TOGGLE_MOVING" }
  | { kind: "FAULT_DRONE"; droneId: number }
  | { kind: "RTH_ALL" }
  | { kind: "RTH_DRONE"; droneId: number }
  | { kind: "SET_CONTROL_MODE"; droneId: number; mode: ControlMode }
  | { kind: "SET_MANUAL_WAYPOINT"; droneId: number; waypoint: Vec3 }
  | { kind: "SET_DRONE_RADAR"; droneId: number; on: boolean }
  | { kind: "SET_BATTERY"; droneId: number; pct: number }
  | { kind: "ADD_DRONE" }
  | { kind: "REMOVE_DRONE" }
  | { kind: "SET_SPLIT"; split: boolean }
  | { kind: "RESET" }
  | { kind: "SET_MAX_RANGE"; maxRangeKm: number };

export type WorkerToMain = { kind: "SNAPSHOT"; snapshot: Snapshot };
