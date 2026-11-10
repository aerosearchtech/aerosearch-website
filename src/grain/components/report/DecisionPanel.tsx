import { useState } from 'react';
import { DECISIONS } from '../../config/constants';
import type { Decision, SignedRecord } from '../../types/analysis';
import { time } from '../../utils/format';
import { Panel } from '../common/Panel';

interface Props {
  createdAt: string;
  signed: SignedRecord | null;
  onSign: (decision: Decision) => Promise<void>;
  onNext: () => void;
}

/** The device reports; the officer decides, and the decision is signed into the record. */
export function DecisionPanel({ createdAt, signed, onSign, onNext }: Props) {
  const [choice, setChoice] = useState<Decision | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const decided = (signed?.payload.officer_decision as Decision | undefined) ?? null;

  const sign = async (): Promise<void> => {
    if (!choice) return;
    setBusy(true);
    setError(null);
    try {
      await onSign(choice);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const signLabel = decided ? `SIGNED · ${DECISIONS.find((d) => d.id === decided)?.label}` : choice ? 'SIGN DECISION' : 'SELECT A DECISION';

  return (
    <Panel num="04" title="OFFICER DECISION" aside={time(createdAt)}>
      <div className="panel-body decision">
        <div className="decision-grid">
          {DECISIONS.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`decision-btn is-${d.id.toLowerCase()} ${(decided ?? choice) === d.id ? 'is-active' : ''}`}
              onClick={() => setChoice(d.id)}
              disabled={decided !== null || busy}
            >
              {d.label}
            </button>
          ))}
        </div>
        <button type="button" className={`btn-sign ${decided ? 'is-done' : ''}`} onClick={sign} disabled={!choice || decided !== null || busy}>
          {busy ? 'SIGNING…' : signLabel}
        </button>
        {error && <div className="alert">{error}</div>}
        {decided && <button type="button" className="btn-start" onClick={onNext}>NEXT SAMPLE <span>▸</span></button>}
        <p className="note-text">The device reports. The officer decides.</p>
      </div>
    </Panel>
  );
}
