'use client';

import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import Segmented from '@/gpr/components/ui/Segmented';
import Slider from '@/gpr/components/ui/Slider';
import { PARAM_LIMITS } from '@/gpr/lib/constants';
import { velocityMPerNs } from '@/gpr/lib/processing';
import { useViewer } from '@/gpr/lib/store';
import { cssVar, FONT_MONO } from '@/gpr/lib/theme';
import type { ColormapName, FlightMeta } from '@/gpr/lib/types';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: cssVar('inkMuted') }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11.5 }}>
      <span style={{ color: cssVar('inkSecondary') }}>{label}</span>
      <span style={{ color: cssVar('ink'), fontFamily: FONT_MONO, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

export default function ProcessingPanel({ meta, busy }: { meta: FlightMeta; busy: boolean }) {
  const params = useViewer((s) => s.params);
  const display = useViewer((s) => s.display);
  const setParams = useViewer((s) => s.setParams);
  const setDisplay = useViewer((s) => s.setDisplay);
  const resetParams = useViewer((s) => s.resetParams);
  const bgSeconds = params.backgroundTraces / meta.traceRateHz;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, padding: 14, overflowY: 'auto', flex: 1, minHeight: 0 }}>
      <Section title="Filters">
        <Slider
          label="Dewow window"
          value={params.dewowNs}
          display={params.dewowNs ? `${params.dewowNs} ns` : 'off'}
          {...PARAM_LIMITS.dewowNs}
          onChange={(dewowNs) => setParams({ dewowNs })}
        />
        <Slider
          label="Background removal"
          value={params.backgroundTraces}
          display={params.backgroundTraces ? `${params.backgroundTraces} tr` : 'off'}
          {...PARAM_LIMITS.backgroundTraces}
          onChange={(backgroundTraces) => setParams({ backgroundTraces })}
          hint={params.backgroundTraces ? `Moving mean over ${bgSeconds.toFixed(1)} s of flight` : 'Direct wave and ringing kept'}
        />
        <Slider
          label="Time gain"
          value={params.gainDbPerNs}
          display={`${params.gainDbPerNs.toFixed(2)} dB/ns`}
          {...PARAM_LIMITS.gainDbPerNs}
          onChange={(gainDbPerNs) => setParams({ gainDbPerNs })}
          hint="Applied below the ground reflection"
        />
      </Section>

      <Section title="Geometry">
        <Segmented
          ariaLabel="Time reference"
          options={[
            { value: 'flat', label: 'Flatten to ground' },
            { value: 'raw', label: 'Raw time' },
          ]}
          value={params.flatten ? 'flat' : 'raw'}
          onChange={(v) => setParams({ flatten: v === 'flat' })}
        />
        <Slider
          label="Soil permittivity εr"
          value={params.permittivity}
          display={params.permittivity.toFixed(1)}
          {...PARAM_LIMITS.permittivity}
          onChange={(permittivity) => setParams({ permittivity })}
          hint={`v = ${velocityMPerNs(params.permittivity).toFixed(3)} m/ns · sets the depth axis`}
        />
      </Section>

      <Section title="Display">
        <Segmented<ColormapName>
          ariaLabel="Colormap"
          options={[
            { value: 'diverging', label: 'Polarity' },
            { value: 'gray', label: 'Grayscale' },
          ]}
          value={display.colormap}
          onChange={(colormap) => setDisplay({ colormap })}
        />
        <Slider
          label="Contrast"
          value={display.contrast}
          display={`${display.contrast.toFixed(1)}×`}
          {...PARAM_LIMITS.contrast}
          onChange={(contrast) => setDisplay({ contrast })}
        />
        <button
          onClick={resetParams}
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            border: `1px solid ${cssVar('border')}`,
            background: cssVar('raised'),
            color: cssVar('ink'),
            borderRadius: 6,
            padding: '5px 12px',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={13} strokeWidth={1.8} aria-hidden />
          Reset defaults
        </button>
        <span style={{ fontSize: 11, color: cssVar('inkMuted'), minHeight: 14 }} aria-live="polite">
          {busy ? 'Reprocessing…' : ''}
        </span>
      </Section>

      <Section title="Recording">
        <Info label="Radar" value={meta.radar} />
        <Info label="File" value={meta.source} />
        <Info label="Samples / trace" value={String(meta.nSamples)} />
        <Info label="Sample interval" value={`${(meta.dtNs * 1000).toFixed(0)} ps`} />
        <Info label="Time window" value={`${(meta.nSamples * meta.dtNs).toFixed(0)} ns`} />
        <Info label="Trace rate" value={`${meta.traceRateHz.toFixed(1)} Hz`} />
      </Section>
    </div>
  );
}
