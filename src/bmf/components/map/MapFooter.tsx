'use client';

import { MINE_SPECS, MINE_TYPES, TASK_STATE_LABEL, TASK_STATE_ORDER } from '@/bmf/lib/constants';
import { FONT_MONO, PALETTES } from '@/bmf/lib/theme';
import { useGcs } from '@/bmf/lib/store';
import type { OptionCard } from '@/bmf/lib/derive';

const label: React.CSSProperties = {
  fontFamily: FONT_MONO,
  fontSize: 8,
  letterSpacing: 1.5,
  color: 'var(--tx3)',
  flex: 'none',
};

const item: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  fontFamily: FONT_MONO,
  fontSize: 9,
  color: 'var(--tx2)',
  whiteSpace: 'nowrap',
};

const rule: React.CSSProperties = { width: 1, height: 12, background: 'var(--bd)', flex: 'none' };

const key = (swatch: React.ReactNode, text: string) => (
  <span key={text} style={item}>
    {swatch}
    {text}
  </span>
);

const diamond = (color: string) => (
  <span style={{ width: 7, height: 7, background: color, transform: 'rotate(45deg)' }} />
);

const bar = (background: string, opacity = 1) => (
  <span style={{ width: 12, height: 7, background, opacity }} />
);

/** Map legend, laid along the bottom of the frame instead of over the plot. */
export default function MapFooter({ options }: { options: OptionCard[] }) {
  const s = useGcs();
  const p = PALETTES[s.theme];

  const contextual =
    s.mapLayer === 'coverage'
      ? {
          title: 'SURVEY',
          items: [
            key(bar(`rgba(${p.sweptRgb},0.75)`), 'SWEPT'),
            key(bar(`rgba(${p.unsweptRgb},0.75)`), 'UNSWEPT · RESIDUAL RISK'),
          ],
        }
      : s.phase === 'neutralise'
        ? {
            title: 'TASK',
            items: TASK_STATE_ORDER.map((st) => key(diamond(p.state[st]), TASK_STATE_LABEL[st])),
          }
        : {
            title: 'LANE',
            items: options.map((o) =>
              key(bar(o.color, o.selected ? 0.9 : 0.4), `${o.label} · ${o.tag}`),
            ),
          };

  return (
    <div
      style={{
        height: 26,
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 12px',
        background: 'var(--bg2)',
        borderTop: '1px solid var(--bd)',
        overflow: 'hidden',
      }}
    >
      <span style={label}>DEVICE</span>
      {MINE_TYPES.map((t) => key(diamond(p.mine[t]), MINE_SPECS[t].label))}

      <div style={rule} />
      <span style={label}>{contextual.title}</span>
      {contextual.items}

      <div style={{ flex: 1, minWidth: 8 }} />
      <span style={{ ...item, color: 'var(--am)', fontWeight: 700, gap: 4 }}>
        <span
          style={{
            width: 0,
            height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderBottom: '9px solid var(--am)',
          }}
        />
        N
      </span>
    </div>
  );
}
