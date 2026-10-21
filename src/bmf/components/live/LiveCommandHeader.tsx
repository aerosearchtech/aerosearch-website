'use client';

import ReportButtons from '@/bmf/components/ReportButtons';
import ThemeToggle from '@/bmf/components/ThemeToggle';
import AeroSearchMark from './AeroSearchMark';
import { NO_DATA, OPERATOR_INITIALS, OPERATOR_NAME } from '@/bmf/lib/live/constants';
import { FONT_MONO, FONT_SANS } from '@/bmf/lib/theme';
import { useGcs } from '@/bmf/lib/store';

const btn: React.CSSProperties = {
  height: 34,
  padding: '0 12px',
  background: 'var(--bg3)',
  border: '1px solid var(--bd2)',
  color: 'var(--tx)',
  fontFamily: FONT_SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 1,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

interface Props {
  clockStr: string;
  statusText: string;
  statusColor: string;
  /** Solver time, or NO_DATA. */
  solve: string;
}

export default function LiveCommandHeader({ clockStr, statusText, statusColor, solve }: Props) {
  const setSeed = useGcs((s) => s.setSeed);
  const setPreflight = useGcs((s) => s.setPreflight);
  const seed = useGcs((s) => s.seed);

  return (
    <div style={{ height: 58, flex: 'none', background: 'var(--bg2)', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <AeroSearchMark size={30} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 2, lineHeight: 1 }}>
            BREACH<span style={{ color: 'var(--am)' }}>MINEFIELD</span>
          </div>
          <div style={{ fontSize: 9, letterSpacing: 2.5, color: 'var(--tx3)', fontFamily: FONT_MONO, marginTop: 2 }}>
            BREACH PLANNING SYSTEM · AEROSEARCH
          </div>
        </div>
      </div>

      <div style={{ width: 1, height: 30, background: 'var(--bd)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--tx3)', fontFamily: FONT_MONO }}>OPERATION</div>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {NO_DATA}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', border: '1px solid var(--bd2)', background: 'rgba(127,127,127,.06)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, boxShadow: `0 0 8px ${statusColor}`, animation: 'clmBlink 2s infinite' }} />
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, color: statusColor }}>{statusText}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, minWidth: 96 }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--tx3)', fontFamily: FONT_MONO }}>PLAN CLOCK · T+</div>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1, fontFamily: FONT_MONO, color: 'var(--tx)' }}>{clockStr}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, minWidth: 74 }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--tx3)', fontFamily: FONT_MONO }}>SOLVER</div>
        <div style={{ fontSize: 12, fontWeight: 600, fontFamily: FONT_MONO, color: 'var(--tl)' }}>{solve}</div>
      </div>

      {/* These act on the simulated field: kept in place, disabled until wired to drone data. */}
      <div title="No drone data yet" style={{ display: 'flex', gap: 16, opacity: 0.4, pointerEvents: 'none' }}>
        <button onClick={() => setPreflight(true)} style={btn} title="Mission planning and pre-flight">
          ◈ PRE-FLIGHT
        </button>
        <button onClick={() => setSeed(Math.floor(Math.random() * 1e8) + 1)} style={btn} title={`Current seed ${seed}`}>
          ⟳ NEW FIELD
        </button>
        <ReportButtons />
      </div>
      <ThemeToggle />

      <div style={{ width: 1, height: 30, background: 'var(--bd)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 30, height: 30, border: '1px solid var(--bd2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--am)', fontFamily: FONT_MONO }}>{OPERATOR_INITIALS}</div>
        <div style={{ lineHeight: 1.25 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{OPERATOR_NAME}</div>
          <div style={{ fontSize: 9, color: 'var(--tx3)', fontFamily: FONT_MONO, letterSpacing: 1 }}>{NO_DATA}</div>
        </div>
      </div>
    </div>
  );
}
