import { BAND_FILE, LOT } from './constants';
import type { BandResult, Decision } from './types';

/** Scale on the operator view: 10 % at the left edge, 20 % of width per point. */
const SCALE_MIN = 10;
const SCALE_STEP = 20;

export function classify(moisture: number): BandResult {
  const { faqMax, cuts } = BAND_FILE;
  if (moisture <= faqMax) {
    return { label: 'FAQ · NO CUT', tone: 'ok', cutPct: 0, note: `Within the ${faqMax}% schedule. Full MSP applies.` };
  }
  let lower: number = faqMax;
  for (const [i, band] of cuts.entries()) {
    if (moisture <= band.max) {
      return {
        label: `BAND ${'I'.repeat(i + 1)} · ${band.pct}% MSP`,
        tone: 'warn',
        cutPct: band.pct,
        note: `Above ${lower}% up to ${band.max}%. Officer applies ${band.pct}% of MSP.`,
      };
    }
    lower = band.max;
  }
  return {
    label: `OUTSIDE · > ${lower}%`,
    tone: 'bad',
    cutPct: null,
    note: 'Outside the band file. Lot cannot be accepted at MSP.',
  };
}

export const scalePos = (moisture: number): string =>
  `${Math.min(98, Math.max(2, (moisture - SCALE_MIN) * SCALE_STEP))}%`;

export const scaleLabels = (): string[] => {
  const { faqMax, cuts } = BAND_FILE;
  const last = cuts[cuts.length - 1].max;
  let lower: number = faqMax;
  const mid = cuts.map((band) => {
    const label = `${lower}–${band.max} · ${band.pct}% MSP`;
    lower = band.max;
    return label;
  });
  return [`≤ ${faqMax.toFixed(1)} · FAQ`, ...mid, `> ${last} · OUTSIDE`];
};

const inr = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatInr = (value: number): string => `₹ ${inr.format(value)}`;

export function cutAmount(band: BandResult): string {
  if (band.cutPct === null) return 'Not applicable';
  return formatInr((LOT.quintals * LOT.mspPerQuintal * band.cutPct) / 100);
}

/** Decisions the band file allows. Reject stays open for reasons beyond moisture. */
export function allowedDecisions(band: BandResult): Decision[] {
  if (band.cutPct === null) return ['reject'];
  return band.cutPct === 0 ? ['accept', 'reject'] : ['cut', 'reject'];
}
