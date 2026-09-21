'use client';

import { FONT_MONO } from '@/bmf/lib/theme';
import { useGcs } from '@/bmf/lib/store';
import type { RunChannelRow, RunView } from '@/bmf/lib/derive';

const btn: React.CSSProperties = {
  padding: '4px 9px',
  fontFamily: FONT_MONO,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: 1,
  cursor: 'pointer',
  color: 'var(--tx2)',
  background: 'transparent',
  border: '1px solid var(--bd2)',
  flex: 'none',
};

const rule: React.CSSProperties = { width: 1, height: 14, background: 'var(--bd)', flex: 'none' };

const kv = (label: string, val: string, color = 'var(--tx)') => (
  <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: 'var(--tx3)', whiteSpace: 'nowrap', flex: 'none' }}>
    {label} <b style={{ color, fontSize: 10 }}>{val}</b>
  </span>
);

/** One channel's share of the pass, so a stalled or riding sensor is obvious. */
function Channel({ c }: { c: RunChannelRow }) {
  return (
    <div style={{ flex: 1, minWidth: 0, opacity: c.pct > 0 ? 1 : 0.42 }} title={c.detail}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: FONT_MONO,
          fontSize: 8,
          letterSpacing: 0.5,
          color: c.flying ? c.color : 'var(--tx3)',
          fontWeight: c.flying ? 700 : 500,
        }}
      >
        <span>{c.id}</span>
        <span>{c.pct}%</span>
      </div>
      <div style={{ height: 3, marginTop: 2, background: 'var(--bd)' }}>
        <div style={{ width: c.barW, height: '100%', background: c.color }} />
      </div>
    </div>
  );
}

/**
 * Transport for the survey playback. The elapsed figure is real mission time,
 * not screen time — each wave is given the screen seconds it is worth watching
 * for, so the rate the clock runs at changes between waves and is shown.
 */
export default function SurveyBar({ run }: { run: RunView }) {
  const setRunPlaying = useGcs((s) => s.setRunPlaying);
  const endRun = useGcs((s) => s.endRun);

  return (
    <div style={{ flex: 'none', borderTop: '1px solid var(--bd)', background: 'var(--bg1)' }}>
      <div style={{ height: 3, background: 'var(--bd)' }}>
        <div
          style={{
            width: run.barW,
            height: '100%',
            background: run.headColor,
            boxShadow: `0 0 8px ${run.headColor}`,
          }}
        />
      </div>

      <div style={{ height: 30, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px' }}>
        <button
          onClick={() => setRunPlaying(!run.playing)}
          disabled={run.done}
          style={{ ...btn, width: 30, opacity: run.done ? 0.4 : 1, cursor: run.done ? 'default' : 'pointer' }}
        >
          {run.playing ? '❚❚' : '▶'}
        </button>

        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.5,
            color: run.headColor,
            flex: 'none',
          }}
        >
          {run.headline}
        </span>

        <div style={rule} />
        {kv('ELAPSED', run.missionStr, 'var(--am)')}
        {kv('FIXES', `${run.found}/${run.total}`, 'var(--tl)')}
        {/* The swap station: how much of the swarm is off task right now. */}
        {kv('ON PAD', `${run.padsBusy}/${run.pads.length}`, run.padsBusy ? 'var(--am)' : 'var(--tx2)')}

        <div style={{ flex: 1, minWidth: 8 }} />

        {/* The whole argument for cueing GPR rather than rastering it. */}
        {kv('CUED', run.cuedStr, 'var(--gn)')}
        {kv('vs BLIND', run.blindStr, 'var(--rd)')}

        <button onClick={endRun} style={{ ...btn, color: run.done ? 'var(--gn)' : 'var(--tx2)' }}>
          {run.done ? '✓ CLOSE' : 'SKIP ▸'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 9, padding: '0 12px 7px' }}>
        {run.channels.map((c) => (
          <Channel key={c.id} c={c} />
        ))}
      </div>
    </div>
  );
}
