'use client';

import { CROP_KINDS, CROP_LABEL, MINE_CLASS_COLOR, MINE_CLASS_LABEL } from '@/bmf/lib/live/constants';
import type { LiveMine } from '@/bmf/lib/live/types';
import { cropUrl } from '@/bmf/lib/live/useDetections';
import { useGcs } from '@/bmf/lib/store';
import { FONT_MONO } from '@/bmf/lib/theme';

const row = (label: string, value: string): React.ReactNode => (
  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontFamily: FONT_MONO, fontSize: 10 }}>
    <span style={{ color: 'var(--tx3)', letterSpacing: 1 }}>{label}</span>
    <span style={{ color: 'var(--tx2)' }}>{value}</span>
  </div>
);

/** Bottom strip for the selected live detection: the same ground patch in each camera channel. */
export default function LiveChannels({ run, mine }: { run: string; mine: LiveMine }) {
  const select = useGcs((s) => s.selectLiveMine);
  const color = `var(--${MINE_CLASS_COLOR[mine.class]})`;

  return (
    <div style={{ flex: 'none', height: 196, background: 'var(--bg1)', borderTop: '1px solid var(--bd2)', display: 'flex', flexDirection: 'column', minHeight: 0, animation: 'clmRise .22s ease' }}>
      <div style={{ height: 30, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderBottom: '1px solid var(--bd)', background: 'linear-gradient(90deg,var(--amWash),transparent)' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'var(--am)' }}>▣ CAMERA CHANNELS</span>
        <button
          onClick={() => select(null)}
          style={{ background: 'none', border: '1px solid var(--bd2)', color: 'var(--tx2)', fontFamily: FONT_MONO, fontSize: 10, padding: '3px 9px', cursor: 'pointer', letterSpacing: 1 }}
        >
          ✕ CLOSE
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ width: 236, flex: 'none', borderRight: '1px solid var(--bd)', padding: '11px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
            <span style={{ width: 12, height: 12, background: color, transform: 'rotate(45deg)', flex: 'none' }} />
            <span style={{ fontSize: 15, fontWeight: 700, color }}>{MINE_CLASS_LABEL[mine.class]}</span>
          </div>
          {row('CONFIDENCE', `${Math.round(mine.conf * 100)}%`)}
          {row('SEEN IN', `${mine.sightings} FRAMES`)}
          {row('CROP FRAME', `#${mine.frame}`)}
          {row('LAT', mine.lat.toFixed(7))}
          {row('LON', mine.lon.toFixed(7))}
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 9, padding: '10px 13px' }}>
          {CROP_KINDS.map((k) => (
            <div key={k} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, letterSpacing: 1, color: 'var(--tx3)' }}>{CROP_LABEL[k]}</span>
              <div style={{ flex: 1, minHeight: 0, border: '1px solid var(--bd)', background: 'var(--bg0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {mine.crops.includes(k) ? (
                  // eslint-disable-next-line @next/next/no-img-element -- crop served by live_view.py
                  <img src={cropUrl(run, mine.id, k)} alt={`${CROP_LABEL[k]} crop`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 1, color: 'var(--tx3)' }}>OUTSIDE THERMAL VIEW</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
