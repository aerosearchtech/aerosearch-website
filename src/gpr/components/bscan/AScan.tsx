'use client';

import { useEffect, useRef } from 'react';
import { plotRect, prepareCanvas, setText } from '@/gpr/lib/canvas';
import { ASCAN_MARGIN, ASCAN_WIDTH } from '@/gpr/lib/constants';
import { useViewer } from '@/gpr/lib/store';
import { PALETTES } from '@/gpr/lib/theme';
import type { Palette } from '@/gpr/lib/theme';
import type { Cursor, Processed, Size, View } from '@/gpr/lib/types';
import { useElementSize } from '@/gpr/lib/useElementSize';

function drawAScan(ctx: CanvasRenderingContext2D, size: Size, p: Processed, view: View, cursor: Cursor | null, palette: Palette): void {
  const rect = plotRect(size, ASCAN_MARGIN);
  ctx.fillStyle = palette.surface;
  ctx.fillRect(0, 0, size.width, size.height);
  ctx.strokeStyle = palette.axis;
  ctx.strokeRect(rect.left - 0.5, rect.top - 0.5, rect.width + 1, rect.height + 1);

  setText(ctx, palette.inkMuted, 10);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (!cursor) {
    ctx.fillText('hover the', rect.left + rect.width / 2, rect.top + rect.height / 2 - 7);
    ctx.fillText('radargram', rect.left + rect.width / 2, rect.top + rect.height / 2 + 7);
    return;
  }
  ctx.fillText(`A-scan · trace ${cursor.trace}`, rect.left + rect.width / 2, 11);
  ctx.textBaseline = 'top';
  ctx.fillText('amplitude', rect.left + rect.width / 2, rect.top + rect.height + 8);

  const r0 = Math.max(0, Math.floor(view.y0));
  const r1 = Math.min(p.nRows, Math.ceil(view.y1));
  const base = cursor.trace * p.nRows;
  let peak = p.clip * 0.05;
  for (let r = r0; r < r1; r++) peak = Math.max(peak, Math.abs(p.data[base + r]));

  const cx = rect.left + rect.width / 2;
  const xPx = (v: number): number => cx + (v / peak) * (rect.width / 2 - 2);
  const yPx = (r: number): number => rect.top + ((r + 0.5 - view.y0) / (view.y1 - view.y0)) * rect.height;

  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.left, rect.top, rect.width, rect.height);
  ctx.clip();

  ctx.strokeStyle = palette.axis;
  ctx.beginPath();
  ctx.moveTo(cx, rect.top);
  ctx.lineTo(cx, rect.top + rect.height);
  ctx.stroke();

  const wiggle = new Path2D();
  for (let r = r0; r < r1; r++) {
    if (r === r0) wiggle.moveTo(xPx(p.data[base + r]), yPx(r));
    else wiggle.lineTo(xPx(p.data[base + r]), yPx(r));
  }

  // Classic wiggle fill on the positive lobes.
  const fill = new Path2D(wiggle);
  fill.lineTo(cx, yPx(r1 - 1));
  fill.lineTo(cx, yPx(r0));
  ctx.save();
  ctx.beginPath();
  ctx.rect(cx, rect.top, rect.width, rect.height);
  ctx.clip();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = palette.series1;
  ctx.fill(fill);
  ctx.restore();

  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = 1.5;
  ctx.stroke(wiggle);

  ctx.lineWidth = 1;
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = palette.inkSecondary;
  ctx.beginPath();
  ctx.moveTo(rect.left, yPx(p.surfaceRow[cursor.trace]));
  ctx.lineTo(rect.left + rect.width, yPx(p.surfaceRow[cursor.trace]));
  ctx.stroke();
  ctx.setLineDash([]);

  if (cursor.row !== null) {
    const y = Math.round(yPx(Math.floor(cursor.row))) + 0.5;
    ctx.strokeStyle = palette.cursor;
    ctx.beginPath();
    ctx.moveTo(rect.left, y);
    ctx.lineTo(rect.left + rect.width, y);
    ctx.stroke();
  }
  ctx.restore();
}

export default function AScan({ processed }: { processed: Processed }) {
  const [boxRef, size] = useElementSize<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const view = useViewer((s) => s.view);
  const cursor = useViewer((s) => s.cursor);
  const theme = useViewer((s) => s.theme);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !view || !size.width) return;
    const ctx = prepareCanvas(canvas, size);
    if (ctx) drawAScan(ctx, size, processed, view, cursor, PALETTES[theme]);
  }, [size, processed, view, cursor, theme]);

  return (
    <div ref={boxRef} style={{ position: 'relative', width: ASCAN_WIDTH, flex: 'none' }}>
      <canvas ref={canvasRef} aria-label="A-scan of the cursor trace" style={{ position: 'absolute', inset: 0 }} />
    </div>
  );
}
