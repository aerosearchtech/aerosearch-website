// Detection comparison page: per-sensor detections, misses and false alarms
// over the Site 2 field, the combined picture, and a survey replay.

import { COLORS, SENSORS, SENSOR_KEYS, MAP, CLASS_LABELS, REPLAY,
  ASSET_BASE, SHARED_BASE, SENSOR_LAYERS, MEASURED_TRACKS, TRACK_LABELS,
  THEME_KEY,
  syncTheme } from './colors.js';
import { createMap } from './map.js';
import { createReplay } from './replay.js';
import { drawMarker, drawAlarm, drawTrack, drawDrone, drawScaleBar, swathPath }
  from './draw.js';
import { createRecorder, recordingSupported } from './record.js';

const $ = (id) => document.getElementById(id);

const MODES = {
  sensors: { button: 'modeSensors' },
  combined: { button: 'modeCombined' },
  replay: { button: 'modeReplay' },
};

const state = { active: new Set(SENSOR_KEYS), mode: 'sensors', misses: true,
  alarms: true, speed: 1 };
let data = null;
let map = null;
let selected = null;
let replay = null;
let recorder = null;
let frameTime = null;
const layerImages = {};

const reported = () => data.targets.filter(
  (t) => t.class === 'ordnance' || t.class === 'minimum_metal',
);

function hitsFor(target) {
  return SENSOR_KEYS.filter((s) => state.active.has(s) && target.det[s]);
}




function drawReplay(ctx, toScreen, scale) {
  const { pass, done, points, swath, head } = replay.trail();
  done.forEach((earlier) => drawTrack(ctx, toScreen, earlier.points,
    SENSORS[earlier.sensor].color, REPLAY.trackWidth, REPLAY.doneTrackAlpha,
    earlier.breaks));
  // Once the survey is over the flight lines step back so the combined
  // detection picture is what the eye lands on.
  if (replay.state.done) {
    drawTrack(ctx, toScreen, points, SENSORS[pass.sensor].color,
      REPLAY.trackWidth, REPLAY.doneTrackAlpha, pass.breaks);
    return;
  }
  // A whole-field pass has no aircraft and no track of its own.
  if (pass.instant) return;
  // Swath first, so the flown centreline reads on top of its own footprint.
  drawTrack(ctx, toScreen, swath, SENSORS[pass.sensor].color,
    (pass.swathM / data.field.pixel_size_m) * scale, REPLAY.swathAlpha);
  drawTrack(ctx, toScreen, points, SENSORS[pass.sensor].color,
    REPLAY.trackWidth, 0.85, pass.breaks);
  if (!head) return;
  const [hx, hy] = toScreen(head[0], head[1]);
  ctx.beginPath();
  ctx.arc(hx, hy, 5, 0, Math.PI * 2);
  ctx.fillStyle = SENSORS[pass.sensor].color;
  ctx.fill();
}

/**
 * The aircraft, drawn at the head of the flown track and turned along it.
 * Mirrors the layer explorer so both replays read as the same vehicle.
 */

/**
 * Ground the active pass has swept: the swath footprint along everything flown
 * so far, so imagery resolves behind the aircraft exactly where the sensor has
 * been and nowhere else.
 */
function clipAcquired(ctx, toScreen, scale) {
  const { pass, points } = replay.trail();
  if (pass.instant) return;
  swathPath(ctx, toScreen, scale, points,
    pass.swathM / data.field.pixel_size_m, pass.breaks);
  ctx.clip();
}

function acquisition() {
  // The opening camera pass is what builds the orthomosaic, so only that one
  // resolves the ground itself. Later passes paint their own response surface
  // over the mosaic instead, in drawSensorLayer.
  if (state.mode !== 'replay' || replay.locate().index > 0) return null;
  return { ghost: REPLAY.ghostAlpha, clip: clipAcquired };
}

