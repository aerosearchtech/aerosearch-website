'use client';

import { useMemo } from 'react';
import { flightS, lastAt, usePlayback } from './playback';
import type { BridgeState, RecordedDemo } from './types';

export interface Bridge {
  /** The recorded state at the playback clock; null while nothing plays. */
  state: BridgeState | null;
  /** No flight is playing. */
  offline: boolean;
  /** The recorded flight's mission cannot be re-downloaded. */
  refreshMission: () => Promise<string | null>;
}

const refreshMission = async (): Promise<string | null> => 'not available in a recorded flight';

function stateAt(demo: RecordedDemo, i: number, mi: number, si: number): BridgeState {
  const s = demo.samples[i];
  return {
    session: 0,
    link: { source: demo.flight.name, replay: true, ...s.link },
    vehicle: s.v,
    flight: s.flight,
    trailFrom: 0,
    trail: demo.trail.slice(...s.trail),
    mission: mi < 0 ? null : demo.missions[mi].mission,
    missionVersion: mi + 1,
    photosFile: demo.flight.name,
    photosFrom: 0,
    photos: demo.photos.slice(...s.photos),
    status: si < 0 ? [] : demo.status[si].list,
    swathPerM: demo.swathPerM,
  };
}

/** The drone as the bridge served it at this moment of the recorded flight. */
export function useBridge(): Bridge {
  const p = usePlayback();
  const t = flightS(p);
  const demo = p.playing ? p.demo : null;
  const i = demo ? Math.max(0, lastAt(demo.samples, t)) : -1;
  const mi = demo ? lastAt(demo.missions, t) : -1;
  const si = demo ? lastAt(demo.status, t) : -1;
  const state = useMemo(() => (demo && i >= 0 ? stateAt(demo, i, mi, si) : null), [demo, i, mi, si]);
  return { state, offline: !state, refreshMission };
}
