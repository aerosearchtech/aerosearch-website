import type { AnalysisMode, Commodity, Decision, LotDetails, LotProfile, PrintKind, RefractionStatus, Screen } from '../types/analysis';

/** Recorded runs of the real analyzer, written by scripts/record_grain.py. */
export const REPLAY_ROOT = '/demos/grain';

export const PRODUCT_NAME = 'AERO GRAINALYZER';
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
  { id: 'intake', num: '01', label: 'INTAKE' },
  { id: 'analyse', num: '02', label: 'ANALYSE' },
  { id: 'report', num: '03', label: 'REPORT' },
  { id: 'outbox', num: '04', label: 'ANNA DARPAN' },
];

export const INTAKE_FIELDS: { id: keyof LotDetails; label: string; hint: string; numeric?: boolean }[] = [
  { id: 'truck', label: 'Truck no.', hint: 'Vehicle registration' },
  { id: 'stack', label: 'Stack no.', hint: 'Depot stack reference' },
  { id: 'variety', label: 'Variety', hint: 'As declared' },
  { id: 'moisture', label: 'Moisture %', hint: 'From the moisture meter', numeric: true },
  { id: 'centre', label: 'Centre', hint: 'Procurement centre or depot' },
  { id: 'officer', label: 'Officer ID', hint: 'Authorised officer' },
];

export const EMPTY_LOT: LotDetails = { truck: '', stack: '', variety: '', moisture: '', centre: '', officer: '' };
export const INTAKE_MAX_CHARS = 40;

/** Rice of length/breadth at or above this is Grade A; below it is Common. */
export const GRADE_A_LB = 2.5;
/** Kernels feeding this refraction are excluded from the L/B median. */
export const BROKEN_REFRACTION = 'brokens';

export const OUTBOX_NOTE = 'Awaiting FCI test credentials.';
/** Official FCI logo from fci.gov.in, one per theme. Anna Darpan publishes no logo of its own. */
export const FCI_LOGO = { light: `${REPLAY_ROOT}/fci-logo.svg`, dark: `${REPLAY_ROOT}/fci-logo-white.svg`, alt: 'Food Corporation of India', width: 308, height: 72 };
export const PRINT_FILE_PREFIX = 'Aerosearch-grain';
/** @page rules per print document: A4 report, 80 mm thermal slip. */
export const PRINT_PAGE_CSS: Record<PrintKind, string> = {
  report: 'size: A4; margin: 14mm;',
  slip: 'size: 80mm 220mm; margin: 3mm;',
};
export const SLIP_SIGNATURE_CHARS = 16;

export const MODE_LABELS: Record<AnalysisMode, string> = { reference: 'Reference lot', image: 'Tray photo' };

export const PIPELINE_STAGES: Record<AnalysisMode, string> = {
  reference: 'LOAD LOT → CLASSIFY 2 VIEWS → GRADE BY WEIGHT → SIGN',
  image: 'CAPTURE → SEGMENT → CLASSIFY → GRADE BY EST. WEIGHT → SIGN',
};

export const CAPTURE_LABELS: Record<AnalysisMode, string> = {
  reference: 'REFERENCE LOT · 2 VIEWS',
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
