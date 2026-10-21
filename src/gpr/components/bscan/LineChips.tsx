'use client';

import { useViewer } from '@/gpr/lib/store';
import { cssVar } from '@/gpr/lib/theme';
import type { FlightMeta } from '@/gpr/lib/types';

const chipStyle = (active: boolean) => ({
  border: `1px solid ${cssVar('border')}`,
  borderRadius: 5,
  padding: '3px 8px',
  fontSize: 11.5,
  cursor: 'pointer',
  background: active ? cssVar('accent') : cssVar('raised'),
  color: active ? cssVar('onAccent') : cssVar('inkSecondary'),
  fontWeight: active ? 600 : 400,
});

// Jump the B-scan to a whole survey line, or back to the full flight.
export default function LineChips({ meta }: { meta: FlightMeta }) {
  const view = useViewer((s) => s.view);
  const setView = useViewer((s) => s.setView);
  const resetView = useViewer((s) => s.resetView);
  if (!view) return null;
  const isFull = view.x0 === 0 && view.x1 === meta.nTraces;

  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }} aria-label="Survey lines">
      <button style={chipStyle(isFull)} onClick={resetView}>
        Full flight
      </button>
      {meta.lines.map((l) => (
        <button
          key={l.id}
          style={chipStyle(view.x0 === l.start && view.x1 === l.end + 1)}
          onClick={() => setView({ ...view, x0: l.start, x1: l.end + 1 })}
          title={`${l.lengthM.toFixed(1)} m`}
        >
          L{l.id}
        </button>
      ))}
    </div>
  );
}
