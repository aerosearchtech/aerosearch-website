"use client";

import { COLORS } from "@/drishti/theme/colors";

export type MapLayer = "PLAIN" | "TERRAIN";

interface Props {
  view: "PPI" | "3D";
  onChange: (v: "PPI" | "3D") => void;
  layer: MapLayer;
  onLayerChange: (l: MapLayer) => void;
}

const btn = (active: boolean) => ({
  fontFamily: "var(--font-mono)" as const,
  fontSize: "9px",
  padding: "4px 14px",
  letterSpacing: "0.12em",
  background: active ? COLORS.greenBg : COLORS.card,
  color: active ? COLORS.green : COLORS.txtLo,
  border: `1px solid ${active ? COLORS.bdHi : COLORS.bdDim}`,
  cursor: "pointer" as const,
});

export function ViewToggle({ view, onChange, layer, onLayerChange }: Props) {
  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        display: "flex",
        gap: "12px",
        zIndex: 5,
      }}
    >
      <div style={{ display: "flex", gap: "1px" }}>
        {(["PLAIN", "TERRAIN"] as const).map((l) => (
          <button key={l} onClick={() => onLayerChange(l)} style={btn(layer === l)}>
            {l === "PLAIN" ? "▢ PLAIN" : "▧ TERRAIN"}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: "1px" }}>
        {(["PPI", "3D"] as const).map((v) => (
          <button key={v} onClick={() => onChange(v)} style={btn(view === v)}>
            {v === "PPI" ? "● 2D PPI" : "◆ 3D"}
          </button>
        ))}
      </div>
    </div>
  );
}
