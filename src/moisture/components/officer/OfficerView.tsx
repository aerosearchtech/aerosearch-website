import { useEffect, useState } from 'react';
import { cutAmount } from '../../lib/bands';
import { NODE_KEY_ID } from '../../lib/constants';
import { verifyText } from '../../lib/crypto';
import { pendingRecords, useMoisture } from '../../lib/store';
import type { Tone } from '../../lib/theme';
import type { Decision, SealedRecord } from '../../lib/types';
import DecisionPanel from './DecisionPanel';
import LotDossier from './LotDossier';
import SignedReading from './SignedReading';

function statusFor(record: SealedRecord, staged: Decision | null): { text: string; tag: string; tone: Tone } {
  switch (staged) {
    case 'accept':
      return { text: 'Staged: accept at full MSP.', tag: 'ACCEPT', tone: 'ok' };
    case 'cut':
      return { text: `Staged: apply value cut of ${cutAmount(record.band)} to the lot.`, tag: 'VALUE CUT', tone: 'warn' };
    case 'reject':
      return { text: 'Staged: reject. Reason will be appended to the record.', tag: 'REJECT', tone: 'bad' };
    default:
      return { text: 'Select a decision. Nothing is filed until you countersign.', tag: 'AWAITING', tone: 'mute' };
  }
}

function Pending({ record }: { record: SealedRecord }) {
  const { busy, decide } = useMoisture();
  const [staged, setStaged] = useState<Decision | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    let live = true;
    verifyText(NODE_KEY_ID, record.reading.line, record.node.sig).then((ok) => live && setVerified(ok));
    return () => {
      live = false;
    };
  }, [record]);

  return (
    <main className="m-view" style={{ gridTemplateColumns: '300px minmax(0, 1fr) 380px' }}>
      <LotDossier no={record.no} verified={verified} />
      <SignedReading record={record} verified={verified} status={statusFor(record, staged)} />
      <DecisionPanel
        record={record}
        staged={staged}
        busy={busy || !verified}
        onStage={setStaged}
        onSubmit={() => staged && decide(record.no, staged)}
      />
    </main>
  );
}

export default function OfficerView() {
  const { records, setRole } = useMoisture();
  const next = pendingRecords(records)[0];

  if (!next) {
    return (
      <main className="m-empty">
        <span className="m-section">No records pending</span>
        <span className="m-body" style={{ color: 'var(--mute)' }}>
          Sealed readings land here once the node&apos;s link is up. Records still queued on the node do not.
        </span>
        <button className="m-btn" onClick={() => setRole('operator')}>GO TO OPERATOR</button>
      </main>
    );
  }
  return <Pending key={next.no} record={next} />;
}
