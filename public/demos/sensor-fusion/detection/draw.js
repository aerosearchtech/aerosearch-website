// Canvas primitives for the detection map. Every colour comes from COLORS, so
// these follow the theme without knowing anything about it.

import { COLORS, SENSORS, MAP, REPLAY } from './colors.js';

export function drawMarker(ctx, x, y, hits) {
  const r = MAP.markerRadius;
  if (!hits.length) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.miss;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    return;
  }
  const slice = (Math.PI * 2) / hits.length;
  hits.forEach((sensor, index) => {
    ctx.beginPath();
    ctx.arc(x, y, r, -Math.PI / 2 + index * slice, -Math.PI / 2 + (index + 1) * slice);
    ctx.strokeStyle = SENSORS[sensor].color;
    ctx.lineWidth = MAP.ringWidth;
    ctx.stroke();
  });
  ctx.beginPath();
  ctx.arc(x, y, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = hits.length > 1 ? COLORS.text : SENSORS[hits[0]].color;
  ctx.fill();
}

export function drawAlarm(ctx, x, y, color, explained) {
  const s = 6;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s, y + s * 0.75);
  ctx.lineTo(x - s, y + s * 0.75);
  ctx.closePath();
  // A solid marker sits on a recorded clutter item or control hole, so the
  // sensor had something real to fire on.
  if (explained) {
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

/**
 * Flown track. `breaks` holds the sample indices a new leg starts at, so the
 * line lifts between legs instead of drawing the ferry across the field.
 */
export function drawTrack(ctx, toScreen, points, color, width, alpha, breaks) {
  if (points.length < 2) return;
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    const [sx, sy] = toScreen(x, y);
    if (index === 0 || (breaks && breaks.has(index))) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  });
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export function drawDrone(ctx, toScreen, points) {
  const head = points[points.length - 1];
  if (!head) return;
  const previous = points[Math.max(0, points.length - 4)];
  const [x, y] = toScreen(head[0], head[1]);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.atan2(head[1] - previous[1], head[0] - previous[0]));
  ctx.shadowColor = COLORS.shadow;
  ctx.shadowBlur = 9;
  ctx.fillStyle = COLORS.panel;
  ctx.strokeStyle = COLORS.text;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(-5, -5);
  ctx.lineTo(5, 5);
  ctx.moveTo(-5, 5);
  ctx.lineTo(5, -5);
  ctx.stroke();
  [-6, 6].forEach((a) => [-6, 6].forEach((b) => {
    ctx.beginPath();
    ctx.arc(a, b, 2.6, 0, Math.PI * 2);
    ctx.stroke();
  }));
  ctx.fillStyle = COLORS.accent;
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(12, -3);
  ctx.lineTo(12, 3);
  ctx.fill();
  ctx.restore();
}

/**
 * Path covering the swath a track has actually swept: one quad per step, as wide
 * as the sensor's footprint. Overlapping quads in a single path union together,
 * so this clips imagery to the ground the pass has really been over.
 */
export function swathPath(ctx, toScreen, scale, points, swathPx, breaks) {
  const half = (swathPx / 2) * scale;
  ctx.beginPath();
  for (let i = 1; i < points.length; i += 1) {
    if (breaks && breaks.has(i)) continue;
    const [x0, y0] = toScreen(points[i - 1][0], points[i - 1][1]);
    const [x1, y1] = toScreen(points[i][0], points[i][1]);
    const length = Math.hypot(x1 - x0, y1 - y0) || 1;
    const nx = (-(y1 - y0) / length) * half;
    const ny = ((x1 - x0) / length) * half;
    ctx.moveTo(x0 + nx, y0 + ny);
    ctx.lineTo(x1 + nx, y1 + ny);
    ctx.lineTo(x1 - nx, y1 - ny);
    ctx.lineTo(x0 - nx, y0 - ny);
    ctx.closePath();
  }
}

export function drawScaleBar(ctx, { width, height, scale }, pixelSize) {
  const metres = scale > 1 ? 1 : 5;
  const bar = (metres / pixelSize) * scale;
  ctx.strokeStyle = COLORS.muted;
  ctx.fillStyle = COLORS.muted;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width - 22 - bar, height - 25);
  ctx.lineTo(width - 22, height - 25);
  ctx.stroke();
  ctx.font = REPLAY.overlayFont;
  ctx.textAlign = 'right';
  ctx.fillText(`${metres} m`, width - 22, height - 31);
  ctx.textAlign = 'left';
}
