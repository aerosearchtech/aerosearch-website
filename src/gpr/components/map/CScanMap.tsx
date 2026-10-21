'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import Tooltip from '@/gpr/components/ui/Tooltip';
import { prepareCanvas } from '@/gpr/lib/canvas';
import { buildLut } from '@/gpr/lib/colormap';
import { DATA_DIR, MAP_HOVER_RADIUS_M, TARGET_HIT_PX } from '@/gpr/lib/constants';
import { computeCScan, gridAt, lineTraceIndices, magneticGrid, sliceRows } from '@/gpr/lib/cscan';
import { fixed, lineOf, toLatLon } from '@/gpr/lib/format';
import { renderGrid } from '@/gpr/lib/images';
import { useViewer } from '@/gpr/lib/store';
import { depthText, resultText } from '@/gpr/lib/targets';
import { PALETTES, RAMPS } from '@/gpr/lib/theme';
import type { CScanGrid, FlightMeta, Processed, TooltipData } from '@/gpr/lib/types';
import { useElementSize } from '@/gpr/lib/useElementSize';
import { drawMap, gridOverlay, mapMapping } from './drawMap';
import type { MapOverlay } from './drawMap';
import { useBasemap } from './useBasemap';
import { useImage } from './useImage';
import { useMapBounds } from './useMapBounds';

interface CScanMapProps {
  meta: FlightMeta;
  processed: Processed;
  velocity: number;
}

const normalised = (g: CScanGrid, x: number, y: number): number => (gridAt(g, x, y) - g.vmin) / (g.vmax - g.vmin || 1);

