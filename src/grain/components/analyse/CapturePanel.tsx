import { CAPTURE_LABELS, PIPELINE_STAGES } from '../../config/constants';
import type { AnalysisStatus } from '../../hooks/useAnalysis';
import type { AnalysisMode, AnalysisResult, KernelResult } from '../../types/analysis';
import { Panel } from '../common/Panel';
import { KernelGrid } from './KernelGrid';
import { PipelineBar } from './PipelineBar';
import { TelemetryRow } from './TelemetryRow';
import { TrayOverlay } from './TrayOverlay';

interface Props {
  status: AnalysisStatus;
  mode: AnalysisMode;
  result: AnalysisResult | null;
  visible: KernelResult[];
  progress: number;
  error: string | null;
  filter: string | null;
  onSelect: (k: KernelResult) => void;
}

const PHASES: Record<AnalysisStatus, string> = {
  idle: 'STANDBY',
  running: 'PROCESSING',
  streaming: 'STREAMING',
  done: 'COMPLETE',
  error: 'ERROR',
};

export function CapturePanel({ status, mode, result, visible, progress, error, filter, onSelect }: Props) {
  const shownMode = result?.mode ?? mode;
  const live = status === 'running' || status === 'streaming';
  const phase = <span className={`phase is-${status} ${live ? 'blink' : ''}`}>● {PHASES[status]}</span>;
  const showResult = result && status !== 'running' && status !== 'error';

  return (
    <Panel num="02" title={`CAPTURE · ${CAPTURE_LABELS[shownMode]}`} aside={phase} className="capture-panel">
      <div className="feed">
        <span className="corner tl" />
        <span className="corner tr" />
        <span className="corner bl" />
        <span className="corner br" />
        <div className="feed-bar">
          <span>{result ? result.sample_id : 'NO SAMPLE'}</span>
          <span>{filter ? `HIGHLIGHT · ${filter}` : result?.mode === 'reference' ? 'HOVER A KERNEL FOR ITS UNDERSIDE' : ''}</span>
        </div>
        <div className="feed-body">
          {status === 'error' && <div className="alert">{error}</div>}
          {showResult && result.skipped_clumps > 0 && (
            <div className="notice">
              {result.skipped_clumps} clump{result.skipped_clumps > 1 ? 's' : ''} of overlapping grains not graded. Spread the grains into a single layer.
            </div>
          )}
          {status === 'running' && (
            <div className="scanner">
              <div className="scanner-beam" />
              <span>IMAGING AND CLASSIFYING KERNELS</span>
            </div>
          )}
          {status === 'idle' && (
            <div className="empty">
              <span className="label">AWAITING SAMPLE</span>
            </div>
          )}
          {showResult && (result.mode === 'image' && result.image_url && result.image_size ? (
            <TrayOverlay imageUrl={result.image_url} size={result.image_size} kernels={visible} filter={filter} onSelect={onSelect} />
          ) : (
            <KernelGrid kernels={visible} filter={filter} onSelect={onSelect} />
          ))}
        </div>
      </div>
      <TelemetryRow result={result} visible={visible} />
      <PipelineBar stages={PIPELINE_STAGES[shownMode]} progress={progress} waiting={status === 'running'} />
    </Panel>
  );
}
