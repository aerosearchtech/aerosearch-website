import type { KernelResult, RefractionResult } from '../types/analysis';

const plural = (n: number): string => `${n} line${n > 1 ? 's' : ''}`;

/** Whether every line is within limit, and a one-line explanation of the verdict. */
export function verdictDetail(rows: RefractionResult[]): { within: boolean; detail: string } {
  const over = rows.filter((r) => r.status === 'over');
  const near = rows.filter((r) => r.status === 'near');
  const names = (list: RefractionResult[]): string => list.map((r) => r.label).join(', ');
  if (over.length) return { within: false, detail: `${plural(over.length)} over limit: ${names(over)}.` };
  if (near.length) return { within: true, detail: `${plural(near.length)} near limit: ${names(near)}.` };
  return { within: true, detail: `All ${rows.length} lines within limit.` };
}

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
