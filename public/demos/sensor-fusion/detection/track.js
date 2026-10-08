// Flight lines for each pass. Where the survey published its own positions the
// aircraft flies those; where it published none the pass flies a lawnmower with
// realistic drift.

import { DRIFT, TRACK } from './colors.js';

/** Deterministic PRNG so every replay of a pass flies the identical track. */
export function rng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const meanY = (points) => points.reduce((sum, p) => sum + p[1], 0) / points.length;

const lane = (points) => ({ points, centre: meanY(points) });

/** Evenly spaced lawnmower lanes with cross-track drift and speed jitter. */
export function syntheticLanes(pass, field, pixel) {
  const random = rng(pass.seed);
  const step = DRIFT.stepM / pixel;
  const margin = Math.min(field.height / 2, pass.swathM / 2 / pixel);
  const span = field.height - 2 * margin;
  const phase = random() * Math.PI * 2;
  const lanes = [];
  let offset = 0;
  let velocity = 0;
  for (let index = 0; index < pass.lanes; index += 1) {
    const centre = margin + (pass.lanes === 1 ? span / 2
      : (span * index) / (pass.lanes - 1));
    const forward = index % 2 === 0;
    const points = [];
    for (let along = 0; along <= field.width; along += step) {
      velocity = velocity * DRIFT.damping + (random() - 0.5) * DRIFT.walkM;
      offset = Math.max(-DRIFT.maxM, Math.min(DRIFT.maxM, offset + velocity));
      const sine = Math.sin(phase + (along * pixel / DRIFT.periodM) * Math.PI * 2);
      const y = centre + (offset + sine * DRIFT.sineM) / pixel;
      points.push([forward ? along : field.width - along,
        Math.max(0, Math.min(field.height, y))]);
    }
    lanes.push(lane(points));
  }
  return lanes;
}

/**
 * Lanes read straight off the survey's own sample positions, one per recorded
 * line. Lines are ordered down the field and flown alternately, which is how a
 * boustrophedon survey is actually walked; the drift is the real thing.
 */
function boustrophedon(legs) {
  return legs
    .sort((a, b) => meanY(a) - meanY(b))
    .map((points, index) => lane(index % 2 === 0 ? points : points.slice().reverse()));
}

/**
 * The line carried on to a field edge. Valid samples stop short of the edge
 * wherever the source dropped out, but the aircraft flew the whole line and the
 * gridded product covers it, so the leg is continued at the heading it ends on.
 */
function toEdge(points, x) {
  const [a, b] = x < points[0][0]
    ? [points[Math.min(TRACK.headingSamples, points.length - 1)], points[0]]
    : [points[points.length - 1 - Math.min(TRACK.headingSamples, points.length - 1)],
      points[points.length - 1]];
  const run = b[0] - a[0];
  return [x, b[1] + (run ? ((b[1] - a[1]) / run) * (x - b[0]) : 0)];
}

export function measuredLanes({ points: samples }, field) {
  const lines = new Map();
  samples.forEach(([x, y, , , id]) => {
    if (!lines.has(id)) lines.set(id, []);
    lines.get(id).push([x, y]);
  });
  return boustrophedon([...lines.values()]
    .map((points) => points.slice().sort((a, b) => a[0] - b[0]))
    .map((points) => [toEdge(points, 0), ...points, toEdge(points, field.width)]));
}

/**
 * A pass over a gridded product. There are no flight lines in it to follow and
 * no acquisition order to replay, so the pass holds a single position and the
 * product is presented whole.
 */
export function wholeField(field) {
  return [{ points: [[0, field.height / 2]], centre: field.height / 2 }];
}

/** Flatten lanes into the single track a pass flies, and their centre lines. */
export function assemble(lanes) {
  return {
    points: lanes.flatMap((leg) => leg.points),
    centres: lanes.map((leg) => leg.centre),
  };
}

/**
 * Sample indices the aircraft was not scanning into: a turn at the end of a
 * lane, or a transit longer than the swath itself. The track lifts here and the
 * swath paints nothing, so coverage is only ever claimed where it was flown.
 */
export function breaksOver(points, gap) {
  const breaks = new Set([0]);
  for (let i = 1; i < points.length; i += 1) {
    if (Math.hypot(points[i][0] - points[i - 1][0],
      points[i][1] - points[i - 1][1]) > gap) breaks.add(i);
  }
  return breaks;
}

/** Along-track distance to each sample, with speed jitter folded into timing. */
export function schedule(points, seed) {
  const random = rng(seed);
  const cumulative = [0];
  for (let i = 1; i < points.length; i += 1) {
    const jitter = 1 + (random() - 0.5) * 2 * DRIFT.speedJitter;
    const dx = points[i][0] - points[i - 1][0];
    const dy = points[i][1] - points[i - 1][1];
    cumulative.push(cumulative[i - 1] + Math.hypot(dx, dy) * jitter);
  }
  return cumulative;
}
