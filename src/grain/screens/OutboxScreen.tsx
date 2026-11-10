import { Panel } from '../components/common/Panel';
import { decisionText } from '../components/print/printData';
import { OUTBOX_NOTE, PRINT_FILE_PREFIX } from '../config/constants';
import type { OutboxEntry } from '../types/analysis';
import { downloadJson } from '../utils/download';

interface Props {
  entries: OutboxEntry[];
}

const lotLabel = (e: OutboxEntry): string => [e.lot.truck, e.lot.stack].filter((s) => s.trim()).join(' · ') || '—';

/** Signed records queued for Anna Darpan. The link is not set up, so nothing is sent. */
export function OutboxScreen({ entries }: Props) {
  return (
    <div className="outbox-screen">
      <Panel num="07" title="ANNA DARPAN OUTBOX" aside={<span className="outbox-state"><i />NOT CONNECTED</span>}>
        <div className="outbox-table-wrap">
          <div className="outbox-table">
            <div className="outbox-row outbox-head">
              <span>SAMPLE</span><span>LOT</span><span>VERDICT</span><span>OFFICER DECISION</span><span>STATUS</span><span />
            </div>
            {entries.length === 0 && <div className="outbox-empty note-text">No signed records yet. Sign a decision on the report to queue it here.</div>}
            {entries.map((e, i) => (
              <div key={`${e.sampleId}-${i}`} className="outbox-row">
                <span className="mono">{e.sampleId}</span>
                <span>{lotLabel(e)}</span>
                <span>{e.verdict}</span>
                <span className="mono">{decisionText(e.decision)}</span>
                <span className="outbox-status">QUEUED</span>
                <button
                  type="button"
                  className="btn-mini"
                  onClick={() => downloadJson(`${PRINT_FILE_PREFIX}-${e.sampleId}-record.json`, { result: e.result, decision: e.decision, lot_entered_by_operator: e.lot })}
                >
                  JSON
                </button>
              </div>
            ))}
          </div>
        </div>
        <p className="panel-body note-text">{OUTBOX_NOTE}</p>
      </Panel>
    </div>
  );
}
