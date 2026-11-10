import { DECISIONS } from '../../config/constants';
import type { OutboxEntry } from '../../types/analysis';
import { StatCell } from '../common/StatCell';

interface Props {
  entries: OutboxEntry[];
}

/** Queue size and the count of each officer decision. */
export function SyncTiles({ entries }: Props) {
  const count = (id: string): number => entries.filter((e) => String(e.decision.payload.officer_decision) === id).length;
  return (
    <div className="sync-tiles">
      <StatCell label="QUEUED" value={String(entries.length)} />
      {DECISIONS.map((d) => <StatCell key={d.id} label={d.label} value={String(count(d.id))} />)}
    </div>
  );
}
