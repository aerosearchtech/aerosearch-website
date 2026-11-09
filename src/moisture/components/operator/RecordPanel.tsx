import { classify } from '../../lib/bands';
import { BAND_FILE, CENTRE_LABEL, CUSTODY, FIRST_RECORD_NO, LOT, METER_SERIAL, NODE_KEY_ID, NODE_SOFTWARE, SIG_SCHEME } from '../../lib/constants';
import { groupHex } from '../../lib/crypto';
import { recordNo } from '../../lib/format';
import { useMoisture } from '../../lib/store';
import { KV } from '../ui';

/** The draft record for the live reading, or the last sealed one once filed. */
export default function RecordPanel() {
  const { reading: live, records } = useMoisture();
  const last = records[records.length - 1];
  const sealed = live ? undefined : last;
  const reading = live ?? last?.reading;
  const no = sealed ? sealed.no : FIRST_RECORD_NO + records.length;
  const band = reading ? classify(reading.moisture) : null;

  return (
    <aside className="m-pane">
      <div className="m-row" style={{ marginBottom: 14 }}>
        <span className="m-section">{sealed ? 'Record · sealed' : 'Record · draft'}</span>
        <span className="m-num" style={{ fontSize: 22 }}>{recordNo(no)}</span>
      </div>

      <div>
        <KV k="CENTRE" v={CENTRE_LABEL} />
        <KV k="LOT" v={LOT.id} />
        <KV k="METER ID" v={METER_SERIAL} />
        <KV k="MOISTURE" v={reading ? `${reading.moisture.toFixed(1)} %` : '--'} tone={band?.tone} />
        <KV k="TEMPERATURE" v={reading ? `${reading.tempC.toFixed(1)} °C` : '--'} />
        <KV k="HUMIDITY" v={reading ? `${reading.rh} %` : '--'} />
        <KV k="CUP" v={reading ? reading.cup : '--'} />
        <KV k="BAND FILE" v={BAND_FILE.ref} />
        <KV k="NODE SOFTWARE" v={NODE_SOFTWARE} />
      </div>

      <div className="m-frame" style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="m-row">
          <span className="m-label">Digital signature</span>
          <span className="m-meta" style={{ color: sealed ? 'var(--ok)' : 'var(--mute)' }}>
            {!sealed ? 'AWAITING SEAL' : sealed.synced ? '✓ SIGNED · SENT' : '✓ SIGNED · QUEUED'}
          </span>
        </div>
        <span className="m-mono" style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--tx2)', minHeight: 38 }}>
          {sealed ? groupHex(sealed.node.sig, 12) : 'Signed with the node key when you seal.'}
        </span>
        <span className="m-meta" style={{ fontSize: 10 }}>{SIG_SCHEME} · KEY {NODE_KEY_ID}</span>
      </div>

      <div className="m-push m-meta" style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
        <div className="m-row">
          <span>CUSTODY SAMPLE {CUSTODY.sampleTime}</span>
          <span style={{ color: 'var(--ok)' }}>Δ {CUSTODY.delta} / TOL {CUSTODY.tolerance}</span>
        </div>
        <div className="m-row">
          <span>OVEN CHECK · {CUSTODY.ovenStandard}</span>
          <span style={{ color: 'var(--tx)' }}>{CUSTODY.ovenDate}</span>
        </div>
        <div className="m-row">
          <span>PORT SEAL · RS-232</span>
          <span style={{ color: 'var(--ok)' }}>INTACT · {CUSTODY.sealDays} D</span>
        </div>
      </div>
    </aside>
  );
}
