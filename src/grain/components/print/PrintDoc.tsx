import { createPortal } from 'react-dom';
import type { PrintKind } from '../../types/analysis';
import type { PrintData } from './printData';
import { PrintReport } from './PrintReport';
import { PrintSlip } from './PrintSlip';

interface Props {
  kind: PrintKind;
  data: PrintData;
}

/** Mounted on <body> while printing; print CSS hides everything else. Always light. */
export function PrintDoc({ kind, data }: Props) {
  return createPortal(
    <div className="grain-root grain-print" data-theme="light">
      {kind === 'report' ? <PrintReport {...data} /> : <PrintSlip {...data} />}
    </div>,
    document.body,
  );
}
