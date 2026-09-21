"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { COLORS } from "@/drishti/theme/colors";
import { TopBar } from "./TopBar";
import { StatusBar } from "./StatusBar";
import { SwarmPanel } from "./swarm/SwarmPanel";
import { RightPanel } from "./right/RightPanel";
import { RangeDoppler } from "./drone/RangeDoppler";
import { TweaksPanel } from "./TweaksPanel";
import { WorkspaceSwitcher } from "./workspace/WorkspaceSwitcher";
import { ObserveWorkspace } from "./workspace/ObserveWorkspace";
import { MissionWorkspace } from "./workspace/MissionWorkspace";
import { DroneWorkspace } from "./workspace/DroneWorkspace";
import { useStore } from "@/drishti/state/store";
import { useSimWorker } from "@/drishti/state/useSimWorker";

function fmtZulu(d: Date): string {
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${hh}${mm}${ss}Z`;
}

export function GCSApp() {
  const send = useSimWorker();
  const params = useSearchParams();

  // Sim-driven state
  const uavs = useStore((s) => s.uavs);
  const tracks = useStore((s) => s.tracks);
  const alerts = useStore((s) => s.alerts);
  const missionTimeSec = useStore((s) => s.missionTimeSec);
  const radarTimeSec = useStore((s) => s.radarTimeSec);
  const latencyMs = useStore((s) => s.latencyMs);
  const revisitSec = useStore((s) => s.revisitSec);
  const gnssCount = useStore((s) => s.gnssCount);
  const windKt = useStore((s) => s.windKt);
  const swarmMoving = useStore((s) => s.swarmMoving);
  const swarmSpd = useStore((s) => s.swarmSpd);
  const splitActive = useStore((s) => s.splitActive);
  const dronesHistory = useStore((s) => s.dronesHistory);

  // UI state
  const formation = useStore((s) => s.formation);
  const setFormation = useStore((s) => s.setFormation);
  const selectedDroneId = useStore((s) => s.selectedDroneId);
  const setSelectedDroneId = useStore((s) => s.setSelectedDroneId);
  const selectedTrackId = useStore((s) => s.selectedTrackId);
  const setSelectedTrackId = useStore((s) => s.setSelectedTrackId);
  const tweaks = useStore((s) => s.tweaks);
  const setTweak = useStore((s) => s.setTweak);
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const radarOn = useStore((s) => s.radarOn);
  const setRadarOn = useStore((s) => s.setRadarOn);
  const gnssDenied = useStore((s) => s.gnssDenied);
  const toggleGnssDeny = useStore((s) => s.toggleGnssDeny);
  const recording = useStore((s) => s.recording);
  const setRecording = useStore((s) => s.setRecording);
  const recordTimeSec = useStore((s) => s.recordTimeSec);
  const setRecordTimeSec = useStore((s) => s.setRecordTimeSec);
  const nightMode = useStore((s) => s.nightMode);
  const setNightMode = useStore((s) => s.setNightMode);
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const workspace = useStore((s) => s.workspace);
  const setWorkspace = useStore((s) => s.setWorkspace);

  const [tweaksVis, setTweaksVis] = useState(false);
  const [zulu, setZulu] = useState("");

  // Zulu clock
  useEffect(() => {
    setZulu(fmtZulu(new Date()));
    const id = setInterval(() => setZulu(fmtZulu(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  // Recording timer (UI-only) — read latest value from store inside the
  // interval so we only schedule once per start/stop.
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {
      const cur = useStore.getState().recordTimeSec;
      setRecordTimeSec(cur + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [recording, setRecordTimeSec]);

  // Night mode CSS filter
  useEffect(() => {
    const root = document.querySelector(".gcs-root") as HTMLElement | null;
    if (!root) return;
    root.style.filter = nightMode ? "sepia(0.22) hue-rotate(-12deg) brightness(0.78)" : "";
  }, [nightMode]);

  // Sync radar on/off to worker
  useEffect(() => {
    send({ kind: "SET_RADAR_ON", on: radarOn });
  }, [radarOn, send]);

  // Deep-link: /demo?ws=mission|drone|observe selects the workspace on mount
  useEffect(() => {
    const ws = params.get("ws");
    if (ws === "mission") setWorkspace("MISSION");
    else if (ws === "drone") setWorkspace("DRONE");
    else if (ws === "observe") setWorkspace("OBSERVE");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedDrone = uavs.find((u) => u.id === selectedDroneId) ?? null;
  const selectedDroneIdx = uavs.findIndex((u) => u.id === selectedDroneId);
  const selectedTrack = tracks.find((t) => t.id === selectedTrackId) ?? null;
  const swarmAlt = uavs.length > 0 ? Math.round(uavs.reduce((a, u) => a + u.pos.z, 0) / uavs.length) : 700;

  return (
    <div
      className="gcs-root"
      style={{
        display: "grid",
        gridTemplateRows: "48px 1fr 44px",
        gridTemplateColumns: "260px 1fr 340px",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: COLORS.bg,
        color: COLORS.txtHi,
        fontFamily: "var(--font-mono)",
      }}
    >
      <TopBar
        missionTimeSec={missionTimeSec}
        radarOn={radarOn}
        mode={mode}
        trackCount={tracks.length}
        zuluTime={zulu}
      />

      <div style={{ gridRow: 2, gridColumn: 1, overflow: "hidden" }}>
        <SwarmPanel
          uavs={uavs}
          formation={formation}
          latencyMs={latencyMs}
          splitActive={splitActive}
          onFormationChange={setFormation}
          onFault={(id) => send({ kind: "FAULT_DRONE", droneId: id })}
          onRTH={(id) => send({ kind: "RTH_DRONE", droneId: id })}
          onSelectDrone={(id) => {
            setSelectedDroneId(id);
            // Switching to DRONE workspace when a card is clicked is the
            // primary "show me this node" gesture.
            if (selectedDroneId !== id) setWorkspace("DRONE");
          }}
          selectedDroneId={selectedDroneId}
          onAddDrone={() => send({ kind: "ADD_DRONE" })}
          onRemoveDrone={() => send({ kind: "REMOVE_DRONE" })}
          onSplit={() => send({ kind: "SET_SPLIT", split: true })}
          onMerge={() => send({ kind: "SET_SPLIT", split: false })}
          on360={() => {
            setFormation("CIRCULAR");
            setMode("360° COVER");
          }}
        />
      </div>

      <div
        style={{
          gridRow: 2,
          gridColumn: 2,
          display: "flex",
          flexDirection: "column",
          background: COLORS.bg,
          borderLeft: `1px solid ${COLORS.bdDim}`,
          borderRight: `1px solid ${COLORS.bdDim}`,
          overflow: "hidden",
        }}
      >
        <WorkspaceSwitcher
          workspace={workspace}
          onChange={setWorkspace}
          selectedCallsign={selectedDrone?.callsign ?? null}
        />

        {workspace === "OBSERVE" && (
          <ObserveWorkspace
            uavs={uavs}
            tracks={tracks}
            view={view}
            setView={setView}
            tweaks={tweaks}
            mode={mode}
            setMode={setMode as (m: string) => void}
            radarOn={radarOn}
            setRadarOn={setRadarOn}
            recording={recording}
            recordTimeSec={recordTimeSec}
            setRecording={setRecording}
            gnssDenied={gnssDenied}
            toggleGnssDeny={toggleGnssDeny}
            swarmMoving={swarmMoving}
            swarmSpd={swarmSpd}
            nightMode={nightMode}
            setNightMode={setNightMode}
            setFormation={setFormation}
            setTweaksVis={setTweaksVis}
            send={send}
          />
        )}
        {workspace === "MISSION" && <MissionWorkspace />}
        {workspace === "DRONE" && (
          <DroneWorkspace
            uav={selectedDrone}
            idx={selectedDroneIdx}
            history={selectedDrone ? dronesHistory[selectedDrone.id] ?? [] : []}
            zuluTime={zulu}
            send={send}
          />
        )}
      </div>

      <div style={{ gridRow: 2, gridColumn: 3, overflow: "hidden" }}>
        <RightPanel
          tracks={tracks}
          alerts={alerts}
          uavs={uavs}
          swarmAltM={swarmAlt}
          maxRangeKm={tweaks.maxRangeKm}
          onSelectTrack={setSelectedTrackId}
          selectedTrackId={selectedTrackId}
        />
      </div>

      <StatusBar
        uavs={uavs}
        radarTimeSec={radarTimeSec}
        revisitSec={revisitSec}
        latencyMs={latencyMs}
        gnssCount={gnssCount}
        windKt={windKt}
        swarmMoving={swarmMoving}
        swarmSpd={swarmSpd}
      />

      {tweaksVis && (
        <TweaksPanel tweaks={tweaks} setTweak={setTweak} onClose={() => setTweaksVis(false)} />
      )}

      {selectedTrack && (
        <div
          style={{
            position: "fixed",
            bottom: "60px",
            right: "350px",
            zIndex: 998,
            background: COLORS.panel,
            border: `1px solid ${COLORS.bdHi}`,
            boxShadow: "0 0 20px rgba(0,200,80,0.1)",
            width: "280px",
          }}
        >
          <div
            style={{
              padding: "5px 10px",
              background: "#040a07",
              borderBottom: `1px solid ${COLORS.bdDim}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: COLORS.txtMid,
                letterSpacing: "0.1em",
              }}
            >
              RANGE-DOPPLER — {selectedTrack.id} ({selectedTrack.type})
            </span>
            <button
              onClick={() => setSelectedTrackId(null)}
              style={{ color: COLORS.txtLo, fontSize: "10px", fontFamily: "var(--font-mono)" }}
            >
              ✕
            </button>
          </div>
          <RangeDoppler track={selectedTrack} maxRangeKm={tweaks.maxRangeKm} />
        </div>
      )}
    </div>
  );
}
