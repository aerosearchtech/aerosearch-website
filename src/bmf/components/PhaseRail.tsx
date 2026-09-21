'use client';

import { FONT_MONO } from '@/bmf/lib/theme';
import { useGcs } from '@/bmf/lib/store';
import type { ViewModel } from '@/bmf/lib/derive';

/** Operation phases in doctrinal order, each carrying its own live state. */
export default function PhaseRail({ phases }: { phases: ViewModel['phases'] }) {
  const setPhase = useGcs((s) => s.setPhase);

  return (
    <div style={{ height: 42, flex: 'none', display: 'flex', background: 'var(--bg2)', borderBottom: '1px solid var(--bd)' }}>
      {phases.map((ph, i) => (
        <button
          key={ph.id}
          onClick={() => setPhase(ph.id)}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 16px',
            background: ph.active ? 'rgba(242,169,59,.10)' : 'transparent',
            border: 'none',
            borderRight: '1px solid var(--bd)',
            borderBottom: `2px solid ${ph.active ? 'var(--am)' : 'transparent'}`,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: ph.active ? 'var(--am)' : 'var(--tx3)' }}>
            {i + 1}
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, color: ph.active ? 'var(--tx)' : 'var(--tx2)' }}>
              {ph.label}
            </span>
            <span style={{ fontSize: 9, letterSpacing: 1, color: 'var(--tx3)', fontFamily: FONT_MONO }}>
              {ph.caption}
            </span>
          </span>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: ph.statusColor, flex: 'none' }} />
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 0.5, color: ph.statusColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {ph.status}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
