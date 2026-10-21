// Rasterise processed data into offscreen canvases that the plots blit from.
import type { Lut } from './colormap';
import { LUT_SIZE } from './constants';
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

// Full-resolution radargram: one pixel per sample, x = trace, y = row.
export function renderBScan(p: Processed, lut: Lut, contrast: number): HTMLCanvasElement {
  const { data, nTraces, nRows } = p;
  const half = (LUT_SIZE - 1) / 2;
  const scale = (contrast / p.clip) * half;
  return canvasWithImage(nTraces, nRows, (px) => {
    for (let i = 0; i < nTraces; i++) {
      for (let r = 0; r < nRows; r++) {
        const k = Math.max(0, Math.min(LUT_SIZE - 1, Math.round(half + data[i * nRows + r] * scale))) * 3;
        const o = (r * nTraces + i) * 4;
        px[o] = lut[k];
        px[o + 1] = lut[k + 1];
        px[o + 2] = lut[k + 2];
        px[o + 3] = 255;
      }
    }
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
