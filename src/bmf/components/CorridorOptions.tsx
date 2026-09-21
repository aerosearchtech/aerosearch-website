'use client';

import { CORRIDOR_WIDTHS_M } from '@/bmf/lib/constants';
import { FONT_MONO } from '@/bmf/lib/theme';
import { useGcs } from '@/bmf/lib/store';
import type { ViewModel } from '@/bmf/lib/derive';
import type { Weights } from '@/bmf/lib/types';

const SLIDERS: { key: keyof Weights; label: string }[] = [
  { key: 'risk', label: 'AVOID DEVICES' },
  { key: 'resid', label: 'AVOID UNSWEPT GROUND' },
  { key: 'length', label: 'KEEP IT SHORT' },
  { key: 'turn', label: 'KEEP IT STRAIGHT' },
];

const sectionHdr: React.CSSProperties = {
  padding: '10px 13px 7px',
  fontSize: 9,
  letterSpacing: 2,
  color: 'var(--tx3)',
  fontFamily: FONT_MONO,
};

export default function CorridorOptions({ options, solveMs }: { options: ViewModel['options']; solveMs: number }) {
  const corridorWidthM = useGcs((s) => s.corridorWidthM);
  const setCorridorWidth = useGcs((s) => s.setCorridorWidth);
  const weights = useGcs((s) => s.weights);
  const setWeights = useGcs((s) => s.setWeights);
  const selectRoute = useGcs((s) => s.selectRoute);

  return (
    <div style={{ width: 296, flex: 'none', background: 'var(--bg1)', borderRight: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ height: 34, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 13px', borderBottom: '1px solid var(--bd)', background: 'var(--bg2)' }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, color: 'var(--tx)' }}>CORRIDOR OPTIONS</span>
        <span style={{ fontSize: 10, fontFamily: FONT_MONO, color: 'var(--gn)' }}>{options.length} PLANNED</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={sectionHdr}>LANE WIDTH</div>
        <div style={{ display: 'flex', gap: 6, padding: '0 13px 12px' }}>
          {CORRIDOR_WIDTHS_M.map((w) => (
            <button
              key={w}
              onClick={() => setCorridorWidth(w)}
              style={{
                flex: 1,
                padding: '7px 0',
                background: w === corridorWidthM ? 'rgba(242,169,59,.12)' : 'var(--bg3)',
                border: `1px solid ${w === corridorWidthM ? 'var(--am)' : 'var(--bd2)'}`,
                color: w === corridorWidthM ? 'var(--am)' : 'var(--tx2)',
                fontFamily: FONT_MONO,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                cursor: 'pointer',
              }}
            >
              {w} m
            </button>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--bd)' }} />

        {options.map((o) => (
          <div
            key={o.id}
            onClick={() => selectRoute(o.id)}
            style={{ padding: '11px 13px', borderBottom: '1px solid var(--bd)', cursor: 'pointer', background: o.rowBg, borderLeft: `3px solid ${o.color}` }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 7, height: 7, background: o.color, boxShadow: `0 0 6px ${o.color}` }} />
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.5, fontFamily: FONT_MONO }}>{o.label}</span>
                {o.best && (
                  <span style={{ fontSize: 8, fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: 1, padding: '1px 5px', color: 'var(--gn)', border: '1px solid var(--gn)' }}>BEST</span>
                )}
              </div>
              <span style={{ fontSize: 9, letterSpacing: 1.5, fontWeight: 600, color: o.color, fontFamily: FONT_MONO }}>{o.tag}</span>
            </div>

            <div style={{ marginTop: 6, fontSize: 10, color: 'var(--tx3)', letterSpacing: 0.3 }}>{o.caption}</div>

            {/* How much of the ground under this lane the survey actually saw. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 8, letterSpacing: 1, color: 'var(--tx3)', flex: 'none' }}>CONF</span>
              <div style={{ flex: 1, height: 4, background: 'var(--bg3)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, width: o.confW, background: o.unswept ? 'var(--am)' : 'var(--gn)' }} />
              </div>
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: o.unswept ? 'var(--am)' : 'var(--gn)', minWidth: 30, textAlign: 'right' }}>
                {o.conf}%
              </span>
            </div>
            {o.unswept && (
              <div style={{ marginTop: 6, fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 0.5, color: 'var(--am)' }}>
                ⚠ {Math.round(o.unsweptM)} m THROUGH UNSWEPT GROUND
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, fontFamily: FONT_MONO, fontSize: 10, color: 'var(--tx2)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'var(--tx3)' }}>CLR</span>
                <span style={{ color: 'var(--rd)', fontWeight: 700 }}>{o.mines}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'var(--tx3)' }}>LEN</span>
                {Math.round(o.lengthM)}m
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'var(--tx3)' }}>TRN</span>
                {o.turns}
              </span>
              <span style={{ marginLeft: 'auto', color: 'var(--tx3)' }}>{o.effort}</span>
            </div>
          </div>
        ))}

        {!options.length && (
          <div style={{ padding: '26px 16px', textAlign: 'center', fontFamily: FONT_MONO, fontSize: 11, color: 'var(--tx3)', lineHeight: 1.7 }}>
            NO CORRIDOR ACROSS<br />THE OBSTACLE
          </div>
        )}

        <div style={sectionHdr}>PLANNER PRIORITIES</div>
        <div style={{ padding: '0 13px 14px', display: 'flex', flexDirection: 'column', gap: 11 }}>
          {SLIDERS.map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label htmlFor={`w-${key}`} style={{ display: 'flex', fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 1.5, color: 'var(--tx3)' }}>
                {label}
                <span style={{ marginLeft: 'auto', color: 'var(--tx)', fontWeight: 600 }}>{weights[key].toFixed(2)}</span>
              </label>
              <input
                id={`w-${key}`}
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={weights[key]}
                onChange={(e) => setWeights({ ...weights, [key]: +e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 'none', borderTop: '1px solid var(--bd)', padding: '9px 13px', background: 'var(--bg2)', display: 'flex', justifyContent: 'space-between', fontFamily: FONT_MONO, fontSize: 9, color: 'var(--tx3)', letterSpacing: 1 }}>
        <span>A* CORRIDOR SEARCH</span>
        <span style={{ color: 'var(--gn)' }}>{solveMs} ms</span>
      </div>
    </div>
  );
}
