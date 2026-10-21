'use client';

import CScanLegend from '@/gpr/components/map/CScanLegend';
import MagLegend from '@/gpr/components/map/MagLegend';
import PinKey from '@/gpr/components/map/PinKey';
import { useViewer } from '@/gpr/lib/store';
import { cssVar } from '@/gpr/lib/theme';
import type { FlightMeta } from '@/gpr/lib/types';

export default function MapLegend({ meta }: { meta: FlightMeta }) {
  const layer = useViewer((s) => s.mapLayer);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {layer === 'mag' && meta.magnetic ? <MagLegend layer={meta.magnetic} /> : <CScanLegend />}
      {meta.targets?.length ? <PinKey sensor={layer} /> : null}
      <span style={{ fontSize: 11, color: cssVar('inkMuted') }}>
        Scroll to zoom · Drag to pan · Double-click to fit · Click an object to inspect it, a line to jump the B-scan
      </span>
    </div>
  );
}
