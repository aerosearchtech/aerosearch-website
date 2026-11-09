import { MODE_LABELS } from '../../config/constants';
import type { AnalysisResult, CommodityMeta } from '../../types/analysis';
import { pct, seconds } from '../../utils/format';
import { StatCell } from '../common/StatCell';

interface Props {
  result: AnalysisResult;
  meta: CommodityMeta;
}

const listNames = (names: string[]): string => names.join(', ');

/** Sample facts on the left, the device's verdict against the schedule on the right. */
export function ReportSummary({ result, meta }: Props) {
  const over = result.refractions.filter((r) => r.status === 'over');
  const near = result.refractions.filter((r) => r.status === 'near');
  const within = over.length === 0;
  const isTray = result.mode === 'image';

  let detail = `All ${result.refractions.length} lines within limit.`;
  if (!within) detail = `${over.length} line${over.length > 1 ? 's' : ''} over limit: ${listNames(over.map((r) => r.label))}.`;
  else if (near.length) detail = `${near.length} line${near.length > 1 ? 's' : ''} near limit: ${listNames(near.map((r) => r.label))}.`;

  return (
    <div className="summary">
      <div className="summary-stats">
        <StatCell label="COMMODITY" value={meta.label} />
        <StatCell label="INPUT" value={MODE_LABELS[result.mode]} />
        <StatCell label={isTray ? 'EST. MASS' : 'MASS'} value={result.total_mass_g.toFixed(2)} unit="g" />
        <StatCell label="KERNELS" value={result.kernels.length.toLocaleString('en-IN')} />
        <StatCell label="PASS TIME" value={seconds(result.duration_ms)} />
        {result.agreement !== null
          ? <StatCell label="MATCH TO INSPECTOR" value={pct(result.agreement * 100, 1)} />
          : <StatCell label="CLUMPS SKIPPED" value={String(result.skipped_clumps)} />}
      </div>
      <div className={`verdict ${within ? 'is-ok' : 'is-bad'}`}>
        <span className="label">VERDICT AGAINST SCHEDULE</span>
        <span className="verdict-word">{within ? 'WITHIN SPEC' : 'OUTSIDE SPEC'}</span>
        <span className="verdict-detail">{detail}</span>
        <span className="verdict-rec">DEVICE RECOMMENDATION · {result.verdict}</span>
      </div>
    </div>
  );
}
