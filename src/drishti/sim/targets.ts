// Target spawning + motion. Ground-truth only.

import { TARGET } from "@/drishti/theme/constants";
import type { Target, TargetType } from "@/drishti/types/target";
import { integrate } from "./physics";

const TYPES: { type: TargetType; weight: number }[] = [
  { type: "DRONE", weight: 6 },
  { type: "BIRD", weight: 2 },
  { type: "UNK", weight: 1 },
];

function pickType(): TargetType {
  const total = TYPES.reduce((a, t) => a + t.weight, 0);
  let r = Math.random() * total;
  for (const t of TYPES) {
    r -= t.weight;
    if (r <= 0) return t.type;
  }
  return "DRONE";
}

let counter = 0;
function nextId(): string {
  counter += 1;
  return `T-${String(counter).padStart(3, "0")}`;
}

export function spawnInitial(count: number, maxRangeM: number): Target[] {
  counter = 0;
  const out: Target[] = [];
  for (let i = 0; i < count; i++) {
    out.push(makeAtEdge(maxRangeM, i));
  }
  return out;
}

function makeAtEdge(maxRangeM: number, seedIdx: number): Target {
  // Spawn near outer edge with velocity pointed roughly inward.
  const az = (seedIdx * (2 * Math.PI)) / 5 + (Math.random() - 0.5) * 0.6;
  const r = maxRangeM * (0.55 + Math.random() * 0.35);
  const x = Math.sin(az) * r;
  const y = Math.cos(az) * r;
  const speed = TARGET.vMinMs + Math.random() * (TARGET.vMaxMs - TARGET.vMinMs);
  const inwardAz = az + Math.PI + (Math.random() - 0.5) * 0.8;
  const vx = Math.sin(inwardAz) * speed;
  const vy = Math.cos(inwardAz) * speed;
  const rcs = TARGET.rcsMin + Math.random() * (TARGET.rcsMax - TARGET.rcsMin);
  const type = pickType();
  return {
    id: nextId(),
    pos: { x, y, z: 600 + Math.random() * 400 },
    vel: { x: vx, y: vy, z: 0 },
    rcs,
    type,
  };
}

export function step(targets: Target[], dt: number, maxRangeM: number): Target[] {
  const out: Target[] = [];
  for (const t of targets) {
    const npos = integrate(t.pos, t.vel, dt);
    const r = Math.sqrt(npos.x * npos.x + npos.y * npos.y);
    if (r > maxRangeM * 1.15) {
      // Respawn from a different edge
      out.push(makeAtEdge(maxRangeM, Math.floor(Math.random() * 5)));
    } else {
      out.push({ ...t, pos: npos });
    }
  }
  return out;
}
