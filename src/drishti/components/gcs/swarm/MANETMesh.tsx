"use client";

import { COLORS, DRONE_COLORS } from "@/drishti/theme/colors";
import type { UAV } from "@/drishti/types/uav";

const NODES: [number, number][] = [[50, 18], [20, 38], [80, 38], [30, 68], [70, 68]];
const LINKS: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 2],
  [1, 3],
  [2, 4],
  [3, 4],
  [0, 3],
  [0, 4],
];

export function MANETMesh({ uavs, latencyMs }: { uavs: UAV[]; latencyMs: number }) {
  return (
    <div>
      <svg viewBox="0 0 100 82" style={{ width: "100%", height: "54px", display: "block" }}>
        <rect width="100" height="82" fill={COLORS.bg} />
        {LINKS.map(([a, b], i) => {
          const pa = NODES[a];
          const pb = NODES[b];
          if (!pa || !pb) return null;
          const q = Math.min(uavs[a]?.signal ?? 0, uavs[b]?.signal ?? 0);
          const stroke = q > 70 ? COLORS.greenDim : q > 40 ? "#4a3200" : "#4a0800";
          return (
            <line
              key={i}
              x1={pa[0]}
              y1={pa[1]}
              x2={pb[0]}
              y2={pb[1]}
              stroke={stroke}
              strokeWidth={q > 70 ? 1 : 0.6}
              opacity="0.9"
            />
          );
        })}
        {NODES.map(([x, y], i) => {
          const u = uavs[i];
          const c = !u
            ? COLORS.txtLo
            : u.status === "ACTIVE"
              ? (DRONE_COLORS[i] ?? COLORS.green)
              : u.status === "FAULT"
                ? COLORS.red
                : u.status === "RTH"
                  ? COLORS.amber
                  : COLORS.blue;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="5" fill={COLORS.bg} stroke={c} strokeWidth="1" />
              <text
                x={x}
                y={y + 1.5}
                textAnchor="middle"
                fill={c}
                fontSize="4.5"
                fontFamily="IBM Plex Mono"
                fontWeight="600"
              >
                K{i + 1}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px", marginTop: "4px" }}>
        {[
          ["PROTO", "OLSR"],
          ["LATENCY", `${latencyMs}ms`],
          ["NODES", `${uavs.filter((u) => u.status !== "FAULT").length}/5`],
        ].map(([l, v]) => (
          <div key={l} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "7px", color: COLORS.txtLo, fontFamily: "var(--font-mono)" }}>{l}</div>
            <div
              style={{
                fontSize: "10px",
                color: COLORS.txtMid,
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
              }}
            >
              {v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
