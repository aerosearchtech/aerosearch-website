'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import Tooltip from '@/gpr/components/ui/Tooltip';
import { drawTicks, niceTicks, plotRect, prepareCanvas, setText } from '@/gpr/lib/canvas';
import type { PlotRect } from '@/gpr/lib/canvas';
import { ALT_MARGIN } from '@/gpr/lib/constants';
import { extent } from '@/gpr/lib/extent';
import { fixed, radarHeight } from '@/gpr/lib/format';
import { useViewer } from '@/gpr/lib/store';
import { PALETTES } from '@/gpr/lib/theme';
import type { Palette } from '@/gpr/lib/theme';
import type { Cursor, FlightMeta, Size, TooltipData, View } from '@/gpr/lib/types';
import { useElementSize } from '@/gpr/lib/useElementSize';

interface Series {
  label: string;
  color: keyof Palette;
  values: Float32Array;
}

interface Scene {
  meta: FlightMeta;
  series: Series[];
  yMax: number;
  view: View;
  cursor: Cursor | null;
  palette: Palette;
}

const xMapping = (rect: PlotRect, view: View) => ({
  xPx: (t: number): number => rect.left + ((t - view.x0) / (view.x1 - view.x0)) * rect.width,
  toTrace: (px: number): number => view.x0 + ((px - rect.left) / rect.width) * (view.x1 - view.x0),
});

function draw(ctx: CanvasRenderingContext2D, size: Size, s: Scene): void {
  const rect = plotRect(size, ALT_MARGIN);
  const { xPx, toTrace } = xMapping(rect, s.view);
  const yPx = (v: number): number => rect.top + rect.height * (1 - v / s.yMax);
  const { palette, meta } = s;
  const right = rect.left + rect.width;

  ctx.fillStyle = palette.surface;
  ctx.fillRect(0, 0, size.width, size.height);
  for (const l of meta.lines) {
    const a = Math.max(rect.left, xPx(l.start));
    const b = Math.min(right, xPx(l.end + 1));
    if (b > a) {
      ctx.fillStyle = palette.raised;
      ctx.fillRect(a, rect.top, b - a, rect.height);
    }
  }
  drawTicks(ctx, { ticks: niceTicks(0, s.yMax, rect.height / 28), toPx: yPx, rect, palette, side: 'left', gridlines: true });
  const rate = meta.traceRateHz;
  const timeTicks = niceTicks(s.view.x0 / rate, s.view.x1 / rate, rect.width / 90);
  drawTicks(ctx, { ticks: timeTicks, toPx: (t) => xPx(t * rate), rect, palette, side: 'bottom' });

  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.left, rect.top - 2, rect.width, rect.height + 4);
  ctx.clip();
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  for (const ser of s.series) {
    ctx.strokeStyle = palette[ser.color];
    ctx.beginPath();
    for (let px = rect.left; px <= right; px++) {
      const t = Math.min(meta.nTraces - 1, Math.max(0, Math.floor(toTrace(px))));
      if (px === rect.left) ctx.moveTo(px, yPx(ser.values[t]));
      else ctx.lineTo(px, yPx(ser.values[t]));
    }
    ctx.stroke();
  }
  ctx.restore();

  // Direct labels in the right margin, at each series' last visible value.
  const tEnd = Math.min(meta.nTraces - 1, Math.floor(s.view.x1) - 1);
  const ys = s.series.map((ser) => yPx(ser.values[tEnd]));
  if (Math.abs(ys[0] - ys[1]) < 12) ys[ys[0] < ys[1] ? 1 : 0] += 12 - Math.abs(ys[0] - ys[1]);
  s.series.forEach((ser, k) => {
    ctx.fillStyle = palette[ser.color];
    ctx.fillRect(right + 8, ys[k] - 1, 10, 2);
    setText(ctx, palette.inkSecondary, 10.5);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${ser.label}  ${fixed(ser.values[tEnd], 2)} m`, right + 22, ys[k]);
  });

  if (s.cursor) {
    const x = Math.round(xPx(s.cursor.trace + 0.5)) + 0.5;
    ctx.strokeStyle = palette.cursor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, rect.top);
    ctx.lineTo(x, rect.top + rect.height);
    ctx.stroke();
    for (const ser of s.series) {
      ctx.beginPath();
      ctx.arc(x, yPx(ser.values[s.cursor.trace]), 4, 0, Math.PI * 2);
      ctx.fillStyle = palette[ser.color];
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = palette.surface;
      ctx.stroke();
    }
  }
}

export default function AltitudeChart({ meta }: { meta: FlightMeta }) {
  const [boxRef, size] = useElementSize<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const view = useViewer((s) => s.view);
  const cursor = useViewer((s) => s.cursor);
  const theme = useViewer((s) => s.theme);
  const setCursor = useViewer((s) => s.setCursor);

  const series = useMemo<Series[]>(
    () => [
      { label: 'Rangefinder', color: 'series1', values: Float32Array.from(meta.alt) },
      { label: 'Radar echo', color: 'series2', values: Float32Array.from(meta.alt, (_, i) => radarHeight(meta, i)) },
    ],
    [meta],
  );
  const yMax = useMemo(() => Math.max(...series.map((s) => extent(s.values)[1])) * 1.1, [series]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !view || !size.width) return;
    const ctx = prepareCanvas(canvas, size);
    if (ctx) draw(ctx, size, { meta, series, yMax, view, cursor, palette: PALETTES[theme] });
  }, [size, meta, series, yMax, view, cursor, theme]);

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>): void => {
    if (!view) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const trace = Math.floor(xMapping(plotRect(size, ALT_MARGIN), view).toTrace(px));
    if (trace < 0 || trace >= meta.nTraces || trace < view.x0 || trace >= view.x1) {
      setTooltip(null);
      return;
    }
    setCursor({ trace, row: useViewer.getState().cursor?.row ?? null });
    setTooltip({
      x: px,
      y: e.clientY - r.top,
      rows: [
        ['Time', `${fixed(trace / meta.traceRateHz, 2)} s`],
        ...series.map((s): [string, string] => [s.label, `${fixed(s.values[trace], 2)} m`]),
      ],
    });
  };

  return (
    <div ref={boxRef} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <canvas
        ref={canvasRef}
        aria-label="Altitude profile: rangefinder and radar surface echo"
        style={{ position: 'absolute', inset: 0, cursor: 'crosshair' }}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setTooltip(null)}
      />
      <Tooltip data={tooltip} containerWidth={size.width} />
    </div>
  );
}