/** The active sensor's rendered output, filling in behind the pass. */
function drawSensorLayer(ctx, toScreen, scale) {
  const image = layerImages[replay.trail().pass.sensor];
  if (!image || !image.complete || !image.naturalWidth || replay.state.done) return;
  ctx.save();
  clipAcquired(ctx, toScreen, scale);
  ctx.globalAlpha = REPLAY.layerAlpha;
  const [x, y] = toScreen(0, 0);
  ctx.drawImage(image, x, y, data.field.width * scale, data.field.height * scale);
  ctx.restore();
}

/** Physical scale bar, stable through playback and tied only to manual zoom. */

function replayOverlay(ctx, { toScreen, scale }) {
  drawSensorLayer(ctx, toScreen, scale);
  drawReplay(ctx, toScreen, scale);
  const hits = replay.found();
  reported().forEach((target) => {
    const sensors = hits.get(target.id);
    const [x, y] = toScreen(target.x, target.y);
    if (!sensors) {
      // Ground the opening pass has not reached yet is not known ground.
      if (state.misses && (replay.locate().index > 0
        || replay.acquired(target.id))) {
        drawMarker(ctx, x, y, []);
      }
      return;
    }
    drawMarker(ctx, x, y, sensors);
    if (!replay.fused(sensors)) return;
    ctx.beginPath();
    ctx.arc(x, y, MAP.markerRadius + 5, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.confirmed;
    ctx.lineWidth = 2;
    ctx.stroke();
  });
  const { pass, points } = replay.trail();
  if (!replay.state.done && !pass.instant) drawDrone(ctx, toScreen, points);
}

function staticOverlay(ctx, { toScreen }) {
  if (state.alarms) {
    if (state.mode === 'combined') {
      data.clusters.filter((c) => c.sensors.length >= 2).forEach((c) => {
        const [x, y] = toScreen(c.x, c.y);
        drawAlarm(ctx, x, y, COLORS.confirmed, false);
      });
    } else {
      data.alarms.filter((a) => state.active.has(a.sensor)).forEach((a) => {
        const [x, y] = toScreen(a.x, a.y);
        drawAlarm(ctx, x, y, SENSORS[a.sensor].color, a.cause !== 'background');
      });
    }
  }
  reported().forEach((target) => {
    const hits = hitsFor(target);
    if (!hits.length && !state.misses) return;
    const [x, y] = toScreen(target.x, target.y);
    drawMarker(ctx, x, y, hits);
    if (selected && selected.id === target.id) {
      ctx.beginPath();
      ctx.arc(x, y, MAP.markerRadius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.accent;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
}

function overlay(ctx, view) {
  if (state.mode === 'replay') replayOverlay(ctx, view);
  else staticOverlay(ctx, view);
  drawScaleBar(ctx, view, data.field.pixel_size_m);
}

function pct(value) {
  return value === null || value === undefined ? '—' : `${Math.round(value * 100)}%`;
}

function swatch(key) {
  return `<i class="swatch" style="background:${SENSORS[key].color}"></i>`;
}

function buildSensorPanel() {
  const panel = $('sensors');
  panel.innerHTML = '';
  SENSOR_KEYS.forEach((key) => {
    const meta = data.sensors[key];
    const stats = data.stats.sensors[key];
    const row = document.createElement('label');
    row.className = state.active.has(key) ? 'sensor' : 'sensor off';
    row.title = meta.basis;
    row.innerHTML = `
      <span class="sensor-main">
        <input type="checkbox" ${state.active.has(key) ? 'checked' : ''} />
        ${swatch(key)}
        <span class="sensor-text">
          <b>${meta.label}
            <span class="chip chip-${meta.provenance}">${meta.provenance}</span></b>
          <small>${stats.all.detected}/${stats.all.total} found ·
            ${stats.false_alarms} false alarms · ${pct(stats.coverage)} coverage</small>
        </span>
      </span>`;
    row.querySelector('input').addEventListener('change', (event) => {
      if (event.target.checked) state.active.add(key); else state.active.delete(key);
      buildSensorPanel();
      render();
    });
    panel.appendChild(row);
  });
  $('shownCount').textContent = `${state.active.size} of ${SENSOR_KEYS.length} shown`;
}

function inspect(target) {
  selected = target;
  $('selectedTitle').textContent = `${target.id} · ${target.name || 'unnamed'}`;
  $('selectedMeta').textContent = `${CLASS_LABELS[target.class]} · ${
    target.kind || '—'} · depth ${target.depth} cm · response in a ${
    data.stats.field.cell_radius_m} m disc`;
  $('readings').innerHTML = SENSOR_KEYS.map((key) => {
    const value = target.values[key];
    return `<div class="reading">
      <span>${swatch(key)}${SENSORS[key].label}</span>
      <b class="${target.det[key] ? 'yes' : 'no'}">${
  target.det[key] ? 'Detected' : 'Not detected'}</b>
      <small>${value === null ? 'no coverage' : `${value.toFixed(3)} response`} ·
        ${data.sensors[key].provenance}</small>
    </div>`;
  }).join('');
  map.schedule();
}

const clock = (seconds) => {
  const whole = Math.floor(seconds);
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${
    String(whole % 60).padStart(2, '0')}`;
};

function passTitle(label) {
  if (replay.state.done) return 'Survey complete';
  if (replay.state.playing) return `Surveying · ${label}`;
  return replay.state.elapsed ? `Survey paused · ${label}` : 'Ready to survey';
}

function updateReplay() {
  const { index } = replay.locate();
  const pass = replay.passes[index];
  const label = SENSORS[pass.sensor].label;
  const hits = replay.found();
  const count = String(replay.passes.length).padStart(2, '0');
  let fused = 0;
  hits.forEach((sensors) => { if (replay.fused(sensors)) fused += 1; });
  $('replayPass').innerHTML = replay.state.done ? 'Survey complete'
    : `Pass ${String(index + 1).padStart(2, '0')} / ${count}
      <b style="color:${SENSORS[pass.sensor].color}">${label}</b>`;
  $('replayTitle').textContent = passTitle(label);
  const covers = pass.instant ? TRACK_LABELS.instant
    : `${pass.count} ${TRACK_LABELS[pass.measured
      ? MEASURED_TRACKS[pass.sensor].kind : 'synthetic']}, ${pass.swathM} m swath`;
  $('replayTally').textContent = `${covers}
    · ${hits.size} reported · ${fused} confirmed by two or more`;
  $('replayElapsed').textContent = clock(replay.state.elapsed);
  $('replayScrub').value = String(
    Math.round((replay.state.elapsed / replay.total) * 1000));
  $('replayPlay').textContent = replay.state.playing ? 'Ⅱ' : '▶';
  $('replayPlay').setAttribute('aria-label',
    replay.state.playing ? 'Pause survey' : 'Start survey');
}

function render() {
  const isReplay = state.mode === 'replay';
  Object.entries(MODES).forEach(([mode, config]) => {
    $(config.button).classList.toggle('active', mode === state.mode);
  });
  $('replayPanel').hidden = !isReplay;
  $('replayBadge').hidden = !isReplay;
  if (isReplay) updateReplay();
  map.schedule();
}

function setMode(mode) {
  state.mode = mode;
  if (mode === 'combined') {
    SENSOR_KEYS.forEach((key) => state.active.add(key));
    buildSensorPanel();
  }
  if (mode === 'replay') replay.reset();
  render();
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  const next = theme === 'light' ? 'dark' : 'light';
  $('theme').innerHTML = `◐ <span>${theme === 'light' ? 'Dark' : 'Light'}</span>`;
  $('theme').setAttribute('aria-label', `Switch to ${next} theme`);
  syncTheme();
  if (map) map.schedule();
}

// Controls that would corrupt a take while the canvas is being captured.
const RECORD_LOCKED = ['replayRecord', 'replayScrub', 'replaySpeed',
  'replayRestart', 'replayPlay'];

/** Record one uninterrupted survey from the start, then save the WebM. */
function startRecording() {
  map.fit();
  state.speed = 1;
  $('replaySpeed').value = '1';
  replay.reset();
  replay.play();
  recorder.start();
  $('replayRecord').textContent = 'Recording…';
  RECORD_LOCKED.forEach((id) => { $(id).disabled = true; });
  render();
}

function finishRecording() {
  $('replayRecord').textContent = 'Record';
  RECORD_LOCKED.forEach((id) => { $(id).disabled = false; });
}

function tick(time) {
  const delta = frameTime === null ? 0 : (time - frameTime) / 1000;
  frameTime = time;
  if (state.mode === 'replay' && replay.state.playing) {
    replay.step(delta * state.speed);
    updateReplay();
    map.schedule();
  }
  if (recorder.running && replay.state.done) recorder.stop();
  requestAnimationFrame(tick);
}

function wireControls() {
  Object.entries(MODES).forEach(([mode, config]) => {
    $(config.button).addEventListener('click', () => setMode(mode));
  });
  $('showMisses').addEventListener('change', (event) => {
    state.misses = event.target.checked;
    render();
  });
  $('showAlarms').addEventListener('change', (event) => {
    state.alarms = event.target.checked;
    render();
  });
  $('theme').addEventListener('click', () => setTheme(
    document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'));
  $('replayPlay').addEventListener('click', () => {
    if (replay.state.playing) replay.pause(); else replay.play();
    updateReplay();
  });
  $('replayRestart').addEventListener('click', () => {
    replay.reset();
    updateReplay();
    map.schedule();
  });
  $('replayScrub').addEventListener('input', (event) => {
    replay.pause();
    replay.seek(Number(event.target.value) / 1000);
    updateReplay();
    map.schedule();
  });
  $('replaySpeed').innerHTML = REPLAY.speeds.map((speed) => `<option value="${
    speed}"${speed === 1 ? ' selected' : ''}>${speed}×</option>`).join('');
  $('replaySpeed').addEventListener('change', (event) => {
    state.speed = Number(event.target.value);
  });
  $('replayRecord').addEventListener('click', startRecording);
  $('fit').addEventListener('click', () => map.fit());
  $('zoomIn').addEventListener('click', () => map.zoom(1.4));
  $('zoomOut').addEventListener('click', () => map.zoom(1 / 1.4));
  $('canvas').addEventListener('click', (event) => {
    if (map.wasDrag()) return;
    const rect = event.target.getBoundingClientRect();
    const [fx, fy] = map.toField(event.clientX - rect.left, event.clientY - rect.top);
    let best = null;
    let bestDistance = Infinity;
    reported().forEach((target) => {
      const d = Math.hypot(target.x - fx, target.y - fy);
      if (d < bestDistance) { bestDistance = d; best = target; }
    });
    if (best && bestDistance < MAP.pickRadiusPx) inspect(best);
  });
}

/**
 * Recorded positions for the passes that have them. A sample list on its own is
 * enough when the survey published line ids; otherwise the edge graph that goes
 * with it supplies the order the samples were observed in.
 */
async function loadTracks() {
  const json = (url) => fetch(url).then((r) => r.json());
  const entries = await Promise.all(
    Object.entries(MEASURED_TRACKS).map(async ([sensor, track]) => [sensor, {
      points: await json(track.points),
      edges: track.edges ? (await json(track.edges)).edges : null,
    }]),
  );
  return Object.fromEntries(entries);
}

async function boot() {
  const [detection, manifest, tracks] = await Promise.all([
    fetch('assets/detection.json').then((r) => r.json()),
    fetch(`${ASSET_BASE}/manifest.json`).then((r) => r.json()),
    loadTracks(),
  ]);
  data = detection;
  map = createMap($('canvas'), manifest, data.field, overlay, acquisition);
  replay = createReplay(data, reported(), tracks);
  recorder = createRecorder($('canvas'), finishRecording);
  Object.entries(SENSOR_LAYERS).forEach(([sensor, file]) => {
    const image = new Image();
    image.src = `${SHARED_BASE}/${file}`;
    image.onload = () => map.schedule();
    layerImages[sensor] = image;
  });
  setTheme(localStorage.getItem(THEME_KEY) || 'light');
  buildSensorPanel();
  wireControls();
  $('replayDuration').textContent = clock(replay.total);
  if (!recordingSupported()) $('replayRecord').hidden = true;
  render();
  requestAnimationFrame(() => map.fit());
  requestAnimationFrame(tick);
}

boot();
