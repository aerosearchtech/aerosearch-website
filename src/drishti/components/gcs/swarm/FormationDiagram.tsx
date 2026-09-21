"use client";

import { COLORS, DRONE_COLORS } from "@/drishti/theme/colors";
import type { UAV } from "@/drishti/types/uav";
import type { Formation } from "@/drishti/types/mission";

const POS: Record<Formation, [number, number][]> = {
  WEDGE: [[50, 8], [20, 38], [80, 38], [6, 76], [94, 76]],
  "LINE-ABREAST": [[7, 50], [26, 50], [50, 50], [74, 50], [93, 50]],
  CIRCULAR: [[50, 5], [90, 34], [74, 82], [26, 82], [10, 34]],
  DIAMOND: [[50, 5], [6, 46], [94, 46], [50, 90], [50, 48]],
};

const LINKS: [number, number][] = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4]];

export function FormationDiagram({ formation, uavs }: { formation: Formation; uavs: UAV[] }) {
  const positions = POS[formation];
  return (
    <svg viewBox="0 0 100 90" style={{ width: "100%", height: "60px", display: "block" }}>
      <rect width="100" height="90" fill={COLORS.bg} />
      <line x1="50" y1="88" x2="50" y2="2" stroke="#0c2018" strokeWidth="0.5" strokeDasharray="3,4" />
      <polygon points="50,1 47,7 53,7" fill="#0c2018" />
      <text x="52" y="6" fill="#1a4025" fontSize="4" fontFamily="IBM Plex Mono">N</text>
      {LINKS.map(([a, b], i) => {
        const pa = positions[a];
        const pb = positions[b];
        if (!pa || !pb) return null;
        const q = Math.min(uavs[a]?.signal ?? 0, uavs[b]?.signal ?? 0);
        const stroke = q > 70 ? "#006030" : q > 40 ? "#604000" : "#500010";
        return <line key={i} x1={pa[0]} y1={pa[1]} x2={pb[0]} y2={pb[1]} stroke={stroke} strokeWidth="0.7" opacity="0.8" />;
      })}
      {positions.map(([x, y], i) => {
        const uav = uavs[i];
        const col = !uav
          ? "#1a3020"
          : uav.status === "ACTIVE"
            ? (DRONE_COLORS[i] ?? COLORS.green)
            : uav.status === "FAULT"
              ? COLORS.red
              : uav.status === "RTH"
                ? COLORS.amber
                : COLORS.blue;
        return (
          <g key={i} transform={`translate(${x},${y})`}>
            <polygon points="0,-5 -3.5,3 3.5,3" fill={col + "22"} stroke={col} strokeWidth="1" />
            <text x="4" y="2" fill={col} fontSize="4" fontFamily="IBM Plex Mono" style={{ userSelect: "none" }}>
              K{i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
