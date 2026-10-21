'use client';

import { useMemo } from 'react';
import { flightS, usePlayback } from './playback';
import type { ReplayFlight, ReplayStatus } from './types';

export interface Replay {
  status: ReplayStatus | null;
  flights: ReplayFlight[];
  /** Seconds into the playing flight. */
  elapsedS: number | null;
  paused: boolean;
  busy: boolean;
  error: string | null;
  loadFlights: () => Promise<void>;
  play: (id: string, speed: number) => Promise<void>;
  stop: () => Promise<void>;
  /** Jump the playing flight to this many seconds in. */
  seek: (s: number) => Promise<void>;
  setPaused: (on: boolean) => Promise<void>;
}

/** The recorded flight's transport, in the live app's replay interface. */
export function useReplay(): Replay {
  const p = usePlayback();
  const flight = useMemo<ReplayFlight | null>(
    () =>
      p.demo && {
        id: p.demo.flight.name,
        name: p.demo.flight.name,
        start: p.demo.flight.start,
        startT: 0,
        durationS: Math.round(p.demo.flight.durationS),
        photos: p.demo.flight.photos,
        videos: 2,
        partialTelemetry: false,
      },
    [p.demo],
  );
  const { load, play, stop, seek, setPaused } = p;

  return {
    status: { playing: p.playing, flight: p.playing ? flight : null, speed: p.speed, error: p.error },
    flights: flight ? [flight] : [],
    elapsedS: p.playing ? flightS(p) : null,
    paused: p.paused,
    busy: false,
    error: p.error,
    loadFlights: load,
    play: async (id, speed) => play(speed),
    stop: async () => stop(),
    seek: async (s) => seek(s),
    setPaused: async (on) => setPaused(on),
  };
}
