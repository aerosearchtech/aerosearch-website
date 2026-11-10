import { Panel } from '../components/common/Panel';
import { SlipPreview } from '../components/intake/SlipPreview';
import { EMPTY_LOT, INTAKE_FIELDS, INTAKE_MAX_CHARS } from '../config/constants';
import type { LotDetails } from '../types/analysis';

interface Props {
  lot: LotDetails;
  deviceId: string;
  onChange: (lot: LotDetails) => void;
  onContinue: () => void;
}

/** Lot and consignment details, entered before the sample is analysed. */
export function IntakeScreen({ lot, deviceId, onChange, onContinue }: Props) {
  return (
    <div className="intake-screen">
      <Panel num="00" title="LOT INTAKE" aside="ENTERED BY OPERATOR" className="intake-main">
        <div className="panel-body intake-body">
          {INTAKE_FIELDS.map((f) => (
            <label key={f.id} className="intake-field">
              <span className="label">{f.label.toUpperCase()}</span>
              <input
                value={lot[f.id]}
                onChange={(e) => onChange({ ...lot, [f.id]: e.target.value })}
                placeholder={f.hint}
                inputMode={f.numeric ? 'decimal' : 'text'}
                type={f.numeric ? 'number' : 'text'}
                step={f.numeric ? '0.1' : undefined}
                maxLength={INTAKE_MAX_CHARS}
              />
            </label>
          ))}
        </div>
        <div className="intake-actions">
          <button type="button" className="btn-mini" onClick={() => onChange(EMPTY_LOT)}>CLEAR</button>
          <button type="button" className="btn-start" onClick={onContinue}>CONTINUE TO ANALYSE <span>▸</span></button>
        </div>
      </Panel>
      <Panel num="00" title="SLIP PREVIEW" className="intake-side">
        <SlipPreview lot={lot} deviceId={deviceId} />
      </Panel>
    </div>
  );
}
