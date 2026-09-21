'use client';

import { BarList, LogList, panelHdr } from '../PanelChrome';
import { FONT_MONO } from '@/bmf/lib/theme';
import type { ViewModel } from '@/bmf/lib/derive';

/** SURVEY LOG · DEVICE CLASSES · FIX CONFIDENCE. */
export default function DetectBottom({ detect }: { detect: ViewModel['detect'] }) {
  return (
    <div style={{ flex: 'none', height: 196, background: 'var(--bg1)', borderTop: '1px solid var(--bd2)', display: 'flex', minHeight: 0 }}>
      <div style={{ flex: 1.4, borderRight: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={panelHdr}>SURVEY LOG</div>
        <LogList lines={detect.surveyLog} />
      </div>

      <div style={{ flex: 1, borderRight: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ ...panelHdr, justifyContent: 'space-between' }}>
          <span>DEVICE CLASSES</span>
          <span style={{ fontFamily: FONT_MONO, color: 'var(--tx3)', letterSpacing: 1 }}>FIXES</span>
        </div>
        <BarList rows={detect.classTally} labelW={110} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ ...panelHdr, justifyContent: 'space-between' }}>
          <span>FIX CONFIDENCE</span>
          <span style={{ fontFamily: FONT_MONO, color: 'var(--tx3)', letterSpacing: 1 }}>FUSED %</span>
        </div>
        <BarList rows={detect.confBins} labelW={62} />
      </div>
    </div>
  );
}
