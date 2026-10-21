import { plotRect, setText } from '@/gpr/lib/canvas';
import type { PlotRect } from '@/gpr/lib/canvas';
import { BASEMAP, MAP_MARGIN, MAP_SCALE_BAR_M, TARGET_PIN_PX } from '@/gpr/lib/constants';
import type { Palette } from '@/gpr/lib/theme';
import type { Bounds, CScanGrid, Cursor, FlightMeta, MapLayer, Size, Target, View } from '@/gpr/lib/types';
import type { BasemapTile } from './useBasemap';

type Corner = [number, number];

// Raster placed in the local metric frame by its north-west, north-east and
// south-west corners (so rotated imagery draws correctly).
export interface MapOverlay {
  img: HTMLCanvasElement | HTMLImageElement;
  nw: Corner;
  ne: Corner;
  sw: Corner;
}

export function gridOverlay(g: CScanGrid, img: HTMLCanvasElement): MapOverlay {
  const left = g.minX - g.cellM / 2;
  const top = g.maxY + g.cellM / 2;
  return {
    img,
    nw: [left, top],
    ne: [left + g.width * g.cellM, top],
    sw: [left, top - g.height * g.cellM],
  };
}

export interface MapScene {
  meta: FlightMeta;
  bounds: Bounds;
  overlay: MapOverlay | null;
  overlayAlpha: number;
  tiles: BasemapTile[];
  targets: Target[];
  sensor: MapLayer; // pins are coloured by this sensor's result
  selectedTarget: number | null;
  hoverTarget: number | null;
  view: View;
  cursor: Cursor | null;
  palette: Palette;
}

export interface MapMapping {
  rect: PlotRect;
  scale: number; // px per metre
  toPx: (x: number, y: number) => [number, number];
  toWorld: (px: number, py: number) => [number, number];
}

// Foreground/halo pair: plain colours on the surface, white-on-dark over imagery.
interface Ink {
  fg: string;
  muted: string;
  halo: string | null;
}

// North-up, equal-aspect fit of `bounds` into the plot area.
export function mapMapping(size: Size, { minX, maxX, minY, maxY }: Bounds): MapMapping {
  const rect = plotRect(size, MAP_MARGIN);
  const scale = Math.min(rect.width / (maxX - minX || 1), rect.height / (maxY - minY || 1));
  const ox = rect.left + (rect.width - (maxX - minX) * scale) / 2;
  const oy = rect.top + (rect.height - (maxY - minY) * scale) / 2;
  return {
    rect,
    scale,
    toPx: (x, y) => [ox + (x - minX) * scale, oy + (maxY - y) * scale],
    toWorld: (px, py) => [minX + (px - ox) / scale, maxY - (py - oy) / scale],
  };
}

