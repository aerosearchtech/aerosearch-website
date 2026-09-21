'use client';

import { FONT_MONO } from '@/bmf/lib/theme';
import { useGcs } from '@/bmf/lib/store';
import type { ClearanceView } from '@/bmf/lib/derive';

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

/**
 * Transport for the clearance playback. The lane is worked by charge-carrying
 * airframes, so the figures that matter are charges expended and contacts that
 * turned out to be nothing — the second is what a cued survey really costs.
 */
export default function ClearanceBar({ run }: { run: ClearanceView }) {
  const setClearancePlaying = useGcs((s) => s.setClearancePlaying);
  const endClearance = useGcs((s) => s.endClearance);

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
          onClick={() => setClearancePlaying(!run.playing)}
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
        {kv('PROOFED', `${run.proofed}/${run.tasked}`, 'var(--gn)')}
        {kv('CHARGES', `${run.chargesPlaced}/${run.charges}`, 'var(--or)')}

        <div style={{ flex: 1, minWidth: 8 }} />

        {/* The cost of cueing: contacts flown to that had nothing under them. */}
        {kv('NO DEVICE', `${run.falseAlarmsFound}/${run.falseAlarmCount}`, 'var(--gnPale)')}
        {kv('SHOTS', `${run.shots} × ${run.shotDevices}`, 'var(--tx2)')}

        <button onClick={endClearance} style={{ ...btn, color: run.done ? 'var(--gn)' : 'var(--tx2)' }}>
          {run.done ? '✓ CLOSE' : 'SKIP ▸'}
        </button>
      </div>
    </div>
  );
}
