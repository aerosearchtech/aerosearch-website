'use client';

import { useEffect, useState } from 'react';
import { REPLAY_DEFAULT_SPEED, REPLAY_SPEEDS } from '@/bmf/lib/live/constants';
import type { Replay } from '@/bmf/lib/live/useReplay';
import { FONT_MONO } from '@/bmf/lib/theme';
import { RailHeader, rail, railBody, smallBtn } from './chrome';
import { clock } from './TelemetryStrip';

const speedBtn = (on: boolean): React.CSSProperties => ({
  ...smallBtn,
  background: on ? 'var(--amWash)' : 'var(--bg3)',
  color: on ? 'var(--am)' : 'var(--tx2)',
  borderColor: on ? 'var(--am)' : 'var(--bd2)',
});

/** Replay rail over the map: the recorded flights, each playable through the live map. */
export default function ReplayPanel({ replay }: { replay: Replay }) {
  const { status, flights, busy, error, loadFlights, play, stop } = replay;
  const [speed, setSpeed] = useState(REPLAY_DEFAULT_SPEED);
  const playingId = status?.playing ? status.flight?.id : null;

  useEffect(() => {
    void loadFlights();
  }, [loadFlights]);

  return (
    <div style={rail}>
      <RailHeader
        title="REPLAY"
        right={
          <span style={{ display: 'flex', gap: 4 }}>
            {REPLAY_SPEEDS.map((s) => (
              <button key={s} style={speedBtn(s === speed)} onClick={() => setSpeed(s)} title="Replay speed">
                {s}×
              </button>
            ))}
          </span>
        }
      />

      <div style={railBody}>
        {(error || status?.error) && <div style={{ padding: '8px 13px 0', fontFamily: FONT_MONO, fontSize: 10, color: 'var(--rd)', lineHeight: 1.5 }}>{error ?? status?.error}</div>}
        {flights.map((f) => {
          const playing = f.id === playingId;
          return (
            <div key={f.id} style={{ padding: '10px 13px', borderBottom: '1px solid var(--bd)', borderLeft: `3px solid ${playing ? 'var(--bl)' : 'transparent'}`, background: playing ? 'var(--amWash)' : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, fontFamily: FONT_MONO }}>{f.name}</span>
                <button
                  disabled={busy}
                  onClick={() => void (playing ? stop() : play(f.id, speed))}
                  style={{ ...smallBtn, marginLeft: 'auto', color: playing ? 'var(--rd)' : 'var(--tl)', borderColor: playing ? 'var(--rd)' : 'var(--tl)', opacity: busy ? 0.4 : 1 }}
                  title={playing ? 'Stop the replay' : `Replay at ${speed}×`}
                >
                  {playing ? '■ STOP' : '▶ PLAY'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 6, fontFamily: FONT_MONO, fontSize: 10, color: 'var(--tx2)' }}>
                <span>{f.start.slice(0, 16).replace('T', ' ')}</span>
                <span>{clock(f.durationS)}</span>
                <span>{f.photos} PHOTOS</span>
                <span>{f.videos} VIDEO</span>
              </div>
              {f.partialTelemetry && <div style={{ marginTop: 4, fontFamily: FONT_MONO, fontSize: 9, color: 'var(--am)', letterSpacing: 1 }}>PARTIAL TELEMETRY · RECOVERED FROM MISSION PLANNER</div>}
            </div>
          );
        })}
        {!flights.length && !error && <div style={{ padding: '12px 13px', fontFamily: FONT_MONO, fontSize: 10, color: 'var(--tx3)' }}>No recorded flights with telemetry.</div>}
      </div>
    </div>
  );
}
