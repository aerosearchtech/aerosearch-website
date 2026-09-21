// A scripted scenario is a sequence of timed events.

export type ScenarioId =
  | "STATIC_DETECT"
  | "MOVING_DETECT"
  | "FAULT_INJECT"
  | "LOW_BATTERY_RTH"
  | "GNSS_DENIED"
  | "SPLIT_MERGE";

export interface ScenarioStep {
  atSec: number; // absolute seconds from scenario start
  narration: string; // overlay text shown to operator
  action: ScenarioAction;
}

export type ScenarioAction =
  | { kind: "FAULT_DRONE"; droneId: number }
  | { kind: "SET_BATTERY"; droneId: number; pct: number }
  | { kind: "GNSS_DENY"; on: boolean }
  | { kind: "SET_FORMATION"; formation: string }
  | { kind: "SET_MODE"; mode: string }
  | { kind: "SET_SWARM_MOVING"; moving: boolean; spdMs?: number }
  | { kind: "SPAWN_TARGETS"; count: number; pattern: "INGRESS_N" | "INGRESS_NE" | "RANDOM" }
  | { kind: "ANNOTATE"; text: string };

export interface Scenario {
  id: ScenarioId;
  title: string;
  blurb: string;
  durationSec: number;
  steps: ScenarioStep[];
  // MBC-3 Appendix paragraphs this scenario proves
  proves: string[];
}
