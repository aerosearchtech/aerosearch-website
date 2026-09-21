/// <reference lib="webworker" />

// Main simulation worker — runs at SIM.tickMs (100 ms = 10 Hz).
// Owns ground-truth UAV / target state, runs physics + radar + fusion,
// pushes Snapshot frames to the main thread.

import type { UAV, Vec3 } from "@/drishti/types/uav";
import type { Target } from "@/drishti/types/target";
import type { Track } from "@/drishti/types/track";
import type { Alert } from "@/drishti/types/alert";
import type { Formation } from "@/drishti/types/mission";
import { SIM, TARGET, COMMS, SWARM } from "@/drishti/theme/constants";
import { slots, assignSlots } from "./formation";
import { detect } from "./radar";
import { updateTracks, type PrevTrack } from "./fusion";
import { computeComms } from "./comms";
import { spawnInitial, step as stepTargets } from "./targets";
import { fsmStep, basePos } from "./mission";
import type { MainToWorker, Snapshot, WorkerToMain } from "./protocol";

const ROLES = ["LEAD", "WING-L", "WING-R", "REAR-L", "REAR-R"] as const;

function initUAV(id: number): UAV {
  return {
    id,
    callsign: `KESTREL-${id}`,
    role: ROLES[id - 1] ?? "FREE",
    pos: { x: 0, y: 0, z: 700 },
    vel: { x: 0, y: 0, z: 0 },
    battery: 100 - (id - 1) * 4,
    signal: 95,
    status: "ACTIVE",
    navMode: "GPS",
    controlMode: "AUTO",
    radarOn: true,
    slotIdx: id - 1,
    groupId: 1,
  };
}

interface World {
  uavs: UAV[];
  targets: Target[];
  formation: Formation;
  maxRangeKm: number;
  simSpeed: number;
  radarOn: boolean;
  gnssDenied: boolean;
  swarmMoving: boolean;
  swarmSpdMs: number;
  swarmCentre: Vec3;
  splitActive: boolean;
  missionTimeSec: number;
  radarTimeSec: number;
  alerts: Alert[];
  windKt: number;
  prior: Map<string, PrevTrack>;
  revisitSec: number;
  signalLossSec: Map<number, number>; // droneId → seconds since last good signal
}

const world: World = {
  uavs: [1, 2, 3, 4, 5].map(initUAV),
  targets: [],
  formation: "WEDGE",
  maxRangeKm: 5,
  simSpeed: 1,
  radarOn: true,
  gnssDenied: false,
  swarmMoving: false,
  swarmSpdMs: 0,
  swarmCentre: { x: 0, y: 0, z: 700 },
  splitActive: false,
  missionTimeSec: 0,
  radarTimeSec: 0,
  alerts: [
    { time: zulu(), sev: "INFO", msg: "SYSTEM ONLINE — RADAR EMITTING" },
    { time: zulu(), sev: "INFO", msg: "SWARM FORMATION: WEDGE / 5 NODES ACTIVE" },
  ],
  windKt: 6,
  prior: new Map(),
  revisitSec: 8.4,
  signalLossSec: new Map(),
};

function zulu(): string {
  const d = new Date();
  return `${String(d.getUTCHours()).padStart(2, "0")}${String(d.getUTCMinutes()).padStart(2, "0")}Z`;
}

function pushAlert(sev: Alert["sev"], msg: string): void {
  world.alerts = [...world.alerts.slice(-49), { time: zulu(), sev, msg }];
}

world.targets = spawnInitial(TARGET.initialCount, world.maxRangeKm * 1000);

