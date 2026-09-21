"use client";

// Zustand root store. The worker publishes Snapshots which we apply
// here; UI components read with selectors.

import { create } from "zustand/react";
import type { Snapshot } from "@/drishti/sim/protocol";
import type { UAV } from "@/drishti/types/uav";
import type { Track } from "@/drishti/types/track";
import type { Alert } from "@/drishti/types/alert";
import type { Formation } from "@/drishti/types/mission";
import type { Tweaks } from "@/drishti/types/tweaks";
import type { HistorySample } from "@/drishti/components/gcs/drone/HistorySparklines";
import type { MissionRun, ROE } from "@/drishti/types/missionRun";
import { MISSION_PHASES } from "@/drishti/data/missionPhases";

const HISTORY_MAX_SAMPLES = 180; // 3 min at 1 Hz sampling

interface State {
  // From the sim
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
  // UI-only
  formation: Formation;
  selectedDroneId: number | null;
  selectedTrackId: string | null;
  tweaks: Tweaks;
  // Mission knobs
  mode: string;
  radarOn: boolean;
  gnssDenied: boolean;
  recording: boolean;
  recordTimeSec: number;
  nightMode: boolean;
  view: "PPI" | "3D";
  workspace: "OBSERVE" | "MISSION" | "DRONE";
  // Per-drone 1Hz ring buffer of battery/signal/alt for sparklines
  dronesHistory: Record<number, HistorySample[]>;
  lastHistorySec: number;
  // Mission-run state machine (separate from the static mission definition)
  missionRun: MissionRun;
  roe: ROE;

  applySnapshot: (s: Snapshot) => void;
  setSelectedDroneId: (id: number | null) => void;
  setSelectedTrackId: (id: string | null) => void;
  setTweak: <K extends keyof Tweaks>(k: K, v: Tweaks[K]) => void;
  setFormation: (f: Formation) => void;
  setMode: (m: string) => void;
  setRadarOn: (v: boolean) => void;
  setRecording: (v: boolean) => void;
  setRecordTimeSec: (v: number) => void;
  setNightMode: (v: boolean) => void;
  toggleGnssDeny: () => void;
  setView: (v: "PPI" | "3D") => void;
  setWorkspace: (w: "OBSERVE" | "MISSION" | "DRONE") => void;
  // Mission run controls
  missionStart: () => void;
  missionPause: () => void;
  missionResume: () => void;
  missionAbort: () => void;
  missionReset: () => void;
  // Advance phase clock; called by GCSApp at 1 Hz when RUNNING.
  missionTick: (dt: number) => void;
  setROE: (r: Partial<ROE>) => void;
}

const INIT_TWEAKS: Tweaks = {
  radarTheme: "green",
  maxRangeKm: 5,
  simSpeed: 1,
  showFovArcs: true,
  showCIEllipses: true,
  nightMode: false,
};

