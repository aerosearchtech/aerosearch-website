"use client";

import { COLORS } from "@/drishti/theme/colors";
import { useStore } from "@/drishti/state/store";
import { MissionTimeline } from "../planner/MissionTimeline";
import { PreflightChecklist, isSwarmReady } from "../planner/PreflightChecklist";
import { ContingencyMatrix } from "../planner/ContingencyMatrix";
import { ROEForm } from "../planner/ROEForm";
import { ResourceBudget } from "../planner/ResourceBudget";
import { MissionPlanner } from "../planner/MissionPlanner";

export function MissionWorkspace() {
  const uavs = useStore((s) => s.uavs);
  const ready = isSwarmReady(uavs);

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        background: COLORS.bg,
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <Card title="Mission Timeline & Controls">
        <MissionTimeline canStart={ready} />
      </Card>

      <Card title="Pre-flight Checklist" badge={ready ? "READY" : "HOLD"} badgeOk={ready}>
        <PreflightChecklist uavs={uavs} />
      </Card>

      <Card title="Plan · Map · Waypoints · Sectors" noPad>
        <MissionPlanner />
      </Card>

      <Card title="Contingency Matrix">
        <ContingencyMatrix />
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <Card title="Rules of Engagement (ROE)">
          <ROEForm />
        </Card>
        <Card title="Resource Budget · Endurance Projection">
          <ResourceBudget uavs={uavs} />
        </Card>
      </div>
    </div>
  );
}

function Card({
  title,
  badge,
  badgeOk,
  noPad,
  children,
}: {
  title: string;
  badge?: string;
  badgeOk?: boolean;
  noPad?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.bdDim}` }}>
      <div
        style={{
          padding: "5px 12px",
          background: "#040a07",
          borderBottom: `1px solid ${COLORS.bdDim}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "var(--font-cond)",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.18em",
          color: COLORS.txtLo,
          textTransform: "uppercase",
        }}
      >
        <span>{title}</span>
        {badge && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              padding: "2px 8px",
              background: badgeOk ? COLORS.greenBg : COLORS.amberBg,
              color: badgeOk ? COLORS.green : COLORS.amber,
              border: `1px solid ${badgeOk ? COLORS.bdHi : COLORS.amberBd}`,
              letterSpacing: "0.12em",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div style={{ padding: noPad ? "0" : "10px 12px" }}>{children}</div>
    </div>
  );
}
