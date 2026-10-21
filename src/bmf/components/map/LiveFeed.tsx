'use client';

import { useEffect, useRef, useState } from 'react';
import { FEED_MODES } from '@/bmf/lib/constants';
import { DEMO_TICK_MS, DEMO_URL, VIDEO_SYNC_S } from '@/bmf/lib/live/constants';
import { flightS, usePlayback } from '@/bmf/lib/live/playback';
import { FONT_MONO } from '@/bmf/lib/theme';
import type { FeedMode } from '@/bmf/lib/types';

interface Props {
  /** Who the feed belongs to, e.g. 'HB10 · C12'. */
  title: string;
  mode: FeedMode;
  onMode: (mode: FeedMode) => void;
  onClose: () => void;
  /** Shown under the video, e.g. the replay controls. */
  footer?: React.ReactNode;
}

const btn = (active: boolean): React.CSSProperties => ({
  padding: '4px 10px',
  background: active ? 'var(--amWash)' : 'var(--bg3)',
  border: `1px solid ${active ? 'var(--am)' : 'var(--bd2)'}`,
  color: active ? 'var(--am)' : 'var(--tx)',
  fontFamily: FONT_MONO,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 1,
  cursor: 'pointer',
});

/** Keeps a feed video on the playback clock: rate, pause and seeks. */
function syncVideo(v: HTMLVideoElement): void {
  const p = usePlayback.getState();
  const t = flightS(p);
  if (!p.playing || p.paused || t >= (p.demo?.flight.durationS ?? 0)) v.pause();
  if (!p.playing) return;
  v.playbackRate = p.speed;
  if (!v.seeking && Math.abs(v.currentTime - t) > VIDEO_SYNC_S) v.currentTime = t;
  if (!p.paused && v.paused && t < (p.demo?.flight.durationS ?? 0)) void v.play().catch(() => undefined);
}

/** Fills the map area with the recorded C12 feed of the airframe the operator picked. */
export default function LiveFeed({ title, mode, onMode, onClose, footer }: Props) {
  const [failed, setFailed] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const tick = () => video.current && syncVideo(video.current);
    tick();
    const id = window.setInterval(tick, DEMO_TICK_MS);
    return () => window.clearInterval(id);
  }, [mode]);

  const pick = (m: FeedMode) => {
    setFailed(false);
    onMode(m);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', background: 'var(--bg0)' }}>
      <div style={{ height: 34, flex: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '0 13px', borderBottom: '1px solid var(--bd)', background: 'var(--bg2)' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: failed ? 'var(--rd)' : 'var(--bl)' }} />
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, color: 'var(--tx)', marginRight: 'auto' }}>
          {title} · {failed ? 'NO SIGNAL' : 'REPLAY'}
        </span>
        {FEED_MODES.map((m) => (
          <button key={m} onClick={() => pick(m)} style={btn(m === mode)}>
            {m.toUpperCase()}
          </button>
        ))}
        <button onClick={onClose} style={{ ...btn(false), marginLeft: 8 }}>
          ✕ MAP
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {failed ? (
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: 'var(--tx3)' }}>The recorded {mode} feed could not be loaded.</span>
        ) : (
          <video
            key={mode}
            ref={video}
            src={`${DEMO_URL}/video/${mode}.mp4`}
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={(e) => syncVideo(e.currentTarget)}
            onError={() => setFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        )}
      </div>
      {footer}
    </div>
  );
}
