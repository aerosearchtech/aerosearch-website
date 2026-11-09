import { scaleLabels, scalePos } from '../../lib/bands';

const SEGMENTS = ['var(--band0)', 'var(--band1)', 'var(--band2)', 'var(--band3)'];

/** Band file as a bar, with a pointer at the current reading. */
export default function BandScale({ moisture }: { moisture: number | null }) {
  return (
    <div style={{ position: 'relative', marginTop: 44 }}>
      <div className="m-scale" style={{ height: 10 }}>
        {SEGMENTS.map((bg) => (
          <div key={bg} style={{ background: bg }} />
        ))}
      </div>
      {moisture !== null && <div className="m-pointer" style={{ left: scalePos(moisture) }} />}
      <div className="m-scale m-meta" style={{ marginTop: 12, lineHeight: 1.4 }}>
        {scaleLabels().map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}
