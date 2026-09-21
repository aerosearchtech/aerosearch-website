// Breach map renderer: landscape photo backdrop (washed) + MGRS grid + AO frame,
// cached offscreen. The hazard-density field, the planned corridors and the
// device plot repaint on top whenever the plan changes.

import {
  AOI_DEPTH_M,
  AOI_WIDTH_M,
  CELL_M,
  GRID_H,
  GRID_W,
  MINE_SPECS,
  SWEPT_THRESHOLD,
} from '../constants';
import type { Palette } from '../theme';
import type { MapLayer, Mine, Minefield, Point, Route } from '../types';

export const AO_MARGIN = 0.045;

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 24;

/** Camera over the AO: zoom factor and the world point held at screen centre. */
export interface MapView {
  zoom: number;
  cx: number; // metres, AOI frame
  cy: number;
}

export const FIT_VIEW: MapView = {
  zoom: 1,
  cx: AOI_WIDTH_M / 2,
  cy: AOI_DEPTH_M / 2,
};

export interface Projection {
  s: number; // screen px per metre
  ox: number;
  oy: number;
}

/** Scale at which the whole AO fits the viewport — zoom 1. */
export function fitScale(w: number, h: number): number {
  const inner = 1 - 2 * AO_MARGIN;
  return Math.min((w * inner) / AOI_WIDTH_M, (h * inner) / AOI_DEPTH_M);
}

export function project(w: number, h: number, view: MapView = FIT_VIEW): Projection {
  const s = fitScale(w, h) * view.zoom;
  return { s, ox: w / 2 - view.cx * s, oy: h / 2 - view.cy * s };
}

export const toPx = (pr: Projection, p: Point): Point => ({
  x: p.x * pr.s + pr.ox,
  y: p.y * pr.s + pr.oy,
});

export const toWorld = (pr: Projection, x: number, y: number): Point => ({
  x: (x - pr.ox) / pr.s,
  y: (y - pr.oy) / pr.s,
});

export interface DrawArgs {
  palette: Palette;
  view: MapView;
  layer: MapLayer;
  field: Minefield;
  risk: Float32Array;
  riskMax: number;
  survey: Float32Array;
  routes: Route[];
  selectedId: string | null;
  selectedMineId: string | null;
  clearedIds: Set<string>;
  corridorWidthM: number;
  /** Live survey playback; null outside a run. */
  run: RunOverlay | null;
}

/** What the map shows while a survey is flying. */
export interface RunOverlay {
  /** Depth intervals a sensor has been over. Everything else is sunk back. */
  swept: { y0: number; y1: number }[];
  /** Northing of each rastering airframe's sweep front. */
  fronts: { y: number; color: string }[];
  /** The swap station apron, one pad per committed airframe. */
  pads: { at: Point; busy: boolean }[];
  /** Fixes the operator has been handed so far. */
  visibleIds: Set<string>;
}

/** Side of a landing pad on the ground, metres. */
const PAD_M = 7;

/** Extra wash applied over the backdrop on the clean device plot. */
const DEVICE_LAYER_WASH = 0.35;

/** Radius of the ring drawn around the device the operator has picked. */
const PICK_RING_PX = 11;

/** How far ground outside the area of interest is sunk back. */
const OUTSIDE_AO_WASH = 0.5;

/** How far unsurveyed ground is sunk back during a run. */
const UNSWEPT_WASH = 0.72;

