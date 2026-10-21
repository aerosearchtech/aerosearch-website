'use client';

import { useDeferredValue, useEffect, useMemo } from 'react';
import { Layers, Magnet, Mountain, Satellite, ScanLine } from 'lucide-react';
import AltitudeChart from '@/gpr/components/AltitudeChart';
import AScan from '@/gpr/components/bscan/AScan';
import BScan from '@/gpr/components/bscan/BScan';
import LinePicker from '@/gpr/components/bscan/LinePicker';
import Overview from '@/gpr/components/bscan/Overview';
import CScanMap from '@/gpr/components/map/CScanMap';
import MapLegend from '@/gpr/components/map/MapLegend';
import MapToolbar from '@/gpr/components/map/MapToolbar';
import Sidebar from '@/gpr/components/Sidebar';
import StatTiles from '@/gpr/components/StatTiles';
import TopBar from '@/gpr/components/TopBar';
import IconButton from '@/gpr/components/ui/IconButton';
import Panel from '@/gpr/components/ui/Panel';
import { buildLut } from '@/gpr/lib/colormap';
import { renderBScan } from '@/gpr/lib/images';
import { processFlight, velocityMPerNs } from '@/gpr/lib/processing';
import { useViewer } from '@/gpr/lib/store';
import { cssVar, RAMPS } from '@/gpr/lib/theme';
import { SHORTCUTS_HELP, useShortcuts } from '@/gpr/lib/useShortcuts';

function Message({ text }: { text: string }) {
  return <div style={{ margin: 'auto', color: cssVar('inkSecondary'), fontSize: 14 }}>{text}</div>;
}

const hint = { fontSize: 11, color: cssVar('inkMuted') };

export default function Viewer() {
  const flight = useViewer((s) => s.flight);
  const loading = useViewer((s) => s.loading);
  const error = useViewer((s) => s.error);
  const theme = useViewer((s) => s.theme);
  const sidebarOpen = useViewer((s) => s.sidebarOpen);
  const basemap = useViewer((s) => s.basemap);
  const toggleBasemap = useViewer((s) => s.toggleBasemap);
  const magLayer = useViewer((s) => s.mapLayer === 'mag');
  const liveParams = useViewer((s) => s.params);
  const liveDisplay = useViewer((s) => s.display);
  const params = useDeferredValue(liveParams);
  const display = useDeferredValue(liveDisplay);
  useShortcuts();

  useEffect(() => {
    void useViewer.getState().init();
  }, []);

  const processed = useMemo(() => (flight ? processFlight(flight, params) : null), [flight, params]);
  const image = useMemo(
    () => (processed ? renderBScan(processed, buildLut(RAMPS[theme][display.colormap]), display.contrast) : null),
    [processed, theme, display],
  );
  const velocity = velocityMPerNs(params.permittivity);
  const busy = params !== liveParams || display !== liveDisplay;

  return (
    <div className="gpr-root gpr-app" data-theme={theme}>
      <TopBar />
      {error && <Message text={`Could not load survey data: ${error}`} />}
      {!error && (loading || !flight || !processed || !image) && <Message text="Loading survey…" />}
      {!error && !loading && flight && processed && image && (
        <>
          <StatTiles meta={flight.meta} />
          <main className={sidebarOpen ? 'gpr-workspace' : 'gpr-workspace gpr-collapsed'}>
            <Sidebar key={flight.meta.id} meta={flight.meta} busy={busy} />
            <div className="gpr-center">
              <Panel
                title="B-scan radargram"
                icon={ScanLine}
                actions={<LinePicker meta={flight.meta} />}
                exportName={`${flight.meta.id}-bscan`}
                maximizable
                footer={
                  <span style={hint}>
                    Scroll to zoom · Shift+scroll zooms time · Drag to pan · Double-click to reset · Keys: {SHORTCUTS_HELP} ·
                    Dashed line = ground reflection · Band = depth slice · ▲ = surveyed buried object
                  </span>
                }
              >
                <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
                  <BScan meta={flight.meta} processed={processed} image={image} velocity={velocity} />
                  <AScan processed={processed} />
                </div>
                <Overview image={image} />
              </Panel>
              <Panel
                key={flight.meta.id}
                title="Flight altitude"
                icon={Mountain}
                className="gpr-altitude"
                exportName={`${flight.meta.id}-altitude`}
                maximizable
                collapsible
                defaultOpen={!flight.meta.targets?.length}
              >
                <AltitudeChart meta={flight.meta} />
              </Panel>
            </div>
            <Panel
              title={magLayer ? 'Magnetometer anomaly' : 'Depth slice (C-scan)'}
              icon={magLayer ? Magnet : Layers}
              className="gpr-right"
              actions={<IconButton icon={Satellite} label={basemap ? 'Hide satellite imagery' : 'Show satellite imagery'} onClick={toggleBasemap} active={basemap} />}
              toolbar={<MapToolbar meta={flight.meta} />}
              footer={<MapLegend meta={flight.meta} />}
              exportName={`${flight.meta.id}-${magLayer ? 'magnetometer' : 'cscan'}`}
              maximizable
            >
              <CScanMap key={flight.meta.id} meta={flight.meta} processed={processed} velocity={velocity} />
            </Panel>
          </main>
        </>
      )}
    </div>
  );
}
