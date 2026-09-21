// Doctrinal obstacle generation.
//
// Soviet/Russian practice lays anti-tank rows at 4–5.5 m mine spacing, giving
// 750–1,000 mines per kilometre of front, two to four rows to a belt with
// 20–40 m between rows. Critically the rows are laid as staggered *panels*
// rather than one continuous line, and the panels are offset row to row — so a
// gap in the first row does not give you a gap through the belt. Threading
// those near-aligned gaps is the whole problem the corridor search solves.
//
// Protective anti-personnel rows are tied to each belt on the enemy-facing
// side. Scatterable PFM-1 arrives by rocket cassette in long, narrow footprints
// aligned with the delivery axis.

import { AOI_DEPTH_M, AOI_WIDTH_M, BELT, FIX_QUALITY, MINE_SPECS, STRIKE } from './constants';
import type { Mine, Minefield, MineType } from './types';
import { clamp } from './geom';
import { contributors, fusedConfidence } from './sensing';
import { mulberry32 } from './rng';

type Rnd = () => number;

const between = (rnd: Rnd, r: { min: number; max: number }): number =>
  r.min + rnd() * (r.max - r.min);

interface Panel {
  from: number;
  to: number;
}

/**
 * Lays one row along the front as alternating panels and gaps. `phase` shifts
 * where the panels start, so adjacent rows do not open a clean seam.
 */
function panels(rnd: Rnd, frontM: number, phase: number): Panel[] {
  const out: Panel[] = [];
  let at = -phase;
  while (at < frontM) {
    const len = between(rnd, BELT.panelM);
    const from = Math.max(0, at);
    const to = Math.min(frontM, at + len);
    if (to > from) out.push({ from, to });
    at += len + between(rnd, BELT.gapM);
  }
  return out;
}

function makeMine(id: number, x: number, y: number, type: MineType, rnd: Rnd): Mine {
  const models = MINE_SPECS[type].models;
  const mine: Mine = {
    id: `TX-${String(id).padStart(3, '0')}`,
    model: models[Math.floor(rnd() * models.length) % models.length],
    x: +x.toFixed(2),
    y: +y.toFixed(2),
    type,
    confidence: 0,
    depthM: type === 'pfm1' ? 0 : +(rnd() * 0.18).toFixed(3),
    quality: +between(rnd, FIX_QUALITY).toFixed(3),
    sensors: [],
  };
  // Both follow from what the channels returned, so the figure in the
  // inventory and the fusion panel's verdict are the same number rather than
  // two unrelated guesses. A shallow steel AT mine on MAG+GPR fixes hard; a
  // buried plastic AP mine on GPR alone does not.
  mine.sensors = contributors(mine);
  mine.confidence = +fusedConfidence(mine).toFixed(2);
  return mine;
}

export function generateMinefield(seed: number): Minefield {
  const rnd = mulberry32(seed);
  const mines: Mine[] = [];
  const W = AOI_WIDTH_M;
  const D = AOI_DEPTH_M;
  let id = 1;

  // --- obstacle belts, laid across the axis of advance -------------------
  // Rows run north-south (along the front); the belt steps east through the AO.
  for (const centre of BELT.centres) {
    const beltX = centre * W + (rnd() - 0.5) * 18;
    const rowSpacing = between(rnd, BELT.rowSpacingM);
    const depth = (BELT.rowsPerBelt - 1) * rowSpacing;

    for (let row = 0; row < BELT.rowsPerBelt; row++) {
      const rowX = beltX - depth / 2 + row * rowSpacing;
      const spacing = between(rnd, BELT.atSpacingM);
      // Every row gets its own panel phase, so gaps stagger through the belt.
      for (const panel of panels(rnd, D, rnd() * 90)) {
        // Rows are offset half an interval from their neighbour.
        const stagger = (row % 2) * spacing * 0.5;
        for (let y = panel.from + stagger; y < panel.to; y += spacing) {
          if (rnd() > 0.97) continue; // the odd mine that failed to arm
          mines.push(
            makeMine(
              id++,
              clamp(rowX + (rnd() - 0.5) * 2.4, 2, W - 2),
              clamp(y + (rnd() - 0.5) * 1.2, 1, D - 1),
              'at',
              rnd,
            ),
          );
        }
      }
    }

    // Protective anti-personnel rows on the enemy-facing (western) side.
    for (let k = 0; k < BELT.apRowsPerBelt; k++) {
      const apX = beltX - depth / 2 - between(rnd, BELT.apOffsetM);
      const spacing = between(rnd, BELT.apSpacingM);
      for (const panel of panels(rnd, D, rnd() * 120)) {
        if (rnd() > 0.72) continue; // AP rows cover only part of the front
        for (let y = panel.from; y < panel.to; y += spacing) {
          mines.push(
            makeMine(
              id++,
              clamp(apX + (rnd() - 0.5) * 3.2, 2, W - 2),
              clamp(y + (rnd() - 0.5) * 1.4, 1, D - 1),
              'ap',
              rnd,
            ),
          );
        }
      }
    }
  }

  // --- scatterable PFM-1 strike footprints -------------------------------
  const strikes = Math.round(between(rnd, STRIKE.count));
  for (let s = 0; s < strikes; s++) {
    const cx = 70 + rnd() * (W - 140);
    const cy = 45 + rnd() * (D - 90);
    const along = between(rnd, STRIKE.alongM) / 2;
    const across = between(rnd, STRIKE.acrossM) / 2;
    const rot = rnd() * Math.PI;
    const count = Math.round(between(rnd, STRIKE.submunitions));
    for (let k = 0; k < count; k++) {
      const t = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd());
      const ex = Math.cos(t) * along * r;
      const ey = Math.sin(t) * across * r;
      mines.push(
        makeMine(
          id++,
          clamp(cx + ex * Math.cos(rot) - ey * Math.sin(rot), 4, W - 4),
          clamp(cy + ex * Math.sin(rot) + ey * Math.cos(rot), 4, D - 4),
          'pfm1',
          rnd,
        ),
      );
    }
  }

  // --- sparse nuisance devices and UXO -----------------------------------
  const nuisance = 16 + Math.floor(rnd() * 12);
  for (let k = 0; k < nuisance; k++) {
    const type: MineType = rnd() > 0.55 ? 'uxo' : 'ap';
    mines.push(makeMine(id++, 6 + rnd() * (W - 12), 6 + rnd() * (D - 12), type, rnd));
  }

  return { seed, widthM: W, depthM: D, mines };
}
