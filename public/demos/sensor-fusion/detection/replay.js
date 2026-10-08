// Survey replay: each sensor flies its own pass over the field, revealing its
// detections as the swath crosses them. A target that two or more sensors have
// reported becomes a fused detection.

import { PASSES, REPLAY } from './colors.js';
import { syntheticLanes, measuredLanes, wholeField, assemble, schedule, breaksOver }
  from './track.js';

/** Closest the track comes to a target, and the first sample within the swath. */
function approach(points, target, reach) {
  let best = Infinity;
  let nearest = 0;
  for (let i = 0; i < points.length; i += 1) {
    const distance = Math.hypot(points[i][0] - target.x, points[i][1] - target.y);
    if (distance <= reach) return { inside: i, nearest: i, distance };
    if (distance < best) {
      best = distance;
      nearest = i;
    }
  }
  return { inside: -1, nearest, distance: best };
}

/**
 * Sample index at which each target comes under the swath, and at which each
 * detected one is reported. A reported detection the swath never quite covers
 * is still revealed at closest approach, so the replay always ends on the same
 * counts the summary table gives.
 */
function buildReveals(points, targets, pass, pixel) {
  const covered = new Map();
  const reveals = new Map();
  // A whole-field pass has no front to cross a target: everything it reports is
  // on screen from the moment the pass starts.
  if (pass.instant) {
    targets.forEach((target) => {
      covered.set(target.id, 0);
      if (target.det[pass.sensor]) reveals.set(target.id, 0);
    });
    return { covered, reveals };
  }
  const reach = (pass.swathM / 2) / pixel;
  targets.forEach((target) => {
    const { inside, nearest } = approach(points, target, reach);
    if (inside >= 0) covered.set(target.id, inside);
    if (target.det[pass.sensor]) reveals.set(target.id, inside >= 0 ? inside : nearest);
  });
  return { covered, reveals };
}

/** How a pass covers the field: whole, a recorded track, or a lawnmower. */
function lanes(pass, track, field, pixel) {
  if (pass.instant) return wholeField(field);
  return track ? measuredLanes(track, field) : syntheticLanes(pass, field, pixel);
}

export function createReplay(data, targets, tracks) {
  const pixel = data.field.pixel_size_m;
  const trailPx = REPLAY.swathTrailM / pixel;
  const passes = PASSES.map((pass) => {
    const track = tracks[pass.sensor];
    const built = assemble(lanes(pass, track, data.field, pixel));
    return {
      ...pass,
      ...built,
      measured: Boolean(track),
      count: built.centres.length,
      breaks: pass.instant ? new Set([0])
        : breaksOver(built.points, pass.swathM / pixel),
      schedule: schedule(built.points, pass.seed ^ 0x9e3779b9),
      ...buildReveals(built.points, targets, pass, pixel),
    };
  });
  const total = passes.reduce((sum, pass) => sum + pass.seconds, 0);
  const state = { elapsed: 0, playing: false, done: false };

  /** Progress inside the active pass, plus how far earlier passes advanced. */
  function locate() {
    let remaining = state.elapsed;
    for (let i = 0; i < passes.length; i += 1) {
      if (remaining < passes[i].seconds || i === passes.length - 1) {
        return { index: i, t: Math.min(1, remaining / passes[i].seconds) };
      }
      remaining -= passes[i].seconds;
    }
    return { index: passes.length - 1, t: 1 };
  }

  /** Along-track distance the active pass has flown. */
  function flown(pass, t) { return pass.schedule[pass.schedule.length - 1] * t; }

  /** Sensors that have reported each target by the current moment. */
  function found() {
    const { index, t } = locate();
    const hits = new Map();
    passes.forEach((pass, i) => {
      if (i > index) return;
      const limit = i < index ? flown(pass, 1) : flown(pass, t);
      pass.reveals.forEach((sample, id) => {
        if (pass.schedule[sample] > limit) return;
        if (!hits.has(id)) hits.set(id, []);
        hits.get(id).push(pass.sensor);
      });
    });
    return hits;
  }

  /**
   * Track flown so far, plus the trailing stretch the swath footprint covers.
   * The trail never reaches back past the start of the current leg, so a
   * footprint is only ever drawn along one continuous run of flight.
   */
  function trail() {
    const { index, t } = locate();
    const pass = passes[index];
    const end = flown(pass, t);
    let cut = pass.schedule.findIndex((value) => value > end);
    if (cut === -1) cut = pass.points.length;
    const last = Math.max(0, cut - 1);
    let from = last;
    while (from > 0 && !pass.breaks.has(from)
      && pass.schedule[last] - pass.schedule[from - 1] < trailPx) from -= 1;
    return {
      pass,
      index,
      done: passes.slice(0, index),
      points: pass.points.slice(0, Math.max(1, cut)),
      swath: pass.points.slice(from, Math.max(from + 1, cut)),
      head: pass.points[last],
    };
  }

  /** Whether the active pass has already swept over this target. */
  function acquired(id) {
    const { index, t } = locate();
    const pass = passes[index];
    const sample = pass.covered.get(id);
    return sample !== undefined && pass.schedule[sample] <= flown(pass, t);
  }

  return {
    passes,
    total,
    state,
    locate,
    found,
    trail,
    acquired,
    step(seconds) {
      if (!state.playing) return false;
      state.elapsed = Math.min(total, state.elapsed + seconds);
      if (state.elapsed >= total) {
        state.playing = false;
        state.done = true;
      }
      return true;
    },
    play() {
      if (state.done) state.elapsed = 0;
      state.done = false;
      state.playing = true;
    },
    pause() { state.playing = false; },
    reset() {
      state.elapsed = 0;
      state.playing = false;
      state.done = false;
    },
    seek(fraction) {
      state.elapsed = Math.max(0, Math.min(total, fraction * total));
      state.done = state.elapsed >= total;
    },
    fused(sensors) { return sensors.length >= REPLAY.minSensorsToFuse; },
  };
}
