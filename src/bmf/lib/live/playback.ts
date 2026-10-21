'use client';

import { create } from 'zustand/react';
import { DEMO_TICK_MS, DEMO_URL } from './constants';
import type { RecordedDemo } from './types';

interface Playback {
  demo: RecordedDemo | null;
  error: string | null;
  playing: boolean;
  paused: boolean;
  speed: number;
  /** Flight seconds at performance.now() `at` (ms). */
  baseS: number;
  at: number;
  /** Bumped while playing so whatever reads the clock re-renders. */
  tick: number;
  load: () => Promise<void>;
  play: (speed: number) => void;
  stop: () => void;
  seek: (s: number) => void;
  setPaused: (paused: boolean) => void;
}

let timer = 0;

/** Seconds into the recorded flight, held at its end. */
export function flightS(p: Pick<Playback, 'demo' | 'playing' | 'paused' | 'speed' | 'baseS' | 'at'>): number {
  const run = p.playing && !p.paused ? ((performance.now() - p.at) / 1000) * p.speed : 0;
  return Math.min(p.baseS + run, p.demo?.flight.durationS ?? 0);
}

/** Index of the last entry at or before t (entries sorted by t); -1 if none. */
export function lastAt(list: { t: number }[], t: number): number {
  let lo = 0;
  let hi = list.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (list[mid].t <= t) lo = mid + 1;
    else hi = mid;
  }
  return lo - 1;
}

/** The recorded flight's playback clock, shared by the live hooks and the feed. */
export const usePlayback = create<Playback>((set, get) => ({
  demo: null,
  error: null,
  playing: false,
  paused: false,
  speed: 1,
  baseS: 0,
  at: 0,
  tick: 0,

  load: async () => {
    if (get().demo) return;
    try {
      const r = await fetch(`${DEMO_URL}/demo.json`);
      if (!r.ok) throw new Error(r.statusText);
      set({ demo: (await r.json()) as RecordedDemo, error: null });
    } catch {
      set({ error: 'recorded flight not found' });
    }
  },

  play: (speed) => {
    window.clearInterval(timer);
    timer = window.setInterval(() => set((s) => ({ tick: s.tick + 1 })), DEMO_TICK_MS);
    set({ playing: true, paused: false, speed, baseS: 0, at: performance.now() });
  },

  stop: () => {
    window.clearInterval(timer);
    set({ playing: false, paused: false, baseS: 0 });
  },

  seek: (s) => set({ baseS: s, at: performance.now() }),

  setPaused: (paused) => set({ baseS: flightS(get()), at: performance.now(), paused }),
}));
