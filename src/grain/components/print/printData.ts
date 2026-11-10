import { DECISIONS, INTAKE_FIELDS } from '../../config/constants';
import type { AnalysisResult, CommodityMeta, LotDetails, SignedRecord } from '../../types/analysis';
import { clock, dateLabel } from '../../utils/format';
import type { LbSummary } from '../../utils/grade';

/** Everything the printed report and slip show. */
export interface PrintData {
  result: AnalysisResult;
  meta: CommodityMeta;
  lot: LotDetails;
  lb: LbSummary;
  signed: SignedRecord | null;
  deviceId: string;
  disclaimer: string;
}

export const stamp = (iso: string): string => `${dateLabel(new Date(iso))} ${clock(new Date(iso))}`;

/** The officer's signed decision, e.g. "VALUE CUT · 10 NOV 2026 14:02:11", or pending. */
export function decisionText(signed: SignedRecord | null): string {
  if (!signed) return 'PENDING OFFICER DECISION';
  const id = String(signed.payload.officer_decision);
  const label = DECISIONS.find((d) => d.id === id)?.label ?? id;
  return `${label} · ${stamp(String(signed.payload.decided_at))}`;
}

/** Filled intake fields as label/value pairs. */
export const lotRows = (lot: LotDetails): [string, string][] =>
  INTAKE_FIELDS.filter((f) => lot[f.id].trim()).map((f) => [f.label, lot[f.id]]);
