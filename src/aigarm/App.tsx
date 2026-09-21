'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Database,
  Download,
  Satellite,
  ShieldCheck,
  X,
} from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { MapChrome, type DisplayMode } from './components/MapChrome';
import { MissionRail } from './components/MissionRail';
import { OperationsPanel } from './components/OperationsPanel';
import {
  TacticalMap,
  type MapMode,
  type MapTool,
} from './components/TacticalMap';
import { defaultLayerVisibility, mission } from './data/mission';
import type {
  AmmunitionStock,
  Coordinate,
  GunInventory,
  MissionResources,
  ViewId,
} from './types';

const views: Array<{ id: ViewId; label: string; shortcut: string }> = [
  { id: 'recce', label: 'RECCE', shortcut: '1' },
  { id: 'routes', label: 'ROUTES', shortcut: '2' },
  { id: 'ballistics', label: 'MASK CHECK', shortcut: '3' },
  { id: 'threat', label: 'THREAT', shortcut: '4' },
  { id: 'resources', label: 'GUNS / AMMO', shortcut: '5' },
  { id: 'orders', label: 'ORDERS', shortcut: '6' },
  { id: 'audit', label: 'ASSURANCE', shortcut: '7' },
];

const viewTool: Partial<Record<ViewId, MapTool>> = {
  recce: 'select',
  routes: 'route',
  ballistics: 'ballistic',
  threat: 'threat',
};

