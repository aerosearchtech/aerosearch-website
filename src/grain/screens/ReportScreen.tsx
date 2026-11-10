import { useMemo } from 'react';
import { Panel } from '../components/common/Panel';
import { PrintDoc } from '../components/print/PrintDoc';
import { ClassBreakdown } from '../components/report/ClassBreakdown';
import { DecisionPanel } from '../components/report/DecisionPanel';
import { IntegrityPanel } from '../components/report/IntegrityPanel';
import { LotStrip } from '../components/report/LotStrip';
import { RefractionTable } from '../components/report/RefractionTable';
import { ReportActions } from '../components/report/ReportActions';
import { ReportSummary } from '../components/report/ReportSummary';
import { ReviewPanel } from '../components/report/ReviewPanel';
import { PRINT_FILE_PREFIX, REVIEW_CONFIDENCE, REVIEW_MAX } from '../config/constants';
import { usePrint } from '../hooks/usePrint';
import type { AnalysisResult, CommodityMeta, Decision, KernelResult, LotDetails, SignedRecord } from '../types/analysis';
import { downloadJson } from '../utils/download';
import { lbSummary } from '../utils/grade';
import { classCounts, reviewQueue } from '../utils/refractions';

interface Props {
  result: AnalysisResult | null;
  meta: CommodityMeta | null;
  lot: LotDetails;
  disclaimer: string;
  inProgress: boolean;
  signed: SignedRecord | null;
  deviceId: string;
  onSign: (decision: Decision) => Promise<void>;
  onNext: () => void;
  onPickClass: (code: string) => void;
  onSelect: (k: KernelResult) => void;
}

export function ReportScreen({ result, meta, lot, disclaimer, inProgress, signed, deviceId, onSign, onNext, onPickClass, onSelect }: Props) {
  const review = useMemo<KernelResult[]>(
    () => (result ? reviewQueue(result.kernels, REVIEW_CONFIDENCE, REVIEW_MAX) : []),
    [result],
  );
  const lb = useMemo(() => lbSummary(result?.kernels ?? [], meta?.classes ?? []), [result, meta]);
  const fileStem = `${PRINT_FILE_PREFIX}-${result?.sample_id ?? ''}`;
  const [printing, print] = usePrint(fileStem);

  if (!result || !meta || inProgress) {
    return (
      <div className="report-empty">
        <span className="label">{inProgress ? 'ANALYSIS IN PROGRESS' : 'NO SAMPLE IN THIS SESSION'}</span>
        <div className="empty-title">{inProgress ? 'The report opens when the pass completes.' : 'Run a sample to generate a quality report.'}</div>
        <button type="button" className="btn-start" onClick={onNext}>GO TO ANALYSE <span>▸</span></button>
      </div>
    );
  }

  const basis = result.mode === 'image' ? 'EST. WEIGHT' : 'WEIGHT';
  const saveRecord = (): void => downloadJson(`${fileStem}-record.json`, { result: result.record, decision: signed });
  const actions = <ReportActions onPrint={print} onRecord={saveRecord} />;
  return (
    <div className="report-screen">
      <Panel num="03" title={`QUALITY REPORT · ${result.sample_id}`} aside={<>FCI LIMITS · INDICATIVE {actions}</>} className="report-main">
        <LotStrip lot={lot} />
        <ReportSummary result={result} meta={meta} lb={lb} />
        <RefractionTable rows={result.refractions} basis={basis} />
        <p className="panel-body note-text">
          Results are percent of sample weight against the FCI maximum. {result.mode === 'image'
            ? 'Tray photos estimate each kernel’s weight from its area.'
            : 'Reference lots use each kernel’s measured weight; both faces of every kernel are classified together.'} The mapping of model classes to refraction lines is indicative.
        </p>
        <ClassBreakdown classes={meta.classes} refractions={meta.refractions} counts={classCounts(result.kernels)} total={result.kernels.length} onPick={onPickClass} />
      </Panel>
      <aside className="report-side">
        <DecisionPanel key={result.sample_id} createdAt={result.created_at} signed={signed} onSign={onSign} onNext={onNext} />
        <ReviewPanel kernels={review} onSelect={onSelect} />
        <IntegrityPanel result={result} signed={signed} deviceId={deviceId} />
      </aside>
      {printing && <PrintDoc kind={printing} data={{ result, meta, lot, lb, signed, deviceId, disclaimer }} />}
    </div>
  );
}
