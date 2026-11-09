import { useCallback, useEffect, useRef, useState } from 'react';
import { REVEAL_DURATION_MS } from '../config/constants';
import type { RecordedSample } from '../types/analysis';

export type AnalysisStatus = 'idle' | 'running' | 'streaming' | 'done' | 'error';

export interface AnalysisState {
  status: AnalysisStatus;
  result: RecordedSample | null;
  revealed: number;
  error: string | null;
  run: (job: () => Promise<RecordedSample>) => Promise<void>;
  skip: () => void;
}

/** Runs an analysis, then streams its kernels onto the screen one by one. */
export function useAnalysis(): AnalysisState {
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<RecordedSample | null>(null);
  const [revealed, setRevealed] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const frame = useRef<number>(0);
  const total = useRef<number>(0);

  const stop = (): void => cancelAnimationFrame(frame.current);

  const skip = useCallback((): void => {
    stop();
    setRevealed(total.current);
    setStatus((s) => (s === 'streaming' ? 'done' : s));
  }, []);

  const run = useCallback(async (job: () => Promise<RecordedSample>): Promise<void> => {
    stop();
    setStatus('running');
    setError(null);
    setRevealed(0);
    try {
      const res = await job();
      setResult(res);
      setStatus('streaming');
      total.current = res.kernels.length;
      const start = performance.now();
      const tick = (now: number): void => {
        const n = Math.min(total.current, Math.ceil(((now - start) / REVEAL_DURATION_MS) * total.current));
        setRevealed(n);
        if (n < total.current) frame.current = requestAnimationFrame(tick);
        else setStatus('done');
      };
      frame.current = requestAnimationFrame(tick);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  }, []);

  useEffect(() => stop, []);

  return { status, result, revealed, error, run, skip };
}
