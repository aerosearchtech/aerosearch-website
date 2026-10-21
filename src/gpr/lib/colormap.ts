import { LUT_SIZE } from './constants';

// RGB triplets, LUT_SIZE entries.
export type Lut = Uint8ClampedArray;

const hexToRgb = (hex: string): [number, number, number] => {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};

// Piecewise-linear interpolation through evenly spaced colour stops.
export function buildLut(stops: readonly string[]): Lut {
  const rgb = stops.map(hexToRgb);
  const lut = new Uint8ClampedArray(LUT_SIZE * 3);
  for (let i = 0; i < LUT_SIZE; i++) {
    const t = (i / (LUT_SIZE - 1)) * (rgb.length - 1);
    const k = Math.min(Math.floor(t), rgb.length - 2);
    const f = t - k;
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = rgb[k][c] + (rgb[k + 1][c] - rgb[k][c]) * f;
  }
  return lut;
}

export const lutCss = (lut: Lut, i: number): string =>
  `rgb(${lut[i * 3]},${lut[i * 3 + 1]},${lut[i * 3 + 2]})`;

export const cssGradient = (stops: readonly string[]): string =>
  `linear-gradient(90deg, ${stops.join(', ')})`;