function tick(dt: number): void {
  world.missionTimeSec += dt;
  if (world.radarOn) world.radarTimeSec += dt;

  if (world.swarmMoving) {
    world.swarmCentre = {
      x: world.swarmCentre.x,
      y: world.swarmCentre.y + world.swarmSpdMs * dt,
      z: world.swarmCentre.z,
    };
  }

  // Compute formation slots. When split is active, each sub-group has its
  // own centre and its own slot layout for the current formation.
  const slotByDroneId = new Map<number, Vec3>();
  const computeGroup = (groupId: 1 | 2, centre: Vec3) => {
    const group = world.uavs.filter((u) => u.status === "ACTIVE" && u.groupId === groupId);
    if (group.length === 0) return;
    const shapes = slots(world.formation, group.length, centre.z);
    const sp = shapes.map((s) => ({ x: s.x + centre.x, y: s.y + centre.y, z: s.z }));
    const perm = assignSlots(group.map((u) => u.pos), sp);
    group.forEach((u, i) => {
      const s = sp[perm[i] ?? i];
      if (s) slotByDroneId.set(u.id, s);
    });
  };

  if (world.splitActive) {
    const c1: Vec3 = {
      x: world.swarmCentre.x,
      y: world.swarmCentre.y + SWARM.splitOffsetM,
      z: world.swarmCentre.z,
    };
    const c2: Vec3 = {
      x: world.swarmCentre.x,
      y: world.swarmCentre.y - SWARM.splitOffsetM,
      z: world.swarmCentre.z,
    };
    computeGroup(1, c1);
    computeGroup(2, c2);
  } else {
    computeGroup(1, world.swarmCentre);
    computeGroup(2, world.swarmCentre);
  }

  // Update signal-loss timer
  for (const u of world.uavs) {
    const prev = world.signalLossSec.get(u.id) ?? 0;
    world.signalLossSec.set(u.id, u.signal < 25 ? prev + dt : 0);
  }

  // FSM step
  const base = basePos(world.swarmCentre);
  const transitions: { id: number; t: string }[] = [];
  world.uavs = world.uavs.map((u) => {
    const slot = u.status === "ACTIVE" ? slotByDroneId.get(u.id) ?? null : null;
    const { uav: next, transition } = fsmStep({
      uav: u,
      slot,
      base,
      dt,
      swarmCentre: world.swarmCentre,
      signalLossSec: world.signalLossSec.get(u.id) ?? 0,
    });
    if (transition) transitions.push({ id: u.id, t: transition });
    return next;
  });

  for (const tr of transitions) {
    if (tr.t === "BATTERY_RTH")
      pushAlert("WARN", `KESTREL-${tr.id} BATTERY LOW — AUTO RTH ENGAGED`);
    if (tr.t === "COMMS_RTH")
      pushAlert("WARN", `KESTREL-${tr.id} LINK LOSS — AUTO RTH ENGAGED`);
    if (tr.t === "ARRIVED_BASE")
      pushAlert("INFO", `KESTREL-${tr.id} ARRIVED BASE — RECOVERING`);
    if (tr.t === "REJOIN")
      pushAlert("INFO", `KESTREL-${tr.id} RECHARGED — REJOINING SWARM`);
    if (tr.t === "BATTERY_EXHAUSTED")
      pushAlert("CRITICAL", `KESTREL-${tr.id} BATTERY EXHAUSTED — FAULT`);
  }

  // Comms / signal
  const { state: commsState, perDroneSignal } = computeComms(world.uavs);
  world.uavs = world.uavs.map((u, i) => ({ ...u, signal: perDroneSignal[i] ?? u.signal }));

  // Targets
  world.targets = stepTargets(world.targets, dt, world.maxRangeKm * 1000);

  // Radar → fusion → tracks. updateTracks mutates `prior` in place
  // (carries forward COASTING entries until they time out).
  const ms = world.radarOn ? detect(world.uavs, world.targets, world.maxRangeKm) : [];
  cachedTracks = updateTracks(world.targets, ms, world.prior, Math.max(dt, 0.05));
  if (cachedTracks.length > 0) world.revisitSec = 8 + (Math.random() - 0.5);
  cachedLatency = commsState.latencyMs;
}

let cachedTracks: Track[] = [];
let cachedLatency: number = COMMS.baseLatencyMs;

function snapshot(): Snapshot {
  const activeUavs = world.uavs.filter((u) => u.status === "ACTIVE");
  const gnssCount = world.gnssDenied ? 0 : activeUavs.filter((u) => u.navMode === "GPS").length;
  return {
    uavs: world.uavs,
    tracks: cachedTracks,
    alerts: world.alerts,
    missionTimeSec: Math.floor(world.missionTimeSec),
    radarTimeSec: Math.floor(world.radarTimeSec),
    latencyMs: cachedLatency,
    revisitSec: world.revisitSec,
    gnssCount,
    windKt: Math.round(world.windKt),
    swarmMoving: world.swarmMoving,
    swarmSpd: Math.round(world.swarmSpdMs),
    splitActive: world.splitActive,
  };
}

