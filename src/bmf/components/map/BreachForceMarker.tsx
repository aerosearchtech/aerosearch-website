'use client';

import { ForceIcon } from '@/bmf/components/icons/ForceIcons';
import { FONT_MONO, FONT_SANS } from '@/bmf/lib/theme';
import type { BreachForce } from '@/bmf/lib/constants';
import type { Point } from '@/bmf/lib/types';

/** Half-width reserved for the label, so it never runs off the map edge. */
const HALF_W_PX = 118;

/**
 * The force staged at the lane entry, sized to the corridor the operator chose:
 * a 3 m lane only passes infantry in file, 9 m passes armour two-way.
 */
export default function BreachForceMarker({
  at,
  force,
  widthM,
  color,
  mapW,
}: {
  at: Point;
  force: BreachForce;
  widthM: number;
  color: string;
  mapW: number;
}) {
  const left = Math.min(Math.max(at.x, HALF_W_PX + 8), Math.max(HALF_W_PX + 8, mapW - HALF_W_PX - 8));

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top: at.y,
        width: HALF_W_PX * 2,
        marginLeft: -HALF_W_PX,
        transform: 'translateY(-100%)',
        paddingBottom: 16,
        zIndex: 7,
        pointerEvents: 'none',
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'flex', gap: 5, justifyContent: 'center', alignItems: 'flex-end' }}>
        {force.icons.map((k, i) => (
          <ForceIcon key={`${k}-${i}`} kind={k} size={k === 'soldier' ? 16 : 22} color={color} />
        ))}
      </div>
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 1,
          color,
          marginTop: 2,
          textShadow: '0 0 6px var(--bg0)',
        }}
      >
        {widthM} m · {force.label}
      </div>
      <div
        style={{
          fontFamily: FONT_SANS,
          fontSize: 10,
          color: 'var(--tx3)',
          textShadow: '0 0 6px var(--bg0)',
        }}
      >
        {force.detail}
      </div>
    </div>
  );
}
