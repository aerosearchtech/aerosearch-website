interface Props {
  label: string;
  value: string;
  unit?: string;
}

/** Labelled read-out used in the capture telemetry row and the report summary. */
export function StatCell({ label, value, unit }: Props) {
  return (
    <div className="stat">
      <span className="label">{label}</span>
      <span className="stat-value">
        {value}
        {unit && <small>{unit}</small>}
      </span>
    </div>
  );
}
