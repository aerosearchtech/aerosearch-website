import type { AnalysisResult, KernelResult } from '../../types/analysis';
import { StatCell } from '../common/StatCell';

interface Props {
  result: AnalysisResult | null;
  visible: KernelResult[];
}

const DASH = '—';

/** Live read-outs computed from the kernels on screen. */
export function TelemetryRow({ result, visible }: Props) {
  const n = visible.length;
  const massG = visible.reduce((s, k) => s + k.mass_mg, 0) / 1000;
  const defects = visible.filter((k) => k.pred !== 'NOR').length;
  const isTray = result?.mode === 'image';
  const matched = visible.filter((k) => k.truth === k.pred).length;
  const passS = result ? result.duration_ms / 1000 : 0;

  return (
    <div className="telemetry">
      <StatCell label="KERNELS IMAGED" value={String(n)} unit={result ? `/ ${result.kernels.length}` : undefined} />
      <StatCell label={isTray ? 'EST. MASS' : 'SAMPLE MASS'} value={n ? massG.toFixed(2) : DASH} unit={n ? 'g' : undefined} />
      <StatCell label="DEFECTS" value={n ? String(defects) : DASH} unit={n ? `${((defects / n) * 100).toFixed(1)}%` : undefined} />
      {isTray ? (
        <StatCell label="CLUMPS SKIPPED" value={String(result.skipped_clumps)} />
      ) : (
        <StatCell label="MATCH TO INSPECTOR" value={n ? ((matched / n) * 100).toFixed(1) : DASH} unit={n ? '%' : undefined} />
      )}
      <StatCell label="PASS TIME" value={result ? passS.toFixed(2) : DASH} unit={result ? 's' : undefined} />
      <StatCell label="THROUGHPUT" value={result && passS ? Math.round(result.kernels.length / passS).toLocaleString('en-IN') : DASH} unit={result ? 'k/s' : undefined} />
    </div>
  );
}
