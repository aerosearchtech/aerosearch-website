import { allowedDecisions } from '../../lib/bands';
import { recordNo } from '../../lib/format';
import { toneVar, type Tone } from '../../lib/theme';
import type { Decision, SealedRecord } from '../../lib/types';

const OPTIONS: { id: Decision; title: string; sub: string; key: string; tone: Tone }[] = [
  { id: 'accept', title: 'Accept', sub: 'Within FAQ, full MSP', key: 'A', tone: 'ok' },
  { id: 'cut', title: 'Apply value cut', sub: "Per the season's band file", key: 'C', tone: 'warn' },
  { id: 'reject', title: 'Reject', sub: 'Return lot, reason logged', key: 'R', tone: 'bad' },
];

interface Props {
  record: SealedRecord;
  staged: Decision | null;
  busy: boolean;
  onStage: (d: Decision) => void;
  onSubmit: () => void;
}

export default function DecisionPanel({ record, staged, busy, onStage, onSubmit }: Props) {
  const allowed = allowedDecisions(record.band);
  return (
    <aside className="m-pane" style={{ padding: '30px 28px', gap: 12 }}>
      <span className="m-section" style={{ marginBottom: 6 }}>Decision</span>
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          className="m-option"
          aria-pressed={staged === o.id}
          disabled={!allowed.includes(o.id)}
          onClick={() => onStage(o.id)}
        >
          <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="m-num" style={{ fontSize: 24, letterSpacing: '-0.02em', color: 'var(--tx)' }}>{o.title}</span>
            <span className="m-body" style={{ fontSize: 12, color: 'var(--mute)' }}>{o.sub}</span>
          </span>
          <span className="m-key" style={{ color: toneVar(o.tone) }}>{o.key}</span>
        </button>
      ))}
      <div className="m-push" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span className="m-body" style={{ fontSize: 12, color: 'var(--mute)' }}>
          Options outside the band file are locked. Your decision is countersigned with your officer key and appended to
          record {recordNo(record.no)}.
        </span>
        <button className="m-btn-primary" style={{ padding: 18 }} disabled={!staged || busy} onClick={onSubmit}>
          COUNTERSIGN &amp; SUBMIT
        </button>
      </div>
    </aside>
  );
}
