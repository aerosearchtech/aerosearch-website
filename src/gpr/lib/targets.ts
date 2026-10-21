// Ground-truth helpers: which pass shows a target best, and summary counts.
import { MARK_MATCH_M, TARGET_VIEW_M } from './constants';
import type { DetectionScore, FlightMeta, Target, TargetPass, View } from './types';

export const SCORE_LABEL: Record<DetectionScore, string> = {
  0: 'Not detected',
  1: 'Possibly detected',
  2: 'Most likely detected',
};

export const resultText = (detected: boolean | null): string =>
  detected === null ? 'not evaluated' : detected ? 'detected' : 'not detected';

export const depthText = (t: Target): string =>
  t.depthM ? `${t.depthM[0] === t.depthM[1] ? t.depthM[0] : t.depthM.join('–')} m deep` : 'depth unknown';

// Highest published score first, then the line passing closest.
export function bestPass(t: Target): TargetPass | undefined {
  return [...t.passes].sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || a.offsetM - b.offsetM)[0];
}

// Object to open on: GPR-detected with the best-scored pass, lowest number first.
export function heroTarget(targets: Target[]): number | null {
  const rank = (t: Target): number => (t.gpr ? 10 : 0) + (bestPass(t)?.score ?? -1);
  let best: number | null = null;
  targets.forEach((t, i) => {
    if (!t.passes.length || t.no === null) return;
    if (best === null || rank(t) > rank(targets[best])) best = i;
  });
  return best;
}

// Numbered objects in report order, unnumbered ones last.
export const byNumber = (a: Target, b: Target): number => (a.no ?? Infinity) - (b.no ?? Infinity);

// B-scan window of TARGET_VIEW_M along track, centred on the pass.
export function passView(meta: FlightMeta, pass: TargetPass, view: View): View {
  const line = meta.lines.find((l) => l.id === pass.line);
  const perM = line ? (line.end - line.start) / (line.lengthM || 1) : 1;
  const half = (TARGET_VIEW_M * perM) / 2;
  return { ...view, x0: pass.trace - half, x1: pass.trace + half };
}

export interface Tally {
  hit: number;
  of: number;
}

// Targets a sensor found, out of those that were evaluated for it.
export function tally(targets: Target[], sensor: 'gpr' | 'mag'): Tally {
  const evaluated = targets.filter((t) => t[sensor] !== null);
  return { hit: evaluated.filter((t) => t[sensor]).length, of: evaluated.length };
}

// Shallowest and deepest surveyed burial depth.
export function depthRange(targets: Target[]): [number, number] | null {
  const depths = targets.flatMap((t) => t.depthM ?? []);
  return depths.length ? [Math.min(...depths), Math.max(...depths)] : null;
}

// Interpreter marks lying within MARK_MATCH_M of any surveyed target.
export function marksOnTargets(meta: FlightMeta): Tally {
  const marks = meta.marks ?? [];
  const targets = meta.targets ?? [];
  const hit = marks.filter(({ trace }) =>
    targets.some((t) => Math.hypot(meta.x[trace] - t.x, meta.y[trace] - t.y) <= MARK_MATCH_M),
  ).length;
  return { hit, of: marks.length };
}
