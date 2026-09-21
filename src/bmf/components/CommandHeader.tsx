'use client';

import AeroSearchLogo from './AeroSearchLogo';
import ReportButtons from './ReportButtons';
import ThemeToggle from './ThemeToggle';
import { AO_NAME, OPERATION_NAME } from '@/bmf/lib/constants';
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
  solveMs: number;
}

export default function CommandHeader({ clockStr, statusText, statusColor, solveMs }: Props) {
  const setSeed = useGcs((s) => s.setSeed);
  const setPreflight = useGcs((s) => s.setPreflight);
  const seed = useGcs((s) => s.seed);

  return (
    <div style={{ height: 58, flex: 'none', background: 'var(--bg2)', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <AeroSearchLogo size={30} />
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
          {OPERATION_NAME} · <span style={{ color: 'var(--tx2)' }}>{AO_NAME}</span>
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
        <div style={{ fontSize: 12, fontWeight: 600, fontFamily: FONT_MONO, color: 'var(--tl)' }}>{solveMs} ms</div>
      </div>

      <button onClick={() => setPreflight(true)} style={btn} title="Mission planning and pre-flight">
        ◈ PRE-FLIGHT
      </button>
      <button onClick={() => setSeed(Math.floor(Math.random() * 1e8) + 1)} style={btn} title={`Current seed ${seed}`}>
        ⟳ NEW FIELD
      </button>
      <ReportButtons />
      <ThemeToggle />

      <div style={{ width: 1, height: 30, background: 'var(--bd)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 30, height: 30, border: '1px solid var(--bd2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--am)', fontFamily: FONT_MONO }}>AX</div>
        <div style={{ lineHeight: 1.25 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>Cdr. Alex</div>
          <div style={{ fontSize: 9, color: 'var(--tx3)', fontFamily: FONT_MONO, letterSpacing: 1 }}>EOD-LEAD · CL-0427</div>
        </div>
      </div>
    </div>
  );
}
