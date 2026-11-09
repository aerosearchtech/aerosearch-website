import type { KernelResult } from '../types/analysis';

export function classCounts(kernels: KernelResult[]): Record<string, number> {
  return kernels.reduce<Record<string, number>>((acc, k) => {
    acc[k.pred] = (acc[k.pred] ?? 0) + 1;
    return acc;
  }, {});
}

/** Confidence as the console's two-digit tag, e.g. 0.934 -> ".93". */
export const confidenceTag = (p: number): string => (p >= 0.995 ? '1.0' : p.toFixed(2).slice(1));

/** Least-confident kernels, for the human review queue. */
export function reviewQueue(kernels: KernelResult[], threshold: number, max: number): KernelResult[] {
  return kernels.filter((k) => k.confidence < threshold).sort((a, b) => a.confidence - b.confidence).slice(0, max);
}
