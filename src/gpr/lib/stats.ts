import { lineTraceIndices } from './cscan';
import type { FlightMeta } from './types';

export interface FlightStats {
  durationS: number;
  lineCount: number;
  lineLengthM: number;
  medianAltM: number;
  traceSpacingCm: number;
}

const median = (v: number[]): number => {
  const s = [...v].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : NaN;
};

export function flightStats(meta: FlightMeta): FlightStats {
  const onLine = lineTraceIndices(meta);
  const lineLengthM = meta.lines.reduce((sum, l) => sum + l.lengthM, 0);
  const lineTraces = meta.lines.reduce((sum, l) => sum + l.end - l.start, 0);
  return {
    durationS: meta.nTraces / meta.traceRateHz,
    lineCount: meta.lines.length,
    lineLengthM,
    medianAltM: median(onLine.map((i) => meta.alt[i])),
    traceSpacingCm: lineTraces ? (lineLengthM / lineTraces) * 100 : NaN,
  };
}
