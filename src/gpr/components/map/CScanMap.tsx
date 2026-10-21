'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import Tooltip from '@/gpr/components/ui/Tooltip';
import { prepareCanvas } from '@/gpr/lib/canvas';
import { buildLut } from '@/gpr/lib/colormap';
import { MAP_HOVER_RADIUS_M } from '@/gpr/lib/constants';
import { computeCScan, lineTraceIndices, sliceRows } from '@/gpr/lib/cscan';
import { fixed, lineOf, toLatLon } from '@/gpr/lib/format';
import { renderGrid } from '@/gpr/lib/images';
import { useViewer } from '@/gpr/lib/store';
import { PALETTES, RAMPS } from '@/gpr/lib/theme';
import type { CScanGrid, FlightMeta, Processed, TooltipData } from '@/gpr/lib/types';
import { useElementSize } from '@/gpr/lib/useElementSize';
import { drawMap, mapMapping } from './drawMap';
import { useBasemap } from './useBasemap';

interface CScanMapProps {
  meta: FlightMeta;
  processed: Processed;
  velocity: number;
}

function gridValue(g: CScanGrid, x: number, y: number): number {
  const gx = Math.round((x - g.minX) / g.cellM);
  const gy = Math.round((g.maxY - y) / g.cellM);
  if (gx < 0 || gy < 0 || gx >= g.width || gy >= g.height) return NaN;
  return (g.values[gy * g.width + gx] - g.vmin) / (g.vmax - g.vmin || 1);
}

export default function CScanMap({ meta, processed, velocity }: CScanMapProps) {
  const [boxRef, size] = useElementSize<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const view = useViewer((s) => s.view);
  const cursor = useViewer((s) => s.cursor);
  const theme = useViewer((s) => s.theme);
  const liveSlice = useViewer((s) => s.slice);
  const slice = useDeferredValue(liveSlice);
  const setCursor = useViewer((s) => s.setCursor);
  const setView = useViewer((s) => s.setView);
  const basemap = useViewer((s) => s.basemap);
  const tiles = useBasemap(meta, size, basemap);

  const grid = useMemo(() => computeCScan(meta, processed, slice, velocity), [meta, processed, slice, velocity]);
  const gridImage = useMemo(() => (grid ? renderGrid(grid, buildLut(RAMPS[theme].sequential)) : null), [grid, theme]);
  const lineTraces = useMemo(() => lineTraceIndices(meta), [meta]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !view || !size.width) return;
    const ctx = prepareCanvas(canvas, size);
    if (ctx) drawMap(ctx, size, { meta, grid, gridImage, tiles, view, cursor, palette: PALETTES[theme] });
  }, [size, meta, grid, gridImage, tiles, view, cursor, theme]);

  const nearestTrace = (px: number, py: number): number | null => {
    const [wx, wy] = mapMapping(size, meta).toWorld(px, py);
    let best: number | null = null;
    let bestD = MAP_HOVER_RADIUS_M ** 2;
    for (const i of lineTraces) {
      const d = (meta.x[i] - wx) ** 2 + (meta.y[i] - wy) ** 2;
      if (d < bestD) [best, bestD] = [i, d];
    }
    return best;
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>): void => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    const trace = nearestTrace(px, py);
    if (trace === null) {
      setTooltip(null);
      return;
    }
    const { offsetRows, countRows } = sliceRows(slice, meta.dtNs, velocity);
    setCursor({ trace, row: processed.surfaceRow[trace] + offsetRows + countRows / 2 });
    const [lat, lon] = toLatLon(meta, trace);
    const [wx, wy] = mapMapping(size, meta).toWorld(px, py);
    setTooltip({
      x: px,
      y: py,
      rows: [
        ['Line', `L${lineOf(meta, trace)?.id ?? '–'}`],
        ['Trace', String(trace)],
        ['Lat, Lon', `${fixed(lat, 6)}, ${fixed(lon, 6)}`],
        ['Slice level', grid ? fixed(gridValue(grid, wx, wy), 2) : '–'],
      ],
    });
  };

  const onClick = (e: ReactMouseEvent<HTMLCanvasElement>): void => {
    const r = e.currentTarget.getBoundingClientRect();
    const trace = nearestTrace(e.clientX - r.left, e.clientY - r.top);
    if (trace === null || !view) return;
    const half = (view.x1 - view.x0) / 2;
    setView({ ...view, x0: trace - half, x1: trace + half });
  };

  return (
    <div ref={boxRef} style={{ position: 'relative', flex: 1, minWidth: 0, minHeight: 0 }}>
      <canvas
        ref={canvasRef}
        aria-label="Survey map with depth-slice amplitude"
        style={{ position: 'absolute', inset: 0, cursor: 'crosshair' }}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setTooltip(null)}
        onClick={onClick}
      />
      <Tooltip data={tooltip} containerWidth={size.width} />
    </div>
  );
}
