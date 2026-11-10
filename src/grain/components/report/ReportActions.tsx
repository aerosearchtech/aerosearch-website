import type { PrintKind } from '../../types/analysis';

interface Props {
  onPrint: (kind: PrintKind) => void;
  onRecord: () => void;
}

/** Report downloads: A4 PDF, thermal slip, and the signed record as JSON. */
export function ReportActions({ onPrint, onRecord }: Props) {
  return (
    <span className="report-actions">
      <button type="button" className="btn-mini" onClick={() => onPrint('report')}>PDF REPORT</button>
      <button type="button" className="btn-mini" onClick={() => onPrint('slip')}>PRINT SLIP</button>
      <button type="button" className="btn-mini" onClick={onRecord}>SIGNED RECORD .JSON</button>
    </span>
  );
}
