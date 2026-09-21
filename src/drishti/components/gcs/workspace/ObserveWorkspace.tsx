"use client";

import { useState } from "react";
import { COLORS } from "@/drishti/theme/colors";
import { RadarPPI } from "../RadarPPI";
import { Radar3D } from "../Radar3D";
import { ViewToggle, type MapLayer } from "../ViewToggle";
import { CommandBar } from "../CommandBar";
import { ScenarioRunner } from "../scenario/ScenarioRunner";
import type { UAV } from "@/drishti/types/uav";
import type { Track } from "@/drishti/types/track";
import type { Tweaks } from "@/drishti/types/tweaks";
import type { MissionMode, Formation } from "@/drishti/types/mission";
import type { MainToWorker } from "@/drishti/sim/protocol";

const MODES: MissionMode[] = ["DETECT+TRACK", "360° COVER", "SURVEILLANCE", "STANDBY"];

interface Props {
  uavs: UAV[];
  tracks: Track[];
  view: "PPI" | "3D";
  setView: (v: "PPI" | "3D") => void;
  tweaks: Tweaks;
  // Command bar
  mode: string;
  setMode: (m: string) => void;
  radarOn: boolean;
  setRadarOn: (v: boolean) => void;
  recording: boolean;
  recordTimeSec: number;
  setRecording: (v: boolean) => void;
  gnssDenied: boolean;
  toggleGnssDeny: () => void;
  swarmMoving: boolean;
  swarmSpd: number;
  nightMode: boolean;
  setNightMode: (v: boolean) => void;
  setFormation: (f: Formation) => void;
  setTweaksVis: (v: boolean) => void;
  send: (msg: MainToWorker) => void;
}

export function ObserveWorkspace(p: Props) {
  const [layer, setLayer] = useState<MapLayer>("PLAIN");

  return (
    <>
      <div
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <ViewToggle view={p.view} onChange={p.setView} layer={layer} onLayerChange={setLayer} />
        {p.view === "PPI" ? (
          <RadarPPI
            uavs={p.uavs}
            tracks={p.tracks}
            maxRangeKm={p.tweaks.maxRangeKm}
            theme={p.tweaks.radarTheme}
            showFovArcs={p.tweaks.showFovArcs}
            showCIEllipses={p.tweaks.showCIEllipses}
            terrain={layer === "TERRAIN"}
          />
        ) : (
          <Radar3D uavs={p.uavs} tracks={p.tracks} maxRangeKm={p.tweaks.maxRangeKm} />
        )}
      </div>

      <div style={{ position: "relative", flexShrink: 0 }}>
        <CommandBar
          mode={p.mode}
          modes={MODES}
          onModeChange={p.setMode}
          radarOn={p.radarOn}
          onToggleRadar={() => p.setRadarOn(!p.radarOn)}
          recording={p.recording}
          recordTimeSec={p.recordTimeSec}
          onToggleRecording={() => p.setRecording(!p.recording)}
          hasReplayBuffer={false}
          onOpenReplay={() => {
            /* Phase E */
          }}
          gnssDenied={p.gnssDenied}
          onToggleGnssDeny={() => {
            p.toggleGnssDeny();
            p.send({ kind: "TOGGLE_GNSS_DENY" });
          }}
          swarmMoving={p.swarmMoving}
          swarmSpd={p.swarmSpd}
          onToggleMoving={() => p.send({ kind: "TOGGLE_MOVING" })}
          nightMode={p.nightMode}
          onToggleNight={() => p.setNightMode(!p.nightMode)}
          on360={() => {
            p.setFormation("CIRCULAR");
            p.setMode("360° COVER");
          }}
          onRTHAll={() => {
            p.send({ kind: "RTH_ALL" });
            p.setMode("RTH");
          }}
          leading={
            <>
              <ScenarioRunner send={p.send} />
              <button
                onClick={() => p.setTweaksVis(true)}
                style={{
                  padding: "5px 12px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  letterSpacing: "0.1em",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: COLORS.txtMid,
                  background: COLORS.card,
                  border: `1px solid ${COLORS.bdMid}`,
                  cursor: "pointer",
                }}
              >
                ⚙ TWEAKS
              </button>
            </>
          }
        />
      </div>
    </>
  );
}
