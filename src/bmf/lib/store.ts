'use client';

import { create } from 'zustand/react';
import {
  AOI_DEPTH_M,
  AOI_WIDTH_M,
  DEFAULT_CORRIDOR_WIDTH_M,
  DEFAULT_GOAL,
  DEFAULT_PAYLOAD_COUNTS,
  DEFAULT_SEED,
  DEFAULT_START,
  DEFAULT_WEIGHTS,
  EOD_TEAMS,
  LANE_FRAME_FRACTION,
  MAX_AIRFRAMES,
  PHASE_LAYER,
  PROFILE_TAG,
  TASK_STATE_ORDER,
} from './constants';
import { FIT_VIEW, ZOOM_MAX, ZOOM_MIN, type MapView } from './canvas/map';
import { computeDensity, type DensityStats } from './density';
import { clamp } from './geom';
import { generateMinefield } from './minefield';
import { buildRiskField } from './riskField';
import { planRoutes } from './routing';
import { generateSurvey } from './survey';
import type { PayloadCounts } from './surveyRun';
import { DEFAULT_THEME, PALETTES, THEME_STORAGE_KEY, type Palette, type ThemeName } from './theme';
import type {
  LogEntry,
  MapLayer,
  Minefield,
  Phase,
  Point,
  Route,
  SensorTag,
  SurveyField,
  TaskState,
  Weights,
} from './types';

interface GcsState {
  theme: ThemeName;
  phase: Phase;
  seed: number;
  corridorWidthM: number;
  weights: Weights;
  start: Point;
  goal: Point;
  mapLayer: MapLayer;
  selectedRouteId: string | null;
  hoverMineId: string | null;
  selectedMineId: string | null;
  preflightOpen: boolean;
  /** Seconds into the survey playback; null when no run is loaded. */
  runS: number | null;
  runPlaying: boolean;
  /** Airframes apportioned to each payload. */
  payloadCounts: PayloadCounts;
  /** Seconds into the clearance playback; null when none is running. */
  clearanceS: number | null;
  clearancePlaying: boolean;
  field: Minefield;
  risk: Float32Array;
  riskMax: number;
  survey: SurveyField;
  /** Plan-clock second the survey closed, so SURVEY AGE is a real elapsed. */
  surveyAtS: number;
  density: DensityStats;
  routes: Route[];
  /** Map camera — zoom and the world point held at screen centre. */
  mapView: MapView;
  planning: boolean;
  solveMs: number;
  log: LogEntry[];
  elapsedS: number;
  /** Clearance progress, keyed by device id — a device stays cleared per lane. */
  taskStates: Record<string, TaskState>;
  taskTeams: Record<string, string>;
  /** Bumped whenever the map's cached base layer must be rebuilt. */
  mapEpoch: number;

  palette: () => Palette;
  toggleTheme: () => void;
  hydrateTheme: () => void;
  setPhase: (p: Phase) => void;
  setCorridorWidth: (w: number) => void;
  setWeights: (w: Weights) => void;
  setSeed: (s: number) => void;
  setStart: (p: Point) => void;
  setGoal: (p: Point) => void;
  setLayer: (l: MapLayer) => void;
  zoomAt: (factor: number, wx: number, wy: number) => void;
  panBy: (dxM: number, dyM: number) => void;
  fitView: () => void;
  zoomToLane: () => void;
  selectRoute: (id: string) => void;
  hoverMine: (id: string | null) => void;
  selectMine: (id: string | null) => void;
  setPreflight: (open: boolean) => void;
  startRun: () => void;
  setRunPlaying: (playing: boolean) => void;
  advanceRun: (runS: number) => void;
  completeRun: (runS: number) => void;
  endRun: () => void;
  setPayloadCount: (id: SensorTag, n: number) => void;
  startClearance: () => void;
  setClearancePlaying: (playing: boolean) => void;
  advanceClearance: (clearanceS: number) => void;
  endClearance: () => void;
  advanceTask: (id: string) => void;
  assignTeam: (id: string) => void;
  autoAssign: (ids: string[]) => void;
  resetTasking: () => void;
  recompute: () => void;
  tickClock: () => void;
}

const clock = (s: number): string =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const initialField = generateMinefield(DEFAULT_SEED);
const initialRisk = buildRiskField(initialField);

/**
 * Keeps the camera over the AO. At zoom 1 the whole AO is in view on both axes,
 * so the visible span is at least AOI/zoom metres — clamp the centre by that
 * half-span, which collapses to the AO centre when fully zoomed out.
 */
function clampView(v: MapView): MapView {
  const halfX = AOI_WIDTH_M / (2 * v.zoom);
  const halfY = AOI_DEPTH_M / (2 * v.zoom);
  return {
    zoom: v.zoom,
    cx: clamp(v.cx, halfX, Math.max(halfX, AOI_WIDTH_M - halfX)),
    cy: clamp(v.cy, halfY, Math.max(halfY, AOI_DEPTH_M - halfY)),
  };
}

