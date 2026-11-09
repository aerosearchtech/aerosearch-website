/* eslint-disable @next/next/no-img-element -- static export: recorded kernel crops, no image optimiser */
import { useEffect } from 'react';
import { classColors } from '../../theme/colors';
import type { GrainClass, KernelResult } from '../../types/analysis';

interface Props {
  kernel: KernelResult;
  classes: GrainClass[];
  onClose: () => void;
}

export function KernelInspector({ kernel, classes, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const label = (code: string): string => classes.find((c) => c.code === code)?.label ?? code;
  const ranked = [...classes].sort((a, b) => (kernel.probs[b.code] ?? 0) - (kernel.probs[a.code] ?? 0));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
        <div className="modal-head">
          <h3>Kernel #{kernel.idx + 1}</h3>
          <button type="button" className="btn-mini" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="inspector-views">
          <figure>
            <img src={kernel.up_url} alt="Upper view" />
            <figcaption>{kernel.down_url ? 'Upper view' : 'Camera view'}</figcaption>
          </figure>
          {kernel.down_url && (
            <figure>
              <img src={kernel.down_url} alt="Lower view" />
              <figcaption>Lower view</figcaption>
            </figure>
          )}
        </div>
        <dl className="kv">
          <dt>Model</dt>
          <dd style={{ color: classColors[kernel.pred] }}>{label(kernel.pred)} · {(kernel.confidence * 100).toFixed(1)}%</dd>
          {kernel.truth && (
            <>
              <dt>Inspector</dt>
              <dd>{label(kernel.truth)} {kernel.truth === kernel.pred ? '✓' : '✗'}</dd>
            </>
          )}
          <dt>Mass</dt><dd className="mono">{kernel.mass_mg.toFixed(1)} mg{kernel.down_url ? '' : ' (est.)'}</dd>
        </dl>
        <div className="prob-list">
          {ranked.map((c) => {
            const p = kernel.probs[c.code] ?? 0;
            return (
              <div key={c.code} className="prob-row">
                <span>{c.label}</span>
                <div className="bar"><div style={{ width: `${p * 100}%`, background: classColors[c.code] }} /></div>
                <span className="mono">{(p * 100).toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
