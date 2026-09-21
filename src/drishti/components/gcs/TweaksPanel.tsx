"use client";

import { COLORS } from "@/drishti/theme/colors";
import { RADAR, SIM } from "@/drishti/theme/constants";
import type { Tweaks } from "@/drishti/types/tweaks";

interface Props {
  tweaks: Tweaks;
  setTweak: <K extends keyof Tweaks>(k: K, v: Tweaks[K]) => void;
  onClose: () => void;
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "3px 8px",
        fontSize: "8px",
        fontFamily: "var(--font-mono)",
        border: `1px solid ${on ? COLORS.green : COLORS.bdDim}`,
        background: on ? COLORS.greenBg : COLORS.card,
        color: on ? COLORS.green : COLORS.txtLo,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export function TweaksPanel({ tweaks, setTweak, onClose }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "60px",
        right: "20px",
        zIndex: 999,
        background: "#050e08",
        border: `1px solid ${COLORS.bdHi}`,
        width: "240px",
        boxShadow: "0 0 30px rgba(0,220,80,0.08)",
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          background: "#040a07",
          borderBottom: `1px solid ${COLORS.bdDim}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-cond)",
            fontWeight: 700,
            fontSize: "11px",
            letterSpacing: "0.15em",
            color: COLORS.txtMid,
          }}
        >
          TWEAKS
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: COLORS.txtLo,
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ padding: "10px 12px" }}>
        <Row label="Radar Theme">
          {(["green", "amber", "blue"] as const).map((t) => (
            <Chip key={t} on={tweaks.radarTheme === t} onClick={() => setTweak("radarTheme", t)}>
              {t}
            </Chip>
          ))}
        </Row>
        <Row label="Max Radar Range">
          {RADAR.rangeOptionsKm.map((r) => (
            <Chip key={r} on={tweaks.maxRangeKm === r} onClick={() => setTweak("maxRangeKm", r)}>
              {r}km
            </Chip>
          ))}
        </Row>
        <Row label="Simulation Speed">
          {SIM.speedOptions.map((s) => (
            <Chip key={s} on={tweaks.simSpeed === s} onClick={() => setTweak("simSpeed", s)}>
              {s}×
            </Chip>
          ))}
        </Row>
        <Row label="FoV Sector Arcs">
          <Chip on={tweaks.showFovArcs} onClick={() => setTweak("showFovArcs", true)}>
            On
          </Chip>
          <Chip on={!tweaks.showFovArcs} onClick={() => setTweak("showFovArcs", false)}>
            Off
          </Chip>
        </Row>
        <Row label="CI Covariance Ellipses">
          <Chip on={tweaks.showCIEllipses} onClick={() => setTweak("showCIEllipses", true)}>
            On
          </Chip>
          <Chip on={!tweaks.showCIEllipses} onClick={() => setTweak("showCIEllipses", false)}>
            Off
          </Chip>
        </Row>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div
        style={{
          fontSize: "8px",
          color: COLORS.txtLo,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: "4px",
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>{children}</div>
    </div>
  );
}
