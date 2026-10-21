'use client';

import { useMemo } from 'react';
import { ArrowLeftRight, AudioWaveform, Clock, Crosshair, Layers, Magnet, MapPin, MoveVertical, Route, Ruler, ScanLine } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { fixed } from '@/gpr/lib/format';
import { flightStats } from '@/gpr/lib/stats';
import { depthRange, marksOnTargets, tally } from '@/gpr/lib/targets';
import type { Tally } from '@/gpr/lib/targets';
import { cssVar } from '@/gpr/lib/theme';
import type { FlightMeta, Target } from '@/gpr/lib/types';

interface TileProps {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  share?: number; // 0..1, drawn as a bar under the value
}

function Tile({ icon: Icon, label, value, unit, hint, share }: TileProps) {
  return (
    <div
      title={hint}
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
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 11, color: cssVar('inkMuted'), whiteSpace: 'nowrap' }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.3, color: cssVar('ink') }}>
          {value}
          {unit && <span style={{ fontSize: 12, fontWeight: 400, color: cssVar('inkSecondary'), marginLeft: 4 }}>{unit}</span>}
        </div>
        {share !== undefined && (
          <div style={{ height: 4, marginTop: 4, borderRadius: 2, background: cssVar('raised'), overflow: 'hidden' }} aria-hidden>
            <div style={{ width: `${share * 100}%`, height: '100%', borderRadius: 2, background: cssVar('accent') }} />
          </div>
        )}
      </div>
    </div>
  );
}

const ratio = ({ hit, of }: Tally): Pick<TileProps, 'value' | 'unit' | 'share'> => ({
  value: `${hit} / ${of}`,
  unit: `${of ? Math.round((100 * hit) / of) : 0}%`,
  share: of ? hit / of : 0,
});

// Sites with surveyed objects: how well each sensor found them.
function DetectionTiles({ meta, targets }: { meta: FlightMeta; targets: Target[] }) {
  const gpr = tally(targets, 'gpr');
  const mag = tally(targets, 'mag');
  const marks = marksOnTargets(meta);
  const depth = depthRange(targets);
  const lineM = meta.lines.reduce((sum, l) => sum + l.lengthM, 0);
  return (
    <div className="gpr-stats">
      <Tile icon={Crosshair} label="Buried objects surveyed" value={String(targets.length)} unit={`${gpr.of} evaluated`} />
      {gpr.of > 0 && <Tile icon={ScanLine} label="Found by GPR" hint="Per-object result in the published evaluation" {...ratio(gpr)} />}
      {marks.of > 0 && (
        <Tile
          icon={MapPin}
          label="GPR picks on an object"
          hint="Interpreter marks on the radargrams within 1 m of a surveyed object (computed here)"
          {...ratio(marks)}
        />
      )}
      {mag.of > 0 && <Tile icon={Magnet} label="Found by magnetometer" hint="Per-object result in the published evaluation" {...ratio(mag)} />}
      {depth && <Tile icon={Layers} label="Burial depth" value={`${depth[0]}–${depth[1]}`} unit="m" />}
      <Tile icon={Route} label="GPR survey lines" value={String(meta.lines.length)} unit={`· ${fixed(lineM, 0)} m`} />
    </div>
  );
}

function FlightTiles({ meta }: { meta: FlightMeta }) {
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

export default function StatTiles({ meta }: { meta: FlightMeta }) {
  return meta.targets?.length ? <DetectionTiles meta={meta} targets={meta.targets} /> : <FlightTiles meta={meta} />;
}
