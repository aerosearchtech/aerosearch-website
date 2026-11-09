import type { KernelResult } from '../../types/analysis';
import { KernelTile } from './KernelTile';

interface Props {
  kernels: KernelResult[];
  filter: string | null;
  onSelect: (k: KernelResult) => void;
}

/** All kernels revealed so far; hovering a tile flips it to the underside view. */
export function KernelGrid({ kernels, filter, onSelect }: Props) {
  return (
    <div className="kernel-grid">
      {kernels.map((k) => (
        <KernelTile key={k.idx} kernel={k} dimmed={filter !== null && k.pred !== filter} onSelect={onSelect} />
      ))}
    </div>
  );
}
