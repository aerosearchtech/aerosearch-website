"use client";

import { COLORS } from "@/drishti/theme/colors";
import type { Alert } from "@/drishti/types/alert";

const COL: Record<Alert["sev"], string> = {
  CRITICAL: COLORS.red,
  WARN: COLORS.amber,
  ALERT: "#ff8040",
  INFO: COLORS.txtMid,
};

export function EventsTab({ alerts }: { alerts: Alert[] }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
      {[...alerts].reverse().map((a, i) => (
        <div
          key={`${a.time}-${i}`}
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "flex-start",
            padding: "3px 0",
            borderBottom: `1px solid ${COLORS.bdDim}`,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "8px",
              color: COLORS.txtLo,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {a.time}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "7px",
              fontWeight: 700,
              color: COL[a.sev],
              flexShrink: 0,
              letterSpacing: "0.06em",
            }}
          >
            [{a.sev}]
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "8px",
              color: COLORS.txtMid,
              lineHeight: 1.4,
            }}
          >
            {a.msg}
          </span>
        </div>
      ))}
    </div>
  );
}
