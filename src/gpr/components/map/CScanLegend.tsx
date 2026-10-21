'use client';

import { cssGradient } from '@/gpr/lib/colormap';
import { useViewer } from '@/gpr/lib/store';
import { cssVar, RAMPS } from '@/gpr/lib/theme';

export default function CScanLegend() {
  const theme = useViewer((s) => s.theme);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: cssVar('inkSecondary') }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>Low</span>
        <div
          style={{ flex: 1, height: 8, borderRadius: 4, background: cssGradient(RAMPS[theme].sequential) }}
          aria-hidden
        />
        <span>High</span>
      </div>
      <span style={{ color: cssVar('inkMuted') }}>
        RMS reflection amplitude in the depth window, survey lines only. Hover to link, click to jump the B-scan.
      </span>
    </div>
  );
}
