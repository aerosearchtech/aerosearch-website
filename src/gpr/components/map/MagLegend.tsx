'use client';

import { cssGradient } from '@/gpr/lib/colormap';
import { useViewer } from '@/gpr/lib/store';
import { cssVar, RAMPS } from '@/gpr/lib/theme';
import type { MagneticLayer } from '@/gpr/lib/types';

export default function MagLegend({ layer }: { layer: MagneticLayer }) {
  const theme = useViewer((s) => s.theme);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: cssVar('inkSecondary') }}>
      {layer.kind === 'grid' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>
            {layer.vmin.toFixed(0)} {layer.unit}
          </span>
          <div style={{ flex: 1, height: 8, borderRadius: 4, background: cssGradient(RAMPS[theme].diverging) }} aria-hidden />
          <span>
            +{layer.vmax.toFixed(0)} {layer.unit}
          </span>
        </div>
      ) : (
        <span>Published anomaly map image; colours as rendered by the survey company, no values.</span>
      )}
      {layer.source && <span style={{ color: cssVar('inkMuted') }}>{layer.source}</span>}
    </div>
  );
}
