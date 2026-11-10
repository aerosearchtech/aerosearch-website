import { GRADE_A_LB, MODE_LABELS } from '../../config/constants';
import type { AnalysisResult, CommodityMeta } from '../../types/analysis';
import { pct, seconds } from '../../utils/format';
import type { LbSummary } from '../../utils/grade';
import { verdictDetail } from '../../utils/refractions';
import { StatCell } from '../common/StatCell';

interface Props {
  result: AnalysisResult;
  meta: CommodityMeta;
  lb: LbSummary;
}

/** Sample facts on the left, the device's verdict against the schedule on the right. */
export function ReportSummary({ result, meta, lb }: Props) {
  const { within, detail } = verdictDetail(result.refractions);
  const isTray = result.mode === 'image';

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
        <StatCell label={`L/B MEDIAN · A ≥ ${GRADE_A_LB}`} value={lb.median?.toFixed(2) ?? '—'} unit={lb.grade ?? undefined} />
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
