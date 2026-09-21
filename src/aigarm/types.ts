export type ViewId =
  | 'recce'
  | 'routes'
  | 'ballistics'
  | 'threat'
  | 'resources'
  | 'orders'
  | 'audit';

export type Provenance = 'COMPUTED' | 'ESTIMATED' | 'SCENARIO';
export type StatusTone = 'ok' | 'warn' | 'bad' | 'info' | 'muted';

export type Coordinate = [longitude: number, latitude: number];

export interface MissionMetric {
  label: string;
  value: string;
  detail: string;
  tone: StatusTone;
  provenance: Provenance;
  progress?: number;
}

export interface CandidateTag {
  label: string;
  tone: StatusTone;
}

export interface CandidateArea {
  id: string;
  rank: number | null;
  name: string;
  grid: string;
  description: string;
  score: number | null;
  state: 'recommended' | 'viable' | 'marginal' | 'rejected';
  coordinate: Coordinate;
  tags: CandidateTag[];
  metrics: MissionMetric[];
  reasoning: ReasoningStep[];
}

export interface ReasoningStep {
  id: string;
  text: string;
  weight: number;
  tone: StatusTone;
  provenance: Provenance;
}

export interface UASAsset {
  id: string;
  name: string;
  payload: string;
  task: string;
  link: number;
  status: 'online' | 'degraded' | 'down';
}

export interface MapLayerDefinition {
  id: string;
  label: string;
  color: string;
  opacity: number;
  defaultVisible: boolean;
}

export interface RouteWaypoint {
  id: string;
  coordinate: Coordinate;
  elevation: number;
  slope: number;
  rci: number;
  soil: string;
  cover: number;
}

export interface RouteCandidate {
  id: string;
  rank: number;
  name: string;
  score: number;
  state: 'recommended' | 'viable' | 'marginal';
  distanceKm: number;
  duration: string;
  maxSlope: number;
  maxRci: number;
  cover: number;
  threat: 'LOW' | 'MED' | 'HIGH';
  path: Coordinate[];
  waypoints: RouteWaypoint[];
}

export interface ThreatContact {
  id: string;
  type: string;
  description: string;
  coordinate: Coordinate;
  confidence: number;
  rangeKm: number;
  severity: 'critical' | 'high' | 'medium';
  source: string;
}

export interface DataSource {
  id: string;
  label: string;
  detail: string;
  provenance: Provenance;
  status: 'ready' | 'estimated' | 'scenario';
}

export interface GunPlatform {
  id: string;
  label: string;
  shortLabel: string;
  calibre: string;
  mobility: string;
}

export interface GunInventory {
  authorized: number;
  available: number;
  assigned: number;
  reserve: number;
  unserviceable: number;
}

export interface AmmunitionStock {
  id: string;
  label: string;
  description: string;
  available: number;
  allocated: number;
  reserve: number;
  unit: 'RDS';
}

export interface MissionResources {
  platformId: string;
  platforms: GunPlatform[];
  guns: GunInventory;
  ammunition: AmmunitionStock[];
  sourceLabel: string;
  capturedAt: string;
  freshness: string;
  provenance: Provenance;
}

export interface MissionData {
  id: string;
  name: string;
  area: string;
  regiment: string;
  commander: string;
  platform: string;
  battery: string;
  hHour: string;
  timeOnTarget: string;
  center: Coordinate;
  bounds: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
  assets: UASAsset[];
  layers: MapLayerDefinition[];
  candidates: CandidateArea[];
  routes: RouteCandidate[];
  threats: ThreatContact[];
  sources: DataSource[];
  resources: MissionResources;
}
