'use client';

import { useEffect, useRef } from 'react';
import { drawSensor } from '@/bmf/lib/canvas/sensors';
import { FONT_MONO } from '@/bmf/lib/theme';
import { useGcs } from '@/bmf/lib/store';
import type { ChannelTile, FusionView } from '@/bmf/lib/derive';
import type { Mine } from '@/bmf/lib/types';

/** One channel tile. The canvas is repainted whenever the device changes. */
function Tile({ tile, mine }: { tile: ChannelTile; mine: Mine }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const paint = () => drawSensor(cv, tile.key, mine);
    paint();
    const ro = new ResizeObserver(paint);
    if (cv.parentElement) ro.observe(cv.parentElement);
    return () => ro.disconnect();
  }, [tile.key, mine]);

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, letterSpacing: 1, color: tile.strong ? 'var(--am)' : 'var(--tx3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {tile.label}
        </span>
        {tile.contributed && (
          <span title="contributed to the fix" style={{ fontFamily: FONT_MONO, fontSize: 8, color: 'var(--tl)', flex: 'none' }}>FIX</span>
        )}
      </div>

      <div style={{ position: 'relative', flex: 1, minHeight: 0, border: '1px solid var(--bd)', background: 'var(--bg0)' }}>
        <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ flex: 1, height: 3, background: 'var(--bg3)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, width: `${tile.pct}%`, background: tile.strong ? 'var(--am)' : 'var(--tx3)' }} />
        </div>
        <span style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, color: tile.strong ? 'var(--tx)' : 'var(--tx3)', minWidth: 26, textAlign: 'right' }}>
          {tile.pct}%
        </span>
      </div>
    </div>
  );
}

const meta = (label: string, value: string): React.ReactNode => (
  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontFamily: FONT_MONO, fontSize: 10 }}>
    <span style={{ color: 'var(--tx3)', letterSpacing: 1 }}>{label}</span>
    <span style={{ color: 'var(--tx2)' }}>{value}</span>
  </div>
);

/**
 * Bottom overlay: everything the payloads returned for one device, side by side
 * with the fused verdict. Takes the bottom strip while a device is selected —
 * the survey log and tallies behind it are context the operator does not need
 * while looking at a single fix.
 */
export default function SensorFusion({ fusion }: { fusion: FusionView }) {
  const selectMine = useGcs((s) => s.selectMine);
  const mine = useGcs((s) => s.field.mines.find((m) => m.id === s.selectedMineId));
  if (!mine) return null;

  return (
    <div style={{ flex: 'none', height: 196, background: 'var(--bg1)', borderTop: '1px solid var(--bd2)', display: 'flex', flexDirection: 'column', minHeight: 0, animation: 'clmRise .22s ease' }}>
      <div style={{ height: 30, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderBottom: '1px solid var(--bd)', background: 'linear-gradient(90deg,var(--amWash),transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'var(--am)', whiteSpace: 'nowrap' }}>▣ SENSOR FUSION</span>
          <span style={{ fontSize: 9, fontFamily: FONT_MONO, color: 'var(--tx3)', letterSpacing: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {fusion.channels.length}-CHANNEL · LATE-STAGE DECISION FUSION · REPRESENTATIVE IMAGERY
          </span>
        </div>
        <button
          onClick={() => selectMine(null)}
          style={{ background: 'none', border: '1px solid var(--bd2)', color: 'var(--tx2)', fontFamily: FONT_MONO, fontSize: 10, padding: '3px 9px', cursor: 'pointer', letterSpacing: 1, flex: 'none' }}
        >
          ✕ CLOSE
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* device card */}
        <div style={{ width: 236, flex: 'none', borderRight: '1px solid var(--bd)', padding: '11px 14px', display: 'flex', flexDirection: 'column', gap: 9, minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 12, height: 12, background: fusion.color, transform: 'rotate(45deg)', flex: 'none', boxShadow: `0 0 9px ${fusion.color}` }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fusion.model}</div>
              <div style={{ fontSize: 10, color: 'var(--tx2)', fontFamily: FONT_MONO, marginTop: 3 }}>{fusion.typeLabel}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, padding: '2px 7px', color: fusion.color, background: fusion.sevBg, border: `1px solid ${fusion.color}`, fontFamily: FONT_MONO }}>{fusion.sev}</span>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, padding: '2px 7px', color: 'var(--tx2)', border: '1px solid var(--bd2)', fontFamily: FONT_MONO }}>{fusion.short}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {meta('FIX', fusion.id)}
            {meta('GRID', fusion.grid)}
            {meta('DEPTH', fusion.depth)}
          </div>
        </div>

        {/* channel tiles */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 9, padding: '10px 13px' }}>
          {fusion.channels.map((t) => (
            <Tile key={t.key} tile={t} mine={mine} />
          ))}
        </div>

        {/* fused verdict */}
        <div style={{ width: 210, flex: 'none', borderLeft: '1px solid var(--bd)', padding: '11px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <span style={{ fontSize: 9, fontFamily: FONT_MONO, letterSpacing: 2, color: 'var(--tx3)' }}>FUSED ASSESSMENT</span>
          <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1, color: fusion.fusedColor, fontFamily: FONT_MONO }}>{fusion.fused}</div>
          <span style={{ fontSize: 9, fontFamily: FONT_MONO, color: 'var(--tx3)', letterSpacing: 1 }}>{fusion.agreement}</span>
          <div style={{ fontSize: 10, fontFamily: FONT_MONO, color: fusion.fusedColor, textAlign: 'center', lineHeight: 1.45, marginTop: 2 }}>{fusion.verdict}</div>
        </div>
      </div>
    </div>
  );
}
