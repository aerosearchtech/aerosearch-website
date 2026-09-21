"use client";

import { COLORS } from "@/drishti/theme/colors";

const toRad = (a: number) => (a * Math.PI) / 180;

export function DrishtiLogo() {
  const g = COLORS.green;
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="16" stroke={g} strokeWidth="0.8" opacity="0.4" />
      <circle cx="18" cy="18" r="11" stroke={g} strokeWidth="0.6" opacity="0.3" />
      <circle cx="18" cy="18" r="6" stroke={g} strokeWidth="0.8" opacity="0.5" />
      <line x1="18" y1="18" x2="30" y2="5" stroke={g} strokeWidth="1.2" opacity="0.9" />
      <circle cx="18" cy="18" r="3.5" fill={g} opacity="0.15" stroke={g} strokeWidth="1" />
      <circle cx="18" cy="18" r="1.5" fill={g} opacity="0.9" />
      {([[18, 4], [30, 12], [26, 28], [10, 28], [6, 12]] as const).map(([x, y], i) => (
        <polygon
          key={i}
          points={`${x},${y - 3.5} ${x - 2.5},${y + 2} ${x + 2.5},${y + 2}`}
          fill={`${g}22`}
          stroke={g}
          strokeWidth="0.8"
          opacity="0.7"
        />
      ))}
      {[0, 90, 180, 270].map((deg) => {
        const r = toRad(deg - 90);
        const x1 = 18 + 13 * Math.cos(r);
        const y1 = 18 + 13 * Math.sin(r);
        const x2 = 18 + 16 * Math.cos(r);
        const y2 = 18 + 16 * Math.sin(r);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={g} strokeWidth="0.8" opacity="0.5" />;
      })}
    </svg>
  );
}
