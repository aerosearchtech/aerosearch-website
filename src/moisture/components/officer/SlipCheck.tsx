import { slipRows } from '../../lib/slip';
import type { MeterReading } from '../../lib/types';

/** Printed slip against the filed record, field by field. */
export default function SlipCheck({ reading }: { reading: MeterReading }) {
  const rows = slipRows(reading);
  return (
    <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="m-label">Printed slip · field check</span>
      <div className="m-meta" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.4fr 1.4fr 24px', rowGap: 6, fontSize: 12 }}>
        <span>FIELD</span>
        <span>SLIP</span>
        <span>RECORD</span>
        <span />
        {rows.map((r) => {
          const ok = r.slip === r.record;
          return [
            <span key={`${r.field}f`}>{r.field}</span>,
            <span key={`${r.field}s`} style={{ color: 'var(--tx)' }}>{r.slip}</span>,
            <span key={`${r.field}r`} style={{ color: 'var(--tx)' }}>{r.record}</span>,
            <span key={`${r.field}m`} style={{ color: ok ? 'var(--ok)' : 'var(--bad)' }}>{ok ? '✓' : '✕'}</span>,
          ];
        })}
      </div>
    </div>
  );
}
