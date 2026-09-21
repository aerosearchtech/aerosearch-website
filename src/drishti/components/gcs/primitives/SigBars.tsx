"use client";

import { COLORS } from "@/drishti/theme/colors";

export function SigBars({ v }: { v: number }) {
  const n = 5;
  const f = Math.round((v / 100) * n);
  const c = v > 70 ? COLORS.green : v > 40 ? COLORS.amber : COLORS.red;
  return (
    <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "13px" }}>
      {Array.from({ length: n }, (_, i) => (
        <div
          key={i}
          style={{
            width: "3px",
            height: `${(i + 1) * 2 + 3}px`,
            background: i < f ? c : COLORS.bdDim,
            border: `1px solid ${i < f ? c + "66" : "#152318"}`,
          }}
        />
      ))}
    </div>
  );
}
