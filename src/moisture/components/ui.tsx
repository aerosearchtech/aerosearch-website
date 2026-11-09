import type { ReactNode } from 'react';
import { toneVar, type Tone } from '../lib/theme';

export function KV({ k, v, tone }: { k: string; v: ReactNode; tone?: Tone }) {
  return (
    <div className="m-kv">
      <span>{k}</span>
      <span style={tone ? { color: toneVar(tone) } : undefined}>{v}</span>
    </div>
  );
}

export function Stat({ label, children, tone }: { label: string; children: ReactNode; tone?: Tone }) {
  const color = tone ? toneVar(tone) : undefined;
  return (
    <div className="m-stat">
      <span className="m-label" style={{ color }}>{label}</span>
      <span className="m-num" style={{ fontSize: 30, lineHeight: 1, color }}>{children}</span>
    </div>
  );
}

export const Unit = ({ children }: { children: ReactNode }) => (
  <span style={{ fontSize: '0.55em', color: 'var(--mute)', letterSpacing: 0 }}>{children}</span>
);

/** Green tick line for a passed integrity check. */
export const Check = ({ children }: { children: ReactNode }) => (
  <span className="m-mono" style={{ fontSize: 12, color: 'var(--ok)' }}>✓ {children}</span>
);
