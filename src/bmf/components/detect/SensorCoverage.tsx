'use client';

import { AOI_DEPTH_M, AOI_WIDTH_M } from '@/bmf/lib/constants';
import { FONT_MONO } from '@/bmf/lib/theme';
import { useGcs } from '@/bmf/lib/store';
import type { ViewModel } from '@/bmf/lib/derive';

const sectionHdr: React.CSSProperties = {
  padding: '10px 13px 7px',
  fontSize: 9,
  letterSpacing: 2,
  color: 'var(--tx3)',
  fontFamily: FONT_MONO,
};

const row = (label: string, value: string, color = 'var(--tx)'): React.ReactNode => (
  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT_MONO, fontSize: 10, color: 'var(--tx3)' }}>
    <span>{label}</span>
    <span style={{ color }}>{value}</span>
  </div>
);

/** Left rail in DETECT: what each payload actually covered. */
export default function SensorCoverage({ detect }: { detect: ViewModel['detect'] }) {
  const setLayer = useGcs((s) => s.setLayer);

  return (
    <div style={{ width: 296, flex: 'none', background: 'var(--bg1)', borderRight: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ height: 34, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 13px', borderBottom: '1px solid var(--bd)', background: 'var(--bg2)' }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, color: 'var(--tx)' }}>SENSOR COVERAGE</span>
        <span style={{ fontSize: 10, fontFamily: FONT_MONO, color: 'var(--tl)' }}>{detect.channels.length} CHANNELS</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {detect.channels.map((c) => (
          <div key={c.id} style={{ padding: '11px 13px', borderBottom: '1px solid var(--bd)', borderLeft: `3px solid ${c.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 7, height: 7, background: c.color, boxShadow: `0 0 6px ${c.color}` }} />
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.5, fontFamily: FONT_MONO }}>{c.id}</span>
                {c.holiday && (
                  <span style={{ fontSize: 8, fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: 1, padding: '1px 5px', color: 'var(--am)', border: '1px solid var(--am)' }}>
                    HOLIDAYS
                  </span>
                )}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: FONT_MONO, color: c.color }}>
                {c.coveragePct.toFixed(0)}%
              </span>
            </div>

            <div style={{ marginTop: 6, fontSize: 10, color: 'var(--tx3)', letterSpacing: 0.3 }}>{c.name}</div>

            <div style={{ marginTop: 8, height: 5, background: 'var(--bg3)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, width: c.coverageW, background: c.color }} />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8, fontFamily: FONT_MONO, fontSize: 10, color: 'var(--tx2)' }}>
              <span><span style={{ color: 'var(--tx3)' }}>SWATH </span>{c.swathM}m</span>
              <span><span style={{ color: 'var(--tx3)' }}>SPACING </span>{c.lineSpacingM}m</span>
              <span style={{ marginLeft: 'auto', color: 'var(--tx3)' }}>{c.passes} PASSES</span>
            </div>
          </div>
        ))}

        <div style={sectionHdr}>OBSTACLE DENSITY</div>
        <div style={{ padding: '0 13px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {detect.densityRows.map((d) => (
            <div key={d.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontFamily: FONT_MONO, fontSize: 10, color: 'var(--tx3)' }}>
                <span>{d.label}</span>
                <span>
                  <span style={{ color: d.color, fontSize: 12, fontWeight: 700 }}>{d.value}</span>{' '}
                  {d.unit}
                </span>
              </div>
              {d.note && (
                <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 0.5, color: d.color, opacity: 0.8, marginTop: 1 }}>
                  {d.note}
                </div>
              )}
            </div>
          ))}
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, lineHeight: 1.6, color: 'var(--tx3)', marginTop: 2 }}>
            Measured from the fused plot. Doctrinal anti-tank belts run 750–1,000
            per km of front; armoured approaches have reached 2,000.
          </div>
        </div>

        <div style={sectionHdr}>SURVEY PARAMETERS</div>
        <div style={{ padding: '0 13px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {row('AREA OF INTEREST', `${AOI_WIDTH_M} × ${AOI_DEPTH_M} m`)}
          {row('FUSED QUALITY', `${(detect.meanQuality * 100).toFixed(0)}%`, 'var(--tl)')}
          {row('SWEPT TO STANDARD', `${detect.sweptPct.toFixed(0)}%`, detect.sweptPct >= 80 ? 'var(--gn)' : 'var(--am)')}
          {row('SURVEY AGE', `${detect.ageStr} ${detect.ageUnit.toLowerCase()}`)}
          {row('MEAN FIX CONFIDENCE', `${detect.meanConf.toFixed(0)}%`, 'var(--am)')}
        </div>

        <div style={{ padding: '0 13px 14px' }}>
          <button
            onClick={() => setLayer('coverage')}
            style={{ width: '100%', padding: '8px 0', background: 'var(--bg3)', border: '1px solid var(--bd2)', color: 'var(--tx)', fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, letterSpacing: 1, cursor: 'pointer' }}
          >
            SHOW COVERAGE ON MAP
          </button>
        </div>
      </div>

      <div style={{ flex: 'none', borderTop: '1px solid var(--bd)', padding: '9px 13px', background: 'var(--bg2)', display: 'flex', justifyContent: 'space-between', fontFamily: FONT_MONO, fontSize: 9, color: 'var(--tx3)', letterSpacing: 1 }}>
        <span>MULTI-CHANNEL FUSION</span>
        <span style={{ color: 'var(--gn)' }}>{detect.channelsUp}/{detect.channels.length} USABLE</span>
      </div>
    </div>
  );
}
