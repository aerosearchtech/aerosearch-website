'use client';

import { useEffect, useRef, useState } from 'react';
import BreachForceMarker from '@/bmf/components/map/BreachForceMarker';
import DroneOverlay from '@/bmf/components/map/DroneOverlay';
import MapFooter from '@/bmf/components/map/MapFooter';
import MapHeader from '@/bmf/components/map/MapHeader';
import SurveyOverlay from '@/bmf/components/map/SurveyOverlay';
import ClearanceBar from '@/bmf/components/neutralise/ClearanceBar';
import SurveyBar from '@/bmf/components/survey/SurveyBar';
import { BreachMapRenderer, project, toPx, toWorld, type RunOverlay } from '@/bmf/lib/canvas/map';
import { AOI_DEPTH_M, AOI_WIDTH_M } from '@/bmf/lib/constants';
import { clamp } from '@/bmf/lib/geom';
import { FONT_MONO, PALETTES } from '@/bmf/lib/theme';
import { useGcs } from '@/bmf/lib/store';
import type { ViewModel } from '@/bmf/lib/derive';
import type { Phase } from '@/bmf/lib/types';

/** Hints carry affordances the operator cannot discover, never commentary. */
const TITLE: Record<Phase, { head: string; hint?: string }> = {
  detect: { head: 'AIRBORNE SURVEY · FUSED DEVICE PLOT' },
  breach: {
    head: 'MINEFIELD · BREACH LANE PLAN',
    hint: 'CLICK = ENTRY · SHIFT+CLICK = EXIT',
  },
  neutralise: { head: 'BREACH LANE · CLEARANCE & PROOFING' },
};

/** Pixels of drag beyond which a mouse-up is a pan, not an entry-point click. */
const DRAG_SLOP_PX = 4;

/** How near a click has to land to open a canvas-drawn device. */
const PICK_RADIUS_PX = 11;

