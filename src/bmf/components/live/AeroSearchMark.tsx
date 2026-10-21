interface Props {
  size?: number;
  color?: string;
}

/**
 * AeroSearch mark: the chevron, wings and centre dot of the brand logo.
 *
 * Taken from webpages/aerosearch/public/logos/aerosearch "open file all logo-03/06"
 * (the same glyph, black / white), with the viewBox cropped to the glyph. Filled with
 * the theme text colour so dark mode shows logo-06's white mark and light mode logo-03's.
 */
export default function AeroSearchMark({ size = 20, color = 'var(--tx)' }: Props) {
  return (
    <svg width={size} height={size} viewBox="181.5 180 164 164" fill={color} aria-label="AeroSearch">
      <polygon points="209.72 285.03 263.87 203.05 317.51 285.62 306.32 280.14 263.62 234.05 220.48 279.93 209.72 285.03" />
      <polygon points="184.47 320.86 196.76 301.41 247.15 277.72 236.71 294.34 184.47 320.86" />
      <polygon points="279.47 277.95 290.61 294.75 342.51 320.84 329.89 301.26 279.47 277.95" />
      <circle cx="263.15" cy="272.04" r="8" />
    </svg>
  );
}
