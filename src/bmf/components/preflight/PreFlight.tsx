'use client';

import { useEffect } from 'react';
import { AO_NAME, OPERATION_NAME } from '@/bmf/lib/constants';
import { FONT_MONO } from '@/bmf/lib/theme';
import { useGcs } from '@/bmf/lib/store';
import type { PreflightView } from '@/bmf/lib/derive';
import AoPanel from './AoPanel';
import PayloadPanel from './PayloadPanel';
import TempoPanel from './TempoPanel';

const btn: React.CSSProperties = {
  padding: '9px 18px',
  fontFamily: FONT_MONO,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1.5,
  cursor: 'pointer',
  border: '1px solid var(--bd2)',
  background: 'transparent',
  color: 'var(--tx2)',
};

/**
 * Pre-flight mission planning. A review surface rather than a gate: the console
 * opens on a committed AO, and this is where the operator changes what the
 * column needs and sees what surveying it will cost before launching.
 */
export default function PreFlight({ pf }: { pf: PreflightView }) {
  const setPreflight = useGcs((s) => s.setPreflight);
  const setSeed = useGcs((s) => s.setSeed);
  const startRun = useGcs((s) => s.startRun);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreflight(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setPreflight]);

  const launch = (): void => {
    setSeed(Math.floor(Math.random() * 1e8) + 1);
    startRun();
    setPreflight(false);
  };

  return (
    <div
      onClick={() => setPreflight(false)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        background: 'rgba(4,7,12,.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 26,
        animation: 'clmRise .18s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(1180px, 100%)',
          maxHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          background: 'var(--bg1)',
          border: '1px solid var(--bd2)',
          boxShadow: '0 24px 70px rgba(0,0,0,.55)',
        }}
      >
        <div
          style={{
            height: 44,
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 16px',
            borderBottom: '1px solid var(--bd)',
            background: 'linear-gradient(90deg,var(--amWash),transparent)',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: 'var(--am)', whiteSpace: 'nowrap' }}>
            ◈ MISSION PLANNING · PRE-FLIGHT
          </span>
          <span
            style={{
              fontSize: 10,
              fontFamily: FONT_MONO,
              color: 'var(--tx3)',
              letterSpacing: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {OPERATION_NAME} · {AO_NAME} · 43R FN 4200 6450
          </span>
          <div style={{ flex: 1 }} />
          <button onClick={() => setPreflight(false)} style={{ ...btn, padding: '5px 11px', fontSize: 10 }}>
            ✕ CLOSE
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', gap: 12, padding: 14 }}>
          <AoPanel pf={pf} />
          <PayloadPanel pf={pf} />
          <TempoPanel pf={pf} />
        </div>

        <div
          style={{
            flex: 'none',
            height: 56,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 16px',
            borderTop: '1px solid var(--bd)',
            background: 'var(--bg2)',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--gn)',
              boxShadow: '0 0 8px var(--gn)',
              flex: 'none',
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontFamily: FONT_MONO,
              letterSpacing: 1.5,
              color: 'var(--tx2)',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            CLEARED FOR LAUNCH · GNSS-DENIED CAPABLE · SINGLE-OPERATOR AUTOPILOT
          </span>
          <div style={{ flex: 1 }} />
          <button onClick={() => setPreflight(false)} style={btn}>
            ABORT
          </button>
          <button
            onClick={launch}
            style={{ ...btn, color: 'var(--bg0)', background: 'var(--am)', border: '1px solid var(--am)' }}
          >
            ▶ LAUNCH SURVEY
          </button>
        </div>
      </div>
    </div>
  );
}
