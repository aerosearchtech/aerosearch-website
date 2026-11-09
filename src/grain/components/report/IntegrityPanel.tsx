import { useState } from 'react';
import type { AnalysisResult, SignedRecord } from '../../types/analysis';
import { kb, time } from '../../utils/format';
import { Panel } from '../common/Panel';

interface Props {
  result: AnalysisResult;
  signed: SignedRecord | null;
  deviceId: string;
}

const COPIED_MS = 1500;

/** What would be pushed to Anna Darpan: the signed result, then the signed decision. */
export function IntegrityPanel({ result, signed, deviceId }: Props) {
  const [copied, setCopied] = useState<boolean>(false);
  const record = signed ?? result.record;
  const text = JSON.stringify(record, null, 2);
  const decision = signed ? `${String(signed.payload.officer_decision).replace('_', ' ')} · ${time(String(signed.payload.decided_at))}` : 'PENDING OFFICER DECISION';

  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <Panel num="06" title="RECORD INTEGRITY" aside={kb(text)}>
      <dl className="panel-body integrity">
        <dt>SAMPLE ID</dt><dd>{result.sample_id}</dd>
        <dt>RESULT SIGNATURE · HMAC-SHA256</dt><dd>{result.record.signature}</dd>
        <dt>OFFICER DECISION</dt><dd className={signed ? '' : 'is-pending'}>{decision}</dd>
        {signed && (<><dt>DECISION SIGNATURE</dt><dd>{signed.signature}</dd></>)}
        <dt>KEY</dt><dd>DEMO DEVICE KEY · {deviceId}</dd>
      </dl>
      <details className="record">
        <summary>
          <span>VIEW RECORD JSON</span>
          <button type="button" className="btn-mini" onClick={(e) => { e.preventDefault(); void copy(); }}>{copied ? 'COPIED' : 'COPY'}</button>
        </summary>
        <pre>{text}</pre>
      </details>
    </Panel>
  );
}