const formatUtc = (date: Date) => {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = date
    .toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
    .toUpperCase();
  const year = String(date.getUTCFullYear()).slice(-2);
  const time = [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
  return `${day} ${month} ${year} · ${time}Z`;
};

const cloneResources = (): MissionResources => ({
  ...mission.resources,
  platforms: mission.resources.platforms.map((platform) => ({ ...platform })),
  guns: { ...mission.resources.guns },
  ammunition: mission.resources.ammunition.map((item) => ({ ...item })),
});

function App() {
  const [activeView, setActiveView] = useState<ViewId>('recce');
  const [activeTool, setActiveTool] = useState<MapTool>('select');
  const [mapMode, setMapMode] = useState<MapMode>('2d');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('analysis');
  const [selectedCandidateId, setSelectedCandidateId] = useState('paa-alpha');
  const [selectedRouteId, setSelectedRouteId] = useState('RTE-01');
  const [selectedWaypointIndex, setSelectedWaypointIndex] = useState(2);
  const [layerVisibility, setLayerVisibility] =
    useState<Record<string, boolean>>(defaultLayerVisibility);
  const [cursorCoordinate, setCursorCoordinate] = useState<Coordinate>(
    mission.center,
  );
  const [measurement, setMeasurement] = useState<string | null>(null);
  const [clock, setClock] = useState(() => new Date());
  const [toast, setToast] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [resources, setResources] = useState<MissionResources>(cloneResources);

  const selectedCandidate = useMemo(
    () =>
      mission.candidates.find((item) => item.id === selectedCandidateId) ??
      mission.candidates[0],
    [selectedCandidateId],
  );
  const selectedRoute = useMemo(
    () =>
      mission.routes.find((item) => item.id === selectedRouteId) ??
      mission.routes[0],
    [selectedRouteId],
  );
  const selectedPlatform = useMemo(
    () =>
      resources.platforms.find((item) => item.id === resources.platformId) ??
      resources.platforms[0],
    [resources],
  );
  const allocatedRounds = useMemo(
    () =>
      resources.ammunition.reduce(
        (sum, item) => sum + item.allocated,
        0,
      ),
    [resources.ammunition],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleViewChange = useCallback((view: ViewId) => {
    setActiveView(view);
    if (view === 'routes') setMapMode('terrain');
    if (view === 'recce') setMapMode('2d');
    const matchingTool = viewTool[view];
    if (matchingTool) setActiveTool(matchingTool);
  }, []);

  const toggleLayer = useCallback((layerId: string) => {
    setLayerVisibility((current) => ({
      ...current,
      [layerId]: !current[layerId],
    }));
  }, []);

  const handleToolChange = useCallback((tool: MapTool) => {
    setActiveTool(tool);
    if (tool === 'viewshed') {
      setLayerVisibility((current) => ({ ...current, viewshed: true }));
    }
  }, []);

  const handleSelectRoute = useCallback((routeId: string) => {
    setSelectedRouteId(routeId);
    setSelectedWaypointIndex(0);
  }, []);

  const handlePlatformChange = useCallback((platformId: string) => {
    setResources((current) => ({ ...current, platformId }));
  }, []);

  const handleGunCountChange = useCallback(
    (field: keyof GunInventory, value: number) => {
      setResources((current) => ({
        ...current,
        guns: { ...current.guns, [field]: value },
      }));
    },
    [],
  );

  const handleAmmunitionChange = useCallback(
    (
      ammunitionId: string,
      field: keyof Pick<
        AmmunitionStock,
        'available' | 'allocated' | 'reserve'
      >,
      value: number,
    ) => {
      setResources((current) => ({
        ...current,
        ammunition: current.ammunition.map((item) =>
          item.id === ammunitionId ? { ...item, [field]: value } : item,
        ),
      }));
    },
    [],
  );

  const resetResources = useCallback(() => {
    setResources(cloneResources());
    setToast('RESOURCE PLAN RESET TO SCENARIO MANIFEST');
  }, []);

  const exportMission = useCallback(() => {
    const platform =
      resources.platforms.find((item) => item.id === resources.platformId) ??
      resources.platforms[0];
    const payload = {
      schema: 'aerosearch.aigarm.demo.v1',
      exportedAt: new Date().toISOString(),
      classification: 'UNCLASSIFIED // DEMONSTRATION',
      mission: {
        ...mission,
        platform: platform.label,
        battery: `${resources.guns.assigned}× ASSIGNED / ${resources.guns.available}× AVAILABLE`,
        resources,
      },
      selection: {
        candidateId: selectedCandidateId,
        routeId: selectedRouteId,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${mission.id.toLowerCase()}-demo-package.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setToast('DEMO PACKAGE EXPORTED');
  }, [resources, selectedCandidateId, selectedRouteId]);

  const handleAction = useCallback(
    (action: string) => {
      if (action === 'EXPORT DEMO JSON') {
        exportMission();
        return;
      }
      if (
        action.includes('PREVIEW') ||
        action.includes('REPORT') ||
        action.includes('PACKAGE')
      ) {
        setReportOpen(true);
        return;
      }
      setToast(`${action} · RECORDED IN DEMO LOG`);
    },
    [exportMission],
  );

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const matchingView = views.find((view) => view.shortcut === event.key);
      if (matchingView) {
        handleViewChange(matchingView.id);
        return;
      }

      const tools: Record<string, MapTool> = {
        v: 'select',
        m: 'measure',
        r: 'route',
        l: 'viewshed',
        b: 'ballistic',
        t: 'threat',
      };
      const tool = tools[event.key.toLowerCase()];
      if (tool) handleToolChange(tool);

      if (event.key === 'Escape') {
        setReportOpen(false);
        setActiveTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [handleToolChange, handleViewChange]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <Logo />
          <div className="brand-copy">
            <span>AEROSEARCH TECHNOLOGIES</span>
            <strong>AIGARM <i>// v0.7 DEMO</i></strong>
          </div>
          <div className="module-name">GUN AREA RECCE</div>
        </div>

        <nav className="primary-nav" aria-label="Primary workspace">
          {views.map((view, index) => (
            <button
              type="button"
              key={view.id}
              className={activeView === view.id ? 'active' : ''}
              onClick={() => handleViewChange(view.id)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {view.label}
            </button>
          ))}
        </nav>

        <div className="system-cluster">
          <div className="system-pill"><i /> EDGE<br /><strong>ONLINE</strong></div>
          <div className="system-pill system-pill--aux"><i /> UAS-03<br /><strong>LINK 96%</strong></div>
          <div className="system-pill system-pill--aux warning"><i /> COMMS<br /><strong>DEG</strong></div>
          <div className="system-pill"><i /> GUNS<br /><strong>{resources.guns.assigned}/{resources.guns.available}</strong></div>
          <time dateTime={clock.toISOString()}>{formatUtc(clock)}</time>
        </div>
      </header>

      <main className="workspace">
        <MissionRail
          layerVisibility={layerVisibility}
          resources={resources}
          onToggleLayer={toggleLayer}
        />

        <TacticalMap
          activeView={activeView}
          selectedCandidateId={selectedCandidateId}
          selectedRouteId={selectedRouteId}
          layerVisibility={layerVisibility}
          mapMode={mapMode}
          displayMode={displayMode}
          activeTool={activeTool}
          onSelectCandidate={setSelectedCandidateId}
          onSelectRoute={handleSelectRoute}
          onCoordinateChange={setCursorCoordinate}
          onMeasurementChange={setMeasurement}
        >
          <MapChrome
            activeView={activeView}
            activeTool={activeTool}
            mapMode={mapMode}
            displayMode={displayMode}
            candidate={selectedCandidate}
            route={selectedRoute}
            resources={resources}
            coordinate={cursorCoordinate}
            measurement={measurement}
            onToolChange={handleToolChange}
            onMapModeChange={setMapMode}
            onDisplayModeChange={setDisplayMode}
            onNavigate={handleViewChange}
            onAction={handleAction}
          />
        </TacticalMap>

        <OperationsPanel
          activeView={activeView}
          selectedCandidateId={selectedCandidateId}
          selectedRouteId={selectedRouteId}
          selectedWaypointIndex={selectedWaypointIndex}
          resources={resources}
          onSelectCandidate={setSelectedCandidateId}
          onSelectRoute={handleSelectRoute}
          onWaypointChange={setSelectedWaypointIndex}
          onPlatformChange={handlePlatformChange}
          onGunCountChange={handleGunCountChange}
          onAmmunitionChange={handleAmmunitionChange}
          onResetResources={resetResources}
          onAction={handleAction}
        />
      </main>

      <footer className="statusbar">
        <div className="statusbar__cluster">
          <span>EDGE · LOCAL DEMO BUNDLE</span>
          <span>RENDER <strong>READY</strong></span>
          <span>ENGINES · DEM · RCI-EST · A* · MASK</span>
          <span className="target">TARGET · STQC EAL 4+</span>
          <span className="target">TARGET · MIL-STD-810H</span>
          <span className="mapped">ETAI · MAPPED</span>
        </div>
        <div className="statusbar__cluster">
          <span className="classification">UNCLASSIFIED // CAPABILITY DEMO</span>
          <span>SESSION VAJRA-07</span>
        </div>
      </footer>

      {toast && (
        <div className="toast" role="status">
          <Check size={14} />
          {toast}
        </div>
      )}

      {reportOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setReportOpen(false)}>
          <section
            className="report-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>AEROSEARCH TECHNOLOGIES</span>
                <h2 id="report-title">AIGARM RECCE DECISION PACKAGE</h2>
              </div>
              <button type="button" aria-label="Close report" onClick={() => setReportOpen(false)}>
                <X size={16} />
              </button>
            </header>
            <div className="report-classification">UNCLASSIFIED // DEMONSTRATION</div>
            <div className="report-summary">
              <div><span>MISSION</span><strong>{mission.id}</strong></div>
              <div><span>RECOMMENDATION</span><strong>{selectedCandidate.name}</strong></div>
              <div><span>INGRESS</span><strong>{selectedRoute.id}</strong></div>
              <div><span>CONFIDENCE</span><strong>{selectedCandidate.score?.toFixed(2) ?? 'REJECTED'}</strong></div>
            </div>
            <div className="report-columns">
              <section>
                <h3><Database size={13} /> DECISION EVIDENCE</h3>
                {selectedCandidate.metrics.slice(0, 6).map((item) => (
                  <div className="report-line" key={item.label}>
                    <span>{item.label}</span>
                    <strong data-tone={item.tone}>{item.value}</strong>
                    <em>{item.provenance}</em>
                  </div>
                ))}
              </section>
              <section>
                <h3><Satellite size={13} /> SOURCE MANIFEST</h3>
                {mission.sources.map((source) => (
                  <div className="report-source" key={source.id}>
                    <i data-state={source.status} />
                    <span><strong>{source.label}</strong><em>{source.detail}</em></span>
                  </div>
                ))}
                <h3 className="report-resource-heading">
                  <Database size={13} /> GUNS &amp; AMMUNITION
                </h3>
                <div className="report-resource">
                  <span><strong>{selectedPlatform.shortLabel}</strong><em>{selectedPlatform.calibre}</em></span>
                  <b>{resources.guns.assigned}/{resources.guns.available} GUNS</b>
                </div>
                <div className="report-resource">
                  <span><strong>MISSION ALLOCATION</strong><em>{resources.sourceLabel}</em></span>
                  <b>{allocatedRounds} RDS</b>
                </div>
              </section>
            </div>
            <div className="report-advisory">
              <AlertTriangle size={14} />
              Demonstration output only. Estimated and scenario-derived values
              require authoritative data and human validation.
            </div>
            <footer>
              <button type="button" onClick={exportMission}>
                <Download size={13} /> EXPORT JSON
              </button>
              <button type="button" className="primary" onClick={() => window.print()}>
                <ShieldCheck size={13} /> PRINT / SAVE PDF
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