export default function BreachMap({ view }: { view: ViewModel }) {
  const s = useGcs();
  const palette = PALETTES[s.theme];

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const coordRef = useRef<HTMLSpanElement>(null);
  const rendererRef = useRef<BreachMapRenderer>(new BreachMapRenderer());
  const dragRef = useRef<{ x: number; y: number; moved: number } | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const lastEpoch = useRef(s.mapEpoch);

  // In DETECT the whole plot stays on canvas and no lane is drawn; in the later
  // phases the lane devices become interactive DOM markers instead.
  const clearedIds = new Set(s.phase === 'detect' ? [] : (view.selected?.mineIds ?? []));
  const routes = s.phase === 'detect' ? [] : s.routes;

  // A finished run has revealed everything, so the overlay comes off and the
  // plot goes back to being the plain fused picture.
  const r = view.run;
  const run: RunOverlay | null =
    r && !r.done
      ? { swept: r.swept, fronts: r.fronts, pads: r.pads, visibleIds: r.visibleIds }
      : null;

  const drawArgs = useRef({ ...s, palette, clearedIds, routes, run });
  drawArgs.current = { ...s, palette, clearedIds, routes, run };

  useEffect(() => {
    const cv = canvasRef.current;
    const par = cv?.parentElement;
    if (!cv || !par) return;
    const renderer = rendererRef.current;
    const draw = () => {
      const a = drawArgs.current;
      renderer.draw(cv, {
        palette: a.palette,
        layer: a.mapLayer,
        view: a.mapView,
        field: a.field,
        risk: a.risk,
        riskMax: a.riskMax,
        survey: a.survey.quality,
        routes: a.routes,
        selectedId: a.selectedRouteId,
        selectedMineId: a.selectedMineId,
        clearedIds: a.clearedIds,
        corridorWidthM: a.corridorWidthM,
        run: a.run,
      });
      setSize({ w: par.clientWidth, h: par.clientHeight });
    };
    renderer.onReady = () => {
      renderer.reset();
      draw();
    };
    const ro = new ResizeObserver(() => {
      renderer.reset();
      draw();
    });
    ro.observe(par);
    draw();
    return () => {
      ro.disconnect();
      renderer.onReady = null;
    };
  }, []);

  // React registers wheel passively on the root, so the zoom listener has to be
  // native to stop the page scrolling under the map.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const pr = project(r.width || 1, r.height || 1, useGcs.getState().mapView);
      const w = toWorld(pr, e.clientX - r.left, e.clientY - r.top);
      useGcs.getState().zoomAt(e.deltaY < 0 ? 1.18 : 1 / 1.18, w.x, w.y);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    if (s.mapEpoch !== lastEpoch.current) {
      rendererRef.current.reset();
      lastEpoch.current = s.mapEpoch;
    }
    rendererRef.current.draw(cv, {
      palette,
      layer: s.mapLayer,
      view: s.mapView,
      field: s.field,
      risk: s.risk,
      riskMax: s.riskMax,
      survey: s.survey.quality,
      routes,
      selectedId: s.selectedRouteId,
      selectedMineId: s.selectedMineId,
      clearedIds,
      corridorWidthM: s.corridorWidthM,
      run,
    });
  });

  const pr = project(size.w || 1, size.h || 1, s.mapView);

  const onDown = (e: React.MouseEvent<HTMLDivElement>) => {
    dragRef.current = { x: e.clientX, y: e.clientY, moved: 0 };
  };

  // cleared after the click handler, which fires on the following tick
  const onUp = () => {
    window.setTimeout(() => {
      dragRef.current = null;
    }, 0);
  };

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (d && e.buttons === 1) {
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      d.moved += Math.abs(dx) + Math.abs(dy);
      d.x = e.clientX;
      d.y = e.clientY;
      if (d.moved > DRAG_SLOP_PX) s.panBy(-dx / pr.s, -dy / pr.s);
    }

    const ret = reticleRef.current;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (ret) {
      ret.style.opacity = '1';
      const rx = ret.querySelector<HTMLElement>('[data-retx]');
      const ry = ret.querySelector<HTMLElement>('[data-rety]');
      if (rx) rx.style.transform = `translateX(${x}px)`;
      if (ry) ry.style.transform = `translateY(${y}px)`;
    }
    if (coordRef.current) {
      const w = toWorld(pr, x, y);
      const e1 = 4200 + Math.round(w.x);
      const n1 = 6450 + Math.round(AOI_DEPTH_M - w.y);
      coordRef.current.textContent = `43R FN ${e1} ${n1}`;
    }
  };

  const onLeave = () => {
    dragRef.current = null;
    if (reticleRef.current) reticleRef.current.style.opacity = '0';
    if (coordRef.current) coordRef.current.textContent = '43R FN ----- -----';
  };

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((dragRef.current?.moved ?? 0) > DRAG_SLOP_PX) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;

    // In DETECT the devices are painted onto the canvas rather than mounted as
    // markers, so opening one means hit-testing the plot.
    if (s.phase === 'detect') {
      let best: string | null = null;
      let bestD = PICK_RADIUS_PX;
      for (const m of s.field.mines) {
        const q = toPx(pr, m);
        const d = Math.hypot(q.x - px, q.y - py);
        if (d < bestD) {
          bestD = d;
          best = m.id;
        }
      }
      s.selectMine(best && best === s.selectedMineId ? null : best);
      return;
    }

    if (s.phase !== 'breach') return; // the axis of advance is fixed once breaching starts
    const w = toWorld(pr, px, py);
    const p = { x: clamp(w.x, 0, AOI_WIDTH_M), y: clamp(w.y, 0, AOI_DEPTH_M) };
    if (e.shiftKey) s.setGoal(p);
    else s.setStart(p);
  };

  const entry = toPx(pr, s.start);
  const exit = toPx(pr, s.goal);

  const endpoint = (px: { x: number; y: number }, text: string, color: string) => (
    <div style={{ position: 'absolute', left: px.x, top: px.y, transform: 'translate(-50%,-50%)', zIndex: 7, pointerEvents: 'none' }}>
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, border: '2px solid var(--bg0)', boxShadow: `0 0 10px ${color}` }} />
      <div style={{ position: 'absolute', left: 15, top: -4, whiteSpace: 'nowrap', fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, letterSpacing: 1, color, textShadow: '0 0 6px var(--bg0)' }}>{text}</div>
    </div>
  );

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--mapInk)' }}>
      <MapHeader
        head={TITLE[s.phase].head}
        hint={TITLE[s.phase].hint}
        hasLane={!!view.selected}
        coordRef={coordRef}
      />

      <div
        ref={wrapRef}
        style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden', cursor: 'crosshair' }}
        onMouseDown={onDown}
        onMouseUp={onUp}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onClick={onClick}
      >
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />

        <div ref={reticleRef} style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0 }}>
          <div data-retx style={{ position: 'absolute', top: 0, bottom: 0, width: 1, background: 'rgba(242,169,59,.5)', transform: 'translateX(-1px)' }} />
          <div data-rety style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'rgba(242,169,59,.5)', transform: 'translateY(-1px)' }} />
        </div>

        {/* devices inside the selected lane — the actual breaching tasks */}
        {s.phase !== 'detect' && view.tasks.map((t) => {
          const mine = view.selectedMines.find((m) => m.id === t.id)!;
          const px = toPx(pr, mine);
          const hot = s.hoverMineId === t.id;
          return (
            <div
              key={t.id}
              onClick={(e) => {
                e.stopPropagation();
                s.selectMine(s.selectedMineId === t.id ? null : t.id);
              }}
              onMouseEnter={() => s.hoverMine(t.id)}
              onMouseLeave={() => s.hoverMine(null)}
              style={{ position: 'absolute', left: px.x, top: px.y, transform: 'translate(-50%,-50%)', zIndex: 6, cursor: 'pointer', animation: 'clmReveal .5s ease' }}
            >
              {t.state !== 'proofed' && (
                <div style={{ position: 'absolute', left: '50%', top: '50%', width: 18, height: 18, borderRadius: '50%', background: t.markerColor, opacity: 0.5, animation: 'clmPulse 2.4s ease-out infinite' }} />
              )}
              <div style={{ position: 'relative', width: 13, height: 13, background: t.markerColor, transform: 'rotate(45deg)', border: '1.5px solid var(--bg0)', boxShadow: `0 0 9px ${t.markerColor}` }} />
              {/* In clearance the state is carried by the marker colour and the
                  board; labels on every tasked device only collide. */}
              {s.phase !== 'neutralise' && (
                <div style={{ position: 'absolute', left: 12, top: -7, whiteSpace: 'nowrap', fontFamily: FONT_MONO, fontSize: 9, fontWeight: 600, color: t.markerColor, textShadow: '0 0 6px var(--bg0)', opacity: hot ? 1 : 0.85 }}>
                  {t.seq}. {t.id}
                </div>
              )}
            </div>
          );
        })}

        {size.w > 0 && s.phase === 'neutralise' && <DroneOverlay drones={view.neutralise.drones} pr={pr} />}

        {size.w > 0 && view.run && !view.run.done && <SurveyOverlay drones={view.run.drones} pr={pr} mapW={size.w} />}

        {size.w > 0 && s.phase !== 'detect' && endpoint(entry, 'ENTRY', palette.gn)}
        {size.w > 0 && s.phase !== 'detect' && endpoint(exit, 'EXIT', palette.am)}
        {size.w > 0 && s.phase !== 'detect' && (
          <BreachForceMarker
            at={entry}
            force={view.breachForce}
            widthM={view.corridorWidthM}
            color={palette.gn}
            mapW={size.w}
          />
        )}
      </div>

      {view.run ? (
        <SurveyBar run={view.run} />
      ) : view.clearance ? (
        <ClearanceBar run={view.clearance} />
      ) : (
        <MapFooter options={view.options} />
      )}
    </div>
  );
}