export const useStore = create<State>((set) => ({
  uavs: [],
  tracks: [],
  alerts: [],
  missionTimeSec: 0,
  radarTimeSec: 0,
  latencyMs: 7,
  revisitSec: 8.4,
  gnssCount: 5,
  windKt: 6,
  swarmMoving: false,
  swarmSpd: 0,
  splitActive: false,
  formation: "WEDGE",
  selectedDroneId: null,
  selectedTrackId: null,
  tweaks: INIT_TWEAKS,
  mode: "DETECT+TRACK",
  radarOn: true,
  gnssDenied: false,
  recording: false,
  recordTimeSec: 0,
  nightMode: false,
  view: "PPI",
  workspace: "OBSERVE",
  dronesHistory: {},
  lastHistorySec: -1,
  missionRun: {
    status: "IDLE",
    phaseId: "PRE_FLIGHT",
    phaseElapsedSec: 0,
    totalElapsedSec: 0,
  },
  roe: {
    engageRcsMin: 0.2,
    engageSpeedMin: 8,
    engageScoreMin: 0.6,
    confirmRequired: true,
    iffWhitelist: [],
  },

  applySnapshot: (s) =>
    set((st) => {
      // 1 Hz throttle on history (mission time is integer seconds).
      let history = st.dronesHistory;
      let lastHistorySec = st.lastHistorySec;
      if (s.missionTimeSec !== st.lastHistorySec) {
        history = { ...history };
        for (const u of s.uavs) {
          const prev = history[u.id] ?? [];
          const sample: HistorySample = {
            t: s.missionTimeSec,
            batt: u.battery,
            signal: u.signal,
            alt: u.pos.z,
          };
          history[u.id] = prev.length >= HISTORY_MAX_SAMPLES
            ? [...prev.slice(prev.length - HISTORY_MAX_SAMPLES + 1), sample]
            : [...prev, sample];
        }
        lastHistorySec = s.missionTimeSec;
      }
      return {
        uavs: s.uavs,
        tracks: s.tracks,
        alerts: s.alerts,
        missionTimeSec: s.missionTimeSec,
        radarTimeSec: s.radarTimeSec,
        latencyMs: s.latencyMs,
        revisitSec: s.revisitSec,
        gnssCount: s.gnssCount,
        windKt: s.windKt,
        swarmMoving: s.swarmMoving,
        swarmSpd: s.swarmSpd,
        splitActive: s.splitActive,
        dronesHistory: history,
        lastHistorySec,
      };
    }),
  setSelectedDroneId: (id) =>
    set((st) => ({ selectedDroneId: st.selectedDroneId === id ? null : id })),
  setSelectedTrackId: (id) =>
    set((st) => ({ selectedTrackId: st.selectedTrackId === id ? null : id })),
  setTweak: (k, v) => set((st) => ({ tweaks: { ...st.tweaks, [k]: v } })),
  setFormation: (f) => set({ formation: f }),
  setMode: (m) => set({ mode: m }),
  setRadarOn: (v) => set({ radarOn: v }),
  setRecording: (v) => set({ recording: v, recordTimeSec: v ? 0 : 0 }),
  setRecordTimeSec: (v) => set({ recordTimeSec: v }),
  setNightMode: (v) => set({ nightMode: v }),
  toggleGnssDeny: () => set((st) => ({ gnssDenied: !st.gnssDenied })),
  setView: (v) => set({ view: v }),
  setWorkspace: (w) => set({ workspace: w }),
  missionStart: () =>
    set({
      missionRun: { status: "RUNNING", phaseId: "PRE_FLIGHT", phaseElapsedSec: 0, totalElapsedSec: 0 },
    }),
  missionPause: () =>
    set((st) => ({ missionRun: { ...st.missionRun, status: "PAUSED" } })),
  missionResume: () =>
    set((st) => ({ missionRun: { ...st.missionRun, status: "RUNNING" } })),
  missionAbort: () =>
    set((st) => ({ missionRun: { ...st.missionRun, status: "ABORTED" } })),
  missionReset: () =>
    set({
      missionRun: { status: "IDLE", phaseId: "PRE_FLIGHT", phaseElapsedSec: 0, totalElapsedSec: 0 },
    }),
  missionTick: (dt) =>
    set((st) => {
      if (st.missionRun.status !== "RUNNING") return {};
      const run = st.missionRun;
      const phase = MISSION_PHASES.find((p) => p.id === run.phaseId);
      if (!phase) return {};
      const newElapsed = run.phaseElapsedSec + dt;
      if (newElapsed >= phase.durationSec) {
        // Advance to next phase, or complete
        const idx = MISSION_PHASES.findIndex((p) => p.id === run.phaseId);
        const next = MISSION_PHASES[idx + 1];
        if (!next) {
          return {
            missionRun: {
              status: "COMPLETE",
              phaseId: run.phaseId,
              phaseElapsedSec: phase.durationSec,
              totalElapsedSec: run.totalElapsedSec + dt,
            },
          };
        }
        return {
          missionRun: {
            status: "RUNNING",
            phaseId: next.id,
            phaseElapsedSec: 0,
            totalElapsedSec: run.totalElapsedSec + dt,
          },
        };
      }
      return {
        missionRun: { ...run, phaseElapsedSec: newElapsed, totalElapsedSec: run.totalElapsedSec + dt },
      };
    }),
  setROE: (r) => set((st) => ({ roe: { ...st.roe, ...r } })),
}));
