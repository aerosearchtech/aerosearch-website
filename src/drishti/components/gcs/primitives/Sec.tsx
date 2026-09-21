"use client";

import { COLORS } from "@/drishti/theme/colors";
import type { ReactNode } from "react";

interface Props {
  title: string;
  badge?: string;
  children: ReactNode;
  flex?: boolean;
  noPad?: boolean;
}

export function Sec({ title, badge, children, flex, noPad }: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: flex ? "1" : "none",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "5px 10px 4px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#040a07",
          borderTop: `1px solid ${COLORS.bdDim}`,
          borderBottom: `1px solid ${COLORS.bdDim}`,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-cond)",
            fontWeight: 700,
            fontSize: "10px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: COLORS.txtLo,
          }}
        >
          {title}
        </span>
        {badge && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "8px",
              color: COLORS.green,
              background: COLORS.greenBg,
              border: `1px solid ${COLORS.greenBd}`,
              padding: "1px 5px",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div
        style={{
          padding: noPad ? "0" : "6px 8px",
          flex: flex ? "1" : "none",
          overflowY: flex ? "auto" : "visible",
          overflowX: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
