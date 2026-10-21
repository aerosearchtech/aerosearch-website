'use client';

import { useMemo } from 'react';
import { ArrowLeftRight, AudioWaveform, Clock, MoveVertical, Route, Ruler } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { fixed } from '@/gpr/lib/format';
import { flightStats } from '@/gpr/lib/stats';
import { cssVar } from '@/gpr/lib/theme';
import type { FlightMeta } from '@/gpr/lib/types';

interface TileProps {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
}

function Tile({ icon: Icon, label, value, unit }: TileProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        background: cssVar('surface'),
        border: `1px solid ${cssVar('border')}`,
        borderRadius: 10,
        boxShadow: `0 1px 3px ${cssVar('shadow')}`,
      }}
    >
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 32,
          height: 32,
          flex: 'none',
          borderRadius: 8,
          background: cssVar('accentSoft'),
          color: cssVar('accent'),
        }}
      >
        <Icon size={16} strokeWidth={1.8} aria-hidden />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: cssVar('inkMuted'), whiteSpace: 'nowrap' }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.3, color: cssVar('ink') }}>
          {value}
          {unit && <span style={{ fontSize: 12, fontWeight: 400, color: cssVar('inkSecondary'), marginLeft: 3 }}>{unit}</span>}
        </div>
      </div>
    </div>
  );
}

export default function StatTiles({ meta }: { meta: FlightMeta }) {
  const s = useMemo(() => flightStats(meta), [meta]);
  const mins = Math.floor(s.durationS / 60);
  const secs = Math.round(s.durationS % 60);
  return (
    <div className="gpr-stats">
      <Tile icon={Clock} label="Flight time" value={`${mins}:${String(secs).padStart(2, '0')}`} unit="min" />
      <Tile icon={AudioWaveform} label="Traces" value={meta.nTraces.toLocaleString()} />
      <Tile icon={Route} label="Survey lines" value={String(s.lineCount)} />
      <Tile icon={Ruler} label="Line coverage" value={fixed(s.lineLengthM, 0)} unit="m" />
      <Tile icon={MoveVertical} label="Median altitude on lines" value={fixed(s.medianAltM, 2)} unit="m" />
      <Tile icon={ArrowLeftRight} label="Trace spacing" value={fixed(s.traceSpacingCm, 1)} unit="cm" />
    </div>
  );
}
