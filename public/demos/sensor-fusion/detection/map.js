// Tiled basemap with pan and zoom. Draws the RGB pyramid built for the v2
// viewer; overlay drawing is delegated to the caller.

import { COLORS, MAP, ASSET_BASE } from './colors.js';

const TILE_BASE = `${ASSET_BASE}/rgb`;

export function createMap(canvas, manifest, field, drawOverlay, acquisition) {
  const levels = manifest.layers.rgb.levels;
  const tiles = new Map();
  const view = { scale: 1, x: 0, y: 0 };
  let frame = null;
  let touched = false;

  function levelFor(scale) {
    const index = levels.findIndex((level) => level.width / field.width >= scale);
    return index === -1 ? levels.length - 1 : index;
  }

  function tile(level, tx, ty) {
    const key = `${level}/${tx}_${ty}`;
    let image = tiles.get(key);
    if (image === undefined) {
      image = new Image();
      image.src = `${TILE_BASE}/${level}/${tx}_${ty}.webp`;
      image.onload = schedule;
      image.onerror = () => tiles.set(key, null);
      tiles.set(key, image);
    }
    return image && image.complete && image.naturalWidth ? image : null;
  }

  function fit() {
    if (!canvas.clientWidth) return;
    const scale = Math.min(canvas.clientWidth / field.width,
      canvas.clientHeight / field.height);
    view.scale = scale;
    view.x = (canvas.clientWidth - field.width * scale) / 2;
    view.y = (canvas.clientHeight - field.height * scale) / 2;
    schedule();
  }

  function render() {
    frame = null;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
      canvas.width = width * ratio;
      canvas.height = height * ratio;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = COLORS.mapVoid;
    ctx.fillRect(0, 0, width, height);

    const level = levelFor(view.scale);
    const factor = levels[level].width / field.width;
    const step = MAP.tileSize / factor * view.scale;
    const firstX = Math.max(0, Math.floor(-view.x / step));
    const firstY = Math.max(0, Math.floor(-view.y / step));
    const lastX = Math.ceil((width - view.x) / step);
    const lastY = Math.ceil((height - view.y) / step);
    const cols = Math.ceil(levels[level].width / MAP.tileSize);
    const rows = Math.ceil(levels[level].height / MAP.tileSize);
    ctx.imageSmoothingEnabled = true;

    function paintTiles(alpha) {
      ctx.globalAlpha = alpha;
      for (let tx = firstX; tx < Math.min(lastX, cols); tx += 1) {
        for (let ty = firstY; ty < Math.min(lastY, rows); ty += 1) {
          const image = tile(level, tx, ty);
          if (!image) continue;
          ctx.drawImage(image, view.x + tx * step, view.y + ty * step,
            image.naturalWidth / factor * view.scale,
            image.naturalHeight / factor * view.scale);
        }
      }
      ctx.globalAlpha = 1;
    }

    // During a replay the imagery is only at full strength where the pass has
    // already flown; everything ahead of the aircraft stays a faint ghost.
    const acquired = acquisition && acquisition();
    if (acquired) {
      paintTiles(acquired.ghost);
      ctx.save();
      acquired.clip(ctx, toScreen, view.scale);
      paintTiles(1);
      ctx.restore();
    } else {
      paintTiles(1);
    }
    drawOverlay(ctx, { toScreen, scale: view.scale, width, height });
  }

  function schedule() {
    if (frame === null) frame = requestAnimationFrame(render);
  }

  function toScreen(x, y) {
    return [view.x + x * view.scale, view.y + y * view.scale];
  }

  function toField(sx, sy) {
    return [(sx - view.x) / view.scale, (sy - view.y) / view.scale];
  }

  function zoomAt(sx, sy, factor) {
    const next = Math.min(MAP.maxScale, Math.max(MAP.minScale, view.scale * factor));
    const ratio = next / view.scale;
    view.x = sx - (sx - view.x) * ratio;
    view.y = sy - (sy - view.y) * ratio;
    view.scale = next;
    touched = true;
    schedule();
  }

  let dragging = null;
  canvas.addEventListener('pointerdown', (event) => {
    dragging = { x: event.clientX, y: event.clientY, moved: false };
    touched = true;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    view.x += event.clientX - dragging.x;
    view.y += event.clientY - dragging.y;
    if (Math.abs(event.clientX - dragging.x) + Math.abs(event.clientY - dragging.y) > 3) {
      dragging.moved = true;
    }
    dragging.x = event.clientX;
    dragging.y = event.clientY;
    schedule();
  });
  canvas.addEventListener('pointerup', () => { dragging = null; });
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    zoomAt(event.clientX - rect.left, event.clientY - rect.top,
      event.deltaY < 0 ? MAP.zoomStep : 1 / MAP.zoomStep);
  }, { passive: false });
  window.addEventListener('resize', () => (touched ? schedule() : fit()));

  return {
    fit,
    schedule,
    toField,
    wasDrag: () => Boolean(dragging && dragging.moved),
    zoom: (factor) => zoomAt(canvas.clientWidth / 2, canvas.clientHeight / 2, factor),
  };
}
