import { colors } from "@/theme/colors";

/** Suspected hazardous areas over surveyed ground. Modelled, not real data. */
const HOTSPOTS = [
  { x: 62, y: 58, r: 15 },
  { x: 128, y: 104, r: 22 },
  { x: 208, y: 46, r: 12 },
  { x: 252, y: 128, r: 26 },
  { x: 320, y: 74, r: 17 },
  { x: 358, y: 148, r: 13 },
  { x: 168, y: 166, r: 10 },
] as const;

export default function TerrainMap() {
  return (
    <svg
      viewBox="0 0 400 200"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      aria-hidden
    >
      <defs>
        <pattern id="tm-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0v20" fill="none" stroke={colors.line} strokeWidth="0.6" />
        </pattern>
      </defs>

      <rect width="400" height="200" fill={colors.night} />
      <rect width="400" height="200" fill="url(#tm-grid)" />

      {/* Contamination: concentric contours, densest at the core. */}
      {HOTSPOTS.map((h, i) => (
        <g key={i}>
          {[1, 0.68, 0.38].map((k, j) => (
            <circle
              key={j}
              cx={h.x}
              cy={h.y}
              r={h.r * k}
              fill="none"
              stroke={colors.signal}
              strokeWidth="0.9"
              opacity={0.16 + j * 0.14}
            />
          ))}
          <circle cx={h.x} cy={h.y} r="1.8" fill={colors.signal}>
            <animate
              attributeName="opacity"
              values="0.45;1;0.45"
              dur={`${2.6 + i * 0.35}s`}
              repeatCount="indefinite"
            />
          </circle>
        </g>
      ))}

      {/* Survey pass working across the area. */}
      <line x1="0" y1="0" x2="0" y2="200" stroke={colors.survey} strokeWidth="1.2" opacity="0.5">
        <animate attributeName="x1" values="-10;410" dur="11s" repeatCount="indefinite" />
        <animate attributeName="x2" values="-10;410" dur="11s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}