function tracePath(ctx: CanvasRenderingContext2D, m: MapMapping, meta: FlightMeta, from: number, to: number): void {
  ctx.beginPath();
  for (let i = from; i <= to; i++) {
    const [x, y] = m.toPx(meta.x[i], meta.y[i]);
    if (i === from) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// Stroke part of the track, with an optional wider halo underneath.
function strokeTrace(ctx: CanvasRenderingContext2D, m: MapMapping, s: MapScene, range: [number, number], color: string, width: number, halo: string | null): void {
  if (halo) {
    ctx.strokeStyle = halo;
    ctx.lineWidth = width + 2;
    tracePath(ctx, m, s.meta, ...range);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  tracePath(ctx, m, s.meta, ...range);
}

function haloText(ctx: CanvasRenderingContext2D, ink: Ink, fallbackHalo: string, text: string, x: number, y: number): void {
  ctx.lineWidth = 3;
  ctx.strokeStyle = ink.halo ?? fallbackHalo;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = ink.fg;
  ctx.fillText(text, x, y);
}

function drawTiles(ctx: CanvasRenderingContext2D, m: MapMapping, tiles: BasemapTile[]): void {
  for (const t of tiles) {
    const [x0, y0] = m.toPx(...t.nw);
    const [x1, y1] = m.toPx(...t.se);
    // Round outwards so neighbouring tiles overlap by a pixel instead of leaving seams.
    ctx.drawImage(t.img, Math.floor(x0), Math.floor(y0), Math.ceil(x1) - Math.floor(x0), Math.ceil(y1) - Math.floor(y0));
  }
}

function drawOverlay(ctx: CanvasRenderingContext2D, m: MapMapping, o: MapOverlay, alpha: number): void {
  const [nx, ny] = m.toPx(...o.nw);
  const [ex, ey] = m.toPx(...o.ne);
  const [sx, sy] = m.toPx(...o.sw);
  const { width: w, height: h } = o.img;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.transform((ex - nx) / w, (ey - ny) / w, (sx - nx) / h, (sy - ny) / h, nx, ny);
  ctx.drawImage(o.img, 0, 0);
  ctx.restore();
}

export const targetColor = (t: Target, sensor: MapLayer, p: Palette): string =>
  t[sensor] === null ? p.inkMuted : t[sensor] ? p.detected : p.missed;

const targetLabel = (t: Target): string => (t.no === null ? t.name : `#${t.no}`);

// Surveyed objects: dot coloured by the sensor result, ring on the selected one,
// label only on the selected and hovered pins to keep the map readable.
function drawTargets(ctx: CanvasRenderingContext2D, m: MapMapping, s: MapScene, ink: Ink): void {
  const { palette } = s;
  s.targets.forEach((t, i) => {
    const [x, y] = m.toPx(t.x, t.y);
    ctx.beginPath();
    ctx.arc(x, y, TARGET_PIN_PX, 0, Math.PI * 2);
    ctx.fillStyle = targetColor(t, s.sensor, palette);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = ink.halo ?? palette.surface;
    ctx.stroke();
    if (i === s.selectedTarget) {
      ctx.beginPath();
      ctx.arc(x, y, TARGET_PIN_PX + 4, 0, Math.PI * 2);
      ctx.strokeStyle = palette.cursor;
      ctx.stroke();
    }
  });
  setText(ctx, ink.fg, 11, 600);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (const i of new Set([s.selectedTarget, s.hoverTarget])) {
    const t = i === null ? undefined : s.targets[i];
    if (!t) continue;
    const [x, y] = m.toPx(t.x, t.y);
    haloText(ctx, ink, palette.surface, targetLabel(t), x + TARGET_PIN_PX + 7, y);
  }
}

function drawLineLabels(ctx: CanvasRenderingContext2D, m: MapMapping, s: MapScene, ink: Ink): void {
  setText(ctx, ink.fg, 10.5, 600);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  for (const l of s.meta.lines) {
    const [sx, sy] = m.toPx(s.meta.x[l.start], s.meta.y[l.start]);
    const [ex, ey] = m.toPx(s.meta.x[l.end], s.meta.y[l.end]);
    const len = Math.hypot(sx - ex, sy - ey) || 1;
    haloText(ctx, ink, s.palette.surface, `L${l.id}`, sx + ((sx - ex) / len) * 12, sy + ((sy - ey) / len) * 12);
  }
}

function drawChrome(ctx: CanvasRenderingContext2D, m: MapMapping, size: Size, ink: Ink, s: MapScene): void {
  // Scale bar, bottom-left.
  const len = MAP_SCALE_BAR_M * m.scale;
  const y = size.height - 18;
  const x = MAP_MARGIN.left;
  const bar = (): void => {
    ctx.beginPath();
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.lineTo(x + len, y - 4);
    ctx.stroke();
  };
  if (ink.halo) {
    ctx.strokeStyle = ink.halo;
    ctx.lineWidth = 3.5;
    bar();
  }
  ctx.strokeStyle = ink.muted;
  ctx.lineWidth = 1.5;
  bar();
  setText(ctx, ink.muted, 10.5);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  haloText(ctx, ink, s.palette.surface, `${MAP_SCALE_BAR_M} m`, x + len + 6, y - 1);

  // North arrow, top-right.
  const nx = size.width - MAP_MARGIN.right - 10;
  const ny = MAP_MARGIN.top + 6;
  ctx.beginPath();
  ctx.moveTo(nx, ny);
  ctx.lineTo(nx - 5, ny + 14);
  ctx.lineTo(nx, ny + 10);
  ctx.lineTo(nx + 5, ny + 14);
  ctx.closePath();
  if (ink.halo) {
    ctx.strokeStyle = ink.halo;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.fillStyle = ink.muted;
  ctx.fill();
  ctx.textAlign = 'center';
  haloText(ctx, ink, s.palette.surface, 'N', nx, ny + 24);

  if (s.tiles.length) {
    setText(ctx, ink.fg, 9);
    ctx.textAlign = 'right';
    haloText(ctx, ink, s.palette.surface, BASEMAP.attribution, size.width - 6, size.height - 7);
  }
}

export function drawMap(ctx: CanvasRenderingContext2D, size: Size, s: MapScene): void {
  const m = mapMapping(size, s.bounds);
  const { meta, palette } = s;
  const onImage = s.tiles.length > 0;
  const ink: Ink = onImage
    ? { fg: palette.onImage, muted: palette.onImage, halo: palette.imageHalo }
    : { fg: palette.ink, muted: palette.inkSecondary, halo: null };

  ctx.fillStyle = palette.surface;
  ctx.fillRect(0, 0, size.width, size.height);
  ctx.imageSmoothingEnabled = true;
  drawTiles(ctx, m, s.tiles);

  if (s.overlay) drawOverlay(ctx, m, s.overlay, onImage ? s.overlayAlpha : 1);

  ctx.lineJoin = 'round';
  ctx.setLineDash([3, 3]);
  strokeTrace(ctx, m, s, [0, meta.nTraces - 1], onImage ? palette.onImage : palette.inkMuted, 1, ink.halo);
  ctx.setLineDash([]);
  for (const l of meta.lines) strokeTrace(ctx, m, s, [l.start, l.end], ink.muted, 1, ink.halo);

  // Section currently shown in the B-scan (only when zoomed in).
  const from = Math.max(0, Math.floor(s.view.x0));
  const to = Math.min(meta.nTraces - 1, Math.ceil(s.view.x1) - 1);
  if (from > 0 || to < meta.nTraces - 1) strokeTrace(ctx, m, s, [from, to], onImage ? palette.accent : palette.ink, 2.5, ink.halo);

  drawLineLabels(ctx, m, s, ink);
  drawTargets(ctx, m, s, ink);

  if (s.cursor) {
    const [cx, cy] = m.toPx(meta.x[s.cursor.trace], meta.y[s.cursor.trace]);
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = palette.cursor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = palette.surface;
    ctx.stroke();
  }
  drawChrome(ctx, m, size, ink, s);
}
