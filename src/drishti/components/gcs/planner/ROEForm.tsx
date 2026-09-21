"use client";

import { COLORS } from "@/drishti/theme/colors";
import { useStore } from "@/drishti/state/store";

export function ROEForm() {
  const roe = useStore((s) => s.roe);
  const setROE = useStore((s) => s.setROE);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <Row label="RCS ≥">
        <NumInput value={roe.engageRcsMin} step={0.05} onChange={(v) => setROE({ engageRcsMin: v })} unit="m²" />
      </Row>
      <Row label="SPEED ≥">
        <NumInput value={roe.engageSpeedMin} step={1} onChange={(v) => setROE({ engageSpeedMin: v })} unit="m/s" />
      </Row>
      <Row label="THREAT ≥">
        <NumInput value={roe.engageScoreMin} step={0.05} onChange={(v) => setROE({ engageScoreMin: v })} unit="(0–1)" />
      </Row>
      <Row label="CONFIRM REQ">
        <Toggle on={roe.confirmRequired} onChange={(v) => setROE({ confirmRequired: v })} />
      </Row>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: COLORS.txtLo, marginTop: "4px", lineHeight: 1.4 }}>
        Tracks below thresholds → MONITOR. Above → ENGAGE flagged in ASP. Confirm-required holds engagement for operator clearance.
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: "8px", alignItems: "center" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: COLORS.txtLo, letterSpacing: "0.1em" }}>
        {label}
      </span>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, step, unit }: { value: number; onChange: (v: number) => void; step: number; unit: string }) {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(Number.parseFloat(e.target.value) || 0)}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          padding: "3px 6px",
          width: "60px",
          background: COLORS.bg,
          color: COLORS.txtHi,
          border: `1px solid ${COLORS.bdMid}`,
        }}
      />
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: COLORS.txtLo }}>{unit}</span>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", gap: "3px" }}>
      {([true, false] as const).map((v) => (
        <button
          key={String(v)}
          onClick={() => onChange(v)}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            padding: "3px 8px",
            background: on === v ? COLORS.greenBg : COLORS.card,
            color: on === v ? COLORS.green : COLORS.txtLo,
            border: `1px solid ${on === v ? COLORS.bdHi : COLORS.bdDim}`,
            cursor: "pointer",
          }}
        >
          {v ? "YES" : "NO"}
        </button>
      ))}
    </div>
  );
}
