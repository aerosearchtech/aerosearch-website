import { classColors } from '../../theme/colors';
import type { GrainClass, RefractionSpec } from '../../types/analysis';

interface Props {
  classes: GrainClass[];
  refractions: RefractionSpec[];
  counts: Record<string, number>;
  total: number;
  onPick: (code: string) => void;
}

/** Model classes, the refraction line each feeds, and their share of kernels. */
export function ClassBreakdown({ classes, refractions, counts, total, onPick }: Props) {
  const lineOf = (id: string): string => refractions.find((r) => r.id === id)?.label ?? 'Sound';
  return (
    <div className="classes">
      <div className="classes-head">
        <span className="label">KERNEL CLASSES</span>
        <span className="label">CLICK TO HIGHLIGHT ON ANALYSE</span>
      </div>
      <div className="stack-bar">
        {classes.map((c) => {
          const n = counts[c.code] ?? 0;
          return n ? <span key={c.code} style={{ flexGrow: n, background: classColors[c.code] }} title={`${c.label}: ${n}`} /> : null;
        })}
      </div>
      <div className="class-grid">
        {classes.map((c) => {
          const n = counts[c.code] ?? 0;
          return (
            <button key={c.code} type="button" onClick={() => onPick(c.code)} disabled={!n}>
              <span className="swatch" style={{ background: classColors[c.code] }} />
              <span className="class-name">{c.label}<small>{lineOf(c.refraction)}</small></span>
              <span className="num">{n}</span>
              <span className="num muted">{total ? ((n / total) * 100).toFixed(1) : '0.0'}%</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
