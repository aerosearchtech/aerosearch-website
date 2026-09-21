import { BRAND_BLUE } from '@/bmf/lib/theme';

interface Props {
  size?: number;
  color?: string;
}

/**
 * AeroSearch Technologies mark: four-arm rotor star.
 *
 * Traced from design/Logo_Aerosearch_Technologies.png — arm caps at r 4.5 on a
 * 100 unit box, concave flanks cutting to 27.2 from each edge. Kept as a path
 * rather than the source bitmap so it inherits the theme and stays crisp.
 */
export default function AeroSearchLogo({ size = 20, color = BRAND_BLUE }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="AeroSearch">
      <path
        d="M7.68 1.32 Q50 53.04 92.32 1.32 A4.5 4.5 0 0 1 98.68 7.68
           Q46.96 50 98.68 92.32 A4.5 4.5 0 0 1 92.32 98.68
           Q50 46.96 7.68 98.68 A4.5 4.5 0 0 1 1.32 92.32
           Q53.04 50 1.32 7.68 A4.5 4.5 0 0 1 7.68 1.32 Z"
        fill={color}
      />
    </svg>
  );
}
