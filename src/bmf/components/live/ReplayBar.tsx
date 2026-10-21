'use client';

import { useRef, useState } from 'react';
import type { Replay } from '@/bmf/lib/live/useReplay';
import { FONT_MONO } from '@/bmf/lib/theme';
import { smallBtn } from './chrome';
import { clock } from './TelemetryStrip';

/** Transport bar under the map (and the feed) while a recorded flight plays: pause, and click or drag the timeline to seek. */
export default function ReplayBar({ replay }: { replay: Replay }) {
  const { status, elapsedS, paused, busy, stop, seek, setPaused } = replay;
  const track = useRef<HTMLDivElement>(null);
  const [dragS, setDragS] = useState<number | null>(null);
  const flight = status?.flight;
  if (!status?.playing || !flight) return null;

  const at = (e: React.PointerEvent): number => {
    const r = track.current?.getBoundingClientRect();
    return r ? Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1) * flight.durationS : 0;
  };
  const shown = Math.min(Math.round(dragS ?? elapsedS ?? 0), flight.durationS);
  const pct = flight.durationS ? (100 * shown) / flight.durationS : 0;

  return (
    <div style={{ height: 30, flex: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '0 13px', borderTop: '1px solid var(--bd)', background: 'var(--bg2)', fontFamily: FONT_MONO, fontSize: 10 }}>
      <span style={{ color: paused ? 'var(--am)' : 'var(--bl)', fontWeight: 700, letterSpacing: 1 }}>{paused ? '❚❚ PAUSED' : '▶ REPLAY'}</span>
      <span style={{ color: 'var(--tx)' }}>{flight.name}</span>
      <span style={{ color: 'var(--tx3)' }}>{status.speed}×</span>
      <div
        ref={track}
        title="Click or drag to jump"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragS(at(e));
        }}
        onPointerMove={(e) => dragS !== null && setDragS(at(e))}
        onPointerUp={(e) => {
          if (dragS === null) return;
          setDragS(null);
          void seek(at(e));
        }}
        style={{ flex: 1, height: 16, display: 'flex', alignItems: 'center', cursor: 'pointer', touchAction: 'none' }}
      >
        <div style={{ flex: 1, height: 4, background: 'var(--bg3)', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: 'var(--bl)' }} />
          <div style={{ position: 'absolute', left: `${pct}%`, top: -4, width: 4, height: 12, marginLeft: -2, background: 'var(--tx)' }} />
        </div>
      </div>
      <span style={{ color: 'var(--tx2)' }}>
        {clock(shown)} / {clock(flight.durationS)}
      </span>
      <button onClick={() => void setPaused(!paused)} style={{ ...smallBtn, color: 'var(--am)', borderColor: 'var(--am)' }} title={paused ? 'Resume the replay' : 'Pause the replay'}>
        {paused ? '▶ PLAY' : '❚❚ PAUSE'}
      </button>
      <button disabled={busy} onClick={() => void stop()} style={{ ...smallBtn, color: 'var(--rd)', borderColor: 'var(--rd)', opacity: busy ? 0.4 : 1 }} title="Stop the replay">
        ■ STOP
      </button>
    </div>
  );
}
