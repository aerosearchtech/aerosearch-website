// Small pieces shared by the three bottom panels, so each phase's panel stays
// a layout file rather than a pile of repeated styling.

import { FONT_MONO } from '@/bmf/lib/theme';
import type { BarRow } from '@/bmf/lib/derive';

export const panelHdr: React.CSSProperties = {
  height: 28,
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  padding: '0 14px',
  borderBottom: '1px solid var(--bd)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 2,
  color: 'var(--tx2)',
};

export function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ flex: 1, border: '1px solid var(--bd)', padding: '8px 10px' }}>
      <div style={{ fontSize: 9, letterSpacing: 1.5, color: 'var(--tx3)', fontFamily: FONT_MONO }}>{label}</div>
      <div style={{ fontSize: 21, fontWeight: 700, fontFamily: FONT_MONO, color }}>{value}</div>
    </div>
  );
}

export function BarList({ rows, labelW = 92 }: { rows: BarRow[]; labelW?: number }) {
  return (
    <div style={{ flex: 1, padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9 }}>
      {rows.map((r) => (
        <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: r.color, width: labelW, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {r.label}
          </span>
          <div style={{ flex: 1, height: 7, background: 'var(--bg3)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, width: r.width, background: r.color, transition: 'width .2s linear' }} />
          </div>
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: r.color, width: 34, textAlign: 'right' }}>
            {r.detail}
          </span>
        </div>
      ))}
      {!rows.length && <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: 'var(--tx3)' }}>nothing to show</div>}
    </div>
  );
}

export function LogList({ lines }: { lines: { time: string; text: string; color: string }[] }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0', minHeight: 0 }}>
      {lines.map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '4px 14px', fontFamily: FONT_MONO, fontSize: 11 }}>
          <span style={{ color: 'var(--tx3)', flex: 'none' }}>{e.time}</span>
          <span style={{ width: 6, height: 6, background: e.color, flex: 'none', transform: 'translateY(1px)' }} />
          <span style={{ color: 'var(--tx2)' }}>{e.text}</span>
        </div>
      ))}
      {!lines.length && (
        <div style={{ padding: '14px', fontFamily: FONT_MONO, fontSize: 11, color: 'var(--tx3)' }}>awaiting first solve…</div>
      )}
    </div>
  );
}
