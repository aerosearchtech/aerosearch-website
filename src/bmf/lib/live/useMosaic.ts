'use client';

import { useMemo } from 'react';
import { DEMO_URL } from './constants';
import { flightS, lastAt, usePlayback } from './playback';
import type { MosaicKind, MosaicMeta } from './types';

export interface MosaicImage {
  url: string;
  bounds: MosaicMeta['bounds'];
}

/** The recorded mosaic snapshot of the given kind at the playback clock; null when hidden or before the first. */
export function useMosaic(kind: MosaicKind | null): MosaicImage | null {
  const p = usePlayback();
  const demo = p.playing ? p.demo : null;
  const i = kind && demo ? lastAt(demo.mosaics, flightS(p)) : -1;
  const bounds = i >= 0 ? demo?.mosaics[i].bounds : undefined;
  // A new object only when the image changes, so the map reloads it only then.
  return useMemo(() => (kind && bounds ? { url: `${DEMO_URL}/mosaic/${i}_${kind}.webp`, bounds } : null), [kind, i, bounds]);
}
