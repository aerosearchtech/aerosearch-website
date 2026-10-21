// Shared pieces of the live mission rail, styled like the planner's rails.

import { FONT_MONO } from '@/bmf/lib/theme';

export const RAIL_W = 296;

/** A rail that floats over the right side of the map. */
export const rail: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  zIndex: 1,
  width: RAIL_W,
  background: 'var(--bg1)',
  borderLeft: '1px solid var(--bd)',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
};

export const railBody: React.CSSProperties = { flex: 1, overflowY: 'auto', minHeight: 0 };

export const smallBtn: React.CSSProperties = {
  padding: '3px 8px',
  background: 'var(--bg3)',
  border: '1px solid var(--bd2)',
  color: 'var(--tx)',
  fontFamily: FONT_MONO,
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: 1,
  cursor: 'pointer',
};

export function RailHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div style={{ height: 34, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '0 13px', borderBottom: '1px solid var(--bd)', background: 'var(--bg2)' }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, color: 'var(--tx)' }}>{title}</span>
      {right}
    </div>
  );
}

export function Section({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 13px 7px', fontSize: 9, letterSpacing: 2, color: 'var(--tx3)', fontFamily: FONT_MONO }}>
      <span>{title}</span>
      {right}
    </div>
  );
}

export function Row({ label, value, color = 'var(--tx)' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '0 13px', fontFamily: FONT_MONO, fontSize: 10, lineHeight: '19px', color: 'var(--tx3)' }}>
      <span>{label}</span>
      <span style={{ color, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

/** Formats an optional number, '—' when the drone has not sent it yet. */
export const num = (v: number | null | undefined, digits: number, unit = ''): string =>
  v === null || v === undefined ? '—' : `${v.toFixed(digits)}${unit}`;
