export type RiskSeverity = "low" | "medium" | "high" | "critical";

export type RegistryMatch = {
  source: string;
  matched: boolean;
  confidence: number;
};

export type VesselTrack = {
  id: string;
  mmsi: string;
  imo: string;
  name: string;
  flag: string;
  type: string;
  status: string;
  riskScore: number;
  lastPosition: {
    lat: number;
    lon: number;
  };
  speedKnots: number;
  courseDegrees: number;
  zone: string;
  lastUpdate: string;
  suspicionFactors: string[];
  registry: RegistryMatch;
};

export type VesselEvent = {
  id: string;
  trackId: string;
  type: string;
  severity: RiskSeverity;
  title: string;
  occurredAt: string;
  evidence: string[];
};

export type TrackPoint = {
  timestamp: string;
  lat: number;
  lon: number;
  speedKnots: number;
  courseDegrees: number;
};

export type PansRecord = {
  id: string;
  sourceName: string;
  status: string;
  submittedAt: string;
  fields: Record<string, string>;
};

export type PansDocument = PansRecord & {
  trackId: string | null;
  matchConfidence: number;
  textPreview: string;
};

export type VesselDossier = {
  trackId: string;
  summary: string;
  riskLabel: string;
  recommendedActions: string[];
  history: TrackPoint[];
  pansRecords: PansRecord[];
};

export type VesselDetail = {
  vessel: VesselTrack;
  events: VesselEvent[];
  dossier: VesselDossier;
};

export type ApiEnvelope<T> = {
  data: T;
  generatedAt: string;
};

export const riskBand = (score: number): RiskSeverity => {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  return "low";
};

export const filterMatches = (vessel: VesselTrack, query: string) => {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [vessel.name, vessel.mmsi, vessel.imo, vessel.flag, vessel.type, vessel.zone]
    .join(" ")
    .toLowerCase()
    .includes(needle);
};

export type RagQueryRequest = {
  documentId: string;
  query: string;
};

export type RagQueryResponse = {
  documentId: string;
  query: string;
  answer: string;
  evidence: string[];
};
