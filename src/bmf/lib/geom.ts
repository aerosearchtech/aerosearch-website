import type { Point } from "./types";

export const dist = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

export function polylineLength(path: Point[]): number {
  let d = 0;
  for (let i = 1; i < path.length; i++) d += dist(path[i - 1], path[i]);
  return d;
}

/** Perpendicular distance from p to segment ab. */
export function distToSegment(p: Point, a: Point, b: Point): number {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const len2 = vx * vx + vy * vy;
  if (len2 === 0) return dist(p, a);
  let t = ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(p.x - (a.x + t * vx), p.y - (a.y + t * vy));
}

export function distToPolyline(p: Point, path: Point[]): number {
  let best = Infinity;
  for (let i = 1; i < path.length; i++) {
    const d = distToSegment(p, path[i - 1], path[i]);
    if (d < best) best = d;
  }
  return best;
}

/** Heading changes at interior waypoints, in radians. */
export function turnAngles(path: Point[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < path.length - 1; i++) {
    const h1 = Math.atan2(path[i].y - path[i - 1].y, path[i].x - path[i - 1].x);
    const h2 = Math.atan2(path[i + 1].y - path[i].y, path[i + 1].x - path[i].x);
    let d = h2 - h1;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    out.push(Math.abs(d));
  }
  return out;
}

/** Drop waypoints that sit on a straight run. */
export function dropCollinear(path: Point[], epsM = 0.01): Point[] {
  if (path.length < 3) return path.slice();
  const out: Point[] = [path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    if (distToSegment(path[i], out[out.length - 1], path[i + 1]) > epsM) out.push(path[i]);
  }
  out.push(path[path.length - 1]);
  return out;
}

/** Sample a polyline at a fixed spacing (inclusive of both ends). */
export function samplePolyline(path: Point[], stepM: number): Point[] {
  const out: Point[] = [];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const seg = dist(a, b);
    const n = Math.max(1, Math.ceil(seg / stepM));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  out.push(path[path.length - 1]);
  return out;
}

export const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

/** Distance along the polyline to the point on it closest to p (chainage). */
export function chainage(p: Point, path: Point[]): number {
  let acc = 0;
  let best = Infinity;
  let bestAt = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const len2 = vx * vx + vy * vy;
    const seg = Math.sqrt(len2);
    const t = len2 === 0 ? 0 : clamp(((p.x - a.x) * vx + (p.y - a.y) * vy) / len2, 0, 1);
    const d = Math.hypot(p.x - (a.x + t * vx), p.y - (a.y + t * vy));
    if (d < best) {
      best = d;
      bestAt = acc + t * seg;
    }
    acc += seg;
  }
  return bestAt;
}
