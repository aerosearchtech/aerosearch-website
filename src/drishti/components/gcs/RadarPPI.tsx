"use client";

import { useEffect, useRef } from "react";
import { drawRadar, type DrawCtx } from "./drawRadar";
import type { UAV } from "@/drishti/types/uav";
import type { Track } from "@/drishti/types/track";
import type { RadarTheme } from "@/drishti/types/tweaks";

const SWEEP_DEG_PER_SEC = 36; // = 10s/rev, ≤ MBC-3 revisit budget

interface Props {
  uavs: UAV[];
  tracks: Track[];
  maxRangeKm: number;
  theme: RadarTheme;
  showFovArcs: boolean;
  showCIEllipses: boolean;
  terrain?: boolean;
}

export function RadarPPI({ uavs, tracks, maxRangeKm, theme, showFovArcs, showCIEllipses, terrain = false }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const terrainImgRef = useRef<HTMLImageElement | null>(null);
  // Refs hold the live snapshot for the RAF loop without re-creating the closure.
  const liveRef = useRef<{
    uavs: UAV[];
    tracks: Track[];
    sweepDeg: number;
    blipMap: Record<string, number>;
    ctx: DrawCtx;
  }>({
    uavs,
    tracks,
    sweepDeg: 0,
    blipMap: {},
    ctx: { sweepDeg: 0, blipMap: {}, maxRangeKm, theme, dpr: 1, showFovArcs, showCIEllipses, terrainImg: null },
  });

  useEffect(() => {
    if (terrain) {
      const img = new Image();
      img.src = "/terrain.jpg";
      img.onload = () => { terrainImgRef.current = img; liveRef.current.ctx.terrainImg = img; };
    } else {
      terrainImgRef.current = null;
      liveRef.current.ctx.terrainImg = null;
    }
  }, [terrain]);

  // Push fresh props into the ref every render — RAF reads from ref.
  useEffect(() => {
    liveRef.current.uavs = uavs;
    liveRef.current.tracks = tracks;
    liveRef.current.ctx.maxRangeKm = maxRangeKm;
    liveRef.current.ctx.theme = theme;
    liveRef.current.ctx.showFovArcs = showFovArcs;
    liveRef.current.ctx.showCIEllipses = showCIEllipses;
  }, [uavs, tracks, maxRangeKm, theme, showFovArcs, showCIEllipses]);

  // Size canvas to the OUTER flex container at mount + on resize.
  // We can't use canvas.parentElement: that's the inline-block wrapper, which
  // collapses to the canvas's own size (circular dependency → minimum size).
  // DPR is pinned at min 2 so the canvas super-samples on 1.0-DPR displays.
  useEffect(() => {
    const c = canvasRef.current;
    const wrap = wrapRef.current;
    if (!c || !wrap) return;
    const dpr = Math.max(2, window.devicePixelRatio || 1);
    const fit = () => {
      const r = wrap.getBoundingClientRect();
      // Square that fits the wrap with a small uniform margin. No hard cap —
      // on wider screens the radar grows so the centre column isn't sparse.
      const sz = Math.max(300, Math.floor(Math.min(r.width - 24, r.height - 24)));
      c.width = sz * dpr;
      c.height = sz * dpr;
      c.style.width = sz + "px";
      c.style.height = sz + "px";
      liveRef.current.ctx.dpr = dpr;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // RAF loop: advance sweep, light blips on crossing, redraw.
  useEffect(() => {
    let raf = 0;
    let lastT = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.min((now - lastT) / 1000, 0.5);
      lastT = now;
      const c = canvasRef.current;
      if (c && c.width > 50 && c.isConnected) {
        const live = liveRef.current;
        const prev = live.sweepDeg;
        live.sweepDeg = (prev + SWEEP_DEG_PER_SEC * dt) % 360;
        for (const t of live.tracks) {
          const az = ((Math.atan2(t.x, t.y) * 180) / Math.PI + 360) % 360;
          const crossed =
            prev <= live.sweepDeg
              ? az >= prev && az < live.sweepDeg
              : az >= prev || az < live.sweepDeg;
          if (crossed) live.blipMap[t.id] = Date.now();
        }
        live.ctx.sweepDeg = live.sweepDeg;
        live.ctx.blipMap = live.blipMap;
        drawRadar(c, live.uavs, live.tracks, live.ctx);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={wrapRef}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px",
        position: "relative",
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      <div style={{ position: "relative", display: "inline-block", lineHeight: 0 }}>
        <canvas ref={canvasRef} style={{ display: "block" }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            borderRadius: "50%",
            background:
              "repeating-linear-gradient(to bottom,transparent 0,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 3px)",
          }}
        />
      </div>
    </div>
  );
}
