'use client';

import { AO_NAME } from '@/bmf/lib/constants';
import { FONT_MONO, FONT_SANS } from '@/bmf/lib/theme';
import { useGcs } from '@/bmf/lib/store';
import type { MapLayer } from '@/bmf/lib/types';

const LAYERS: { key: MapLayer; label: string }[] = [
  { key: 'terrain', label: 'TERR' },
  { key: 'hazard', label: 'HAZ' },
  { key: 'coverage', label: 'COV' },
  { key: 'devices', label: 'DEV' },
];

const tab = (active: boolean): React.CSSProperties => ({
  padding: '0 10px',
  height: '100%',
  background: active ? 'var(--amWash)' : 'transparent',
  border: 'none',
  color: active ? 'var(--am)' : 'var(--tx2)',
  fontFamily: FONT_MONO,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 1,
  cursor: 'pointer',
});

const rule: React.CSSProperties = { width: 1, height: 18, background: 'var(--bd)', flex: 'none' };

interface Props {
  head: string;
  hint?: string;
  hasLane: boolean;
  coordRef: React.RefObject<HTMLSpanElement>;
}

/**
 * The map's own title bar. Everything here used to float on the canvas, where
 * it sat over the belts in the corners of the AO.
 */
export default function MapHeader({ head, hint, hasLane, coordRef }: Props) {
  const s = useGcs();

  return (
    <div
      style={{
        height: 32,
        flex: 'none',
        display: 'flex',
        alignItems: 'stretch',
        gap: 8,
        padding: '0 0 0 12px',
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--bd)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 1.5, color: 'var(--tx2)', whiteSpace: 'nowrap' }}>
          {head}
        </span>
        <span
          style={{
            fontFamily: FONT_SANS,
            fontSize: 10,
            letterSpacing: 1,
            color: 'var(--tx3)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {AO_NAME}{hint ? ` · ${hint}` : ''}
        </span>
      </div>

      <div style={rule} />
      <div style={{ display: 'flex', flex: 'none' }}>
        {LAYERS.map((l) => (
          <button key={l.key} onClick={() => s.setLayer(l.key)} style={tab(s.mapLayer === l.key)}>
            {l.label}
          </button>
        ))}
      </div>

      <div style={rule} />
      <div style={{ display: 'flex', alignItems: 'stretch', flex: 'none' }}>
        <span style={{ display: 'flex', alignItems: 'center', padding: '0 7px', fontFamily: FONT_MONO, fontSize: 10, color: 'var(--tx3)' }}>
          {s.mapView.zoom.toFixed(1)}×
        </span>
        <button onClick={() => s.zoomAt(1 / 1.6, s.mapView.cx, s.mapView.cy)} title="Zoom out" style={tab(false)}>
          −
        </button>
        <button onClick={() => s.zoomAt(1.6, s.mapView.cx, s.mapView.cy)} title="Zoom in" style={tab(false)}>
          +
        </button>
        <button
          onClick={() => s.zoomToLane()}
          title="Frame the selected lane"
          style={{ ...tab(false), color: hasLane ? 'var(--tx2)' : 'var(--tx3)' }}
        >
          LANE
        </button>
        <button onClick={() => s.fitView()} title="Fit the whole AO" style={tab(false)}>
          FIT
        </button>
      </div>

      <div style={rule} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px 0 0', flex: 'none' }}>
        <span ref={coordRef} style={{ fontFamily: FONT_MONO, fontSize: 11, color: 'var(--am)', fontWeight: 500 }}>
          43R FN ----- -----
        </span>
      </div>
    </div>
  );
}
