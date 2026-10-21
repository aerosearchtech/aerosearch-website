'use client';

import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import Tooltip from '@/gpr/components/ui/Tooltip';
import { prepareCanvas } from '@/gpr/lib/canvas';
import { ZOOM_STEP } from '@/gpr/lib/constants';
import { sliceRows } from '@/gpr/lib/cscan';
import { fixed, lineOf, rowToDepth, rowToNs } from '@/gpr/lib/format';
import { useViewer } from '@/gpr/lib/store';
import { PALETTES } from '@/gpr/lib/theme';
import type { FlightMeta, Processed, TooltipData, View } from '@/gpr/lib/types';
import { useElementSize } from '@/gpr/lib/useElementSize';
import { zoomAxis } from '@/gpr/lib/view';
import { bscanMapping, drawBScan } from './drawBScan';

interface BScanProps {
  meta: FlightMeta;
  processed: Processed;
  image: HTMLCanvasElement;
  velocity: number;
}

interface Drag {
  x: number;
  y: number;
  view: View;
}

export default function BScan({ meta, processed, image, velocity }: BScanProps) {
  const [boxRef, size] = useElementSize<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const view = useViewer((s) => s.view);
  const cursor = useViewer((s) => s.cursor);
  const slice = useViewer((s) => s.slice);
  const theme = useViewer((s) => s.theme);
  const setView = useViewer((s) => s.setView);
  const setCursor = useViewer((s) => s.setCursor);
  const resetView = useViewer((s) => s.resetView);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !view || !size.width) return;
    const ctx = prepareCanvas(canvas, size);
    if (!ctx) return;
    drawBScan(ctx, size, {
      image,
      processed,
      meta,
      view,
      cursor,
      palette: PALETTES[theme],
      velocity,
      slice: sliceRows(slice, meta.dtNs, velocity),
    });
  }, [size, image, processed, meta, view, cursor, slice, theme, velocity]);

  // Wheel zoom needs a non-passive listener to stop the page scrolling.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent): void => {
      const v = useViewer.getState().view;
      if (!v) return;
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const m = bscanMapping({ width: r.width, height: r.height }, v);
      const factor = e.deltaY > 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      if (e.shiftKey) {
        const [y0, y1] = zoomAxis(v.y0, v.y1, m.toRow(e.clientY - r.top), factor);
        setView({ ...v, y0, y1 });
      } else {
        const [x0, x1] = zoomAxis(v.x0, v.x1, m.toTrace(e.clientX - r.left), factor);
        setView({ ...v, x0, x1 });
      }
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [setView]);

  if (!view) return null;
  const m = bscanMapping(size, view);

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>): void => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, view };
    setTooltip(null);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>): void => {
    const drag = dragRef.current;
    if (drag) {
      const dx = ((e.clientX - drag.x) / m.rect.width) * (drag.view.x1 - drag.view.x0);
      const dy = ((e.clientY - drag.y) / m.rect.height) * (drag.view.y1 - drag.view.y0);
      setView({ x0: drag.view.x0 - dx, x1: drag.view.x1 - dx, y0: drag.view.y0 - dy, y1: drag.view.y1 - dy });
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    const trace = Math.floor(m.toTrace(px));
    const row = m.toRow(py);
    if (trace < 0 || trace >= meta.nTraces || row < view.y0 || row >= view.y1) {
      setTooltip(null);
      return;
    }
    const rowIdx = Math.floor(row);
    const depth = rowToDepth(processed, meta, trace, rowIdx, velocity);
    const line = lineOf(meta, trace);
    setCursor({ trace, row });
    setTooltip({
      x: px,
      y: py,
      rows: [
        ['Trace', String(trace)],
        ['Time', `${fixed(trace / meta.traceRateHz, 2)} s`],
        ['Line', line ? `L${line.id}` : 'transit'],
        ['Two-way time', `${fixed(rowToNs(processed, meta, rowIdx), 1)} ns`],
        ['Depth', depth >= 0 ? `${fixed(depth, 2)} m` : 'above ground'],
        ['Amplitude', fixed(processed.data[trace * processed.nRows + rowIdx] / processed.clip, 2)],
        ['Altitude', `${fixed(meta.alt[trace], 2)} m`],
      ],
    });
  };

  const endDrag = (): void => {
    dragRef.current = null;
  };

  return (
    <div ref={boxRef} style={{ position: 'relative', flex: 1, minWidth: 0, minHeight: 0 }}>
      <canvas
        ref={canvasRef}
        aria-label="B-scan radargram"
        style={{ position: 'absolute', inset: 0, cursor: 'crosshair', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => setTooltip(null)}
        onDoubleClick={resetView}
      />
      <Tooltip data={tooltip} containerWidth={size.width} />
    </div>
  );
}
