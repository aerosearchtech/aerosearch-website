import {
  CELL_M,
  CLEAR_MARGIN_M,
  MINE_SPECS,
  DIVERSITY_PENALTY,
  PROOF_MAX_UNSWEPT_M,
  DIVERSITY_RADIUS_MULT,
  GRID_H,
  GRID_W,
  ROUTE_PROFILES,
  SWEPT_THRESHOLD,
  SHORTCUT_GAIN,
  SMOOTH_CUT,
  SMOOTH_PASSES,
  TURN_COST_M_PER_RAD,
  TURN_THRESHOLD_RAD,
} from "./constants";
import { cellIndex, sweptMean, toCellX, toCellY, toMetresX, toMetresY } from "./riskField";
import { MinHeap } from "./heap";
import {
  clamp,
  dist,
  distToPolyline,
  dropCollinear,
  polylineLength,
  samplePolyline,
  turnAngles,
} from "./geom";
import type { Minefield, Point, Route, RouteMetrics, Weights } from "./types";

/** Metres-equivalent penalty for traversing fully saturated ground. */
const RISK_GAIN = 14;

/**
 * Metres-equivalent penalty for traversing ground the survey never actually
 * looked at. Lower than RISK_GAIN — an unswept cell is unknown, not known-mined
 * — but non-zero, so a lane cannot buy a clean device count by threading a gap
 * that is only clean because nobody swept it.
 */
const RESID_GAIN = 8;

const DX = [1, 1, 0, -1, -1, -1, 0, 1];
const DY = [0, 1, 1, 1, 0, -1, -1, -1];
const DIRS = 8;

const dirAngle = (a: number, b: number): number => {
  const d = Math.abs(a - b);
  return Math.min(d, DIRS - d) * (Math.PI / 4);
};

/** A* over (cell, heading) states so heading changes can be charged for. */
function searchPath(
  cost: Float32Array,
  resid: Float32Array,
  start: Point,
  goal: Point,
  w: Weights,
): Point[] | null {
  const sx = clamp(toCellX(start.x), 0, GRID_W - 1);
  const sy = clamp(toCellY(start.y), 0, GRID_H - 1);
  const gx = clamp(toCellX(goal.x), 0, GRID_W - 1);
  const gy = clamp(toCellY(goal.y), 0, GRID_H - 1);
  const goalCell = cellIndex(gx, gy);
  const goalX = toMetresX(gx);
  const goalY = toMetresY(gy);

  const n = GRID_W * GRID_H * DIRS;
  const g = new Float32Array(n).fill(Infinity);
  const from = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const open = new MinHeap();
  const heuristic = (cx: number, cy: number): number =>
    w.length * Math.hypot(toMetresX(cx) - goalX, toMetresY(cy) - goalY);

  const startCell = cellIndex(sx, sy);
  for (let d = 0; d < DIRS; d++) {
    g[startCell * DIRS + d] = 0;
    open.push(heuristic(sx, sy), startCell * DIRS + d);
  }

  let goalState = -1;
  while (open.size) {
    const state = open.pop();
    if (closed[state]) continue;
    closed[state] = 1;
    const cell = (state / DIRS) | 0;
    if (cell === goalCell) {
      goalState = state;
      break;
    }
    const dir = state % DIRS;
    const cx = cell % GRID_W;
    const cy = (cell / GRID_W) | 0;
    const gc = g[state];
    for (let nd = 0; nd < DIRS; nd++) {
      const nx = cx + DX[nd];
      const ny = cy + DY[nd];
      if (nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H) continue;
      const ncell = cellIndex(nx, ny);
      const ns = ncell * DIRS + nd;
      if (closed[ns]) continue;
      const stepM = CELL_M * (DX[nd] && DY[nd] ? Math.SQRT2 : 1);
      const ng =
        gc +
        stepM *
          (w.length + w.risk * RISK_GAIN * cost[ncell] + w.resid * RESID_GAIN * resid[ncell]) +
        w.turn * TURN_COST_M_PER_RAD * dirAngle(dir, nd);
      if (ng < g[ns]) {
        g[ns] = ng;
        from[ns] = state;
        open.push(ng + heuristic(nx, ny), ns);
      }
    }
  }
  if (goalState < 0) return null;

  const path: Point[] = [];
  for (let s = goalState; s >= 0; s = from[s]) {
    const cell = (s / DIRS) | 0;
    path.push({ x: toMetresX(cell % GRID_W), y: toMetresY((cell / GRID_W) | 0) });
  }
  path.reverse();
  path[0] = { ...start };
  path[path.length - 1] = { ...goal };
  return path;
}

