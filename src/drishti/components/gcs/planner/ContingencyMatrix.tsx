"use client";

import { COLORS } from "@/drishti/theme/colors";
import { CONTINGENCIES } from "@/drishti/data/contingencies";

const SEV_COL = {
  INFO: COLORS.txtMid,
  WARN: COLORS.amber,
  CRITICAL: COLORS.red,
};

export function ContingencyMatrix() {
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "140px 110px 1fr",
          gap: "8px",
          padding: "5px 8px",
          borderBottom: `1px solid ${COLORS.bdMid}`,
          fontFamily: "var(--font-mono)",
          fontSize: "8px",
          color: COLORS.txtLo,
          letterSpacing: "0.12em",
        }}
      >
        <span>TRIGGER</span>
        <span>ACTION</span>
        <span>DETAIL</span>
      </div>
      {CONTINGENCIES.map((c) => (
        <div
          key={c.id}
          style={{
            display: "grid",
            gridTemplateColumns: "140px 110px 1fr",
            gap: "8px",
            padding: "6px 8px",
            borderBottom: `1px solid ${COLORS.bdDim}`,
            alignItems: "start",
          }}
        >
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: SEV_COL[c.severity], fontWeight: 600 }}>
              {c.trigger}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: COLORS.txtLo, marginTop: "1px" }}>
              {c.triggerDetail}
            </div>
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 700,
              color: COLORS.green,
              padding: "2px 6px",
              border: `1px solid ${COLORS.bdHi}`,
              background: COLORS.greenBg,
              alignSelf: "start",
            }}
          >
            {c.action}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: COLORS.txtMid, lineHeight: 1.5 }}>
            {c.actionDetail}
          </div>
        </div>
      ))}
    </div>
  );
}