export const useGcs = create<GcsState>((set, get) => ({
  theme: DEFAULT_THEME,
  phase: 'breach',
  seed: DEFAULT_SEED,
  corridorWidthM: DEFAULT_CORRIDOR_WIDTH_M,
  weights: DEFAULT_WEIGHTS,
  start: DEFAULT_START,
  goal: DEFAULT_GOAL,
  mapLayer: 'hazard',
  selectedRouteId: null,
  hoverMineId: null,
  selectedMineId: null,
  preflightOpen: false,
  runS: null,
  runPlaying: false,
  payloadCounts: DEFAULT_PAYLOAD_COUNTS,
  clearanceS: null,
  clearancePlaying: false,
  field: initialField,
  risk: initialRisk.risk,
  riskMax: initialRisk.max,
  survey: generateSurvey(initialField),
  surveyAtS: 0,
  density: computeDensity(initialField),
  routes: [],
  mapView: FIT_VIEW,
  planning: true,
  solveMs: 0,
  log: [],
  elapsedS: 0,
  taskStates: {},
  taskTeams: {},
  mapEpoch: 0,

  palette: () => PALETTES[get().theme],

  toggleTheme: () => {
    const theme: ThemeName = get().theme === 'dark' ? 'light' : 'dark';
    document.querySelector('.bmf-root')?.setAttribute('data-theme', theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    set((s) => ({ theme, mapEpoch: s.mapEpoch + 1 }));
  },

  hydrateTheme: () => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    const theme: ThemeName = stored === 'light' || stored === 'dark' ? stored : DEFAULT_THEME;
    document.querySelector('.bmf-root')?.setAttribute('data-theme', theme);
    if (theme !== get().theme) set((s) => ({ theme, mapEpoch: s.mapEpoch + 1 }));
  },

  setPhase: (phase) =>
    set((s) => ({ phase, mapLayer: PHASE_LAYER[phase], mapEpoch: s.mapEpoch + 1 })),

  setCorridorWidth: (corridorWidthM) => set({ corridorWidthM }),
  setWeights: (weights) => set({ weights }),

  setSeed: (seed) => {
    const field = generateMinefield(seed);
    const risk = buildRiskField(field);
    set((s) => ({
      seed,
      field,
      risk: risk.risk,
      riskMax: risk.max,
      survey: generateSurvey(field),
      surveyAtS: s.elapsedS,
      density: computeDensity(field),
      hoverMineId: null,
      selectedMineId: null,
      taskStates: {},
      taskTeams: {},
      mapEpoch: s.mapEpoch + 1,
    }));
  },

  setStart: (start) => set({ start }),
  setGoal: (goal) => set({ goal }),
  setLayer: (mapLayer) => set((s) => ({ mapLayer, mapEpoch: s.mapEpoch + 1 })),

  /** Zooms about a world point, so the ground under the cursor stays put. */
  zoomAt: (factor, wx, wy) =>
    set((s) => {
      const zoom = clamp(s.mapView.zoom * factor, ZOOM_MIN, ZOOM_MAX);
      const k = 1 - s.mapView.zoom / zoom;
      return {
        mapView: clampView({
          zoom,
          cx: s.mapView.cx + (wx - s.mapView.cx) * k,
          cy: s.mapView.cy + (wy - s.mapView.cy) * k,
        }),
        mapEpoch: s.mapEpoch + 1,
      };
    }),

  panBy: (dxM, dyM) =>
    set((s) => ({
      mapView: clampView({
        ...s.mapView,
        cx: s.mapView.cx + dxM,
        cy: s.mapView.cy + dyM,
      }),
      mapEpoch: s.mapEpoch + 1,
    })),

  fitView: () => set((s) => ({ mapView: FIT_VIEW, mapEpoch: s.mapEpoch + 1 })),

  /**
   * Frames the corridor itself rather than the whole lane: a 3 m lane on a
   * 520 m map is a hairline, so zoom until the corridor covers roughly a
   * seventh of the view and centre on the lane's midpoint.
   */
  zoomToLane: () =>
    set((s) => {
      const route = s.routes.find((r) => r.id === s.selectedRouteId);
      if (!route?.path.length) return {};
      const mid = route.path[Math.floor(route.path.length / 2)];
      const zoom = clamp(AOI_DEPTH_M / (s.corridorWidthM / LANE_FRAME_FRACTION), ZOOM_MIN, ZOOM_MAX);
      return {
        mapView: clampView({ zoom, cx: mid.x, cy: mid.y }),
        mapEpoch: s.mapEpoch + 1,
      };
    }),
  selectRoute: (selectedRouteId) => set({ selectedRouteId }),
  hoverMine: (hoverMineId) => set({ hoverMineId }),
  selectMine: (selectedMineId) => set({ selectedMineId }),

  setPreflight: (preflightOpen) => set({ preflightOpen }),

  startRun: () =>
    set({ runS: 0, runPlaying: true, selectedMineId: null, phase: 'detect', mapLayer: 'devices' }),
  setRunPlaying: (runPlaying) => set({ runPlaying }),
  advanceRun: (runS) => set({ runS }),

  // Reaching the end of the run hands over a survey flown just now, so its
  // age restarts here rather than only when the operator closes the bar.
  completeRun: (runS) =>
    set((s) => ({
      runS,
      runPlaying: false,
      survey: { ...s.survey, ageMin: 0 },
      surveyAtS: s.elapsedS,
    })),
  // Closing a run hands over a survey flown just now, so its age restarts.
  endRun: () =>
    set((s) => ({
      runS: null,
      runPlaying: false,
      survey: { ...s.survey, ageMin: 0 },
      surveyAtS: s.elapsedS,
    })),

  setPayloadCount: (id, n) =>
    set((s) => ({
      payloadCounts: { ...s.payloadCounts, [id]: Math.max(1, Math.min(MAX_AIRFRAMES, n)) },
    })),

  /**
   * The clearance drives the board itself, so any hand-stepped states are
   * cleared first — the two cannot both own a device's state.
   */
  startClearance: () =>
    set({
      clearanceS: 0,
      clearancePlaying: true,
      taskStates: {},
      selectedMineId: null,
      phase: 'neutralise',
      mapLayer: 'hazard',
    }),
  setClearancePlaying: (clearancePlaying) => set({ clearancePlaying }),
  advanceClearance: (clearanceS) => set({ clearanceS }),

  /** Closing the run writes the result back so the board keeps what was flown. */
  endClearance: () => set({ clearanceS: null, clearancePlaying: false }),

  advanceTask: (id) =>
    set((s) => {
      const at = TASK_STATE_ORDER.indexOf(s.taskStates[id] ?? 'pending');
      const next = TASK_STATE_ORDER[(at + 1) % TASK_STATE_ORDER.length];
      return { taskStates: { ...s.taskStates, [id]: next } };
    }),

  assignTeam: (id) =>
    set((s) => {
      const at = EOD_TEAMS.findIndex((t) => t.id === s.taskTeams[id]);
      const next = EOD_TEAMS[(at + 1) % EOD_TEAMS.length].id;
      return { taskTeams: { ...s.taskTeams, [id]: next } };
    }),

  /** Splits the lane into contiguous stretches, one per team. */
  autoAssign: (ids) =>
    set((s) => {
      const taskTeams = { ...s.taskTeams };
      ids.forEach((id, i) => {
        const at = Math.floor((i * EOD_TEAMS.length) / Math.max(1, ids.length));
        taskTeams[id] = EOD_TEAMS[Math.min(EOD_TEAMS.length - 1, at)].id;
      });
      return { taskTeams };
    }),

  resetTasking: () => set({ taskStates: {}, taskTeams: {} }),

  recompute: () => {
    const s = get();
    const t0 = performance.now();
    const routes = planRoutes(
      s.field,
      s.risk,
      s.riskMax,
      s.survey.quality,
      s.start,
      s.goal,
      s.corridorWidthM,
      s.weights,
    );
    const solveMs = Math.round(performance.now() - t0);
    const best = routes.length
      ? routes.reduce((a, b) => (a.metrics.score <= b.metrics.score ? a : b))
      : null;
    const selectedRouteId =
      s.selectedRouteId && routes.some((r) => r.id === s.selectedRouteId)
        ? s.selectedRouteId
        : (best?.id ?? null);

    const p = PALETTES[s.theme];
    const entry: LogEntry = best
      ? {
          time: clock(s.elapsedS),
          text: `${best.label} ${PROFILE_TAG[best.profile]} · ${best.metrics.minesToClear} device${best.metrics.minesToClear === 1 ? '' : 's'} · ${Math.round(best.metrics.lengthM)} m · ${Math.round(best.metrics.surveyMean * 100)}% surveyed · ${solveMs} ms`,
          color: p.gn,
        }
      : { time: clock(s.elapsedS), text: 'no corridor found across the AO', color: p.rd };

    set({ routes, solveMs, selectedRouteId, planning: false, log: [entry, ...s.log].slice(0, 60) });
  },

  tickClock: () => set((s) => ({ elapsedS: s.elapsedS + 1 })),
}));

export const selectedRoute = (s: GcsState): Route | null =>
  s.routes.find((r) => r.id === s.selectedRouteId) ?? null;
