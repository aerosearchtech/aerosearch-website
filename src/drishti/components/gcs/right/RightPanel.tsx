"use client";

import { useEffect, useRef, useState } from "react";
import { COLORS } from "@/drishti/theme/colors";
import { TracksTab } from "./TracksTab";
import { EventsTab } from "./EventsTab";
import { ElevTab } from "./ElevTab";
import { FusionTab } from "./FusionTab";
import { ThreatPanel } from "./ThreatPanel";
import { ASPSummary } from "./ASPSummary";
import type { Track } from "@/drishti/types/track";
import type { Alert } from "@/drishti/types/alert";
import type { UAV } from "@/drishti/types/uav";

type Tab = "TRACKS" | "EVENTS" | "ELEV" | "FUSION";

interface Props {
  tracks: Track[];
  alerts: Alert[];
  uavs: UAV[];
  swarmAltM: number;
  maxRangeKm: number;
  onSelectTrack: (id: string) => void;
  selectedTrackId: string | null;
}

const TABS: Tab[] = ["TRACKS", "EVENTS", "ELEV", "FUSION"];

export function RightPanel({
  tracks,
  alerts,
  uavs,
  swarmAltM,
  maxRangeKm,
  onSelectTrack,
  selectedTrackId,
}: Props) {
  const [tab, setTab] = useState<Tab>("TRACKS");
  const [flashIds, setFlashIds] = useState<Record<string, boolean>>({});
  const prevTracks = useRef<Track[]>([]);

  useEffect(() => {
    const newIds = tracks.filter((t) => !prevTracks.current.find((p) => p.id === t.id)).map((t) => t.id);
    if (newIds.length) {
      const f: Record<string, boolean> = {};
      newIds.forEach((id) => {
        f[id] = true;
      });
      setFlashIds(f);
      const tm = setTimeout(() => setFlashIds({}), 800);
      prevTracks.current = tracks;
      return () => clearTimeout(tm);
    }
    prevTracks.current = tracks;
  }, [tracks]);

  const counts: Partial<Record<Tab, number>> = {
    TRACKS: tracks.length,
    EVENTS: alerts.length,
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: COLORS.panel,
        borderLeft: `1px solid ${COLORS.bdDim}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          flexShrink: 0,
          borderBottom: `1px solid ${COLORS.bdDim}`,
          background: "#040a07",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              fontFamily: "var(--font-mono)",
              fontSize: "8px",
              letterSpacing: "0.08em",
              fontWeight: 700,
              padding: "7px 2px",
              cursor: "pointer",
              background: tab === t ? COLORS.greenBg : "transparent",
              color: tab === t ? COLORS.green : COLORS.txtLo,
              border: "none",
              borderBottom: tab === t ? `2px solid ${COLORS.green}` : "2px solid transparent",
              transition: "all 0.12s",
            }}
          >
            {t}
            {counts[t] != null ? ` (${counts[t]})` : ""}
          </button>
        ))}
      </div>

      {tab === "TRACKS" && (
        <TracksTab
          tracks={tracks}
          flashIds={flashIds}
          selectedTrackId={selectedTrackId}
          onSelect={onSelectTrack}
        />
      )}
      {tab === "EVENTS" && <EventsTab alerts={alerts} />}
      {tab === "ELEV" && <ElevTab tracks={tracks} swarmAltM={swarmAltM} maxRangeKm={maxRangeKm} />}
      {tab === "FUSION" && <FusionTab uavs={uavs} tracks={tracks} />}

      <div style={{ flexShrink: 0, borderTop: `1px solid ${COLORS.bdMid}` }}>
        <ThreatPanel tracks={tracks} />
      </div>

      <ASPSummary tracks={tracks} uavs={uavs} alerts={alerts} />
    </div>
  );
}
