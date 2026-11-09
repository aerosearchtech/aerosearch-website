import { cutAmount } from '../../lib/bands';
import { shortHex } from '../../lib/crypto';
import { toneVar, type Tone } from '../../lib/theme';
import type { SealedRecord } from '../../lib/types';
import SlipCheck from './SlipCheck';

interface Props {
  record: SealedRecord;
  verified: boolean | null;
  status: { text: string; tag: string; tone: Tone };
}

export default function SignedReading({ record, verified, status }: Props) {
  const { reading, band, node } = record;
  return (
    <section className="m-pane" style={{ padding: '30px 36px' }}>
      <span className="m-section">Signed reading</span>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: 22 }}>
        <span className="m-num" style={{ fontSize: 140, lineHeight: 0.82 }}>{reading.moisture.toFixed(1)}</span>
        <span className="m-num" style={{ fontSize: 40, color: 'var(--mute)', paddingBottom: 10 }}>%</span>
      </div>

      <div className="m-stats" style={{ marginTop: 20, gridTemplateColumns: '1fr 1fr' }}>
        <div className="m-stat">
          <span className="m-label">Band · node marked</span>
          <span className="m-mono" style={{ fontSize: 15, color: toneVar(band.tone) }}>{band.label}</span>
        </div>
        <div className="m-stat">
          <span className="m-label">Value cut on lot</span>
          <span className="m-num" style={{ fontSize: 26, letterSpacing: '-0.02em' }}>{cutAmount(band)}</span>
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span className="m-label">Port line · as received from meter</span>
        <div className="m-well">
          &gt; {reading.line}
          <br />
          <span style={{ color: 'var(--mute)' }}>
            &gt; sha256 {shortHex(node.hash)} · sig {verified === null ? '…' : verified ? 'ok' : 'FAILED'} · {record.software}
          </span>
        </div>
      </div>

      <SlipCheck reading={reading} />

      <div className="m-frame m-push m-row" style={{ alignItems: 'center', marginTop: 18 }}>
        <span className="m-body">{status.text}</span>
        <span className="m-meta" style={{ color: toneVar(status.tone), letterSpacing: '0.14em' }}>{status.tag}</span>
      </div>
    </section>
  );
}
