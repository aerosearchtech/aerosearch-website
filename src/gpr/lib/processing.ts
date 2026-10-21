// In-browser GPR processing chain: dewow -> background removal -> gain -> flatten.
import { CLIP_PERCENTILE, FLATTEN_ABOVE_SAMPLES, LIGHT_SPEED_M_PER_NS } from './constants';
import type { Flight, ProcessingParams, Processed } from './types';

export const velocityMPerNs = (permittivity: number): number =>
  LIGHT_SPEED_M_PER_NS / Math.sqrt(permittivity);

// Subtract a running mean along each trace (removes low-frequency "wow").
function dewow(a: Float32Array, n: number, ns: number, window: number): void {
  if (window < 3) return;
  const half = Math.floor(window / 2);
  const cs = new Float64Array(ns + 1);
  for (let i = 0; i < n; i++) {
    const o = i * ns;
    for (let j = 0; j < ns; j++) cs[j + 1] = cs[j] + a[o + j];
    for (let j = 0; j < ns; j++) {
      const lo = Math.max(0, j - half);
      const hi = Math.min(ns, j + half + 1);
      a[o + j] -= (cs[hi] - cs[lo]) / (hi - lo);
    }
  }
}

// Subtract a moving-average trace (removes direct wave and horizontal ringing).
function removeBackground(a: Float32Array, n: number, ns: number, window: number): Float32Array {
  const half = Math.floor(window / 2);
  const acc = new Float64Array(ns);
  const out = new Float32Array(a.length);
  let lo = 0;
  let hi = 0;
  for (let i = 0; i < n; i++) {
    for (; hi < Math.min(n, i + half + 1); hi++) {
      for (let j = 0; j < ns; j++) acc[j] += a[hi * ns + j];
    }
    for (; lo < Math.max(0, i - half); lo++) {
      for (let j = 0; j < ns; j++) acc[j] -= a[lo * ns + j];
    }
    const inv = 1 / (hi - lo);
    const o = i * ns;
    for (let j = 0; j < ns; j++) out[o + j] = a[o + j] - acc[j] * inv;
  }
  return out;
}

// Exponential time gain starting at each trace's ground reflection.
function applyGain(a: Float32Array, n: number, ns: number, surface: number[], dbPerSample: number): void {
  if (dbPerSample <= 0) return;
  const gain = Float32Array.from({ length: ns }, (_, k) => 10 ** ((dbPerSample * k) / 20));
  for (let i = 0; i < n; i++) {
    const o = i * ns;
    for (let j = surface[i] + 1; j < ns; j++) a[o + j] *= gain[j - surface[i]];
  }
}

// Shift every trace so its ground reflection sits at FLATTEN_ABOVE_SAMPLES.
function flatten(a: Float32Array, n: number, ns: number, surface: number[]): Float32Array {
  const out = new Float32Array(a.length);
  for (let i = 0; i < n; i++) {
    const shift = surface[i] - FLATTEN_ABOVE_SAMPLES;
    const from = Math.max(0, shift);
    const to = Math.min(ns, ns + shift);
    if (to > from) out.set(a.subarray(i * ns + from, i * ns + to), i * ns + from - shift);
  }
  return out;
}

function percentileAbs(a: Float32Array, q: number): number {
  const stride = Math.max(1, Math.floor(a.length / 200_000));
  const sample = new Float32Array(Math.ceil(a.length / stride));
  for (let i = 0, k = 0; i < a.length; i += stride, k++) sample[k] = Math.abs(a[i]);
  sample.sort();
  return sample[Math.floor(q * (sample.length - 1))] || 1;
}

export function processFlight({ meta, raw }: Flight, p: ProcessingParams): Processed {
  const { nTraces: n, nSamples: ns, dtNs, surface } = meta;
  let a: Float32Array = Float32Array.from(raw);
  dewow(a, n, ns, Math.round(p.dewowNs / dtNs) | 1);
  if (p.backgroundTraces > 0) a = removeBackground(a, n, ns, p.backgroundTraces);
  applyGain(a, n, ns, surface, p.gainDbPerNs * dtNs);
  const data = p.flatten ? flatten(a, n, ns, surface) : a;
  return {
    data,
    nTraces: n,
    nRows: ns,
    zeroRow: p.flatten ? FLATTEN_ABOVE_SAMPLES : meta.t0Sample,
    surfaceRow: p.flatten ? new Int32Array(n).fill(FLATTEN_ABOVE_SAMPLES) : Int32Array.from(surface),
    flattened: p.flatten,
    clip: percentileAbs(data, CLIP_PERCENTILE),
  };
}
