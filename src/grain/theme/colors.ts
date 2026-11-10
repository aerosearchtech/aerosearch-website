/** Single source of truth for every colour in the grain replay. Both palettes share the same tokens. */
import { colors as site } from '@/theme/colors';

export type ThemeMode = 'dark' | 'light';

const dark = {
  bg: '#090b0a',
  panel: '#101311',
  panel2: '#161a17',
  panel3: '#1d221e',
  line: '#252b26',
  line2: '#353d36',
  text: '#e1e6de',
  text2: '#9ba597',
  text3: '#6d776b',
  accent: site.bone,
  accentSoft: 'rgba(237, 231, 221, 0.12)',
  onAccent: site.night,
  logo: site.mark,
  ok: 'oklch(0.79 0.15 150)',
  okSoft: 'oklch(0.79 0.15 150 / 0.12)',
  warn: 'oklch(0.83 0.14 82)',
  warnSoft: 'oklch(0.83 0.14 82 / 0.12)',
  bad: 'oklch(0.69 0.2 27)',
  badSoft: 'oklch(0.69 0.2 27 / 0.14)',
  feed: '#050605',
  feedBar: 'rgba(5, 6, 5, 0.88)',
  feedText: '#8a9487',
  feedGrid: 'rgba(255, 255, 255, 0.04)',
  feedInk: '#e1e6de',
  feedGlow: 'rgba(225, 230, 222, 0.18)',
  tagInk: '#0b0d0b',
  overlay: 'rgba(5, 6, 5, 0.8)',
  paper: '#ffffff',
};

export type Palette = Record<keyof typeof dark, string>;

const light: Palette = {
  ...dark,
  bg: '#e4e6e1',
  panel: '#f7f8f5',
  panel2: '#eef0eb',
  panel3: '#e6e9e3',
  line: '#cdd1c9',
  line2: '#b3b9b0',
  text: '#0e120f',
  text2: '#454e44',
  text3: '#646d62',
  accent: '#1c1a17',
  accentSoft: 'rgba(28, 26, 23, 0.08)',
  onAccent: '#f7f8f5',
  ok: 'oklch(0.5 0.13 150)',
  okSoft: 'oklch(0.5 0.13 150 / 0.1)',
  warn: 'oklch(0.55 0.13 68)',
  warnSoft: 'oklch(0.55 0.13 68 / 0.1)',
  bad: 'oklch(0.52 0.19 27)',
  badSoft: 'oklch(0.52 0.19 27 / 0.1)',
  feed: '#1a1d1a',
  overlay: 'rgba(14, 18, 15, 0.55)',
};

export const palettes: Record<ThemeMode, Palette> = { dark, light };

/** One colour per grain class code; readable on the dark camera feed in both themes. */
export const classColors: Record<string, string> = {
  NOR: '#5fcf8a',
  BN: '#5aa7f0',
  AP: '#f0645b',
  MY: '#b08cf7',
  SD: '#3fd0c0',
  'F&S': '#f78cc4',
  UN: '#e8b34a',
  HD: '#e8913e',
  BP: '#b07f58',
  IM: '#aab4bf',
  UNK: '#6d776b',
};

const toKebab = (name: string): string => name.replace(/[A-Z0-9]+/g, (c) => `-${c.toLowerCase()}`);
const toCss = (p: Palette): string => Object.entries(p).map(([k, v]) => `--${toKebab(k)}:${v};`).join('');

/** Every token as a CSS variable scoped to .grain-root, e.g. text2 -> --text-2. Injected by the route layout. */
export const THEME_CSS =
  `.grain-root[data-theme="dark"]{color-scheme:dark;${toCss(dark)}}` +
  `.grain-root[data-theme="light"]{color-scheme:light;${toCss(light)}}`;
