// Small canvas helpers shared by every plot.
import { FONT_SANS } from './theme';
import type { Palette } from './theme';
import type { Margins, Size } from './types';

export interface PlotRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function prepareCanvas(canvas: HTMLCanvasElement, size: Size): CanvasRenderingContext2D | null {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(size.width * dpr);
  canvas.height = Math.round(size.height * dpr);
  const ctx = canvas.getContext('2d');
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export const plotRect = (size: Size, m: Margins): PlotRect => ({
  left: m.left,
  top: m.top,
  width: Math.max(1, size.width - m.left - m.right),
  height: Math.max(1, size.height - m.top - m.bottom),
});

// "Nice" 1-2-5 tick values covering [min, max].
export function niceTicks(min: number, max: number, target: number): number[] {
  const span = max - min;
  if (!(span > 0) || target < 1) return [];
  const raw = span / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 5, 10].find((s) => s * mag >= raw) ?? 10) * mag;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) ticks.push(+v.toFixed(10));
  return ticks;
}

export const tickDecimals = (ticks: number[]): number =>
  ticks.length > 1 ? Math.max(0, -Math.floor(Math.log10(ticks[1] - ticks[0]) + 1e-9)) : 0;

export function setText(ctx: CanvasRenderingContext2D, color: string, size = 11, weight = 400): void {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT_SANS}`;
}

interface AxisOptions {
  ticks: number[];
  toPx: (v: number) => number;
  rect: PlotRect;
  palette: Palette;
  side: 'left' | 'right' | 'bottom';
  gridlines?: boolean;
}

export function drawTicks(ctx: CanvasRenderingContext2D, o: AxisOptions): void {
  const { ticks, toPx, rect, palette, side, gridlines = false } = o;
  const decimals = tickDecimals(ticks);
  setText(ctx, palette.inkMuted, 10);
  ctx.strokeStyle = gridlines ? palette.grid : palette.axis;
  ctx.lineWidth = 1;
  for (const v of ticks) {
    const p = Math.round(toPx(v)) + 0.5;
    const label = v.toFixed(decimals);
    ctx.beginPath();
    if (side === 'bottom') {
      if (p < rect.left - 1 || p > rect.left + rect.width + 1) continue;
      const y = rect.top + rect.height;
      ctx.moveTo(p, gridlines ? rect.top : y);
      ctx.lineTo(p, y + 4);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(label, p, y + 6);
    } else {
      if (p < rect.top - 1 || p > rect.top + rect.height + 1) continue;
      const x = side === 'left' ? rect.left : rect.left + rect.width;
      const dir = side === 'left' ? -1 : 1;
      ctx.moveTo(gridlines ? rect.left + rect.width : x, p);
      ctx.lineTo(x + dir * 4, p);
      ctx.textAlign = side === 'left' ? 'right' : 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + dir * 7, p);
    }
    ctx.stroke();
  }
}
