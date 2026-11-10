import { INTAKE_FIELDS } from '../../config/constants';
import type { LotDetails } from '../../types/analysis';

interface Props {
  lot: LotDetails;
}

/** The intake fields the operator filled in, shown above the report. */
export function LotStrip({ lot }: Props) {
  const filled = INTAKE_FIELDS.filter((f) => lot[f.id].trim());
  if (!filled.length) return null;
  return (
    <dl className="lot-strip">
      {filled.map((f) => (
        <div key={f.id}>
          <dt className="label">{f.label.toUpperCase()}</dt>
          <dd>{lot[f.id]}</dd>
        </div>
      ))}
    </dl>
  );
}