const sampleCost = (cost: Float32Array, p: Point): number =>
  cost[cellIndex(clamp(toCellX(p.x), 0, GRID_W - 1), clamp(toCellY(p.y), 0, GRID_H - 1))];

const meanCost = (cost: Float32Array, seg: Point[]): number => {
  const pts = samplePolyline(seg, CELL_M);
  let s = 0;
  for (const p of pts) s += sampleCost(cost, p);
  return s / pts.length;
};

/**
 * Straightens the 8-connected staircase into something a breaching crew can
 * actually mark out, but only where the shortcut does not raise exposure.
 */
function stringPull(path: Point[], cost: Float32Array): Point[] {
  const src = dropCollinear(path);
  if (src.length < 3) return src;
  const out: Point[] = [src[0]];
  let i = 0;
  while (i < src.length - 1) {
    let best = i + 1;
    for (let j = src.length - 1; j > i + 1; j--) {
      // The shortcut has to be clearly better, not merely equal: a deviation
      // that costs the same is one the search chose for a reason.
      if (meanCost(cost, [src[i], src[j]]) < meanCost(cost, src.slice(i, j + 1)) * SHORTCUT_GAIN) {
        best = j;
        break;
      }
    }
    out.push(src[best]);
    i = best;
  }
  return dropCollinear(out);
}

