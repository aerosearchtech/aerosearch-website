"use client";

import { COLORS } from "@/drishti/theme/colors";

type Status =
  | "ACTIVE"
  | "STANDBY"
  | "FAULT"
  | "TRACK"
  | "COASTING"
  | "LOST"
  | "RTH"
  | "RECOVERING";

const MAP: Record<Status, [string, string, string]> = {
  ACTIVE: [COLORS.green, COLORS.greenBg, COLORS.greenBd],
  TRACK: [COLORS.green, COLORS.greenBg, COLORS.greenBd],
  RECOVERING: [COLORS.green, COLORS.greenBg, COLORS.greenBd],
  STANDBY: [COLORS.blue, COLORS.blueBg, COLORS.blueBd],
  COASTING: [COLORS.amber, COLORS.amberBg, COLORS.amberBd],
  RTH: [COLORS.amber, COLORS.amberBg, COLORS.amberBd],
  FAULT: [COLORS.red, COLORS.redBg, COLORS.redBd],
  LOST: [COLORS.red, COLORS.redBg, COLORS.redBd],
};

export function SBadge({ s }: { s: Status }) {
  const [c, bg, bd] = MAP[s] ?? MAP.STANDBY;
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "8px",
        fontWeight: 700,
        letterSpacing: "0.06em",
        color: c,
        background: bg,
        border: `1px solid ${bd}`,
        padding: "1px 6px",
      }}
    >
      {s}
    </span>
  );
}
