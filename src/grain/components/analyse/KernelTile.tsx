/* eslint-disable @next/next/no-img-element -- static export: recorded kernel crops, no image optimiser */
import { memo } from 'react';
import { classColors } from '../../theme/colors';
import type { KernelResult } from '../../types/analysis';
import { confidenceTag } from '../../utils/refractions';

interface Props {
  kernel: KernelResult;
  dimmed: boolean;
  onSelect: (k: KernelResult) => void;
}

export const KernelTile = memo(function KernelTile({ kernel, dimmed, onSelect }: Props) {
  const color = classColors[kernel.pred] ?? classColors.UNK;
  const mismatch = kernel.truth !== null && kernel.truth !== kernel.pred;
  return (
    <button
      type="button"
      className={`kernel-tile ${dimmed ? 'is-dimmed' : ''}`}
      style={{ borderColor: color }}
      onClick={() => onSelect(kernel)}
      title={mismatch ? `Inspector: ${kernel.truth}` : undefined}
    >
      <img src={kernel.up_url} alt="" loading="lazy" draggable={false} />
      {kernel.down_url && <img className="kernel-back" src={kernel.down_url} alt="" loading="lazy" draggable={false} />}
      <span className="kernel-tag" style={{ background: color }}>{kernel.pred} {confidenceTag(kernel.confidence)}</span>
      {mismatch && <span className="kernel-flag" />}
    </button>
  );
});
