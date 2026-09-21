import { FONT_MONO } from '@/bmf/lib/theme';

/** Column heading, matching the section headers used across the console. */
export const colHdr: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: 2,
  color: 'var(--tx3)',
  fontFamily: FONT_MONO,
  padding: '11px 14px 9px',
  borderBottom: '1px solid var(--bd)',
};

export const col: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid var(--bd)',
  background: 'var(--bg0)',
};

/** Label/value line. */
export const kv: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 12,
  fontFamily: FONT_MONO,
  fontSize: 11,
};

export const kvLabel: React.CSSProperties = { color: 'var(--tx3)', letterSpacing: 1 };
