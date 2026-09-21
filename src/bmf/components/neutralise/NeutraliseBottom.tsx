'use client';

import { BarList, StatBox, panelHdr } from '../PanelChrome';
import { FONT_MONO } from '@/bmf/lib/theme';
import type { ViewModel } from '@/bmf/lib/derive';

/** CLEARANCE STATE · PROOFING GATE · LANE CERTIFICATE. */
export default function NeutraliseBottom({ view }: { view: ViewModel }) {
  const n = view.neutralise;

  return (
    <div style={{ flex: 'none', height: 196, background: 'var(--bg1)', borderTop: '1px solid var(--bd2)', display: 'flex', minHeight: 0 }}>
      <div style={{ flex: 1, borderRight: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ ...panelHdr, justifyContent: 'space-between' }}>
          <span>CLEARANCE STATE</span>
          <span style={{ fontFamily: FONT_MONO, color: 'var(--tx3)', letterSpacing: 1 }}>DEVICES</span>
        </div>
        <BarList rows={n.tally} labelW={92} />
      </div>

      <div style={{ flex: 1.2, borderRight: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={panelHdr}>PROOFING GATE</div>
        <div style={{ flex: 1, padding: '8px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
          {n.gate.map((g) => (
            <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: FONT_MONO, fontSize: 10 }}>
              <span style={{ width: 13, flex: 'none', color: g.pass ? 'var(--gn)' : 'var(--rd)', fontWeight: 700 }}>
                {g.pass ? '✓' : '✕'}
              </span>
              <span style={{ color: 'var(--tx2)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.label}</span>
              <span style={{ color: g.pass ? 'var(--gn)' : 'var(--am)', fontWeight: 600 }}>{g.detail}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={panelHdr}>LANE CERTIFICATE</div>
        <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 9 }}>
            <StatBox label="CLEARED" value={`${n.progressPct.toFixed(0)}%`} color="var(--tl)" />
            <StatBox label="PROOFED" value={`${n.proofedPct.toFixed(0)}%`} color="var(--gn)" />
            <StatBox label="TO OPEN" value={n.timeToOpenStr} color="var(--am)" />
          </div>
          <div
            style={{
              border: `1px solid ${n.certified ? 'var(--gn)' : 'var(--rd)'}`,
              background: n.certified ? 'rgba(70,196,106,.10)' : 'rgba(255,83,71,.08)',
              padding: '9px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: FONT_MONO,
            }}
          >
            <span style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--tx3)' }}>
              {view.selected ? view.selected.label : 'NO LANE'} · {view.corridorWidthM} m LANE
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: n.certified ? 'var(--gn)' : 'var(--rd)' }}>
              {n.certified ? 'LANE OPEN' : 'NOT CERTIFIED'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
