import {
  Boxes,
  Crosshair,
  Map,
  Navigation,
  Radio,
  Ruler,
  ShieldAlert,
  Waypoints,
} from 'lucide-react';
import type { CSSProperties } from 'react';
import { SensorFeed } from './SensorFeed';
import { mission } from '../data/mission';
import type {
  CandidateArea,
  Coordinate,
  MissionResources,
  RouteCandidate,
  ViewId,
} from '../types';
import type { MapMode, MapTool } from './TacticalMap';

export type DisplayMode = 'analysis' | 'imagery';

interface MapChromeProps {
  activeView: ViewId;
  activeTool: MapTool;
  mapMode: MapMode;
  displayMode: DisplayMode;
  candidate: CandidateArea;
  route: RouteCandidate;
  resources: MissionResources;
  coordinate: Coordinate;
  measurement: string | null;
  onToolChange: (tool: MapTool) => void;
  onMapModeChange: (mode: MapMode) => void;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onNavigate: (view: ViewId) => void;
  onAction: (action: string) => void;
}

const toolDefinitions: Array<{
  id: MapTool;
  label: string;
  key: string;
  icon: typeof Crosshair;
  navigate?: ViewId;
}> = [
  { id: 'select', label: 'SELECT', key: 'V', icon: Crosshair },
  { id: 'measure', label: 'MEASURE', key: 'M', icon: Ruler },
  { id: 'route', label: 'ROUTE', key: 'R', icon: Navigation, navigate: 'routes' },
  { id: 'viewshed', label: 'VIEWSHED', key: 'L', icon: Radio },
  { id: 'ballistic', label: 'MASK CHECK', key: 'B', icon: Waypoints, navigate: 'ballistics' },
  { id: 'threat', label: 'THREAT', key: 'T', icon: ShieldAlert, navigate: 'threat' },
];