self.onmessage = (e: MessageEvent<MainToWorker>) => {
  const m = e.data;
  switch (m.kind) {
    case "INIT":
      world.maxRangeKm = m.maxRangeKm;
      world.formation = m.formation;
      world.targets = spawnInitial(TARGET.initialCount, m.maxRangeKm * 1000);
      break;
    case "SET_SIM_SPEED":
      world.simSpeed = m.speed;
      break;
    case "SET_FORMATION":
      world.formation = m.formation;
      pushAlert("INFO", `FORMATION CHANGE → ${m.formation}`);
      break;
    case "SET_RADAR_ON":
      world.radarOn = m.on;
      pushAlert(m.on ? "INFO" : "WARN", m.on ? "RADAR EMISSION ACTIVATED" : "RADAR EMISSION SUSPENDED");
      break;
    case "TOGGLE_GNSS_DENY":
      world.gnssDenied = !world.gnssDenied;
      world.uavs = world.uavs.map((u) => ({ ...u, navMode: world.gnssDenied ? "INS" : "GPS" }));
      pushAlert(
        world.gnssDenied ? "CRITICAL" : "INFO",
        world.gnssDenied ? "GNSS DENIED — ALL NODES SWITCHING TO INS" : "GNSS RESTORED — GPS LOCK REACQUIRED",
      );
      break;
    case "TOGGLE_MOVING":
      world.swarmMoving = !world.swarmMoving;
      world.swarmSpdMs = world.swarmMoving ? 14 : 0;
      pushAlert("INFO", world.swarmMoving ? "SWARM MOVING — PLATFORM VEL COMP ACTIVE" : "SWARM STATIC HOVER");
      break;
    case "FAULT_DRONE": {
      const id = m.droneId;
      world.uavs = world.uavs.map((u) =>
        u.id === id ? { ...u, status: "FAULT", radarOn: false, signal: 0, slotIdx: null } : u,
      );
      pushAlert("CRITICAL", `KESTREL-${id} FAULT — NODE LOST FROM SWARM`);
      break;
    }
    case "RTH_ALL":
      world.uavs = world.uavs.map((u) =>
        u.status === "FAULT" ? u : { ...u, status: "RTH", slotIdx: null },
      );
      pushAlert("ALERT", "RTH COMMANDED — ALL UNITS RETURNING HOME");
      break;
    case "RTH_DRONE": {
      const id = m.droneId;
      world.uavs = world.uavs.map((u) =>
        u.id === id && u.status !== "FAULT" ? { ...u, status: "RTH", slotIdx: null } : u,
      );
      pushAlert("WARN", `KESTREL-${id} RTH COMMANDED`);
      break;
    }
    case "SET_CONTROL_MODE": {
      const id = m.droneId;
      world.uavs = world.uavs.map((u) => (u.id === id ? { ...u, controlMode: m.mode } : u));
      pushAlert("INFO", `KESTREL-${id} CONTROL → ${m.mode}`);
      break;
    }
    case "SET_MANUAL_WAYPOINT": {
      const id = m.droneId;
      world.uavs = world.uavs.map((u) =>
        u.id === id ? { ...u, controlMode: "MANUAL", manualWaypoint: m.waypoint } : u,
      );
      break;
    }
    case "SET_DRONE_RADAR": {
      const id = m.droneId;
      world.uavs = world.uavs.map((u) => (u.id === id ? { ...u, radarOn: m.on } : u));
      break;
    }
    case "SET_BATTERY": {
      const id = m.droneId;
      world.uavs = world.uavs.map((u) =>
        u.id === id ? { ...u, battery: Math.max(0, Math.min(100, m.pct)) } : u,
      );
      break;
    }
    case "ADD_DRONE": {
      if (world.uavs.length >= SWARM.maxSize) {
        pushAlert("WARN", `SWARM AT MAX SIZE (${SWARM.maxSize})`);
        break;
      }
      const nextId = (Math.max(0, ...world.uavs.map((u) => u.id)) + 1);
      const fresh = initUAV(nextId);
      // Join the smaller group when split
      if (world.splitActive) {
        const g1 = world.uavs.filter((u) => u.groupId === 1).length;
        const g2 = world.uavs.filter((u) => u.groupId === 2).length;
        fresh.groupId = g1 <= g2 ? 1 : 2;
      }
      world.uavs = [...world.uavs, fresh];
      pushAlert("INFO", `KESTREL-${nextId} JOINED SWARM (${world.uavs.length} total)`);
      break;
    }
    case "REMOVE_DRONE": {
      if (world.uavs.length <= SWARM.minSize) {
        pushAlert("WARN", `SWARM AT MIN SIZE (${SWARM.minSize})`);
        break;
      }
      const last = world.uavs[world.uavs.length - 1];
      if (last) {
        world.uavs = world.uavs.slice(0, -1);
        pushAlert("INFO", `${last.callsign} REMOVED FROM SWARM (${world.uavs.length} remaining)`);
      }
      break;
    }
    case "SET_SPLIT": {
      world.splitActive = m.split;
      if (m.split) {
        // First half → group 1, second half → group 2 (at least 1 in each).
        const total = world.uavs.length;
        const split = Math.max(1, Math.floor(total / 2));
        world.uavs = world.uavs.map((u, i) => ({ ...u, groupId: i < total - split ? 1 : 2 }));
        pushAlert("INFO", `SWARM SPLIT — GROUP-1 NORTH (${total - split}) · GROUP-2 SOUTH (${split})`);
      } else {
        world.uavs = world.uavs.map((u) => ({ ...u, groupId: 1 }));
        pushAlert("INFO", "SWARM MERGED — SINGLE FORMATION");
      }
      break;
    }
    case "RESET":
      world.uavs = [1, 2, 3, 4, 5].map(initUAV);
      world.swarmCentre = { x: 0, y: 0, z: 700 };
      world.swarmMoving = false;
      world.swarmSpdMs = 0;
      world.gnssDenied = false;
      world.formation = "WEDGE";
      world.splitActive = false;
      world.targets = spawnInitial(TARGET.initialCount, world.maxRangeKm * 1000);
      world.prior.clear();
      pushAlert("INFO", "WORLD RESET — KESTREL SWARM ARMED");
      break;
    case "SET_MAX_RANGE":
      world.maxRangeKm = m.maxRangeKm;
      world.targets = spawnInitial(TARGET.initialCount, m.maxRangeKm * 1000);
      world.prior.clear();
      break;
  }
};

setInterval(() => {
  const dt = (SIM.tickMs / 1000) * world.simSpeed;
  tick(dt);
  const out: WorkerToMain = { kind: "SNAPSHOT", snapshot: snapshot() };
  self.postMessage(out);
}, SIM.tickMs);
