import type { AnalysisMode, Commodity, Decision, LotProfile, RefractionStatus, Screen } from '../types/analysis';

/** Recorded runs of the real analyzer, written by scripts/record_grain.py. */
export const REPLAY_ROOT = '/demos/grain';

export const ORG_NAME = 'AEROSEARCH';
export const APP_TITLE = 'AUTO GRAIN ANALYZER';
export const TIME_ZONE = 'Asia/Kolkata';
export const TIME_ZONE_LABEL = 'IST';
export const THEME_STORAGE_KEY = 'grain-replay-theme';

/** Time to stream all kernels of a result onto the screen. */
export const REVEAL_DURATION_MS = 4500;
/** Pause after the last kernel lands before the report opens. */
export const REPORT_DELAY_MS = 900;
export const META_RETRY_MS = 3000;

export const DEFAULT_COMMODITY: Commodity = 'rice';
export const DEFAULT_KERNELS = 400;
export const KERNEL_OPTIONS: number[] = [200, 400, 600];

/** The limit sits at this fraction of the use-of-limit bar. */
export const LIMIT_MARK = 0.8;
export const PIPELINE_SEGMENTS = 50;

/** Kernels below this confidence are queued for human review. */
export const REVIEW_CONFIDENCE = 0.7;
export const REVIEW_MAX = 6;

export const NAV_ITEMS: { id: Screen; num: string; label: string }[] = [
  { id: 'analyse', num: '01', label: 'ANALYSE' },
  { id: 'report', num: '02', label: 'REPORT' },
];

/** The recorded tray is assembled from dataset crops, so it must not pass for a camera photo. */
export const TRAY_NOTE =
  'Recorded tray: GrainSet kernel images laid out on a black background, not a camera photo. The real analyzer found, cropped and graded each kernel. Camera capture and photo upload need the live analyzer.';

export const MODE_LABELS: Record<AnalysisMode, string> = { reference: 'Reference lot', image: 'Tray photo' };

export const PIPELINE_STAGES: Record<AnalysisMode, string> = {
  reference: 'LOAD LOT → CLASSIFY 2 VIEWS → GRADE BY WEIGHT → SIGN',
  image: 'CAPTURE → SEGMENT → CLASSIFY → GRADE BY EST. WEIGHT → SIGN',
};

export const CAPTURE_LABELS: Record<AnalysisMode, string> = {
  reference: 'REFERENCE LOT · 2 VIEWS PER KERNEL · HELD-OUT TEST SET',
  image: 'TRAY PHOTO · 1 VIEW PER KERNEL',
};

export const STATUS_LABELS: Record<RefractionStatus, string> = { ok: 'WITHIN', near: 'NEAR', over: 'FAIL' };

export const DECISIONS: { id: Decision; label: string }[] = [
  { id: 'ACCEPT', label: 'ACCEPT' },
  { id: 'VALUE_CUT', label: 'VALUE CUT' },
  { id: 'REJECT', label: 'REJECT' },
];

export const PROFILE_OPTIONS: { id: LotProfile; label: string; hint: string }[] = [
  { id: 'good', label: 'Good lot', hint: 'Well within FCI limits' },
  { id: 'borderline', label: 'Borderline', hint: 'Close to the limits' },
  { id: 'poor', label: 'Poor lot', hint: 'Exceeds limits' },
];
