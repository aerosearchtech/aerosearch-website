// Six scripted scenarios for the Phase-I stage demo.
// Each scenario lists time-stamped events; ScenarioRunner replays them.

import type { Scenario } from "@/drishti/types/scenario";

export const SCENARIOS: Scenario[] = [
  {
    id: "STATIC_DETECT",
    title: "STATIC DETECT",
    blurb:
      "Swarm hovers at 700 m AGL. Five aerial targets ingress from the threat sector. Watch CI fusion converge across all five radars.",
    durationSec: 60,
    proves: ["2.3", "2.4", "2.11", "2.13"],
    steps: [
      { atSec: 0, narration: "ALL NODES ACTIVE — WEDGE FORMATION — RADAR EMITTING", action: { kind: "ANNOTATE", text: "STATIC DETECT" } },
      { atSec: 8, narration: "FIRST DETECTION — track T-001 acquired", action: { kind: "ANNOTATE", text: "T-001 acquired" } },
      { atSec: 20, narration: "5-NODE CONSENSUS — CI ellipses tighten", action: { kind: "ANNOTATE", text: "CI CONVERGED" } },
      { atSec: 45, narration: "Top threat classified as DRONE — ENGAGE flag set", action: { kind: "ANNOTATE", text: "THREAT — ENGAGE" } },
    ],
  },
  {
    id: "MOVING_DETECT",
    title: "MOVING DETECT",
    blurb:
      "Swarm transits at 14 m/s. Targets are detected and tracked while platform velocity compensation runs.",
    durationSec: 60,
    proves: ["2.19"],
    steps: [
      { atSec: 0, narration: "INITIAL — STATIC HOVER", action: { kind: "ANNOTATE", text: "T-0 hover" } },
      { atSec: 3, narration: "COMMAND: SWARM MOVE — platform vel compensation engages", action: { kind: "SET_SWARM_MOVING", moving: true, spdMs: 14 } },
      { atSec: 25, narration: "Targets resolved while moving — revisit < 10 s maintained", action: { kind: "ANNOTATE", text: "Tracking on-the-move" } },
      { atSec: 55, narration: "Mission complete — return to static hover", action: { kind: "SET_SWARM_MOVING", moving: false } },
    ],
  },
  {
    id: "FAULT_INJECT",
    title: "FAULT INJECT",
    blurb:
      "Drishti-4 fails mid-mission. The mission FSM marks it FAULT, formation slots auto-recompute for N=4, and the swarm continues without it.",
    durationSec: 50,
    proves: ["2.14", "2.15"],
    steps: [
      { atSec: 0, narration: "All five nodes nominal", action: { kind: "ANNOTATE", text: "N=5 NOMINAL" } },
      { atSec: 8, narration: "INJECT FAULT — KESTREL-4", action: { kind: "FAULT_DRONE", droneId: 4 } },
      { atSec: 14, narration: "SELF-HEAL — slots recomputed for N=4, FoV gap surfaced", action: { kind: "ANNOTATE", text: "RECONFIG N=4" } },
      { atSec: 45, narration: "Continuous detection maintained — graceful degradation proved", action: { kind: "ANNOTATE", text: "DEGRADED OK" } },
    ],
  },
  {
    id: "LOW_BATTERY_RTH",
    title: "LOW BATTERY RTH",
    blurb:
      "Drishti-5 reaches 25 % battery and autonomously returns to base. Formation reforms for N=4, drone recovers, then rejoins.",
    durationSec: 70,
    proves: ["2.18"],
    steps: [
      { atSec: 0, narration: "Force KESTREL-5 battery to 28 %", action: { kind: "SET_BATTERY", droneId: 5, pct: 28 } },
      { atSec: 10, narration: "Battery threshold crossed — AUTO RTH engaged", action: { kind: "ANNOTATE", text: "AUTO RTH" } },
      { atSec: 20, narration: "Formation reforms for N=4 — sector reallocation", action: { kind: "ANNOTATE", text: "N=4 REFORM" } },
      { atSec: 50, narration: "Drone reaches base — RECOVERING (recharging)", action: { kind: "ANNOTATE", text: "RECOVERING" } },
      { atSec: 65, narration: "Recharged → rejoins formation", action: { kind: "ANNOTATE", text: "REJOIN" } },
    ],
  },
  {
    id: "GNSS_DENIED",
    title: "GNSS DENIED",
    blurb:
      "Jamming attack denies GNSS to the entire swarm. Nodes switch to INS + UWB cooperative localisation; covariance ellipses widen, then tighten as relative lock is achieved.",
    durationSec: 60,
    proves: ["2.21"],
    steps: [
      { atSec: 0, narration: "All nodes GPS — nominal localisation", action: { kind: "ANNOTATE", text: "GPS LOCK" } },
      { atSec: 5, narration: "JAMMING — GNSS denied across all five nodes", action: { kind: "GNSS_DENY", on: true } },
      { atSec: 25, narration: "UWB cooperative lock achieved — covariance shrinks", action: { kind: "ANNOTATE", text: "UWB LOCK" } },
      { atSec: 55, narration: "GPS restored", action: { kind: "GNSS_DENY", on: false } },
    ],
  },
  {
    id: "SPLIT_MERGE",
    title: "SPLIT & MERGE",
    blurb:
      "Swarm splits into a 360° coverage configuration for area surveillance, then merges back into wedge formation.",
    durationSec: 55,
    proves: ["2.20"],
    steps: [
      { atSec: 0, narration: "Initial WEDGE — directional 90° FoV", action: { kind: "SET_FORMATION", formation: "WEDGE" } },
      { atSec: 6, narration: "SPLIT — transition to CIRCULAR for 360° coverage", action: { kind: "SET_FORMATION", formation: "CIRCULAR" } },
      { atSec: 35, narration: "MERGE — return to WEDGE", action: { kind: "SET_FORMATION", formation: "WEDGE" } },
    ],
  },
];
