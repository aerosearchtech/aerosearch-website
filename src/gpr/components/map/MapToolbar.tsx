'use client';

import SliceControls from '@/gpr/components/map/SliceControls';
import Segmented from '@/gpr/components/ui/Segmented';
import Slider from '@/gpr/components/ui/Slider';
import { PARAM_LIMITS } from '@/gpr/lib/constants';
import { useViewer } from '@/gpr/lib/store';
import type { FlightMeta, MapLayer } from '@/gpr/lib/types';

// Layer choice (when the site has magnetometer data), its controls, and opacity over imagery.
export default function MapToolbar({ meta }: { meta: FlightMeta }) {
  const layer = useViewer((s) => s.mapLayer);
  const setLayer = useViewer((s) => s.setMapLayer);
  const basemap = useViewer((s) => s.basemap);
  const opacity = useViewer((s) => s.overlayOpacity);
  const setOpacity = useViewer((s) => s.setOverlayOpacity);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {meta.magnetic && (
        <Segmented<MapLayer>
          ariaLabel="Map layer"
          options={[
            { value: 'gpr', label: 'GPR depth slice' },
            { value: 'mag', label: 'Magnetometer' },
          ]}
          value={layer}
          onChange={setLayer}
        />
      )}
      {layer === 'gpr' && <SliceControls />}
      {basemap && (
        <Slider
          label="Layer opacity over imagery"
          value={opacity}
          display={`${Math.round(opacity * 100)}%`}
          {...PARAM_LIMITS.overlayOpacity}
          onChange={setOpacity}
        />
      )}
    </div>
  );
}
