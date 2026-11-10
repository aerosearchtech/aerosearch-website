import { INTAKE_FIELDS, PRODUCT_NAME } from '../../config/constants';
import type { LotDetails } from '../../types/analysis';

interface Props {
  lot: LotDetails;
  deviceId: string;
}

/** Live view of the lot block that prints on the slip. */
export function SlipPreview({ lot, deviceId }: Props) {
  return (
    <div className="slip-preview">
      <div className="slip-paper">
        <div className="slip-center"><strong>{PRODUCT_NAME}</strong><br />GRAIN QUALITY SLIP</div>
        <div className="slip-row"><span>Device</span><span>{deviceId}</span></div>
        {INTAKE_FIELDS.map((f) => (
          <div key={f.id} className="slip-row">
            <span>{f.label}</span>
            <span>{lot[f.id].trim() ? `${lot[f.id]}${f.numeric ? ' %' : ''}` : '—'}</span>
          </div>
        ))}
        <div className="slip-cut" />
        <div className="slip-center slip-muted">Results after analysis</div>
      </div>
    </div>
  );
}
