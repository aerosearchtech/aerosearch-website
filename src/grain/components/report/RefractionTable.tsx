import { LIMIT_MARK, STATUS_LABELS } from '../../config/constants';
import type { RefractionResult } from '../../types/analysis';
import { pct } from '../../utils/format';

interface Props {
  rows: RefractionResult[];
  basis: string;
}

const limitDigits = (limit: number): number => (limit < 1 ? 2 : 1);

export function RefractionTable({ rows, basis }: Props) {
  return (
    <div className="ref-table-wrap">
      <div className="ref-table">
        <div className="ref-row ref-head">
          <span>REFRACTION</span>
          <span>BASIS</span>
          <span className="num">RESULT</span>
          <span className="num">LIMIT</span>
          <span>USE OF LIMIT</span>
          <span className="num">STATUS</span>
        </div>
        {rows.map((r) => {
          const fill = Math.min(1, (r.mass_pct / r.limit_pct) * LIMIT_MARK);
          return (
            <div key={r.id} className={`ref-row is-${r.status}`}>
              <span className="ref-name">
                {r.label}
                <small>{r.count} kernel{r.count === 1 ? '' : 's'}</small>
              </span>
              <span className="ref-basis">{basis}</span>
              <span className="num ref-result">{pct(r.mass_pct)}</span>
              <span className="num ref-limit">{pct(r.limit_pct, limitDigits(r.limit_pct))}</span>
              <span className="use-bar">
                <span className="use-fill" style={{ width: `${fill * 100}%` }} />
                <span className="use-mark" style={{ left: `${LIMIT_MARK * 100}%` }} />
              </span>
              <span className="num"><span className="status-chip">{STATUS_LABELS[r.status]}</span></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
