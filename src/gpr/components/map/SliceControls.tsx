'use client';

import Slider from '@/gpr/components/ui/Slider';
import { PARAM_LIMITS } from '@/gpr/lib/constants';
import { useViewer } from '@/gpr/lib/store';

export default function SliceControls() {
  const slice = useViewer((s) => s.slice);
  const setSlice = useViewer((s) => s.setSlice);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <Slider
        label="Depth"
        value={slice.depthM}
        display={`${slice.depthM.toFixed(2)} m`}
        {...PARAM_LIMITS.depthM}
        onChange={(depthM) => setSlice({ depthM })}
      />
      <Slider
        label="Window"
        value={slice.thicknessM}
        display={`${slice.thicknessM.toFixed(2)} m`}
        {...PARAM_LIMITS.thicknessM}
        onChange={(thicknessM) => setSlice({ thicknessM })}
      />
    </div>
  );
}
