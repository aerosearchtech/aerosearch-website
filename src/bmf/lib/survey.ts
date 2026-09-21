// Airborne survey result. Each payload flies parallel lines across the AO; a
// swath narrower than the line spacing leaves holidays, and dropouts knock out
// patches outright. The fused per-cell quality is what the planner treats as
// "how much do we actually know about this ground" — the residual-risk term.

import {
  AOI_DEPTH_M,
  AOI_WIDTH_M,
  SENSOR_CHANNELS,
  SWATH_EDGE_QUALITY,
  SWEPT_THRESHOLD,
  GRID_H,
  GRID_W,
} from './constants';
import { cellIndex, toMetresX, toMetresY } from './riskField';
import { mulberry32 } from './rng';
import type { ChannelCoverage, Minefield, SurveyField } from './types';

interface Dropout {
  x: number;
  y: number;
  rx: number;
  ry: number;
  depth: number;
}

/** Turn-arounds at the flanks leave the outer strip thinner. */
const EDGE_FALLOFF_M = 22;

function channelGrid(
  swathM: number,
  lineSpacingM: number,
  drift: number,
  offsetM: number,
  dropouts: Dropout[],
): Float32Array {
  const grid = new Float32Array(GRID_W * GRID_H);
  const half = swathM / 2;
  for (let cy = 0; cy < GRID_H; cy++) {
    const ym = toMetresY(cy);
    for (let cx = 0; cx < GRID_W; cx++) {
      const xm = toMetresX(cx);
      // Perpendicular offset from the nearest survey line.
      const along = ym - drift * (xm - AOI_WIDTH_M / 2) - offsetM;
      const t = ((along % lineSpacingM) + lineSpacingM) % lineSpacingM;
      const d = Math.min(t, lineSpacingM - t);
      let q = d >= half ? 0 : 1 - (1 - SWATH_EDGE_QUALITY) * (d / half);

      const edge = Math.min(xm, AOI_WIDTH_M - xm, ym, AOI_DEPTH_M - ym);
      if (edge < EDGE_FALLOFF_M) q *= 0.45 + 0.55 * (edge / EDGE_FALLOFF_M);

      for (const g of dropouts) {
        const u = (xm - g.x) / g.rx;
        const v = (ym - g.y) / g.ry;
        const r = Math.hypot(u, v);
        if (r < 1) q *= 1 - g.depth * (1 - r * r);
      }
      grid[cellIndex(cx, cy)] = q;
    }
  }
  return grid;
}

/** Synthesises the survey that produced the device plot for this seed. */
export function generateSurvey(field: Minefield): SurveyField {
  const rnd = mulberry32(field.seed ^ 0x5f37c1);
  const n = GRID_W * GRID_H;
  const quality = new Float32Array(n);
  const channels: ChannelCoverage[] = [];
  const total = field.mines.length || 1;
  const weightSum = SENSOR_CHANNELS.reduce((a, c) => a + c.weight, 0);

  for (const ch of SENSOR_CHANNELS) {
    const dropouts: Dropout[] = Array.from({ length: ch.dropouts }, () => ({
      x: rnd() * AOI_WIDTH_M,
      y: rnd() * AOI_DEPTH_M,
      rx: 28 + rnd() * 52,
      ry: 18 + rnd() * 38,
      depth: 0.55 + rnd() * 0.45,
    }));
    const grid = channelGrid(
      ch.swathM,
      ch.lineSpacingM,
      (rnd() - 0.5) * 0.1,
      rnd() * ch.lineSpacingM,
      dropouts,
    );

    let sum = 0;
    let swept = 0;
    for (let i = 0; i < n; i++) {
      sum += grid[i];
      if (grid[i] >= SWEPT_THRESHOLD) swept++;
      quality[i] += (grid[i] * ch.weight) / weightSum;
    }
    const fixes = field.mines.filter((m) => m.sensors.includes(ch.id)).length;
    channels.push({
      id: ch.id,
      name: ch.name,
      // Quoted figures are the real ones. The grid above is built from the
      // scaled display geometry only because the overlay has to stay legible.
      swathM: ch.physicalSwathM,
      lineSpacingM: ch.physicalSpacingM,
      passes: Math.ceil(AOI_DEPTH_M / ch.physicalSpacingM),
      coveragePct: (swept / n) * 100,
      meanQuality: sum / n,
      fixShare: (fixes / total) * 100,
    });
  }

  let sum = 0;
  let swept = 0;
  for (let i = 0; i < n; i++) {
    sum += quality[i];
    if (quality[i] >= SWEPT_THRESHOLD) swept++;
  }

  return {
    seed: field.seed,
    quality,
    channels,
    meanQuality: sum / n,
    sweptPct: (swept / n) * 100,
    ageMin: 18 + Math.floor(rnd() * 96),
  };
}
