'use client';

import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { plotRect, prepareCanvas } from '@/gpr/lib/canvas';
import { OVERVIEW_HEIGHT, OVERVIEW_MARGIN } from '@/gpr/lib/constants';
import { blit } from '@/gpr/lib/images';
import type { TiledImage } from '@/gpr/lib/images';
import { useViewer } from '@/gpr/lib/store';
import { PALETTES } from '@/gpr/lib/theme';
import type { Palette } from '@/gpr/lib/theme';
import type { Size, View } from '@/gpr/lib/types';
import { useElementSize } from '@/gpr/lib/useElementSize';

function drawOverview(ctx: CanvasRenderingContext2D, size: Size, image: TiledImage, view: View, palette: Palette): void {
  const rect = plotRect(size, OVERVIEW_MARGIN);
  const n = image.width;
  ctx.fillStyle = palette.surface;
  ctx.fillRect(0, 0, size.width, size.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  blit(ctx, image, [0, view.y0, n, view.y1 - view.y0], [rect.left, rect.top, rect.width, rect.height]);

  // Dim everything outside the window shown in the B-scan, then outline the window.
  const a = rect.left + (view.x0 / n) * rect.width;
  const b = rect.left + (view.x1 / n) * rect.width;
  ctx.fillStyle = palette.scrim;
  ctx.fillRect(rect.left, rect.top, a - rect.left, rect.height);
  ctx.fillRect(b, rect.top, rect.left + rect.width - b, rect.height);
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(a, rect.top + 0.75, Math.max(2, b - a), rect.height - 1.5);
}

// Whole-flight strip: click or drag to move the B-scan window along track.
export default function Overview({ image }: { image: TiledImage }) {
  const [boxRef, size] = useElementSize<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const view = useViewer((s) => s.view);
  const theme = useViewer((s) => s.theme);
  const setView = useViewer((s) => s.setView);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !view || !size.width) return;
    const ctx = prepareCanvas(canvas, size);
    if (ctx) drawOverview(ctx, size, image, view, PALETTES[theme]);
  }, [size, image, view, theme]);

  const centerAt = (e: ReactPointerEvent<HTMLCanvasElement>): void => {
    if (!view) return;
    const rect = plotRect(size, OVERVIEW_MARGIN);
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left;
    const trace = ((px - rect.left) / rect.width) * image.width;
    const half = (view.x1 - view.x0) / 2;
    setView({ ...view, x0: trace - half, x1: trace + half });
  };

  return (
    <div ref={boxRef} style={{ position: 'relative', height: OVERVIEW_HEIGHT, flex: 'none' }}>
      <canvas
        ref={canvasRef}
        aria-label="Whole-flight overview; click to move the radargram window"
        style={{ position: 'absolute', inset: 0, cursor: 'ew-resize', touchAction: 'none' }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          dragging.current = true;
          centerAt(e);
        }}
        onPointerMove={(e) => dragging.current && centerAt(e)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      />
    </div>
  );
}
