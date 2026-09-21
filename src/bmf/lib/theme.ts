// Single source of truth for the palette. Token names follow the ClearLandMine
// GCS reference so the chrome is pixel-comparable; the light set is a second
// mapping of the same tokens. Mirrored to CSS custom properties by paletteCss()
// (consumed by components) — canvas/derive code reads the objects directly.

import type { MineType, RouteProfileId, TaskState } from './types';

export type ThemeName = 'dark' | 'light';

export interface Palette {
  bg0: string;
  bg1: string;
  bg2: string;
  bg3: string;
  bd: string;
  bd2: string;
  tx: string;
  tx2: string;
  tx3: string;
  am: string;
  /** Amber at low alpha, for the selected state of a control. */
  amWash: string;
  gnWash: string;
  gn: string;
  /** Pale green — a contact resolved as a false alarm, nothing emplaced. */
  gnPale: string;
  cl: string;
  rd: string;
  or: string;
  tl: string;
  bl: string;
  vt: string;
  mg: string;
  lm: string;
  /** Map-only tokens. */
  mapInk: string;
  mapWash: string;
  gridStrong: string;
  gridWeak: string;
  corridorEdge: string;
  hazardRgb: string;
  hazardAlpha: number;
  sweptRgb: string;
  unsweptRgb: string;
  coverageAlpha: number;
  mine: Record<MineType, string>;
  route: Record<RouteProfileId, string>;
  state: Record<TaskState, string>;
}

const DARK: Palette = {
  bg0: '#070a0f',
  bg1: '#0c1119',
  bg2: '#111a25',
  bg3: '#172230',
  bd: '#1d2836',
  bd2: '#293a4d',
  tx: '#cfd9e6',
  tx2: '#8593a6',
  tx3: '#54616f',
  am: '#f2a93b',
  amWash: 'rgba(242,169,59,.14)',
  gnWash: 'rgba(70,196,106,.14)',
  gn: '#46c46a',
  gnPale: '#a7dcb5',
  cl: '#0a0d11',
  rd: '#ff5347',
  or: '#f5893d',
  tl: '#36c6d4',
  bl: '#5b8def',
  vt: '#9b6dff',
  mg: '#e857b0',
  lm: '#c3e34a',
  mapInk: '#080c12',
  mapWash: 'rgba(7,10,15,0.62)',
  gridStrong: 'rgba(120,150,175,0.14)',
  gridWeak: 'rgba(120,150,175,0.06)',
  corridorEdge: 'rgba(235,243,250,0.55)',
  hazardRgb: '255,83,71',
  hazardAlpha: 0.6,
  sweptRgb: '70,196,106',
  unsweptRgb: '150,163,180',
  coverageAlpha: 0.62,
  mine: { at: '#ff5347', ap: '#f5893d', pfm1: '#9b6dff', uxo: '#5b8def' },
  route: { safest: '#46c46a', balanced: '#36c6d4', direct: '#f2a93b' },
  state: { pending: '#54616f', working: '#f2a93b', neutralised: '#36c6d4', proofed: '#46c46a' },
};

const LIGHT: Palette = {
  bg0: '#e7ebf0',
  bg1: '#f5f7fa',
  bg2: '#e9eef4',
  bg3: '#dde4ec',
  bd: '#c7d1dc',
  bd2: '#adbaca',
  tx: '#16202c',
  tx2: '#4c5a6b',
  tx3: '#78848f',
  am: '#a86400',
  amWash: 'rgba(168,100,0,.12)',
  gnWash: 'rgba(28,138,63,.12)',
  gn: '#1c8a3f',
  gnPale: '#6faf84',
  cl: '#ced7e0',
  rd: '#c62828',
  or: '#b8500c',
  tl: '#0b7484',
  bl: '#2c55c4',
  vt: '#6535c9',
  mg: '#b02a80',
  lm: '#5f7a0c',
  mapInk: '#dfe5ec',
  mapWash: 'rgba(236,240,245,0.66)',
  gridStrong: 'rgba(30,50,70,0.18)',
  gridWeak: 'rgba(30,50,70,0.08)',
  corridorEdge: 'rgba(16,24,34,0.5)',
  hazardRgb: '198,40,40',
  hazardAlpha: 0.46,
  sweptRgb: '28,138,63',
  unsweptRgb: '92,103,116',
  coverageAlpha: 0.5,
  mine: { at: '#c62828', ap: '#b8500c', pfm1: '#6535c9', uxo: '#2c55c4' },
  route: { safest: '#1c8a3f', balanced: '#0b7484', direct: '#a86400' },
  state: { pending: '#78848f', working: '#a86400', neutralised: '#0b7484', proofed: '#1c8a3f' },
};

export const PALETTES: Record<ThemeName, Palette> = { dark: DARK, light: LIGHT };

export const DEFAULT_THEME: ThemeName = 'dark';
export const THEME_STORAGE_KEY = 'bmf-theme';

export const FONT_SANS = "'Saira', system-ui, sans-serif";
export const FONT_MONO = "'JetBrains Mono', monospace";

/** Fixed brand mark colour — identical in both themes. */
export const BRAND_BLUE = '#0B5BD3';

/** Classification banner background by level. */
export const CLASS_BG: Record<string, string> = {
  UNCLASSIFIED: '#2c7a3f',
  RESTRICTED: '#9a6a12',
  CONFIDENTIAL: '#9a3412',
  SECRET: '#7a1d1d',
};

/** Only the flat string tokens become CSS variables. */
function cssVars(p: Palette): string {
  return Object.entries(p)
    .filter(([, v]) => typeof v === 'string')
    .map(([k, v]) => `--${k}:${v as string}`)
    .join(';');
}

export function paletteCss(): string {
  return `:root,.bmf-root{${cssVars(DARK)}}:root[data-theme="light"],.bmf-root[data-theme="light"]{${cssVars(LIGHT)}}`;
}

/**
 * False-colour ramps for the sensor tiles, as RGB triples.
 *
 * Deliberately not part of the light/dark Palette: a GPR radargram is greyscale
 * and a magnetic anomaly is blue-through-red whatever the console theme is set
 * to. Flipping them with the UI would stop them reading as instrument output.
 */
export const SENSOR_RAMP = {
  ink: '#04070c',
  gprLo: [8, 10, 14] as [number, number, number],
  gprHi: [236, 240, 245] as [number, number, number],
  magLo: [64, 126, 232] as [number, number, number],
  magMid: [10, 14, 22] as [number, number, number],
  magHi: [232, 116, 58] as [number, number, number],
  emiLo: [6, 12, 10] as [number, number, number],
  emiHi: [150, 240, 170] as [number, number, number],
  polLo: [10, 8, 18] as [number, number, number],
  polHi: [244, 196, 236] as [number, number, number],
  demLo: [14, 18, 16] as [number, number, number],
  demHi: [226, 240, 208] as [number, number, number],
};
