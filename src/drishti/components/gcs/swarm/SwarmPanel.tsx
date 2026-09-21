"use client";

import { COLORS } from "@/drishti/theme/colors";
import { SWARM } from "@/drishti/theme/constants";
import { Sec } from "../primitives/Sec";
import { UAVCard } from "./UAVCard";
import { FormationDiagram } from "./FormationDiagram";
import { MANETMesh } from "./MANETMesh";
import type { UAV } from "@/drishti/types/uav";
import type { Formation } from "@/drishti/types/mission";

const FORMATIONS: Formation[] = ["WEDGE", "LINE-ABREAST", "CIRCULAR", "DIAMOND"];

interface Props {
  uavs: UAV[];
  formation: Formation;
  latencyMs: number;
  splitActive: boolean;
  onFormationChange: (f: Formation) => void;
  onFault: (id: number) => void;
  onRTH: (id: number) => void;
  onSelectDrone: (id: number) => void;
  selectedDroneId: number | null;
  onAddDrone: () => void;
  onRemoveDrone: () => void;
  onSplit: () => void;
  onMerge: () => void;
  on360: () => void;
}

export function SwarmPanel({
  uavs,
  formation,
  latencyMs,
  splitActive,
  onFormationChange,
  onFault,
  onRTH,
  onSelectDrone,
  selectedDroneId,
  onAddDrone,
  onRemoveDrone,
  onSplit,
  onMerge,
  on360,
}: Props) {
  const activeCnt = uavs.filter((u) => u.status === "ACTIVE").length;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: COLORS.panel,
        borderRight: `1px solid ${COLORS.bdDim}`,
        overflow: "hidden",
      }}
    >
      <Sec title="Swarm Status" badge={`${activeCnt}/${uavs.length} ACTIVE`} flex>
        {/* Scale controls — add / remove drone */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
          <button
            onClick={onAddDrone}
            disabled={uavs.length >= SWARM.maxSize}
            title="Add a drone to the swarm"
            style={{
              flex: 1,
              fontFamily: "var(--font-mono)",
              fontSize: "8px",
              padding: "3px 6px",
              letterSpacing: "0.1em",
              background: COLORS.card,
              color: uavs.length >= SWARM.maxSize ? COLORS.txtLo : COLORS.green,
              border: `1px solid ${uavs.length >= SWARM.maxSize ? COLORS.bdDim : COLORS.bdHi}`,
              cursor: uavs.length >= SWARM.maxSize ? "not-allowed" : "pointer",
              opacity: uavs.length >= SWARM.maxSize ? 0.4 : 1,
            }}
          >
            + ADD DRONE
          </button>
          <button
            onClick={onRemoveDrone}
            disabled={uavs.length <= SWARM.minSize}
            title="Remove the last drone"
            style={{
              flex: 1,
              fontFamily: "var(--font-mono)",
              fontSize: "8px",
              padding: "3px 6px",
              letterSpacing: "0.1em",
              background: COLORS.card,
              color: uavs.length <= SWARM.minSize ? COLORS.txtLo : COLORS.amber,
              border: `1px solid ${uavs.length <= SWARM.minSize ? COLORS.bdDim : COLORS.amberBd}`,
              cursor: uavs.length <= SWARM.minSize ? "not-allowed" : "pointer",
              opacity: uavs.length <= SWARM.minSize ? 0.4 : 1,
            }}
          >
            − REMOVE
          </button>
        </div>
        {uavs.map((u, i) => (
          <UAVCard
            key={u.id}
            uav={u}
            idx={i}
            selected={selectedDroneId === u.id}
            onClick={onSelectDrone}
            onFault={onFault}
            onRTH={onRTH}
          />
        ))}
      </Sec>

      <Sec title="Formation Control">
        <div style={{ display: "flex", gap: "3px", marginBottom: "6px", flexWrap: "wrap" }}>
          {FORMATIONS.map((f) => (
            <button
              key={f}
              onClick={() => onFormationChange(f)}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "8px",
                letterSpacing: "0.06em",
                padding: "3px 6px",
                cursor: "pointer",
                background: formation === f ? COLORS.greenBg : COLORS.card,
                color: formation === f ? COLORS.green : COLORS.txtLo,
                border: `1px solid ${formation === f ? COLORS.bdHi : COLORS.bdDim}`,
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <FormationDiagram formation={formation} uavs={uavs} />
        <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
          {(
            [
              ["SPLIT", onSplit, splitActive],
              ["MERGE", onMerge, !splitActive],
              ["360° COV", on360, formation === "CIRCULAR"],
            ] as const
          ).map(([cmd, fn, isActive]) => (
            <button
              key={cmd}
              onClick={fn}
              style={{
                flex: 1,
                fontFamily: "var(--font-mono)",
                fontSize: "8px",
                letterSpacing: "0.05em",
                padding: "4px 2px",
                cursor: "pointer",
                background: isActive ? COLORS.amberBg : COLORS.card,
                color: COLORS.amber,
                border: `1px solid ${isActive ? COLORS.amber : COLORS.amberBd}`,
              }}
            >
              {cmd}
            </button>
          ))}
        </div>
      </Sec>

      <Sec title="MANET Mesh">
        <MANETMesh uavs={uavs} latencyMs={latencyMs} />
      </Sec>
    </div>
  );
}
