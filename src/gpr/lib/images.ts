// Rasterise processed data into offscreen canvases that the plots blit from.
import type { Lut } from './colormap';
import { IMAGE_TILE_PX, LUT_SIZE } from './constants';
import type { CScanGrid, Processed } from './types';

function canvasWithImage(width: number, height: number, fill: (px: Uint8ClampedArray) => void): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const img = ctx.createImageData(width, height);
  fill(img.data);
  ctx.putImageData(img, 0, 0);
  return canvas;
}

// Image wider than one canvas allows, stored as IMAGE_TILE_PX-wide strips.
export interface TiledImage {
  width: number;
  height: number;
  tiles: HTMLCanvasElement[];
}

// Full-resolution radargram: one pixel per sample, x = trace, y = row.
export function renderBScan(p: Processed, lut: Lut, contrast: number): TiledImage {
  const { data, nTraces, nRows } = p;
  const half = (LUT_SIZE - 1) / 2;
  const scale = (contrast / p.clip) * half;
  const tiles: HTMLCanvasElement[] = [];
  for (let t0 = 0; t0 < nTraces; t0 += IMAGE_TILE_PX) {
    const w = Math.min(IMAGE_TILE_PX, nTraces - t0);
    tiles.push(
      canvasWithImage(w, nRows, (px) => {
        for (let i = 0; i < w; i++) {
          for (let r = 0; r < nRows; r++) {
            const k = Math.max(0, Math.min(LUT_SIZE - 1, Math.round(half + data[(t0 + i) * nRows + r] * scale))) * 3;
            const o = (r * w + i) * 4;
            px[o] = lut[k];
            px[o + 1] = lut[k + 1];
            px[o + 2] = lut[k + 2];
            px[o + 3] = 255;
          }
        }
      }),
    );
  }
  return { width: nTraces, height: nRows, tiles };
}

// drawImage for a TiledImage: source columns [sx, sx+sw) -> destination box.
export function blit(
  ctx: CanvasRenderingContext2D,
  img: TiledImage,
  [sx, sy, sw, sh]: [number, number, number, number],
  [dx, dy, dw, dh]: [number, number, number, number],
): void {
  const k = dw / sw;
  img.tiles.forEach((tile, i) => {
    const t0 = i * IMAGE_TILE_PX;
    const a = Math.max(sx, t0);
    const b = Math.min(sx + sw, t0 + tile.width);
    if (b > a) ctx.drawImage(tile, a - t0, sy, b - a, sh, dx + (a - sx) * k, dy, (b - a) * k, dh);
  });
}

// Depth-slice grid; cells without coverage stay transparent.
export function renderGrid(g: CScanGrid, lut: Lut): HTMLCanvasElement {
  const span = g.vmax - g.vmin || 1;
  return canvasWithImage(g.width, g.height, (px) => {
    g.values.forEach((v, i) => {
      if (Number.isNaN(v)) return;
      const k = Math.round(Math.max(0, Math.min(1, (v - g.vmin) / span)) * (LUT_SIZE - 1)) * 3;
      px[i * 4] = lut[k];
      px[i * 4 + 1] = lut[k + 1];
      px[i * 4 + 2] = lut[k + 2];
      px[i * 4 + 3] = 255;
    });
  });
}
