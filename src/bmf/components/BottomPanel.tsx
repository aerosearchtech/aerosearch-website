'use client';

import { LogList, StatBox, panelHdr as hdr } from './PanelChrome';
import { FONT_MONO } from '@/bmf/lib/theme';
import { useGcs } from '@/bmf/lib/store';
import type { ViewModel } from '@/bmf/lib/derive';

export default function BottomPanel({ view }: { view: ViewModel }) {
  const log = useGcs((s) => s.log);
  const selectRoute = useGcs((s) => s.selectRoute);
  const sel = view.selected;

  return (
    <div style={{ flex: 'none', height: 196, background: 'var(--bg1)', borderTop: '1px solid var(--bd2)', display: 'flex', minHeight: 0 }}>
      <div style={{ flex: 1.3, borderRight: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={hdr}>PLANNING LOG</div>
        <LogList lines={log} />
      </div>

      <div style={{ flex: 1.1, borderRight: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ ...hdr, justifyContent: 'space-between' }}>
          <span>LANE COMPARISON</span>
          <span style={{ fontFamily: FONT_MONO, color: 'var(--tx3)', letterSpacing: 1 }}>DEVICES TO CLEAR</span>
        </div>
        <div style={{ flex: 1, padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9 }}>
          {view.compare.map((c) => (
            <div key={c.id} onClick={() => selectRoute(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: c.color, width: 52, fontWeight: 600 }}>{c.label}</span>
              <div style={{ flex: 1, height: 7, background: 'var(--bg3)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, width: c.mineW, background: c.color, transition: 'width .2s linear' }} />
              </div>
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: c.color, width: 22, textAlign: 'right' }}>{c.mines}</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: 'var(--tx3)', width: 118, textAlign: 'right' }}>
                {Math.round(c.lengthM)}m · {c.turns}t · {c.conf}%
              </span>
            </div>
          ))}
          {!view.compare.length && (
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: 'var(--tx3)' }}>no options to compare</div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={hdr}>BREACH SUMMARY</div>
        <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 9 }}>
            <StatBox label="DEVICES" value={String(sel?.metrics.minesToClear ?? 0)} color="var(--rd)" />
            <StatBox label="EFFORT" value={view.laneHours} color="var(--am)" />
            <StatBox label="CONFIDENCE" value={`${Math.round((sel?.metrics.surveyMean ?? 0) * 100)}%`} color="var(--tl)" />
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: 'var(--tx3)', letterSpacing: 0.5, lineHeight: 1.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>FULL-FIELD MANUAL CLEARANCE</span>
              <span style={{ color: 'var(--tx2)' }}>{view.fieldHours}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>CLEARANCE AVOIDED</span>
              <span style={{ color: 'var(--gn)' }}>{view.savedPct.toFixed(1)}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>BYPASSED BLAST STANDOFF</span>
              <span style={{ color: 'var(--tx)' }}>{(sel?.metrics.clearanceMin ?? 0).toFixed(1)} m</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>LANE TORTUOSITY</span>
              <span style={{ color: 'var(--tx)' }}>{(sel?.metrics.tortuosity ?? 0).toFixed(2)} ×</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>LANE THROUGH UNSWEPT GROUND</span>
              <span style={{ color: (sel?.metrics.unsweptM ?? 0) > 0 ? 'var(--am)' : 'var(--gn)' }}>
                {Math.round(sel?.metrics.unsweptM ?? 0)} m
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
