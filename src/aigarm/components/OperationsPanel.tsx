import {
  AlertTriangle,
  Boxes,
  Check,
  ChevronLeft,
  ChevronRight,
  Database,
  FileDown,
  LockKeyhole,
  Minus,
  Plus,
  RadioTower,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { mission } from '../data/mission';
import type {
  CandidateArea,
  GunInventory,
  MissionMetric,
  MissionResources,
  RouteCandidate,
  ViewId,
} from '../types';

type AmmunitionCountField = 'available' | 'allocated' | 'reserve';

interface OperationsPanelProps {
  activeView: ViewId;
  selectedCandidateId: string;
  selectedRouteId: string;
  selectedWaypointIndex: number;
  resources: MissionResources;
  onSelectCandidate: (candidateId: string) => void;
  onSelectRoute: (routeId: string) => void;
  onWaypointChange: (index: number) => void;
  onPlatformChange: (platformId: string) => void;
  onGunCountChange: (field: keyof GunInventory, value: number) => void;
  onAmmunitionChange: (
    ammunitionId: string,
    field: AmmunitionCountField,
    value: number,
  ) => void;
  onResetResources: () => void;
  onAction: (action: string) => void;
}

function PanelHeader({
  title,
  action,
}: {
  title: string;
  action?: string;
}) {
  return (
    <header className="sub-header">
      <span>{title}</span>
      {action && <span className="sub-header__action">{action} ▸</span>}
    </header>
  );
}

function ProvenanceBadge({
  value,
}: {
  value: MissionMetric['provenance'];
}) {
  return <span className="provenance-badge" data-source={value}>{value}</span>;
}

function CandidateCard({
  candidate,
  selected,
  onSelect,
}: {
  candidate: CandidateArea;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className="candidate-card"
      data-selected={selected}
      data-state={candidate.state}
      onClick={onSelect}
    >
      <span className="candidate-rank">
        {candidate.rank ? String(candidate.rank).padStart(2, '0') : '—'}
      </span>
      <span className="candidate-info">
        <strong>{candidate.name} · {candidate.grid}</strong>
        <em>{candidate.description}</em>
        <span className="tag-row">
          {candidate.tags.map((tag) => (
            <i key={tag.label} data-tone={tag.tone}>{tag.label}</i>
          ))}
        </span>
      </span>
      <span className="candidate-score">
        <strong>{candidate.score?.toFixed(2) ?? 'REJ'}</strong>
        <em>{candidate.score ? 'CONF' : 'STATUS'}</em>
      </span>
    </button>
  );
}

function MetricGrid({ metrics }: { metrics: MissionMetric[] }) {
  return (
    <div className="metric-grid">
      {metrics.map((item) => (
        <div className="metric-card" key={item.label} data-tone={item.tone}>
          <div className="metric-label">
            <span>{item.label}</span>
            <ProvenanceBadge value={item.provenance} />
          </div>
          <div className="metric-reading">
            <strong>{item.value}</strong>
            <span>{item.detail}</span>
          </div>
          {item.progress !== undefined && (
            <div className="metric-track">
              <i style={{ width: `${item.progress}%` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CountControl({
  label,
  value,
  onChange,
  invalid = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  invalid?: boolean;
}) {
  const setValue = (nextValue: number) =>
    onChange(Math.max(0, Math.min(9999, Math.floor(nextValue || 0))));

  return (
    <label className="count-control" data-invalid={invalid}>
      <span>{label}</span>
      <div>
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => setValue(value - 1)}
        >
          <Minus size={11} />
        </button>
        <input
          type="number"
          min="0"
          max="9999"
          value={value}
          aria-invalid={invalid}
          onChange={(event) => setValue(Number(event.target.value))}
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => setValue(value + 1)}
        >
          <Plus size={11} />
        </button>
      </div>
    </label>
  );
}

function ReccePanel({
  selectedCandidateId,
  onSelectCandidate,
  onAction,
}: Pick<
  OperationsPanelProps,
  'selectedCandidateId' | 'onSelectCandidate' | 'onAction'
>) {
  const candidate =
    mission.candidates.find((item) => item.id === selectedCandidateId) ??
    mission.candidates[0];

  return (
    <>
      <PanelHeader title="CANDIDATE POSITION AREAS · RANKED" action="CONFIG" />
      <div className="candidate-stack">
        {mission.candidates.map((item) => (
          <CandidateCard
            key={item.id}
            candidate={item}
            selected={candidate.id === item.id}
            onSelect={() => onSelectCandidate(item.id)}
          />
        ))}
      </div>

      <PanelHeader title={`${candidate.name} · METRIC VERIFICATION`} action="EVIDENCE" />
      <MetricGrid metrics={candidate.metrics} />

      <PanelHeader title="DECISION TRACE · HUMAN REVIEW REQUIRED" action="LOG" />
      <div className="reason-list">
        {candidate.reasoning.map((step) => (
          <div className="reason-row" key={step.id} data-tone={step.tone}>
            <strong>{step.id}</strong>
            <span>{step.text}</span>
            <em>w {step.weight.toFixed(2)}</em>
          </div>
        ))}
      </div>

      <div className="panel-actions">
        <button
          type="button"
          className="primary-action"
          disabled={candidate.state === 'rejected'}
          onClick={() => onAction(`LOCK ${candidate.name}`)}
        >
          <LockKeyhole size={13} />
          {candidate.state === 'rejected' ? 'CANDIDATE REJECTED' : `LOCK ${candidate.name}`}
          <span>[ENT]</span>
        </button>
        <button type="button" onClick={() => onAction('PREVIEW RECCE REPORT')}>
          <FileDown size={13} /> PREVIEW REPORT
        </button>
        <button type="button" onClick={() => onAction('OPEN SOURCE EVIDENCE')}>
          <ShieldCheck size={13} /> SOURCE EVIDENCE
        </button>
      </div>
    </>
  );
}

function RouteCard({
  route,
  selected,
  onSelect,
}: {
  route: RouteCandidate;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className="route-card"
      data-selected={selected}
      data-state={route.state}
      onClick={onSelect}
    >
      <span className="route-rank">{String(route.rank).padStart(2, '0')}</span>
      <span className="route-info">
        <strong>{route.id} {selected && '· SELECTED'}</strong>
        <em>{route.name}</em>
        <span className="tag-row">
          <i data-tone="ok">DIST {route.distanceKm.toFixed(2)} KM</i>
          <i data-tone={route.threat === 'LOW' ? 'ok' : route.threat === 'MED' ? 'warn' : 'bad'}>
            THREAT {route.threat}
          </i>
          <i data-tone={route.maxSlope <= 5 ? 'ok' : 'bad'}>MAX SLP {route.maxSlope.toFixed(1)}°</i>
          <i data-tone="info">COVER {route.cover.toFixed(2)}</i>
        </span>
      </span>
      <span className="candidate-score">
        <strong>{route.score.toFixed(2)}</strong>
        <em>SCORE</em>
      </span>
    </button>
  );
}

function RoutesPanel({
  selectedRouteId,
  selectedWaypointIndex,
  onSelectRoute,
  onWaypointChange,
  onAction,
}: Pick<
  OperationsPanelProps,
  | 'selectedRouteId'
  | 'selectedWaypointIndex'
  | 'onSelectRoute'
  | 'onWaypointChange'
  | 'onAction'
>) {
  const route =
    mission.routes.find((item) => item.id === selectedRouteId) ??
    mission.routes[0];
  const safeIndex = Math.min(selectedWaypointIndex, route.waypoints.length - 1);
  const waypoint = route.waypoints[safeIndex];

  return (
    <>
      <PanelHeader title="ROUTE CANDIDATES" action="WEIGHTS" />
      <div className="candidate-stack">
        {mission.routes.map((item) => (
          <RouteCard
            key={item.id}
            route={item}
            selected={item.id === route.id}
            onSelect={() => onSelectRoute(item.id)}
          />
        ))}
      </div>

      <PanelHeader title="WAYPOINT INSPECTOR" action="PROFILE" />
      <div className="waypoint-panel">
        <div className="waypoint-title">
          <strong>{waypoint.id}</strong>
          <span>({route.state === 'marginal' ? 'REVIEW' : 'OK'})</span>
        </div>
        <dl className="waypoint-coordinates">
          <div>
            <dt>POSITION</dt>
            <dd>{waypoint.coordinate[1].toFixed(5)}° N, {waypoint.coordinate[0].toFixed(5)}° E</dd>
          </div>
          <div><dt>ELEVATION</dt><dd>{waypoint.elevation.toFixed(1)} M</dd></div>
          <div><dt>ROUTE</dt><dd>{route.id} · {route.duration}</dd></div>
        </dl>
        <div className="waypoint-metrics">
          <div><span>SLOPE</span><strong>{waypoint.slope.toFixed(1)}°</strong></div>
          <div><span>RCI</span><strong>{waypoint.rci}</strong></div>
          <div><span>SOIL</span><strong>{waypoint.soil}</strong></div>
          <div><span>COVER</span><strong>{waypoint.cover.toFixed(2)}</strong></div>
        </div>
        <button
          type="button"
          className="outline-action"
          onClick={() => onAction(`INSERT ${waypoint.id}`)}
        >
          INSERT WAYPOINT
        </button>
        <div className="waypoint-nav">
          <button
            type="button"
            disabled={safeIndex === 0}
            onClick={() => onWaypointChange(Math.max(0, safeIndex - 1))}
          >
            <ChevronLeft size={12} /> PREV
          </button>
          <span>{safeIndex + 1} / {route.waypoints.length}</span>
          <button
            type="button"
            disabled={safeIndex === route.waypoints.length - 1}
            onClick={() =>
              onWaypointChange(Math.min(route.waypoints.length - 1, safeIndex + 1))
            }
          >
            NEXT <ChevronRight size={12} />
          </button>
        </div>
      </div>

      <div className="panel-actions">
        <button
          type="button"
          className="primary-action"
          onClick={() => onAction(`ACCEPT ${route.id}`)}
        >
          <Check size={13} /> ACCEPT {route.id}<span>[ENT]</span>
        </button>
        <button type="button" onClick={() => onAction('PREVIEW ROUTE CARD')}>
          <FileDown size={13} /> ROUTE CARD
        </button>
        <button type="button" onClick={() => onAction('COMPARE ROUTES')}>
          COMPARE ROUTES
        </button>
      </div>
    </>
  );
}

function BallisticsPanel({ onAction }: Pick<OperationsPanelProps, 'onAction'>) {
  return (
    <>
      <PanelHeader title="TRAJECTORY MASK CHECK · DEMO" action="CONFIG" />
      <div className="ballistic-summary">
        <div><span>PLATFORM PROFILE</span><strong>155 mm / DEMO</strong></div>
        <div><span>AZIMUTH</span><strong>042°</strong></div>
        <div><span>RANGE</span><strong>34.2 KM</strong></div>
        <div><span>MASK BUFFER</span><strong>70 M</strong></div>
      </div>
      <div className="trajectory-chart" aria-label="Illustrative trajectory profile">
        <svg viewBox="0 0 340 150" preserveAspectRatio="none">
          <g className="chart-grid">
            <path d="M0 30H340M0 60H340M0 90H340M0 120H340" />
            <path d="M60 0V150M120 0V150M180 0V150M240 0V150M300 0V150" />
          </g>
          <path className="terrain-profile" d="M0 136L35 130L70 121L105 125L140 111L170 98L200 84L225 91L250 79L280 68L310 72L340 58V150H0Z" />
          <path className="clearance-line" d="M0 112L35 106L70 97L105 101L140 87L170 74L200 60L225 67L250 55L280 44L310 48L340 34" />
          <path className="trajectory-line" d="M0 136Q118 -38 340 58" />
          <line className="clearance-tick" x1="202" y1="60" x2="202" y2="27" />
          <circle className="clearance-point" cx="202" cy="27" r="3" />
          <text x="208" y="28">+112 M</text>
        </svg>
      </div>
      <div className="chart-legend">
        <span><i className="amber" /> Illustrative trajectory</span>
        <span><i className="green" /> Computed clearance</span>
        <span><i className="dim" /> Configured buffer</span>
      </div>

      <PanelHeader title="MODEL BOUNDARY" action="DETAILS" />
      <div className="advisory-box">
        <AlertTriangle size={15} />
        <p>
          This screen demonstrates terrain-mask decision support. It is not a
          certified firing solution and cannot generate operational fire-control data.
        </p>
      </div>
      <MetricGrid
        metrics={[
          { label: 'MIN CLEARANCE', value: '112 M', detail: 'configured req 70', tone: 'ok', provenance: 'COMPUTED', progress: 84 },
          { label: 'TERRAIN SAMPLES', value: '50', detail: '30 m DEM', tone: 'info', provenance: 'COMPUTED', progress: 68 },
          { label: 'WEATHER INPUT', value: 'N/A', detail: 'not modelled', tone: 'warn', provenance: 'SCENARIO', progress: 0 },
          { label: 'RESULT', value: 'REVIEW', detail: 'human approval', tone: 'warn', provenance: 'COMPUTED', progress: 55 },
        ]}
      />
      <div className="panel-actions">
        <button type="button" className="primary-action" onClick={() => onAction('RUN TERRAIN MASK CHECK')}>
          RUN DEMO CHECK <span>[B]</span>
        </button>
      </div>
    </>
  );
}

function ThreatPanel({ onAction }: Pick<OperationsPanelProps, 'onAction'>) {
  return (
    <>
      <PanelHeader title="THREAT PICTURE · EXERCISE INJECT" action="FILTER" />
      <div className="threat-stack">
        {mission.threats.map((threat) => (
          <button
            type="button"
            className="threat-card"
            data-severity={threat.severity}
            key={threat.id}
            onClick={() => onAction(`FOCUS ${threat.id}`)}
          >
            <span className="threat-symbol">△</span>
            <span>
              <strong>{threat.id} · {threat.type}</strong>
              <em>{threat.description}</em>
            </span>
            <span className="threat-range">
              {threat.rangeKm.toFixed(1)} KM
              <em>CF {threat.confidence.toFixed(2)}</em>
            </span>
          </button>
        ))}
      </div>

      <PanelHeader title="PAA-ALPHA · EXPOSURE SUMMARY" action="MATRIX" />
      <MetricGrid
        metrics={[
          { label: 'DIRECT FIRE', value: 'LOW', detail: 'terrain masked', tone: 'ok', provenance: 'SCENARIO', progress: 22 },
          { label: 'COUNTER-BTY', value: 'MED', detail: '1 emitter', tone: 'warn', provenance: 'SCENARIO', progress: 54 },
          { label: 'AIR THREAT', value: 'MED', detail: 'SHORAD sector', tone: 'warn', provenance: 'SCENARIO', progress: 61 },
          { label: 'AMBUSH RISK', value: 'LOW', detail: 'route screened', tone: 'ok', provenance: 'SCENARIO', progress: 28 },
        ]}
      />

      <PanelHeader title="ANALYST NOTE" action="EDIT" />
      <div className="operator-note">
        Threat contacts are deterministic exercise injects used to demonstrate
        route and position-area risk scoring. No live target-recognition model is
        connected.
      </div>
      <div className="panel-actions">
        <button type="button" className="primary-action" onClick={() => onAction('ACKNOWLEDGE THREAT PICTURE')}>
          <RadioTower size={13} /> ACKNOWLEDGE PICTURE<span>[T]</span>
        </button>
      </div>
    </>
  );
}

function ResourcesPanel({
  resources,
  onPlatformChange,
  onGunCountChange,
  onAmmunitionChange,
  onResetResources,
  onAction,
}: Pick<
  OperationsPanelProps,
  | 'resources'
  | 'onPlatformChange'
  | 'onGunCountChange'
  | 'onAmmunitionChange'
  | 'onResetResources'
  | 'onAction'
>) {
  const platform =
    resources.platforms.find((item) => item.id === resources.platformId) ??
    resources.platforms[0];
  const serviceabilityInvalid =
    resources.guns.available + resources.guns.unserviceable >
    resources.guns.authorized;
  const assignmentInvalid =
    resources.guns.assigned + resources.guns.reserve >
    resources.guns.available;
  const ammunitionErrors = resources.ammunition.filter(
    (item) => item.allocated + item.reserve > item.available,
  );
  const valid =
    !serviceabilityInvalid &&
    !assignmentInvalid &&
    ammunitionErrors.length === 0;
  const totalAvailable = resources.ammunition.reduce(
    (sum, item) => sum + item.available,
    0,
  );
  const totalAllocated = resources.ammunition.reduce(
    (sum, item) => sum + item.allocated,
    0,
  );
  const gunFields: Array<{ field: keyof GunInventory; label: string }> = [
    { field: 'authorized', label: 'AUTHORIZED' },
    { field: 'available', label: 'AVAILABLE' },
    { field: 'assigned', label: 'ASSIGNED' },
    { field: 'reserve', label: 'RESERVE' },
    { field: 'unserviceable', label: 'UNSERVICEABLE' },
  ];

  return (
    <>
      <PanelHeader title="GUN PLATFORM · MISSION SETUP" action="EDITABLE" />
      <div className="resource-platform">
        <label>
          <span>PLATFORM / TYPE</span>
          <select
            value={resources.platformId}
            onChange={(event) => onPlatformChange(event.target.value)}
          >
            {resources.platforms.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <div className="platform-ident">
          <Boxes size={18} />
          <div>
            <strong>{platform.shortLabel}</strong>
            <span>{platform.calibre} · {platform.mobility}</span>
          </div>
          <em>{resources.provenance}</em>
        </div>
      </div>

      <PanelHeader title="GUN AVAILABILITY" action={`${resources.guns.assigned} ASSIGNED`} />
      <div className="gun-count-grid">
        {gunFields.map(({ field, label }) => (
          <CountControl
            key={field}
            label={label}
            value={resources.guns[field]}
            invalid={
              (field === 'authorized' ||
                field === 'available' ||
                field === 'unserviceable') &&
              serviceabilityInvalid ||
              (field === 'assigned' ||
                field === 'reserve' ||
                field === 'available') &&
              assignmentInvalid
            }
            onChange={(value) => onGunCountChange(field, value)}
          />
        ))}
      </div>

      <PanelHeader title="AMMUNITION AVAILABILITY" action={`${totalAvailable} RDS`} />
      <div className="ammunition-list">
        {resources.ammunition.map((item) => {
          const invalid = item.allocated + item.reserve > item.available;
          return (
            <section className="ammunition-row" key={item.id} data-invalid={invalid}>
              <header>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </div>
                <em>{invalid ? 'OVER-ALLOCATED' : 'BALANCED'}</em>
              </header>
              <div className="ammunition-counts">
                {(
                  [
                    ['available', 'AVAILABLE'],
                    ['allocated', 'ALLOCATED'],
                    ['reserve', 'RESERVE'],
                  ] as Array<[AmmunitionCountField, string]>
                ).map(([field, label]) => (
                  <CountControl
                    key={field}
                    label={label}
                    value={item[field]}
                    invalid={invalid}
                    onChange={(value) =>
                      onAmmunitionChange(item.id, field, value)
                    }
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="resource-source">
        <Database size={14} />
        <span>
          <strong>{resources.sourceLabel}</strong>
          <em>{resources.capturedAt} · {resources.freshness}</em>
        </span>
        <b>{resources.provenance}</b>
      </div>

      <div className="resource-validation" data-valid={valid}>
        {valid ? (
          <>
            <Check size={14} />
            <span>
              PLAN VALID · {resources.guns.assigned}/{resources.guns.available} GUNS ·{' '}
              {totalAllocated}/{totalAvailable} RDS ALLOCATED
            </span>
          </>
        ) : (
          <>
            <AlertTriangle size={14} />
            <div>
              {serviceabilityInvalid && (
                <span>Available + unserviceable exceeds authorized guns.</span>
              )}
              {assignmentInvalid && (
                <span>Assigned + reserve exceeds available guns.</span>
              )}
              {ammunitionErrors.map((item) => (
                <span key={item.id}>{item.label} allocation exceeds available rounds.</span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="panel-actions">
        <button
          type="button"
          className="primary-action"
          disabled={!valid}
          onClick={() => onAction('APPLY RESOURCE PLAN')}
        >
          <Check size={13} /> APPLY TO MISSION<span>[ENT]</span>
        </button>
        <button type="button" onClick={() => onAction('SAVE RESOURCE DRAFT')}>
          SAVE DRAFT
        </button>
        <button type="button" onClick={onResetResources}>
          <RotateCcw size={12} /> RESET
        </button>
      </div>
    </>
  );
}

function OrdersPanel({
  selectedCandidateId,
  selectedRouteId,
  resources,
  onAction,
}: Pick<
  OperationsPanelProps,
  'selectedCandidateId' | 'selectedRouteId' | 'resources' | 'onAction'
>) {
  const candidate =
    mission.candidates.find((item) => item.id === selectedCandidateId) ??
    mission.candidates[0];
  const platform =
    resources.platforms.find((item) => item.id === resources.platformId) ??
    resources.platforms[0];
  const totalRounds = resources.ammunition.reduce(
    (sum, item) => sum + item.allocated,
    0,
  );
  const resourcesValid =
    resources.guns.assigned + resources.guns.reserve <=
      resources.guns.available &&
    resources.guns.available + resources.guns.unserviceable <=
      resources.guns.authorized &&
    resources.ammunition.every(
      (item) => item.allocated + item.reserve <= item.available,
    );

  return (
    <>
      <PanelHeader title="RECCE RECOMMENDATION PACKAGE" action="REVISION 03" />
      <div className="order-sheet">
        <div className="order-banner">
          <span>OP / VAJRA-07</span>
          <strong>COMMANDER REVIEW</strong>
        </div>
        <p>&gt; Proposed area: {candidate.name}</p>
        <p>&gt; Grid: {candidate.grid}</p>
        <p>&gt; Ingress: {selectedRouteId}</p>
        <p>&gt; Platform: {platform.shortLabel} · {platform.calibre}</p>
        <p>&gt; Guns: {resources.guns.assigned} assigned / {resources.guns.available} available</p>
        <p>&gt; Ammunition: {totalRounds} rounds allocated</p>
        <p>&gt; H-hour: {mission.hHour}</p>
        <p>&gt; Data mode: OFFLINE DEMONSTRATION</p>
        <hr />
        <p>[ASSET DISPERSION · ILLUSTRATIVE]</p>
        <div className="dispersion-grid">
          {Array.from(
            { length: Math.min(resources.guns.assigned, 8) },
            (_, index) => `G${index + 1}`,
          ).map((gun) => (
            <span key={gun}>{gun}</span>
          ))}
          <i>CP</i>
        </div>
      </div>
      <PanelHeader title="RELEASE GATES" action={resourcesValid ? '5 / 6' : '4 / 6'} />
      <div className="release-list">
        <div data-state="ok"><Check size={12} /> Terrain evidence attached</div>
        <div data-state="ok"><Check size={12} /> Primary and alternate routes attached</div>
        <div data-state="ok"><Check size={12} /> Scenario threat picture acknowledged</div>
        <div data-state="ok"><Check size={12} /> Provenance labels included</div>
        <div data-state={resourcesValid ? 'ok' : 'warn'}>
          {resourcesValid ? <Check size={12} /> : <AlertTriangle size={12} />}
          Gun and ammunition plan {resourcesValid ? 'validated' : 'requires correction'}
        </div>
        <div data-state="warn"><AlertTriangle size={12} /> Commander approval pending</div>
      </div>
      <div className="panel-actions">
        <button type="button" className="primary-action" onClick={() => onAction('PREVIEW RECCE PACKAGE')}>
          <FileDown size={13} /> PREVIEW PACKAGE<span>[O]</span>
        </button>
        <button type="button" onClick={() => onAction('SAVE DRAFT PACKAGE')}>SAVE DRAFT</button>
        <button type="button" onClick={() => onAction('EXPORT DEMO JSON')}>EXPORT JSON</button>
      </div>
    </>
  );
}

function AuditPanel({ onAction }: Pick<OperationsPanelProps, 'onAction'>) {
  return (
    <>
      <PanelHeader title="ASSURANCE READINESS · NOT CERTIFIED" action="EVIDENCE" />
      <div className="assurance-grid">
        {[
          ['ISO/IEC 27001', 'TARGET', 'warn'],
          ['STQC EAL 4+', 'TARGET', 'warn'],
          ['MIL-STD-810H', 'HW TEST REQ', 'muted'],
          ['JSS 55555', 'HW TEST REQ', 'muted'],
          ['ETAI', 'MAPPED', 'ok'],
          ['IEC 61508', 'GAP REVIEW', 'warn'],
        ].map(([label, value, tone]) => (
          <div key={label} data-tone={tone}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <PanelHeader title="DATA PROVENANCE" action="MANIFEST" />
      <div className="source-list">
        {mission.sources.map((source) => (
          <div key={source.id} data-state={source.status}>
            <i />
            <span><strong>{source.label}</strong><em>{source.detail}</em></span>
            <b>{source.provenance}</b>
          </div>
        ))}
      </div>

      <PanelHeader title="DEMO AUDIT LOG" action="LOCAL" />
      <div className="audit-log">
        <p><span>[OK]</span> Mission bundle checksum verified.</p>
        <p><span>[OK]</span> Local raster loaded without network requests.</p>
        <p><span>[OK]</span> Deterministic scenario seed: VAJRA-07.</p>
        <p><span>[OK]</span> Computed and estimated values separated.</p>
        <p className="warn"><span>[WARN]</span> Threat model is scenario-only.</p>
        <p className="warn"><span>[WARN]</span> RCI estimate requires field validation.</p>
        <p><span>[OK]</span> Human decision gate remains enabled.</p>
      </div>
      <div className="panel-actions">
        <button type="button" className="primary-action" onClick={() => onAction('PREVIEW ASSURANCE REPORT')}>
          <ShieldCheck size={13} /> ASSURANCE REPORT<span>[A]</span>
        </button>
      </div>
    </>
  );
}

export function OperationsPanel(props: OperationsPanelProps) {
  return (
    <aside className="operations-panel">
      {props.activeView === 'recce' && <ReccePanel {...props} />}
      {props.activeView === 'routes' && <RoutesPanel {...props} />}
      {props.activeView === 'ballistics' && <BallisticsPanel {...props} />}
      {props.activeView === 'threat' && <ThreatPanel {...props} />}
      {props.activeView === 'resources' && <ResourcesPanel {...props} />}
      {props.activeView === 'orders' && <OrdersPanel {...props} />}
      {props.activeView === 'audit' && <AuditPanel {...props} />}
    </aside>
  );
}
