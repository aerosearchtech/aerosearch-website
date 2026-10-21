'use client';

import { panelHdr } from '../PanelChrome';
import { FONT_MONO } from '@/bmf/lib/theme';

interface Props {
  title: string;
  /** Side rail width; omitted for the bottom strip. */
  width?: number;
  side?: 'left' | 'right';
  message?: string;
}

/** Placeholder for a panel that has no drone data behind it yet. */
export default function NoData({ title, width, side = 'left', message = 'NO DATA' }: Props) {
  const rail: React.CSSProperties = width
    ? { width, [side === 'left' ? 'borderRight' : 'borderLeft']: '1px solid var(--bd)' }
    : { height: 196, borderTop: '1px solid var(--bd2)' };

  return (
    <div style={{ ...rail, flex: 'none', background: 'var(--bg1)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={panelHdr}>{title}</div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 2, color: 'var(--tx3)' }}>
        {message}
      </div>
    </div>
  );
}
