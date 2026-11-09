/* eslint-disable @next/next/no-img-element -- static export: recorded kernel crops, no image optimiser */
import { REVIEW_CONFIDENCE } from '../../config/constants';
import { classColors } from '../../theme/colors';
import type { KernelResult } from '../../types/analysis';
import { confidenceTag } from '../../utils/refractions';
import { Panel } from '../common/Panel';

interface Props {
  kernels: KernelResult[];
  onSelect: (k: KernelResult) => void;
}

/** Kernels the model was least sure about, for a human second look. */
export function ReviewPanel({ kernels, onSelect }: Props) {
  return (
    <Panel num="05" title="LOW-CONFIDENCE REVIEW" aside={`${kernels.length} KERNEL${kernels.length === 1 ? '' : 'S'}`}>
      {kernels.length ? (
        <div className="review-grid">
          {kernels.map((k) => (
            <button key={k.idx} type="button" className="review-item" onClick={() => onSelect(k)}>
              <span className="review-img" style={{ borderColor: classColors[k.pred] }}>
                <img src={k.up_url} alt="" />
              </span>
              <span className="review-cls" style={{ color: classColors[k.pred] }}>{k.pred}</span>
              <span className="review-meta">p {confidenceTag(k.confidence)}{k.truth ? ` · INSP ${k.truth}` : ''}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="panel-body note-text">Every kernel was classified with at least {REVIEW_CONFIDENCE * 100}% confidence.</p>
      )}
    </Panel>
  );
}
