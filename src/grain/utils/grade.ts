import { BROKEN_REFRACTION, GRADE_A_LB } from '../config/constants';
import type { GrainClass, KernelResult, LbGrade } from '../types/analysis';

export interface LbSummary {
  median: number | null;
  grade: LbGrade | null;
  measured: number;
}

/** Median L/B of the whole kernels that could be measured, and the grade it implies. */
export function lbSummary(kernels: KernelResult[], classes: GrainClass[]): LbSummary {
  const broken = new Set(classes.filter((c) => c.refraction === BROKEN_REFRACTION).map((c) => c.code));
  const values = kernels
    .filter((k) => k.lb !== null && !broken.has(k.pred))
    .map((k) => k.lb as number)
    .sort((a, b) => a - b);
  if (!values.length) return { median: null, grade: null, measured: 0 };
  const mid = Math.floor(values.length / 2);
  const median = values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  return { median, grade: median >= GRADE_A_LB ? 'A' : 'COMMON', measured: values.length };
}
