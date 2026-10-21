'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import LiveFeed from '@/bmf/components/map/LiveFeed';
import { DRONE_CALLSIGN } from '@/bmf/lib/live/constants';
import type { Detections, FootprintKind, MosaicKind } from '@/bmf/lib/live/types';
import type { Bridge } from '@/bmf/lib/live/useBridge';
import { useMosaic } from '@/bmf/lib/live/useMosaic';
import { useReplay } from '@/bmf/lib/live/useReplay';
import { useGcs } from '@/bmf/lib/store';
import { FONT_MONO } from '@/bmf/lib/theme';
import MissionPanel from './MissionPanel';
import ReplayBar from './ReplayBar';
import ReplayPanel from './ReplayPanel';
import TelemetryStrip from './TelemetryStrip';

// Leaflet needs the browser's window, so the map never renders on the server.
const LiveMap = dynamic(() => import('./LiveMap'), { ssr: false });

const toggle = (on: boolean): React.CSSProperties => ({
  height: '100%',
  padding: '0 11px',
  background: on ? 'var(--amWash)' : 'transparent',
  border: 'none',
  borderLeft: '1px solid var(--bd)',
  color: on ? 'var(--am)' : 'var(--tx2)',
  fontFamily: FONT_MONO,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 1,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  flex: 'none',
});

/** BMF's map: the real drone on satellite imagery, its telemetry and, on demand, its camera feed. */
export default function LiveMapArea({ detections, bridge }: { detections: Detections; bridge: Bridge }) {
  const { state, offline, refreshMission } = bridge;
  const { feedChannel, feedMode, showFeed, setFeedMode, closeFeed, liveMineId, selectLiveMine } = useGcs();
  const root = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  const toggleFullscreen = () => void (fullscreen ? document.exitFullscreen() : root.current?.requestFullscreen());
  const [follow, setFollow] = useState(false);
  // MISSION and REPLAY share the rail over the map
  const [panel, setPanel] = useState<'mission' | 'replay' | null>(null);
  const flipPanel = (p: 'mission' | 'replay') => setPanel((cur) => (cur === p ? null : p));
  const replay = useReplay();
  const [fitRequest, setFitRequest] = useState(0);
  const [footprints, setFootprints] = useState<Record<FootprintKind, boolean>>({ rgb: false, thermal: true });
  const flip = (k: FootprintKind) => setFootprints((f) => ({ ...f, [k]: !f[k] }));
  const [mosaicKind, setMosaicKind] = useState<MosaicKind | null>(null);
  const mosaic = useMosaic(mosaicKind);
  const pickMosaic = (k: MosaicKind) => setMosaicKind((cur) => (cur === k ? null : k));
  const openFeed = () => showFeed('RGB');

  return (
    <div ref={root} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative', background: 'var(--bg0)' }}>
      <div style={{ height: 34, flex: 'none', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--bd)', background: 'var(--bg2)', overflow: 'hidden' }}>
        <span style={{ padding: '0 13px', fontSize: 11, fontWeight: 600, letterSpacing: 2, color: 'var(--tx)', marginRight: 'auto', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
          LIVE MAP <span style={{ color: 'var(--tx3)', fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 1 }}>· CLICK THE DRONE FOR ITS FEED</span>
        </span>
        <button style={toggle(mosaicKind === 'rgb')} onClick={() => pickMosaic('rgb')} title="Live RGB mosaic of this flight's survey lines">RGB MOSAIC</button>
        <button style={toggle(mosaicKind === 'thermal')} onClick={() => pickMosaic('thermal')} title="Live thermal mosaic of this flight's survey lines">THERMAL MOSAIC</button>
        <button style={toggle(footprints.thermal)} onClick={() => flip('thermal')} title="Thermal photo footprints">THERMAL FP</button>
        <button style={toggle(footprints.rgb)} onClick={() => flip('rgb')} title="RGB photo footprints">RGB FP</button>
        <button style={toggle(follow)} onClick={() => setFollow((f) => !f)} title="Keep the drone centred">FOLLOW</button>
        <button style={toggle(false)} onClick={() => setFitRequest((n) => n + 1)} title="Fit the mission and trail">FIT</button>
        <button style={toggle(panel === 'mission')} onClick={() => flipPanel('mission')} title="Mission, photos and flight messages">MISSION</button>
        <button style={toggle(panel === 'replay')} onClick={() => flipPanel('replay')} title="Play a recorded flight on this map">REPLAY</button>
        <button style={toggle(fullscreen)} onClick={toggleFullscreen} title="Map full screen (Esc exits)">⛶</button>
      </div>

      <TelemetryStrip state={state} offline={offline} feedOpen={feedChannel !== null} onDroneClick={openFeed} />

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {/* isolation keeps Leaflet's high z-index panes under the rail and the feed */}
        <div style={{ position: 'absolute', inset: 0, isolation: 'isolate' }}>
          <LiveMap
            vehicle={state?.vehicle ?? null}
            trail={state?.trail ?? []}
            mission={state?.mission ?? null}
            missionVersion={state?.missionVersion ?? 0}
            photos={state?.photos ?? []}
            footprints={footprints}
            mosaic={mosaic}
            follow={follow}
            fitRequest={fitRequest}
            onDroneClick={openFeed}
            mines={detections.mines}
            selectedMine={liveMineId}
            onMineClick={(id) => selectLiveMine(id === liveMineId ? null : id)}
          />
        </div>
        {panel === 'mission' && <MissionPanel state={state} refreshMission={refreshMission} />}
        {panel === 'replay' && <ReplayPanel replay={replay} />}
      </div>

      <ReplayBar replay={replay} />

      <div style={{ height: 26, flex: 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '0 13px', borderTop: '1px solid var(--bd)', background: 'var(--bg1)', fontFamily: FONT_MONO, fontSize: 9, color: 'var(--tx3)', letterSpacing: 1 }}>
        <span><span style={{ color: 'var(--am)' }}>━</span> SURVEY LINE</span>
        <span><span style={{ color: 'var(--tx2)' }}>┅</span> TRANSIT</span>
        <span><span style={{ color: 'var(--tl)' }}>▭</span> AREA</span>
        <span><span style={{ color: 'var(--gn)' }}>━</span> FLOWN</span>
        <span><span style={{ color: 'var(--or)' }}>▭</span> THERMAL FOOTPRINT</span>
        <span><span style={{ color: 'var(--bl)' }}>▭</span> RGB FOOTPRINT</span>
      </div>

      {feedChannel && <LiveFeed title={`${DRONE_CALLSIGN} · C12`} mode={feedMode} onMode={setFeedMode} onClose={closeFeed} footer={<ReplayBar replay={replay} />} />}
    </div>
  );
}
