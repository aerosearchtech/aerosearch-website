import { drawTicks, niceTicks, plotRect, setText } from '@/gpr/lib/canvas';
import type { PlotRect } from '@/gpr/lib/canvas';
import { BSCAN_MARGIN } from '@/gpr/lib/constants';
import type { SliceRows } from '@/gpr/lib/cscan';
import type { Palette } from '@/gpr/lib/theme';
import type { Cursor, FlightMeta, Processed, Size, View } from '@/gpr/lib/types';

export interface BScanScene {
  image: HTMLCanvasElement;
  processed: Processed;
  meta: FlightMeta;
  view: View;
  cursor: Cursor | null;
  palette: Palette;
  velocity: number;
  slice: SliceRows;
}

export interface BScanMapping {
  rect: PlotRect;
  xPx: (trace: number) => number;
  yPx: (row: number) => number;
  toTrace: (px: number) => number;
  toRow: (py: number) => number;
}

export function bscanMapping(size: Size, view: View): BScanMapping {
  const rect = plotRect(size, BSCAN_MARGIN);
  const sx = rect.width / (view.x1 - view.x0);
  const sy = rect.height / (view.y1 - view.y0);
  return {
    rect,
    xPx: (t) => rect.left + (t - view.x0) * sx,
    yPx: (r) => rect.top + (r - view.y0) * sy,
    toTrace: (px) => view.x0 + (px - rect.left) / sx,
    toRow: (py) => view.y0 + (py - rect.top) / sy,
  };
}

// Points of a per-trace row curve (surface, slice bounds) across the plot.
function curve(m: BScanMapping, nTraces: number, rowOf: (trace: number) => number): [number, number][] {
  const pts: [number, number][] = [];
  for (let px = m.rect.left; px <= m.rect.left + m.rect.width; px += 2) {
    const t = Math.min(nTraces - 1, Math.max(0, Math.floor(m.toTrace(px))));
    pts.push([px, m.yPx(rowOf(t) + 0.5)]);
  }
  return pts;
}

function drawLineStrip(ctx: CanvasRenderingContext2D, m: BScanMapping, s: BScanScene): void {
  const right = m.rect.left + m.rect.width;
  for (const line of s.meta.lines) {
    const a = Math.max(m.rect.left, m.xPx(line.start));
    const b = Math.min(right, m.xPx(line.end + 1));
    if (b <= a) continue;
    ctx.fillStyle = s.palette.raised;
    ctx.fillRect(a, 4, b - a, 14);
    if (b - a > 24) {
      setText(ctx, s.palette.inkSecondary, 10, 600);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`L${line.id}`, (a + b) / 2, 11.5);
    }
  }
}

function drawAxes(ctx: CanvasRenderingContext2D, m: BScanMapping, s: BScanScene): void {
  const { rect } = m;
  const { meta, processed: p, view, palette, velocity } = s;
  const rate = meta.traceRateHz;
  const nsOf = (row: number): number => (row - p.zeroRow) * meta.dtNs;

  const timeTicks = niceTicks(view.x0 / rate, view.x1 / rate, rect.width / 90);
  drawTicks(ctx, { ticks: timeTicks, toPx: (t) => m.xPx(t * rate), rect, palette, side: 'bottom' });

  const nsTicks = niceTicks(nsOf(view.y0), nsOf(view.y1), rect.height / 45);
  drawTicks(ctx, { ticks: nsTicks, toPx: (ns) => m.yPx(p.zeroRow + ns / meta.dtNs), rect, palette, side: 'left' });

  setText(ctx, palette.inkMuted, 10);
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText('time (s)', rect.left + rect.width + 8, rect.top + rect.height + 6);
  ctx.save();
  ctx.translate(12, rect.top + rect.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('two-way time (ns)', 0, -6);
  ctx.restore();

  if (!p.flattened) return;
  const depthOf = (row: number): number => (nsOf(row) * velocity) / 2;
  const depthTicks = niceTicks(Math.max(0, depthOf(view.y0)), depthOf(view.y1), rect.height / 45);
  const toPx = (d: number): number => m.yPx(p.zeroRow + (2 * d) / (velocity * meta.dtNs));
  drawTicks(ctx, { ticks: depthTicks, toPx, rect, palette, side: 'right' });
  ctx.save();
  ctx.translate(rect.left + rect.width + 46, rect.top + rect.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('depth below surface (m)', 0, -6);
  ctx.restore();
}

export function drawBScan(ctx: CanvasRenderingContext2D, size: Size, s: BScanScene): void {
  const m = bscanMapping(size, s.view);
  const { rect } = m;
  const { view, processed: p, palette } = s;

  ctx.fillStyle = palette.surface;
  ctx.fillRect(0, 0, size.width, size.height);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(s.image, view.x0, view.y0, view.x1 - view.x0, view.y1 - view.y0, rect.left, rect.top, rect.width, rect.height);

  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.left, rect.top, rect.width, rect.height);
  ctx.clip();

  // Depth-slice band (linked to the C-scan), following the surface.
  const top = curve(m, p.nTraces, (t) => p.surfaceRow[t] + s.slice.offsetRows);
  const bottom = curve(m, p.nTraces, (t) => p.surfaceRow[t] + s.slice.offsetRows + s.slice.countRows);
  ctx.beginPath();
  [...top, ...bottom.reverse()].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = palette.cursor;
  ctx.fill();
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = palette.cursor;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Ground reflection pick.
  ctx.globalAlpha = 0.7;
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = palette.ink;
  ctx.beginPath();
  curve(m, p.nTraces, (t) => p.surfaceRow[t]).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  if (s.cursor) {
    ctx.strokeStyle = palette.cursor;
    ctx.beginPath();
    const x = Math.round(m.xPx(s.cursor.trace + 0.5)) + 0.5;
    ctx.moveTo(x, rect.top);
    ctx.lineTo(x, rect.top + rect.height);
    if (s.cursor.row !== null) {
      const y = Math.round(m.yPx(Math.floor(s.cursor.row) + 0.5)) + 0.5;
      ctx.moveTo(rect.left, y);
      ctx.lineTo(rect.left + rect.width, y);
    }
    ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle = palette.axis;
  ctx.strokeRect(rect.left - 0.5, rect.top - 0.5, rect.width + 1, rect.height + 1);
  drawLineStrip(ctx, m, s);
  drawAxes(ctx, m, s);
}