export class BreachMapRenderer {
  private base: HTMLCanvasElement | null = null;
  private baseW = 0;
  private baseH = 0;
  private baseKey = '';
  private heat: HTMLCanvasElement | null = null;
  private heatKey = '';
  private cover: HTMLCanvasElement | null = null;
  private coverKey = '';
  private img: HTMLImageElement | null = null;
  private imgReady = false;
  onReady: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const im = new Image();
      im.onload = () => {
        this.imgReady = true;
        this.onReady?.();
      };
      im.src = '/landscape.png';
      this.img = im;
    }
  }

  reset(): void {
    this.base = null;
    this.heat = null;
    this.heatKey = '';
    this.cover = null;
    this.coverKey = '';
  }

  private ensureBase(w: number, h: number, a: DrawArgs): void {
    const v = a.view;
    const key = `${a.layer}|${a.palette.bg0}|${this.imgReady}|${v.zoom.toFixed(3)}|${v.cx.toFixed(1)}|${v.cy.toFixed(1)}`;
    if (this.base && this.baseW === w && this.baseH === h && this.baseKey === key) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bc = this.base ?? document.createElement('canvas');
    bc.width = w * dpr;
    bc.height = h * dpr;
    const ctx = bc.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = a.palette.mapInk;
    ctx.fillRect(0, 0, w, h);

    if (this.imgReady && this.img) {
      // The photo is pinned to the AO, so zooming magnifies the ground rather
      // than sliding a backdrop under the plot. The AO rarely matches the panel
      // aspect, so the tile is mirrored outwards: ground carries on past the
      // boundary instead of leaving dead space, and mirroring hides the seams.
      const pr0 = project(w, h, a.view);
      const o0 = toPx(pr0, { x: 0, y: 0 });
      const aw = AOI_WIDTH_M * pr0.s;
      const ah = AOI_DEPTH_M * pr0.s;
      const iw = this.img.naturalWidth;
      const ih = this.img.naturalHeight;
      const scale = Math.max(aw / iw, ah / ih);
      const tw = iw * scale;
      const th = ih * scale;
      const x0 = o0.x + (aw - tw) / 2;
      const y0 = o0.y + (ah - th) / 2;
      for (let r = Math.floor(-y0 / th); r < Math.ceil((h - y0) / th); r++) {
        for (let c = Math.floor(-x0 / tw); c < Math.ceil((w - x0) / tw); c++) {
          ctx.save();
          ctx.translate(x0 + (c + 0.5) * tw, y0 + (r + 0.5) * th);
          ctx.scale(c % 2 ? -1 : 1, r % 2 ? -1 : 1);
          ctx.drawImage(this.img, -tw / 2, -th / 2, tw, th);
          ctx.restore();
        }
      }
    }
    ctx.fillStyle = a.palette.mapWash;
    ctx.fillRect(0, 0, w, h);
    if (a.layer === 'devices') {
      ctx.fillStyle = a.palette.mapInk;
      ctx.globalAlpha = DEVICE_LAYER_WASH;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }

    // MGRS grid
    const gx = w / 8;
    const gy = h / 5;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      const x = i * gx;
      ctx.strokeStyle = i % 2 === 0 ? a.palette.gridStrong : a.palette.gridWeak;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      if (i < 8) {
        ctx.fillStyle = a.palette.tx3;
        ctx.font = '9px "JetBrains Mono"';
        ctx.fillText(('0' + (48 + i * 4)).slice(-2), x + 3, 12);
      }
    }
    for (let i = 0; i <= 5; i++) {
      const y = i * gy;
      ctx.strokeStyle = i % 2 === 0 ? a.palette.gridStrong : a.palette.gridWeak;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // AO frame at the true minefield bounds
    const pr = project(w, h, a.view);
    const o = toPx(pr, { x: 0, y: 0 });
    const W = AOI_WIDTH_M * pr.s;
    const H = AOI_DEPTH_M * pr.s;
    // Ground beyond the boundary is context only — nothing was surveyed there.
    ctx.fillStyle = a.palette.mapInk;
    ctx.globalAlpha = OUTSIDE_AO_WASH;
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.rect(o.x, o.y, W, H);
    ctx.fill('evenodd');
    ctx.globalAlpha = 1;

    ctx.strokeStyle = a.palette.am;
    ctx.globalAlpha = 0.55;
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(o.x, o.y, W, H);
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    this.base = bc;
    this.baseW = w;
    this.baseH = h;
    this.baseKey = key;
  }

  /** Hazard density, rasterised once per (field, palette) at grid resolution. */
  private ensureHeat(a: DrawArgs): HTMLCanvasElement {
    const key = `${a.field.seed}|${a.palette.hazardRgb}`;
    if (this.heat && this.heatKey === key) return this.heat;
    const hc = this.heat ?? document.createElement('canvas');
    hc.width = GRID_W;
    hc.height = GRID_H;
    const hctx = hc.getContext('2d')!;
    const [r, g, b] = a.palette.hazardRgb.split(',').map(Number);
    const img = hctx.createImageData(GRID_W, GRID_H);
    const inv = a.riskMax > 0 ? 1 / a.riskMax : 1;
    for (let i = 0; i < a.risk.length; i++) {
      const t = Math.min(1, Math.sqrt(a.risk[i] * inv));
      const o = i * 4;
      img.data[o] = r;
      img.data[o + 1] = g;
      img.data[o + 2] = b;
      img.data[o + 3] = Math.round(t * a.palette.hazardAlpha * 255);
    }
    hctx.putImageData(img, 0, 0);
    this.heat = hc;
    this.heatKey = key;
    return hc;
  }

  /**
   * Survey assurance, rasterised once per (field, palette). Ground swept to a
   * usable standard greens up; ground nobody looked at fogs over.
   */
  private ensureCoverage(a: DrawArgs): HTMLCanvasElement {
    const key = `${a.field.seed}|${a.palette.sweptRgb}`;
    if (this.cover && this.coverKey === key) return this.cover;
    const cc = this.cover ?? document.createElement('canvas');
    cc.width = GRID_W;
    cc.height = GRID_H;
    const cctx = cc.getContext('2d')!;
    const [gr, gg, gb] = a.palette.sweptRgb.split(',').map(Number);
    const [ur, ug, ub] = a.palette.unsweptRgb.split(',').map(Number);
    const img = cctx.createImageData(GRID_W, GRID_H);
    for (let i = 0; i < a.survey.length; i++) {
      const q = a.survey[i];
      const good = q >= SWEPT_THRESHOLD;
      const t = Math.abs(q - SWEPT_THRESHOLD) / SWEPT_THRESHOLD;
      const o = i * 4;
      img.data[o] = good ? gr : ur;
      img.data[o + 1] = good ? gg : ug;
      img.data[o + 2] = good ? gb : ub;
      img.data[o + 3] = Math.round(Math.min(1, t) * a.palette.coverageAlpha * 255);
    }
    cctx.putImageData(img, 0, 0);
    this.cover = cc;
    this.coverKey = key;
    return cc;
  }

  private drawCorridor(
    ctx: CanvasRenderingContext2D,
    pr: Projection,
    a: DrawArgs,
    route: Route,
    active: boolean,
  ): void {
    const col = a.palette.route[route.profile];
    const pts = route.path.map((p) => toPx(pr, p));
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);

    ctx.globalAlpha = active ? 0.32 : 0.22;
    ctx.strokeStyle = col;
    ctx.lineWidth = Math.max(2.5, a.corridorWidthM * pr.s);
    ctx.stroke();

    ctx.globalAlpha = active ? 0.8 : 0.42;
    ctx.strokeStyle = a.palette.corridorEdge;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = col;
    ctx.lineWidth = active ? 2.2 : 1.8;
    ctx.setLineDash(active ? [] : [7, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawMine(
    ctx: CanvasRenderingContext2D,
    pr: Projection,
    a: DrawArgs,
    m: Mine,
    emphasise: boolean,
  ): void {
    const p = toPx(pr, m);
    const r = emphasise
      ? 5
      : Math.max(2.2, Math.min(9, MINE_SPECS[m.type].clearRadiusM * pr.s * 0.3));
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = a.palette.mine[m.type];
    ctx.globalAlpha = emphasise ? 1 : 0.5 + m.confidence * 0.4;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /** Selection reticle: a ring and four ticks around the picked device. */
  private drawPick(ctx: CanvasRenderingContext2D, pr: Projection, a: DrawArgs, m: Mine): void {
    const p = toPx(pr, m);
    ctx.save();
    ctx.strokeStyle = a.palette.am;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, PICK_RING_PX, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      ctx.moveTo(p.x + dx * (PICK_RING_PX + 2), p.y + dy * (PICK_RING_PX + 2));
      ctx.lineTo(p.x + dx * (PICK_RING_PX + 7), p.y + dy * (PICK_RING_PX + 7));
    }
    ctx.stroke();
    ctx.restore();
  }

  draw(cv: HTMLCanvasElement, a: DrawArgs): void {
    const par = cv.parentElement;
    if (!par) return;
    const w = par.clientWidth;
    const h = par.clientHeight;
    if (w < 2 || h < 2) return;

    this.ensureBase(w, h, a);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = w * dpr;
    cv.height = h * dpr;
    const ctx = cv.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(this.base!, 0, 0, w, h);

    const pr = project(w, h, a.view);
    const o = toPx(pr, { x: 0, y: 0 });

    if (a.layer === 'hazard' || a.layer === 'coverage') {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(
        a.layer === 'hazard' ? this.ensureHeat(a) : this.ensureCoverage(a),
        o.x,
        o.y,
        GRID_W * CELL_M * pr.s,
        GRID_H * CELL_M * pr.s,
      );
    }

    if (a.run) this.drawRun(ctx, pr, a.run, a.palette);

    for (const r of a.routes) if (r.id !== a.selectedId) this.drawCorridor(ctx, pr, a, r, false);
    const active = a.routes.find((r) => r.id === a.selectedId);
    if (active) this.drawCorridor(ctx, pr, a, active, true);

    // Devices inside the selected lane are drawn as DOM markers on top, so the
    // canvas plots only the ones being bypassed.
    for (const m of a.field.mines) {
      if (a.clearedIds.has(m.id)) continue;
      if (a.run && !a.run.visibleIds.has(m.id)) continue;
      this.drawMine(ctx, pr, a, m, a.layer === 'devices' || m.id === a.selectedMineId);
    }

    // Drawn last so the reticle sits above every other device on the plot.
    const picked = a.field.mines.find((m) => m.id === a.selectedMineId);
    if (picked) this.drawPick(ctx, pr, a, picked);
  }

  /**
   * Sinks back the ground the survey has not reached and marks the sweep front.
   * The veil tracks the first wave only — once something has flown over a strip
   * it stays revealed while the later, slower waves work back across it.
   */
  private drawRun(
    ctx: CanvasRenderingContext2D,
    pr: Projection,
    run: RunOverlay,
    p: Palette,
  ): void {
    const left = toPx(pr, { x: 0, y: 0 });
    const w = AOI_WIDTH_M * pr.s;

    // The veil is everything between the swept intervals, so bands opened by
    // separate airframes clear independently rather than top-down as a whole.
    ctx.save();
    ctx.globalAlpha = UNSWEPT_WASH;
    ctx.fillStyle = '#04070c';
    let at = 0;
    for (const b of run.swept) {
      if (b.y0 > at) ctx.fillRect(left.x, toPx(pr, { x: 0, y: at }).y, w, (b.y0 - at) * pr.s);
      at = Math.max(at, b.y1);
    }
    if (at < AOI_DEPTH_M) {
      ctx.fillRect(left.x, toPx(pr, { x: 0, y: at }).y, w, (AOI_DEPTH_M - at) * pr.s);
    }
    ctx.restore();

    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 12;
    for (const f of run.fronts) {
      const y = toPx(pr, { x: 0, y: f.y }).y;
      ctx.strokeStyle = f.color;
      ctx.shadowColor = f.color;
      ctx.beginPath();
      ctx.moveTo(left.x, y);
      ctx.lineTo(left.x + w, y);
      ctx.stroke();
    }
    ctx.restore();

    this.drawPads(ctx, pr, run, p);
  }

  /**
   * The swap station. Every airframe comes back here for a fresh pack and goes
   * out again, which is what keeps the survey running without a crew forward —
   * so the apron is drawn on the plot rather than left implicit in the clock.
   */
  private drawPads(
    ctx: CanvasRenderingContext2D,
    pr: Projection,
    run: RunOverlay,
    p: Palette,
  ): void {
    if (!run.pads.length) return;
    const side = Math.max(5, PAD_M * pr.s);
    const top = toPx(pr, run.pads[0].at);

    ctx.save();
    ctx.lineWidth = 1;
    for (const pad of run.pads) {
      const c = toPx(pr, pad.at);
      ctx.strokeStyle = pad.busy ? p.am : p.tx3;
      ctx.beginPath();
      ctx.rect(c.x - side / 2, c.y - side / 2, side, side);
      if (pad.busy) {
        ctx.fillStyle = p.am;
        ctx.globalAlpha = 0.4;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.stroke();
    }

    ctx.fillStyle = p.tx3;
    ctx.font = '9px "JetBrains Mono"';
    ctx.fillText('SWAP STN', top.x + side, top.y - side);
    ctx.restore();
  }
}