const lerp = (a: Point, b: Point, t: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

/**
 * Rounds off the hard vertices an 8-connected search leaves behind — a marked
 * lane is driven, not teleported. Cutting a corner moves the lane onto new
 * ground, so each cut is taken only where it does not raise exposure.
 */
function smoothCorners(path: Point[], cost: Float32Array): Point[] {
  let src = path;
  for (let pass = 0; pass < SMOOTH_PASSES && src.length > 2; pass++) {
    const out: Point[] = [src[0]];
    for (let i = 1; i < src.length - 1; i++) {
      const q = lerp(src[i], src[i - 1], SMOOTH_CUT);
      const r = lerp(src[i], src[i + 1], SMOOTH_CUT);
      if (meanCost(cost, [q, r]) <= meanCost(cost, [q, src[i], r])) out.push(q, r);
      else out.push(src[i]);
    }
    out.push(src[src.length - 1]);
    src = out;
  }
  return src;
}

/** Pushes later options away from ground already committed to a corridor. */
function applyDiversityPenalty(cost: Float32Array, path: Point[], halfWidthM: number): void {
  const radius = halfWidthM * DIVERSITY_RADIUS_MULT;
  const rc = Math.ceil(radius / CELL_M);
  for (const p of samplePolyline(path, CELL_M)) {
    const cx = toCellX(p.x);
    const cy = toCellY(p.y);
    for (let y = Math.max(0, cy - rc); y <= Math.min(GRID_H - 1, cy + rc); y++) {
      for (let x = Math.max(0, cx - rc); x <= Math.min(GRID_W - 1, cx + rc); x++) {
        const d = Math.hypot(toMetresX(x) - p.x, toMetresY(y) - p.y);
        if (d > radius) continue;
        const i = cellIndex(x, y);
        const add = DIVERSITY_PENALTY * (1 - d / radius);
        if (add > cost[i]) cost[i] = add;
      }
    }
  }
}

function measure(
  field: Minefield,
  survey: Float32Array,
  path: Point[],
  corridorWidthM: number,
  start: Point,
  goal: Point,
): { mineIds: string[]; metrics: Omit<RouteMetrics, "score"> } {
  // A device has to be neutralised when its effects radius reaches the lane,
  // not merely when it sits inside it: a TM-62M six metres off a 6 m corridor
  // still kills what drives through. Standoff is likewise measured from the
  // blast edge of the nearest bypassed device to the lane edge.
  const laneEdge = corridorWidthM / 2 + CLEAR_MARGIN_M;
  const mineIds: string[] = [];
  let clearanceMin = Infinity;
  let minutesToClear = 0;
  for (const m of field.mines) {
    const reach = distToPolyline(m, path) - MINE_SPECS[m.type].clearRadiusM;
    if (reach <= laneEdge) {
      mineIds.push(m.id);
      minutesToClear += MINE_SPECS[m.type].minutesToClear;
    } else clearanceMin = Math.min(clearanceMin, reach - corridorWidthM / 2);
  }
  const lengthM = polylineLength(path);
  const straight = Math.max(1, dist(start, goal));
  const turns = turnAngles(path).filter((a) => a > TURN_THRESHOLD_RAD).length;

  // How well the ground the lane actually occupies was surveyed.
  const pts = samplePolyline(path, CELL_M);
  let qSum = 0;
  let thin = 0;
  for (const p of pts) {
    const q = sampleCost(survey, p);
    qSum += q;
    if (q < SWEPT_THRESHOLD) thin++;
  }
  const surveyMean = qSum / pts.length;
  const unsweptM = (thin / pts.length) * lengthM;
  return {
    mineIds,
    metrics: {
      lengthM,
      minesToClear: mineIds.length,
      turns,
      tortuosity: lengthM / straight,
      minesPer100m: (mineIds.length / lengthM) * 100,
      clearanceMin: Number.isFinite(clearanceMin) ? Math.max(0, clearanceMin) : 0,
      minutesToClear,
      surveyMean,
      unsweptM,
    },
  };
}

/** Fraction of b that runs inside a's corridor — used to spot duplicate options. */
function overlapFraction(a: Point[], b: Point[], tolM: number): number {
  const pts = samplePolyline(b, CELL_M * 2);
  let n = 0;
  for (const p of pts) if (distToPolyline(p, a) <= tolM) n++;
  return n / pts.length;
}

/** Above this overlap two options are the same corridor and one is re-planned. */
const DUPLICATE_OVERLAP = 0.65;

const normalise = (v: number, lo: number, hi: number): number =>
  hi - lo < 1e-9 ? 0 : (v - lo) / (hi - lo);

/**
 * Produces one corridor per generation profile, each diverted away from the
 * previous, then ranks them with the operator's own weighting.
 */
export function planRoutes(
  field: Minefield,
  risk: Float32Array,
  riskMax: number,
  survey: Float32Array,
  start: Point,
  goal: Point,
  corridorWidthM: number,
  weights: Weights,
): Route[] {
  const swept = sweptMean(risk, corridorWidthM);
  const scale = riskMax > 0 ? 1 / riskMax : 1;
  const base = new Float32Array(swept.length);
  for (let i = 0; i < swept.length; i++) base[i] = swept[i] * scale;

  // Survey quality over the same corridor band, and the shortfall against the
  // usable standard. Ground swept to standard costs nothing extra — only the
  // deficit is charged, so the term bites in the gaps instead of acting as a
  // second distance penalty everywhere.
  const sweptSurvey = sweptMean(survey, corridorWidthM);
  const resid = new Float32Array(sweptSurvey.length);
  for (let i = 0; i < resid.length; i++) {
    resid[i] = Math.max(0, (SWEPT_THRESHOLD - sweptSurvey[i]) / SWEPT_THRESHOLD);
  }

  const routes: Route[] = [];
  for (const profile of ROUTE_PROFILES) {
    const w: Weights = {
      risk: weights.risk * profile.bias.risk,
      resid: weights.resid * profile.bias.resid,
      length: weights.length * profile.bias.length,
      turn: weights.turn * profile.bias.turn,
    };
    // Each profile is planned on the untouched cost surface, so no option is
    // handicapped by ground an earlier option happened to take.
    const raw = searchPath(base, resid, start, goal, w);
    if (!raw) continue;
    let path = smoothCorners(stringPull(raw, base), base);

    // Only if it duplicates an option already on the table is it pushed aside.
    if (routes.some((r) => overlapFraction(r.path, path, corridorWidthM) > DUPLICATE_OVERLAP)) {
      const diverted = Float32Array.from(base);
      for (const r of routes) applyDiversityPenalty(diverted, r.path, corridorWidthM / 2);
      const alt = searchPath(diverted, resid, start, goal, w);
      if (alt) path = smoothCorners(stringPull(alt, base), base);
    }

    const { mineIds, metrics } = measure(field, sweptSurvey, path, corridorWidthM, start, goal);
    routes.push({
      id: profile.label,
      label: profile.label,
      profile: profile.id,
      path,
      mineIds,
      metrics: { ...metrics, score: 0 },
    });
  }
  if (!routes.length) return routes;

  const span = (pick: (r: Route) => number): [number, number] => {
    const vals = routes.map(pick);
    return [Math.min(...vals), Math.max(...vals)];
  };
  const [mLo, mHi] = span((r) => r.metrics.minesToClear);
  const [lLo, lHi] = span((r) => r.metrics.lengthM);
  const [tLo, tHi] = span((r) => r.metrics.turns);
  const wSum = weights.risk + weights.resid + weights.length + weights.turn || 1;
  for (const r of routes) {
    r.metrics.score =
      (weights.risk * normalise(r.metrics.minesToClear, mLo, mHi) +
        // Residual is scored against the certification threshold, not against
        // the other options — a 2 m spread between lanes must not swing the
        // ranking the way a min-max normalisation would.
        weights.resid * Math.min(1, r.metrics.unsweptM / PROOF_MAX_UNSWEPT_M) +
        weights.length * normalise(r.metrics.lengthM, lLo, lHi) +
        weights.turn * normalise(r.metrics.turns, tLo, tHi)) /
      wSum;
  }
  return routes;
}