export function MapChrome({
  activeView,
  activeTool,
  mapMode,
  displayMode,
  candidate,
  route,
  resources,
  coordinate,
  measurement,
  onToolChange,
  onMapModeChange,
  onDisplayModeChange,
  onNavigate,
  onAction,
}: MapChromeProps) {
  const platform =
    resources.platforms.find((item) => item.id === resources.platformId) ??
    resources.platforms[0];
  const allocatedRounds = resources.ammunition.reduce(
    (sum, item) => sum + item.allocated,
    0,
  );
  const gunLabels = Array.from(
    { length: Math.min(resources.guns.assigned, 8) },
    (_, index) => `G${index + 1}`,
  );

  const handleTool = (tool: (typeof toolDefinitions)[number]) => {
    onToolChange(tool.id);
    if (tool.navigate) onNavigate(tool.navigate);
  };

  return (
    <>
      <div className="map-toolbar">
        <div className="map-toolbar__tools">
          {toolDefinitions.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                type="button"
                key={tool.id}
                className={activeTool === tool.id ? 'active' : ''}
                onClick={() => handleTool(tool)}
              >
                <Icon size={12} />
                {tool.label}
                <kbd>{tool.key}</kbd>
              </button>
            );
          })}
        </div>
        <div className="map-toolbar__modes">
          <button
            type="button"
            className={mapMode === '2d' ? 'active' : ''}
            onClick={() => onMapModeChange('2d')}
          >
            2D
          </button>
          <button
            type="button"
            className={mapMode === 'terrain' ? 'active' : ''}
            onClick={() => onMapModeChange('terrain')}
          >
            TERRAIN
          </button>
          <button
            type="button"
            className={displayMode === 'imagery' ? 'active' : ''}
            onClick={() => onDisplayModeChange('imagery')}
          >
            EO
          </button>
          <button
            type="button"
            className={displayMode === 'analysis' ? 'active' : ''}
            onClick={() => onDisplayModeChange('analysis')}
          >
            ANALYSIS
          </button>
        </div>
      </div>

      <div className="map-scale">
        <span>0</span>
        <i /><i /><i /><i /><i /><i />
        <span>1.2 KM</span>
        <b>1:25,000</b>
      </div>

      {activeView === 'recce' && (
        <>
          <section className="map-legend">
            <header className="floating-header">
              <span>SLOPE CLASS · DEM</span>
              <span>MIL-2525D SYMBOLS</span>
            </header>
            <div className="legend-body">
              <div><i className="optimal" /><span>Optimal (0°–2.5°)</span><em>2</em></div>
              <div><i className="marginal" /><span>Marginal (2.5°–5.0°)</span><em>3</em></div>
              <div><i className="restricted" /><span>Restricted (&gt;5.0°)</span><em>—</em></div>
              <div><i className="route" /><span>Primary route</span><em>42 MIN</em></div>
            </div>
          </section>
          <SensorFeed candidate={candidate} />
        </>
      )}

      {activeView === 'routes' && (
        <>
          <section className="route-analysis-card">
            <header className="floating-header">
              <span>ROUTE ANALYSIS</span>
              <span>{route.id}</span>
            </header>
            <dl>
              <div><dt>TOTAL DISTANCE</dt><dd>{route.distanceKm.toFixed(2)} KM</dd></div>
              <div><dt>EST TRAVEL TIME</dt><dd>{route.duration}</dd></div>
              <div><dt>MAX SLOPE</dt><dd>{route.maxSlope.toFixed(1)}°</dd></div>
              <div><dt>MAX RCI</dt><dd>{route.maxRci}</dd></div>
              <div><dt>COVER SCORE</dt><dd>{route.cover.toFixed(2)}</dd></div>
              <div><dt>THREAT EXPOSURE</dt><dd data-tone={route.threat === 'LOW' ? 'ok' : 'warn'}>{route.threat}</dd></div>
              <div><dt>ROUTE STATUS</dt><dd data-tone={route.state === 'marginal' ? 'warn' : 'ok'}>{route.state.toUpperCase()}</dd></div>
            </dl>
            <button type="button" onClick={() => onAction(`DETAIL ${route.id}`)}>
              DETAILED PROFILE
            </button>
          </section>
          <section className="route-legend">
            <header className="floating-header">
              <span>SLOPE / PASSABILITY</span>
              <span>DEM</span>
            </header>
            <div className="legend-body">
              <div><i className="optimal" /><span>0°–2.5° · OPTIMAL</span></div>
              <div><i className="marginal" /><span>2.5°–5.0° · MARGINAL</span></div>
              <div><i className="restricted" /><span>&gt;5.0° · RESTRICTED</span></div>
            </div>
          </section>
        </>
      )}

      {activeView === 'ballistics' && (
        <div className="map-context-label map-context-label--amber">
          <Waypoints size={13} />
          TERRAIN MASK CHECK · {candidate.name} · ILLUSTRATIVE ARC
        </div>
      )}

      {activeView === 'threat' && (
        <div className="map-context-label map-context-label--red">
          <ShieldAlert size={13} />
          EXERCISE THREAT PICTURE · {mission.threats.length} CONTACTS
        </div>
      )}

      {activeView === 'resources' && (
        <section className="resource-map-card">
          <header className="floating-header">
            <span>MISSION RESOURCE PLAN</span>
            <span>{resources.provenance}</span>
          </header>
          <div className="resource-map-card__body">
            <Boxes size={24} />
            <div>
              <strong>{platform.shortLabel}</strong>
              <span>{platform.calibre} · {platform.mobility}</span>
            </div>
          </div>
          <dl>
            <div><dt>AUTHORIZED</dt><dd>{resources.guns.authorized}</dd></div>
            <div><dt>AVAILABLE</dt><dd>{resources.guns.available}</dd></div>
            <div><dt>ASSIGNED</dt><dd>{resources.guns.assigned}</dd></div>
            <div><dt>UNSERVICEABLE</dt><dd data-tone={resources.guns.unserviceable > 0 ? 'warn' : 'ok'}>{resources.guns.unserviceable}</dd></div>
            <div><dt>ALLOCATED AMMO</dt><dd>{allocatedRounds} RDS</dd></div>
            <div><dt>MANIFEST</dt><dd>{resources.freshness}</dd></div>
          </dl>
        </section>
      )}

      {activeView === 'orders' && (
        <div className="dispersion-overlay" aria-label="Illustrative asset dispersion">
          <div className="dispersion-ring">
            {gunLabels.map((gun, index) => (
              <span
                key={gun}
                style={{
                  '--gun-angle': `${(index / Math.max(gunLabels.length, 1)) * 360}deg`,
                } as CSSProperties}
              >
                {gun}
              </span>
            ))}
            <i>CP</i>
          </div>
          <strong>{candidate.name} · DISPERSION PREVIEW</strong>
        </div>
      )}

      {activeView === 'audit' && (
        <div className="map-context-label">
          <Map size={13} />
          SOURCE MANIFEST OVERLAY · SELECT A DATA LAYER FOR PROVENANCE
        </div>
      )}

      <div className="map-reticle" aria-hidden="true">
        <i />
      </div>

      {measurement && (
        <div className="measurement-readout">
          <Ruler size={12} /> {measurement}
        </div>
      )}

      <div className="map-bottom-chrome">
        <div>
          GRID <strong>{candidate.grid}</strong>
          <span>DEC <strong>{coordinate[1].toFixed(5)}°N · {coordinate[0].toFixed(5)}°E</strong></span>
          <span>ELEV <strong>216 M</strong></span>
        </div>
        <div>
          CURSOR · Δ 2.4 KM FROM {candidate.name} · BRG 072° · SLOPE 2.1°
        </div>
      </div>
    </>
  );
}