export default function CScanMap({ meta, processed, velocity }: CScanMapProps) {
  const [boxRef, size] = useElementSize<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [hoverTarget, setHoverTarget] = useState<number | null>(null);
  const view = useViewer((s) => s.view);
  const cursor = useViewer((s) => s.cursor);
  const theme = useViewer((s) => s.theme);
  const liveSlice = useViewer((s) => s.slice);
  const slice = useDeferredValue(liveSlice);
  const setCursor = useViewer((s) => s.setCursor);
  const setView = useViewer((s) => s.setView);
  const basemap = useViewer((s) => s.basemap);
  const layer = useViewer((s) => s.mapLayer);
  const overlayAlpha = useViewer((s) => s.overlayOpacity);
  const selectedTarget = useViewer((s) => s.selectedTarget);
  const selectTarget = useViewer((s) => s.selectTarget);
  const targets = useMemo(() => meta.targets ?? [], [meta]);
  const focus = selectedTarget === null ? undefined : targets[selectedTarget];
  const pan = useMapBounds(meta, size, canvasRef, focus ? [focus.x, focus.y] : null);
  const { bounds } = pan;
  const tiles = useBasemap(meta, size, bounds, basemap);
  const magnetic = meta.magnetic;

  const grid = useMemo(
    () => (layer === 'gpr' ? computeCScan(meta, processed, slice, velocity) : null),
    [layer, meta, processed, slice, velocity],
  );
  const gridImage = useMemo(() => (grid ? renderGrid(grid, buildLut(RAMPS[theme].sequential)) : null), [grid, theme]);
  const magGrid = useMemo(() => (magnetic?.kind === 'grid' ? magneticGrid(magnetic) : null), [magnetic]);
  const magImage = useMemo(() => (magGrid ? renderGrid(magGrid, buildLut(RAMPS[theme].diverging)) : null), [magGrid, theme]);
  const magPhoto = useImage(magnetic?.kind === 'image' ? `${DATA_DIR}/${magnetic.src}` : null);
  const lineTraces = useMemo(() => lineTraceIndices(meta), [meta]);

  const overlay = useMemo((): MapOverlay | null => {
    if (layer === 'gpr') return grid && gridImage ? gridOverlay(grid, gridImage) : null;
    if (magnetic?.kind === 'image') return magPhoto && { img: magPhoto, nw: magnetic.nw, ne: magnetic.ne, sw: magnetic.sw };
    return magGrid && magImage ? gridOverlay(magGrid, magImage) : null;
  }, [layer, grid, gridImage, magnetic, magPhoto, magGrid, magImage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !view || !size.width) return;
    const ctx = prepareCanvas(canvas, size);
    if (ctx) {
      drawMap(ctx, size, {
        meta,
        bounds,
        overlay,
        overlayAlpha,
        tiles,
        targets,
        sensor: layer,
        selectedTarget,
        hoverTarget,
        view,
        cursor,
        palette: PALETTES[theme],
      });
    }
  }, [size, meta, bounds, overlay, overlayAlpha, tiles, targets, layer, selectedTarget, hoverTarget, view, cursor, theme]);

  const targetAt = (px: number, py: number): number | null => {
    const m = mapMapping(size, bounds);
    let best: number | null = null;
    let bestD = TARGET_HIT_PX ** 2;
    targets.forEach((t, i) => {
      const [x, y] = m.toPx(t.x, t.y);
      const d = (x - px) ** 2 + (y - py) ** 2;
      if (d < bestD) [best, bestD] = [i, d];
    });
    return best;
  };

  const nearestTrace = (px: number, py: number): number | null => {
    const [wx, wy] = mapMapping(size, bounds).toWorld(px, py);
    let best: number | null = null;
    let bestD = MAP_HOVER_RADIUS_M ** 2;
    for (const i of lineTraces) {
      const d = (meta.x[i] - wx) ** 2 + (meta.y[i] - wy) ** 2;
      if (d < bestD) [best, bestD] = [i, d];
    }
    return best;
  };

  const layerRow = (wx: number, wy: number): [string, string] | null => {
    if (layer === 'gpr') return ['Slice level', grid ? fixed(normalised(grid, wx, wy), 2) : '–'];
    return magGrid ? ['Magnetic anomaly', `${fixed(gridAt(magGrid, wx, wy), 1)} nT`] : null;
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>): void => {
    if (pan.move(e)) {
      setTooltip(null);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    const hit = targetAt(px, py);
    setHoverTarget(hit);
    if (hit !== null) {
      const t = targets[hit];
      setTooltip({
        x: px,
        y: py,
        rows: [
          ['Object', t.no === null ? 'not in evaluation' : `#${t.no}`],
          ['Type', t.name],
          ['Depth', depthText(t)],
          ['GPR', resultText(t.gpr)],
          ['Magnetometer', resultText(t.mag)],
        ],
      });
      return;
    }
    const trace = nearestTrace(px, py);
    if (trace === null) {
      setTooltip(null);
      return;
    }
    const { offsetRows, countRows } = sliceRows(slice, meta.dtNs, velocity);
    setCursor({ trace, row: processed.surfaceRow[trace] + offsetRows + countRows / 2 });
    const [lat, lon] = toLatLon(meta, trace);
    const [wx, wy] = mapMapping(size, bounds).toWorld(px, py);
    const extra = layerRow(wx, wy);
    setTooltip({
      x: px,
      y: py,
      rows: [
        ['Line', `L${lineOf(meta, trace)?.id ?? '–'}`],
        ['Trace', String(trace)],
        ['Lat, Lon', `${fixed(lat, 6)}, ${fixed(lon, 6)}`],
        ...(extra ? [extra] : []),
      ],
    });
  };

  // A click (not a pan) selects the object under the pointer, else jumps the B-scan.
  const onPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>): void => {
    if (pan.end()) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    const hit = targetAt(px, py);
    if (hit !== null) {
      selectTarget(hit);
      return;
    }
    const trace = nearestTrace(px, py);
    if (trace === null || !view) return;
    const half = (view.x1 - view.x0) / 2;
    setView({ ...view, x0: trace - half, x1: trace + half });
  };

  return (
    <div ref={boxRef} style={{ position: 'relative', flex: 1, minWidth: 0, minHeight: 0 }}>
      <canvas
        ref={canvasRef}
        aria-label={layer === 'gpr' ? 'Survey map with depth-slice amplitude' : 'Survey map with magnetic anomaly'}
        style={{
          position: 'absolute',
          inset: 0,
          touchAction: 'none',
          cursor: pan.dragging ? 'grabbing' : hoverTarget === null ? 'crosshair' : 'pointer',
        }}
        onPointerDown={pan.start}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => pan.end()}
        onDoubleClick={pan.reset}
        onPointerLeave={() => {
          setTooltip(null);
          setHoverTarget(null);
        }}
      />
      <Tooltip data={tooltip} containerWidth={size.width} />
    </div>
  );
}
