// Demo constants. The meter, node and lot are one indicative centre (Osaw
// 2023-BH on node MN-0417-A at Khanna). Fleet figures on the HQ view are
// illustrative, taken from the approved mockup.
import type { Centre, Lot, SafeguardEvent, ScenarioId } from './types';

export const NODE_ID = 'MN-0417-A';
export const NODE_KEY_ID = `${NODE_ID}/02`;
export const CENTRE_LABEL = 'PB-LDH-0417 KHANNA';
export const CENTRE_LONG = 'Khanna Mandi · Ludhiana · PB-LDH-0417';
export const METER_MODEL = '2023-BH';
export const METER_SERIAL = 'OSAW 23BH-04471';
export const OFFICER_ID = 'QC OFFICER · 40218';
export const SYNC_TARGET = 'ANNA DARPAN · TEST';
export const NODE_SOFTWARE = 'MN-SW 0.1.0';
export const SIG_SCHEME = 'ECDSA P-256 · SHA-256';
export const FIRST_RECORD_NO = 419;
export const READS_PER_SAMPLE = 3;
export const READ_SPREAD = 0.1;

export const LOT: Lot = {
  id: 'L-24-118732',
  commodity: 'WHEAT',
  bags: 500,
  bagKg: 50,
  quintals: 250,
  mspPerQuintal: 2275,
};

/** Wheat band file, RMS 2024-25. Indicative; the live file comes from FCI. */
export const BAND_FILE = {
  name: 'WHEAT · RMS 2024-25',
  ref: 'ANNEX II · RMS24-25',
  faqMax: 12,
  cuts: [
    { max: 13, pct: 1 },
    { max: 14, pct: 2 },
  ],
} as const;

export const BAND_FILES_IN_FORCE = [
  { name: 'WHEAT · RMS 2024-25', rule: '12 % · CUT TO 14' },
  { name: 'PADDY · KMS 2023-24', rule: '17 %' },
  { name: 'RICE · KMS 2023-24', rule: '14–15 %' },
] as const;

/** Raw meter values for the three demo readings. */
export const SCENARIOS: Record<ScenarioId, { label: string; moisture: number }> = {
  faq: { label: 'Within FAQ', moisture: 11.4 },
  cut: { label: 'Value cut', moisture: 12.6 },
  beyond: { label: 'Beyond limit', moisture: 14.3 },
};

export const METER_ENV = { tempC: 31.4, rh: 58, curve: 'WHT01', cup: 'B' } as const;

/** Commodity codes the meter sends, as printed on its slip. */
export const COMMODITY_CODES: Record<string, string> = { WHT01: 'WHEAT' };

export const CUSTODY = {
  sampleTime: '06:42',
  delta: '+0.1',
  tolerance: '±0.3',
  ovenStandard: 'IS 4333-2',
  ovenDate: '14 OCT 2026',
  sealDays: 41,
  sealSince: '28 SEP',
} as const;

export const FLEET = {
  reporting: 412,
  total: 418,
  signedToday: 9214,
  heldOffline: 37,
} as const;

export const REGION = {
  name: 'PUNJAB REGION',
  center: [30.85, 75.55] as [number, number],
  zoom: 8,
};

export const CENTRES: readonly Centre[] = [
  { id: 'PB-LDH-0417', name: 'Khanna', node: NODE_ID, lat: 30.705, lon: 76.222, tone: 'ok' },
  { id: 'PB-MOG-0233', name: 'Moga', node: 'MN-0233-C', lat: 30.816, lon: 75.174, tone: 'bad' },
  { id: 'PB-SGR-0108', name: 'Sangrur', node: 'MN-0108-A', lat: 30.245, lon: 75.844, tone: 'bad' },
  { id: 'PB-BTI-0391', name: 'Bathinda', node: 'MN-0391-B', lat: 30.211, lon: 74.945, tone: 'bad' },
  { id: 'PB-LDH-0402', name: 'Ludhiana', node: 'MN-0402-A', lat: 30.901, lon: 75.857, tone: 'ok' },
  { id: 'PB-PTA-0155', name: 'Patiala', node: 'MN-0155-B', lat: 30.34, lon: 76.386, tone: 'ok' },
  { id: 'PB-JUC-0271', name: 'Jalandhar', node: 'MN-0271-A', lat: 31.326, lon: 75.576, tone: 'ok' },
  { id: 'PB-ASR-0019', name: 'Amritsar', node: 'MN-0019-C', lat: 31.634, lon: 74.872, tone: 'ok' },
  { id: 'PB-FZR-0344', name: 'Ferozepur', node: 'MN-0344-A', lat: 30.925, lon: 74.613, tone: 'warn' },
  { id: 'PB-PTA-0160', name: 'Rajpura', node: 'MN-0160-A', lat: 30.484, lon: 76.594, tone: 'ok' },
  { id: 'PB-BNL-0122', name: 'Barnala', node: 'MN-0122-B', lat: 30.378, lon: 75.546, tone: 'ok' },
  { id: 'PB-FZK-0388', name: 'Fazilka', node: 'MN-0388-A', lat: 30.403, lon: 74.028, tone: 'warn' },
];

export const SAFEGUARD_LOG: readonly SafeguardEvent[] = [
  {
    title: 'PORT SEAL OPENED',
    node: 'MN-0233-C',
    when: '09:14',
    body: 'Moga depot. Cable seal broken; logged in next record NO. 001208.',
    tone: 'bad',
  },
  {
    title: 'DRIFT BEYOND TOLERANCE',
    node: 'MN-0108-A',
    when: '06:51',
    body: 'Custody sample read +0.5 against oven. Meter held for IS 4333 check.',
    tone: 'warn',
  },
  {
    title: 'METER IDENTITY CHANGED',
    node: 'MN-0391-B',
    when: 'YDAY 17:30',
    body: 'Different serial on port. Reading blocked until re-enrolment.',
    tone: 'warn',
  },
];

export const TILE_URL: Record<'dark' | 'light', string> = {
  dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  light: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
};
export const TILE_ATTRIBUTION = 'Esri, HERE, Garmin, © OpenStreetMap contributors';
export const TILE_MAX_ZOOM = 16;
export const PIN_RADIUS = 6;
