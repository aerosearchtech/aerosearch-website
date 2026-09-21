// Symbol set for the breaching force and the neutralisation flight. Simple
// silhouettes rather than full APP-6 symbology — they read at 16–20 px.

export type ForceIconKind = 'soldier' | 'apc' | 'tank' | 'artillery';

interface Props {
  size?: number;
  color: string;
}

export function ForceIcon({ kind, size = 18, color }: Props & { kind: ForceIconKind }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: color };
  switch (kind) {
    case 'soldier':
      return (
        <svg {...common}>
          <circle cx="12" cy="4.6" r="2.6" />
          <path d="M8.4 8.4h7.2l1.5 6.2h-2.1l-.5-2.4V21h-2.1v-5.4h-1.2V21H9.1v-8.8l-.5 2.4H6.5z" />
        </svg>
      );
    case 'apc':
      return (
        <svg {...common}>
          <path d="M2 13.5h14.4l3.2-3.6H21l1 3.6v3.2H2z" />
          <circle cx="6" cy="18.4" r="2.1" />
          <circle cx="12" cy="18.4" r="2.1" />
          <circle cx="18" cy="18.4" r="2.1" />
          <rect x="8" y="6.6" width="6.6" height="3.4" rx="0.6" />
        </svg>
      );
    case 'tank':
      return (
        <svg {...common}>
          <rect x="1.6" y="14.4" width="20.8" height="5.2" rx="2.6" />
          <path d="M4 9.8h11.6v4.2H4z" />
          <rect x="7.6" y="6.4" width="5.8" height="3.6" rx="0.8" />
          <rect x="12.8" y="7.4" width="9.6" height="1.6" rx="0.8" />
        </svg>
      );
    case 'artillery':
      return (
        <svg {...common}>
          <circle cx="7" cy="17.6" r="3.2" />
          <circle cx="15.4" cy="17.6" r="2.4" />
          <path d="M3.4 13.8h13.2v2.6H3.4z" />
          <rect
            x="9"
            y="4.2"
            width="12.6"
            height="2.2"
            rx="1.1"
            transform="rotate(28 9 4.2)"
          />
        </svg>
      );
  }
}

/** Quadrotor carrying a slung demolition charge. */
export function DroneIcon({ size = 20, color }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7}>
      <path d="M5.6 5.6l4.4 4.4M18.4 5.6l-4.4 4.4M5.6 18.4l4.4-4.4M18.4 18.4l-4.4-4.4" strokeLinecap="round" />
      <circle cx="4.6" cy="4.6" r="2.4" />
      <circle cx="19.4" cy="4.6" r="2.4" />
      <circle cx="4.6" cy="19.4" r="2.4" />
      <circle cx="19.4" cy="19.4" r="2.4" />
      <rect x="9.4" y="9.4" width="5.2" height="5.2" rx="1.2" fill={color} stroke="none" />
    </svg>
  );
}
