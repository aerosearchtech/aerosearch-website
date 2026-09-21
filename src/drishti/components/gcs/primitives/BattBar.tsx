"use client";

import { COLORS } from "@/drishti/theme/colors";

export function BattBar({ v }: { v: number }) {
  const c = v > 40 ? COLORS.green : v > 20 ? COLORS.amber : COLORS.red;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div
        style={{
          flex: 1,
          height: "5px",
          background: "#0a1810",
          border: `1px solid ${COLORS.bdDim}`,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${v}%`,
            background: c,
            transition: "width 1s linear",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: c,
          minWidth: "32px",
          textAlign: "right",
        }}
      >
        {Math.round(v)}%
      </span>
    </div>
  );
}
