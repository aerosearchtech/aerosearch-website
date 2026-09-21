import type { MissionPhase } from "@/drishti/types/missionRun";

// Nominal phase plan for an OP MEHAR Phase-I sortie.
// Durations chosen so the demo can run end-to-end in ~3 min.
export const MISSION_PHASES: MissionPhase[] = [
  { id: "PRE_FLIGHT", label: "PRE-FLIGHT", durationSec: 20, swarmMode: "STANDBY" },
  { id: "ASSEMBLY", label: "ASSEMBLY", durationSec: 25, swarmMode: "SURVEILLANCE" },
  { id: "INGRESS", label: "INGRESS", durationSec: 30, swarmMode: "DETECT+TRACK" },
  { id: "PATROL", label: "PATROL", durationSec: 60, swarmMode: "DETECT+TRACK" },
  { id: "RTH", label: "RTH", durationSec: 25, swarmMode: "RTH" },
  { id: "RECOVERY", label: "RECOVERY", durationSec: 15, swarmMode: "STANDBY" },
];

export const TOTAL_MISSION_SEC = MISSION_PHASES.reduce((a, p) => a + p.durationSec, 0);
