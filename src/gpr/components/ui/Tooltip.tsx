import { cssVar, FONT_MONO } from '@/gpr/lib/theme';
import type { TooltipData } from '@/gpr/lib/types';

const OFFSET = 14;

export default function Tooltip({ data, containerWidth }: { data: TooltipData | null; containerWidth: number }) {
  if (!data) return null;
  const flip = data.x > containerWidth / 2;
  return (
    <div
      style={{
        position: 'absolute',
        top: data.y + OFFSET,
        left: flip ? undefined : data.x + OFFSET,
        right: flip ? containerWidth - data.x + OFFSET : undefined,
        pointerEvents: 'none',
        background: cssVar('surface'),
        border: `1px solid ${cssVar('border')}`,
        borderRadius: 6,
        boxShadow: `0 4px 14px ${cssVar('shadow')}`,
        padding: '6px 9px',
        fontSize: 11,
        lineHeight: 1.55,
        zIndex: 5,
        whiteSpace: 'nowrap',
      }}
    >
      {data.rows.map(([label, value]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
          <span style={{ color: cssVar('inkSecondary') }}>{label}</span>
          <span style={{ color: cssVar('ink'), fontFamily: FONT_MONO }}>{value}</span>
        </div>
      ))}
    </div>
  );
}
