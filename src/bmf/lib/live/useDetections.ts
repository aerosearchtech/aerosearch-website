'use client';

import { useMemo } from 'react';
import { DEMO_URL } from './constants';
import { flightS, lastAt, usePlayback } from './playback';
import type { CropKind, Detections } from './types';

const NONE: Detections = { run: null, mines: [] };

/** Crops are exported flat, one folder per flight; run is kept for the live signature. */
export const cropUrl = (run: string, id: string, kind: CropKind): string => `${DEMO_URL}/crops/${id}_${kind}.jpg`;

/** The mines the detector had listed by this moment of the recorded flight. */
export function useDetections(): Detections {
  const p = usePlayback();
  const demo = p.playing ? p.demo : null;
  const n = demo ? lastAt(demo.mines, flightS(p)) + 1 : 0;
  return useMemo(() => (demo && n ? { run: demo.flight.name, mines: demo.mines.slice(0, n).map((m) => m.mine) } : NONE), [demo, n]);
}
