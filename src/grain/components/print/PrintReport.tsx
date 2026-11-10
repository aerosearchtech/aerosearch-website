import Logo from '@/components/ui/Logo';
import { APP_TITLE, GRADE_A_LB, MODE_LABELS, ORG_NAME, STATUS_LABELS } from '../../config/constants';
import { pct } from '../../utils/format';
import { classCounts, verdictDetail } from '../../utils/refractions';
import { decisionText, lotRows, stamp, type PrintData } from './printData';

/** A4 quality report: lot, verdict, refraction lines, classes, decision and signatures. */
export function PrintReport({ result, meta, lot, lb, signed, deviceId, disclaimer }: PrintData) {
  const { within, detail } = verdictDetail(result.refractions);
  const counts = classCounts(result.kernels);
  const lines = lotRows(lot);
  const lineOf = (id: string): string => meta.refractions.find((r) => r.id === id)?.label ?? 'Sound';

  return (
    <article className="pr">
      <header className="pr-head">
        <Logo className="pr-logo" />
        <div>
          <div className="pr-brand">{ORG_NAME} {APP_TITLE}</div>
          <h1>Grain Quality Report</h1>
        </div>
        <dl className="pr-meta">
          <dt>Sample</dt><dd>{result.sample_id}</dd>
          <dt>Analysed</dt><dd>{stamp(result.created_at)}</dd>
          <dt>Device</dt><dd>{deviceId}</dd>
        </dl>
      </header>

      {lines.length > 0 && (
        <section>
          <h2>Lot details <small>entered by operator</small></h2>
          <dl className="pr-grid">{lines.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}</dl>
        </section>
      )}

      <section>
        <h2>Sample</h2>
        <dl className="pr-grid">
          <div><dt>Commodity</dt><dd>{meta.label}</dd></div>
          <div><dt>Input</dt><dd>{MODE_LABELS[result.mode]}</dd></div>
          <div><dt>{result.mode === 'image' ? 'Est. mass' : 'Mass'}</dt><dd>{result.total_mass_g.toFixed(2)} g</dd></div>
          <div><dt>Kernels</dt><dd>{result.kernels.length}</dd></div>
          <div><dt>L/B median (A ≥ {GRADE_A_LB})</dt><dd>{lb.median?.toFixed(2) ?? '—'} {lb.grade ?? ''}</dd></div>
          {result.agreement !== null && <div><dt>Match to inspector</dt><dd>{pct(result.agreement * 100, 1)}</dd></div>}
        </dl>
      </section>

      <section className={`pr-verdict ${within ? 'is-ok' : 'is-bad'}`}>
        <strong>{within ? 'WITHIN SPEC' : 'OUTSIDE SPEC'}</strong>
        <span>{detail} Device recommendation: {result.verdict}.</span>
      </section>

      <section>
        <h2>Refractions <small>% of sample {result.mode === 'image' ? 'est. weight' : 'weight'}, FCI limits indicative</small></h2>
        <table className="pr-table">
          <thead><tr><th>Line</th><th>Kernels</th><th>Result</th><th>Limit</th><th>Status</th></tr></thead>
          <tbody>
            {result.refractions.map((r) => (
              <tr key={r.id} className={`is-${r.status}`}>
                <td>{r.label}</td><td>{r.count}</td><td>{pct(r.mass_pct)}</td><td>{pct(r.limit_pct)}</td><td>{STATUS_LABELS[r.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Kernel classes</h2>
        <table className="pr-table">
          <thead><tr><th>Class</th><th>Line</th><th>Kernels</th><th>Share</th></tr></thead>
          <tbody>
            {meta.classes.map((c) => (
              <tr key={c.code}>
                <td>{c.label}</td><td>{lineOf(c.refraction)}</td><td>{counts[c.code] ?? 0}</td>
                <td>{pct(((counts[c.code] ?? 0) / Math.max(1, result.kernels.length)) * 100, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Officer decision and record</h2>
        <dl className="pr-sig">
          <dt>Decision</dt><dd>{decisionText(signed)}</dd>
          {lot.officer.trim() && (<><dt>Officer ID</dt><dd>{lot.officer}</dd></>)}
          <dt>Result signature ({result.record.alg})</dt><dd>{result.record.signature}</dd>
          {signed && (<><dt>Decision signature</dt><dd>{signed.signature}</dd></>)}
          <dt>Key</dt><dd>Demo device key · {deviceId}</dd>
        </dl>
      </section>

      <footer className="pr-foot">{disclaimer}</footer>
    </article>
  );
}
