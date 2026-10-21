'use client';

import { STANDBY_CHANNELS } from '@/bmf/lib/live/constants';
import { FONT_MONO } from '@/bmf/lib/theme';
import { Section } from './chrome';

const chip: React.CSSProperties = { marginLeft: 'auto', fontSize: 8, fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: 1, padding: '1px 5px', color: 'var(--tx3)', border: '1px solid var(--bd2)' };

/** BMF's other modalities in the drone rail: on standby, with their planned swath and height. */
export default function StandbyChannels() {
  return (
    <>
      <Section title="OTHER MODALITIES" />
      {STANDBY_CHANNELS.map((c) => {
        const color = `var(--${c.colorKey})`;
        return (
          <div key={c.id} style={{ padding: '9px 13px 9px 24px', borderBottom: '1px solid var(--bd)', borderLeft: `3px solid ${color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 7, height: 7, background: color, opacity: 0.6 }} />
              <span style={{ fontSize: 12, fontWeight: 600, fontFamily: FONT_MONO, color: 'var(--tx2)' }}>{c.id}</span>
              <span style={chip}>STANDBY</span>
            </div>
            <div style={{ marginTop: 5, fontSize: 10, color: 'var(--tx3)', letterSpacing: 0.3 }}>{c.name}</div>
            <div style={{ marginTop: 5, fontFamily: FONT_MONO, fontSize: 10, color: 'var(--tx2)' }}>
              <span style={{ color: 'var(--tx3)' }}>SWATH </span>
              {c.physicalSwathM.toFixed(1)} m @ {c.aglM} m AGL
            </div>
          </div>
        );
      })}
    </>
  );
}
