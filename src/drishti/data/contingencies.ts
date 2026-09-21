// Read-only contingency matrix — surfaces what the FSM already enforces
// (`src/sim/mission.ts` + `src/sim/worker.ts`).

export interface ContingencyRule {
  id: string;
  trigger: string;
  triggerDetail: string;
  action: string;
  actionDetail: string;
  severity: "INFO" | "WARN" | "CRITICAL";
}

export const CONTINGENCIES: ContingencyRule[] = [
  {
    id: "battery",
    trigger: "Battery ≤ 25 %",
    triggerDetail: "Per-drone SoC threshold (BATTERY.rthThresholdPct)",
    action: "AUTO RTH",
    actionDetail: "Drone exits formation, paths to base. Slot reassigned across N-1.",
    severity: "WARN",
  },
  {
    id: "comms",
    trigger: "Comms loss > 30 s",
    triggerDetail: "Signal < 25 % for COMMS.heartbeatTimeoutSec",
    action: "AUTO RTH",
    actionDetail: "Same as battery trigger. Sticky until reconnected at base.",
    severity: "WARN",
  },
  {
    id: "fault",
    trigger: "Hard fault",
    triggerDetail: "Operator inject or battery exhausted in flight",
    action: "GRACEFUL DEGRADE",
    actionDetail: "Status → FAULT (sticky). Formation reslots for N-1. FoV gap visualised.",
    severity: "CRITICAL",
  },
  {
    id: "gnss",
    trigger: "GNSS denied",
    triggerDetail: "Jamming detected across one or more nodes",
    action: "INS + UWB FALLBACK",
    actionDetail: "All nodes switch navMode → INS. Position covariance grows then tightens as UWB relative lock converges.",
    severity: "WARN",
  },
  {
    id: "threat",
    trigger: "Threat ≥ HIGH",
    triggerDetail: "Combined RCS + speed + approach-vector score > 0.65",
    action: "ALERT + FLAG",
    actionDetail: "Threat tagged in ASP. Operator decides engagement per ROE.",
    severity: "CRITICAL",
  },
  {
    id: "node-loss-multi",
    trigger: "≥ 3 nodes lost",
    triggerDetail: "Active count drops below MBC-3 minimum coverage",
    action: "ABORT + RTH ALL",
    actionDetail: "Mission un-recoverable; broadcast RTH to all surviving nodes.",
    severity: "CRITICAL",
  },
];
