import { BRAND_BLUE } from '@/bmf/lib/theme';

interface Props {
  size?: number;
  color?: string;
}

/** Aerosearch symbol from the supplied logo artwork. */
export default function AeroSearchLogo({ size = 20, color = BRAND_BLUE }: Props) {
  return (
    <svg width={size} height={size} viewBox="46 230 84 64" aria-label="AeroSearch">
      <g fill={color}>
        <polygon points="60.86 273.49 87.92 232.52 114.73 273.78 109.14 271.04 87.8 248.01 66.24 270.94 60.86 273.49" />
        <polygon points="48.25 291.39 54.39 281.67 79.57 269.84 74.35 278.14 48.25 291.39" />
        <polygon points="95.72 269.95 101.29 278.35 127.22 291.38 120.92 281.6 95.72 269.95" />
        <circle cx="87.56" cy="267" r="4" />
      </g>
    </svg>
  );
}
