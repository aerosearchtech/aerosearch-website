export type Commodity = 'rice' | 'wheat';
export type LotProfile = 'good' | 'borderline' | 'poor';
export type RefractionStatus = 'ok' | 'near' | 'over';
export type Verdict = 'ACCEPT' | 'REJECT';
export type AnalysisMode = 'reference' | 'image';
export type Decision = 'ACCEPT' | 'VALUE_CUT' | 'REJECT';
export type Screen = 'intake' | 'analyse' | 'report' | 'outbox';
export type PrintKind = 'report' | 'slip';
export type LbGrade = 'A' | 'COMMON';

/** Lot details typed by the operator at intake. */
export interface LotDetails {
  truck: string;
  stack: string;
  variety: string;
  moisture: string;
  centre: string;
  officer: string;
}

export interface GrainClass {
  code: string;
  label: string;
  refraction: string;
}

export interface RefractionSpec {
  id: string;
  label: string;
  limit_pct: number;
}

export interface ModelInfo {
  arch: string;
  views: number;
  test_accuracy: number;
  test_macro_f1: number;
  n_test: number;
  dataset: string;
}

export interface CommodityMeta {
  id: Commodity;
  label: string;
  available: boolean;
  classes: GrainClass[];
  refractions: RefractionSpec[];
  model: ModelInfo | null;
}

export interface Meta {
  commodities: CommodityMeta[];
  disclaimer: string;
  device_id: string;
  inference: string;
  recorded_at: string;
}

export interface KernelResult {
  idx: number;
  up_url: string;
  down_url: string | null;
  pred: string;
  confidence: number;
  probs: Record<string, number>;
  mass_mg: number;
  area_mm2: number;
  truth: string | null;
  bbox: [number, number, number, number] | null;
  /** Length/breadth from the crop images; null if the kernel was cut by the crop edge. */
  lb: number | null;
}

export interface RefractionResult {
  id: string;
  label: string;
  count: number;
  mass_pct: number;
  limit_pct: number;
  status: RefractionStatus;
}

export interface SignedRecord {
  payload: Record<string, unknown>;
  alg: string;
  signature: string;
}

export interface AnalysisResult {
  sample_id: string;
  commodity: Commodity;
  mode: AnalysisMode;
  created_at: string;
  duration_ms: number;
  kernels: KernelResult[];
  refractions: RefractionResult[];
  verdict: Verdict;
  total_mass_g: number;
  agreement: number | null;
  record: SignedRecord;
  image_url: string | null;
  image_size: [number, number] | null;
  skipped_clumps: number;
}

/** A recorded run plus the device-signed record for each officer decision on it. */
export interface RecordedSample extends AnalysisResult {
  decisions: Record<Decision, SignedRecord>;
}

/** A signed decision waiting to be pushed to Anna Darpan. */
export interface OutboxEntry {
  sampleId: string;
  verdict: Verdict;
  lot: LotDetails;
  result: SignedRecord;
  decision: SignedRecord;
}

export interface ReferenceRequest {
  commodity: Commodity;
  kernels: number;
  profile: LotProfile;
}
