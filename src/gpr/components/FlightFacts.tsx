'use client';

import { useMemo } from 'react';
import { fixed } from '@/gpr/lib/format';
import { flightStats } from '@/gpr/lib/stats';
import { cssVar, FONT_MONO } from '@/gpr/lib/theme';
import type { FlightMeta } from '@/gpr/lib/types';

// Acquisition facts, for sites where the stat tiles show detection results instead.
export default function FlightFacts({ meta }: { meta: FlightMeta }) {
  const s = useMemo(() => flightStats(meta), [meta]);
  const rows: [string, string][] = [
    ['Radar', meta.radar],
    ['Flight time', `${Math.floor(s.durationS / 60)}:${String(Math.round(s.durationS % 60)).padStart(2, '0')} min`],
    ['Traces', meta.nTraces.toLocaleString()],
    ['Line coverage', `${fixed(s.lineLengthM, 0)} m`],
    ['Median altitude on lines', `${fixed(s.medianAltM, 2)} m`],
    ['Trace spacing', `${fixed(s.traceSpacingCm, 1)} cm`],
  ];
  return (
    <dl style={{ margin: 0, padding: '10px 14px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: 11.5, borderBottom: `1px solid ${cssVar('border')}` }}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: 'contents' }}>
          <dt style={{ color: cssVar('inkSecondary') }}>{k}</dt>
          <dd style={{ margin: 0, textAlign: 'right', color: cssVar('ink'), fontFamily: FONT_MONO, fontSize: 11 }}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
