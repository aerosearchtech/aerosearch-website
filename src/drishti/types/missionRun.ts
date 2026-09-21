// Live mission-execution state machine. Distinct from the static `Mission`
// definition (waypoints, sectors) — this is what's happening NOW.

export type MissionStatus = "IDLE" | "RUNNING" | "PAUSED" | "ABORTED" | "COMPLETE";

export type MissionPhaseId =
  | "PRE_FLIGHT"
  | "ASSEMBLY"
  | "INGRESS"
  | "PATROL"
  | "RTH"
  | "RECOVERY";

export interface MissionPhase {
  id: MissionPhaseId;
  label: string;
  // Nominal duration in seconds — drives the progress bar.
  durationSec: number;
  // Mission mode the swarm should be in during this phase.
  swarmMode: string;
}

export interface MissionRun {
  status: MissionStatus;
  phaseId: MissionPhaseId;
  // Seconds elapsed in the current phase
  phaseElapsedSec: number;
  // Seconds elapsed since START across all phases
  totalElapsedSec: number;
}

export interface ROE {
  engageRcsMin: number; // m²
  engageSpeedMin: number; // m/s
  engageScoreMin: number; // 0–1 threat score
  confirmRequired: boolean;
  // Track ids treated as friendly / no-engage
  iffWhitelist: string[];
}
