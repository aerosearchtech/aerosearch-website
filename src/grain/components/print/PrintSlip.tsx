import { ORG_NAME, SLIP_SIGNATURE_CHARS, STATUS_LABELS } from '../../config/constants';
import { pct } from '../../utils/format';
import { verdictDetail } from '../../utils/refractions';
import { decisionText, lotRows, stamp, type PrintData } from './printData';

/** 80 mm thermal slip handed over at the procurement counter. */
export function PrintSlip({ result, meta, lot, lb, signed, deviceId }: PrintData) {
  const { within } = verdictDetail(result.refractions);
  const short = (sig: string): string => `${sig.slice(0, SLIP_SIGNATURE_CHARS)}…`;

  return (
    <article className="ps">
      <div className="ps-center"><strong>{ORG_NAME}</strong><br />GRAIN QUALITY SLIP</div>
      <hr />
      <div className="ps-row"><span>Sample</span><span>{result.sample_id}</span></div>
      <div className="ps-row"><span>Date</span><span>{stamp(result.created_at)}</span></div>
      <div className="ps-row"><span>Device</span><span>{deviceId}</span></div>
      {lotRows(lot).map(([k, v]) => (<div key={k} className="ps-row"><span>{k}</span><span>{v}</span></div>))}
      <hr />
      <div className="ps-row"><span>{meta.label}</span><span>{result.kernels.length} kernels · {result.total_mass_g.toFixed(2)} g</span></div>
      {result.refractions.map((r) => (
        <div key={r.id} className="ps-row">
          <span>{r.label}</span>
          <span>{pct(r.mass_pct)} / {pct(r.limit_pct)} {STATUS_LABELS[r.status]}</span>
        </div>
      ))}
      <div className="ps-row"><span>L/B median</span><span>{lb.median?.toFixed(2) ?? '—'} {lb.grade ?? ''}</span></div>
      <hr />
      <div className="ps-center"><strong>{within ? 'WITHIN SPEC' : 'OUTSIDE SPEC'}</strong></div>
      <div className="ps-row"><span>Decision</span><span>{decisionText(signed)}</span></div>
      <div className="ps-row"><span>Result sig</span><span>{short(result.record.signature)}</span></div>
      {signed && <div className="ps-row"><span>Decision sig</span><span>{short(signed.signature)}</span></div>}
      <hr />
      <div className="ps-center">FCI limits indicative</div>
    </article>
  );
}
