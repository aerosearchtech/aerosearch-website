// Every colour the moisture demo uses. CSS custom properties are generated from
// PALETTES (THEME_CSS, injected by app/demo/moisture/layout.tsx) and scoped to
// .moist-root. Dark mode is built from the site palette in @/theme/colors.
// Chrome stays monochrome; hue is kept for moisture band and integrity only.
import { colors } from '@/theme/colors';

export type ThemeName = 'dark' | 'light';

export interface Palette {
  bg: string;
  panel: string;
  raised: string;
  well: string;
  hover: string;
  line: string;
  lineSoft: string;
  lineStrong: string;
  tx: string;
  txHi: string;
  tx2: string;
  mute: string;
  acc: string;
  onAcc: string;
  ok: string;
  warn: string;
  bad: string;
  okSoft: string;
  warnSoft: string;
  badSoft: string;
  band0: string;
  band1: string;
  band2: string;
  band3: string;
  mark: string;
}

export const PALETTES: Record<ThemeName, Palette> = {
  dark: {
    bg: colors.night,
    panel: colors.soil,
    raised: colors.ridge,
    well: '#060605',
    hover: colors.ridge,
    line: colors.line,
    lineSoft: '#1D1A17',
    lineStrong: '#3A342E',
    tx: colors.bone,
    txHi: '#FFFFFF',
    tx2: '#C9C2B7',
    mute: colors.boneMuted,
    acc: colors.bone,
    onAcc: colors.night,
    ok: '#8DBF6A',
    warn: colors.survey,
    bad: colors.signal,
    okSoft: 'rgba(141,191,106,.28)',
    warnSoft: 'rgba(217,164,65,.30)',
    badSoft: 'rgba(228,70,43,.34)',
    band0: '#5E7F45',
    band1: '#A88236',
    band2: '#A85E2E',
    band3: colors.signalDim,
    mark: colors.mark,
  },
  light: {
    bg: '#F2EEE6',
    panel: '#E9E4DA',
    raised: '#E1DBCF',
    well: '#E4DED2',
    hover: '#E1DBCF',
    line: '#CFC7B9',
    lineSoft: '#DCD5C8',
    lineStrong: '#B3AA9A',
    tx: '#1C1A17',
    txHi: '#0A0A09',
    tx2: '#3B3731',
    mute: '#6B645A',
    acc: '#1C1A17',
    onAcc: '#F2EEE6',
    ok: '#3F7A2A',
    warn: '#9A6A12',
    bad: '#B8321C',
    okSoft: 'rgba(63,122,42,.30)',
    warnSoft: 'rgba(154,106,18,.30)',
    badSoft: 'rgba(184,50,28,.30)',
    band0: '#7C9A5E',
    band1: '#C9A251',
    band2: '#C27A47',
    band3: '#B04A36',
    mark: colors.mark,
  },
};

const toCss = (p: Palette): string =>
  Object.entries(p)
    .map(([k, v]) => `--${k}:${v};`)
    .join('');

export const THEME_CSS =
  `.moist-root[data-theme="dark"]{color-scheme:dark;${toCss(PALETTES.dark)}}` +
  `.moist-root[data-theme="light"]{color-scheme:light;${toCss(PALETTES.light)}}`;

export type Tone = 'ok' | 'warn' | 'bad' | 'mute';

export const toneVar = (tone: Tone): string => `var(--${tone})`;
