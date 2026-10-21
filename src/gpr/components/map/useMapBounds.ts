import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { MAP_DRAG_PX, ZOOM_STEP } from '@/gpr/lib/constants';
import { centerOn, containsPoint, panBounds, surveyBounds, zoomBounds } from '@/gpr/lib/mapBounds';
import type { Bounds, FlightMeta, Size } from '@/gpr/lib/types';
import { mapMapping } from './drawMap';

interface Drag {
  x: number;
  y: number;
  bounds: Bounds;
  moved: boolean;
}

export interface MapPanZoom {
  bounds: Bounds;
  dragging: boolean;
  start: (e: ReactPointerEvent<HTMLCanvasElement>) => void;
  move: (e: ReactPointerEvent<HTMLCanvasElement>) => boolean; // true while the pointer is down
  end: () => boolean; // true when the gesture was a pan rather than a click
  reset: () => void;
}

// Wheel zoom and drag pan of the map; opens on the survey area and keeps `focus` in view.
export function useMapBounds(
  meta: FlightMeta,
  size: Size,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  focus: [number, number] | null,
): MapPanZoom {
  const [bounds, setBounds] = useState<Bounds>(() => surveyBounds(meta));
  const [dragging, setDragging] = useState(false);
  const drag = useRef<Drag | null>(null);

  // Non-passive listener so the wheel zooms the map instead of scrolling the page.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent): void => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const factor = e.deltaY > 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      setBounds((b) => zoomBounds(b, mapMapping(size, b).toWorld(e.clientX - r.left, e.clientY - r.top), factor));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [canvasRef, size]);

  const [fx, fy] = focus ?? [NaN, NaN];
  useEffect(() => {
    if (Number.isFinite(fx)) setBounds((b) => (containsPoint(b, fx, fy) ? b : centerOn(b, fx, fy)));
  }, [fx, fy]);

  const start = (e: ReactPointerEvent<HTMLCanvasElement>): void => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, bounds, moved: false };
  };

  const move = (e: ReactPointerEvent<HTMLCanvasElement>): boolean => {
    const d = drag.current;
    if (!d) return false;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < MAP_DRAG_PX) return true;
    d.moved = true;
    setDragging(true);
    const { scale } = mapMapping(size, d.bounds);
    setBounds(panBounds(d.bounds, -dx / scale, dy / scale));
    return true;
  };

  const end = (): boolean => {
    const moved = drag.current?.moved ?? false;
    drag.current = null;
    setDragging(false);
    return moved;
  };

  return { bounds, dragging, start, move, end, reset: () => setBounds(surveyBounds(meta)) };
}
