// Single source of truth for every colour in the app. CSS custom properties
// are generated from PALETTES (see THEME_CSS), canvases read PALETTES directly.
// Variables are scoped to .gpr-root so they never leak into the rest of the site.
import type { ColormapName } from './types';

export type ThemeName = 'dark' | 'light';

export interface Palette {
  page: string;
  surface: string;
  raised: string;
  border: string;
  ink: string;
  inkSecondary: string;
  inkMuted: string;
  grid: string;
  axis: string;
  accent: string;
  onAccent: string;
  cursor: string;
  series1: string;
  series2: string;
  shadow: string;
  scrim: string;
  accentSoft: string;
  onImage: string;
  imageHalo: string;
}

export const PALETTES: Record<ThemeName, Palette> = {
  dark: {
    page: '#0d0d0d',
    surface: '#1a1a19',
    raised: '#252523',
    border: 'rgba(255,255,255,0.10)',
    ink: '#ffffff',
    inkSecondary: '#c3c2b7',
    inkMuted: '#898781',
    grid: '#2c2c2a',
    axis: '#383835',
    accent: '#3987e5',
    onAccent: '#ffffff',
    cursor: '#eda100',
    series1: '#3987e5',
    series2: '#d95926',
    shadow: 'rgba(0,0,0,0.45)',
    scrim: 'rgba(0,0,0,0.6)',
    accentSoft: 'rgba(57,135,229,0.16)',
    onImage: '#ffffff',
    imageHalo: 'rgba(0,0,0,0.6)',
  },
  light: {
    page: '#f9f9f7',
    surface: '#fcfcfb',
    raised: '#f0efec',
    border: 'rgba(11,11,11,0.10)',
    ink: '#0b0b0b',
    inkSecondary: '#52514e',
    inkMuted: '#898781',
    grid: '#e1e0d9',
    axis: '#c3c2b7',
    accent: '#2a78d6',
    onAccent: '#ffffff',
    cursor: '#eda100',
    series1: '#2a78d6',
    series2: '#eb6834',
    shadow: 'rgba(0,0,0,0.12)',
    scrim: 'rgba(20,20,20,0.35)',
    accentSoft: 'rgba(42,120,214,0.10)',
    onImage: '#ffffff',
    imageHalo: 'rgba(0,0,0,0.6)',
  },
};

// Colormap stops. Diverging: blue <-> red around a neutral gray midpoint.
// Sequential: one blue ramp; near-zero recedes toward the surface in each mode.
export const RAMPS: Record<ThemeName, Record<ColormapName | 'sequential', readonly string[]>> = {
  dark: {
    diverging: ['#6da7ec', '#383835', '#e66767'],
    gray: ['#0b0b0b', '#ffffff'],
    sequential: ['#0d366b', '#1c5cab', '#3987e5', '#86b6ef', '#cde2fb'],
  },
  light: {
    diverging: ['#184f95', '#f0efec', '#a62d2d'],
    gray: ['#0b0b0b', '#ffffff'],
    sequential: ['#cde2fb', '#86b6ef', '#3987e5', '#1c5cab', '#0d366b'],
  },
};

export const FONT_SANS = '"Inter Variable", system-ui, -apple-system, "Segoe UI", sans-serif';
export const FONT_MONO = '"JetBrains Mono Variable", ui-monospace, "Cascadia Mono", Consolas, monospace';

const toCss = (p: Palette): string =>
  Object.entries(p)
    .map(([k, v]) => `--${k}:${v};`)
    .join('');

export const THEME_CSS =
  `.gpr-root{--font-sans:${FONT_SANS};--font-mono:${FONT_MONO};}` +
  `.gpr-root[data-theme="dark"]{color-scheme:dark;${toCss(PALETTES.dark)}}` +
  `.gpr-root[data-theme="light"]{color-scheme:light;${toCss(PALETTES.light)}}`;

export const cssVar = (key: keyof Palette): string => `var(--${key})`;
