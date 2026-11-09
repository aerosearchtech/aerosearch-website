import { formatInr } from '../../lib/bands';
import { recordNo as fmtNo } from '../../lib/format';
import { CENTRE_LONG, CUSTODY, LOT } from '../../lib/constants';
import { Check, KV } from '../ui';

export default function LotDossier({ no, verified }: { no: number; verified: boolean | null }) {
  return (
    <section className="m-pane" style={{ padding: '30px 28px', gap: 22 }}>
      <span className="m-section">Lot dossier</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="m-num" style={{ fontSize: 32, letterSpacing: '-0.02em' }}>{LOT.id}</span>
        <span className="m-body" style={{ color: 'var(--mute)' }}>{CENTRE_LONG}</span>
      </div>
      <div style={{ borderTop: '1px solid var(--lineSoft)' }}>
        <KV k="COMMODITY" v={LOT.commodity} />
        <KV k="BAGS" v={`${LOT.bags} × ${LOT.bagKg} KG`} />
        <KV k="QUANTITY" v={`${LOT.quintals.toFixed(2)} Q`} />
        <KV k="MSP" v={`${formatInr(LOT.mspPerQuintal).replace('.00', '')} / Q`} />
        <KV k="RECORD" v={fmtNo(no)} />
      </div>
      <div className="m-push" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="m-label">Integrity</span>
        {verified === null && <span className="m-meta">Verifying node signature…</span>}
        {verified === true && <Check>Node signature verified</Check>}
        {verified === false && <span className="m-meta" style={{ color: 'var(--bad)' }}>✕ Node signature failed</span>}
        <Check>Seal intact since {CUSTODY.sealSince}</Check>
        <Check>Custody Δ within tolerance</Check>
      </div>
    </section>
  );
}
