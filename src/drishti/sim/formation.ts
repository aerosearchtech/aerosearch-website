// Slot positions for each formation, scaled to N drones.
// Returns metres-from-swarm-centre (East, North, Up).

import type { Formation } from "@/drishti/types/mission";
import type { Vec3 } from "@/drishti/types/uav";

// Base shapes for N=5, in [-1..1] x/y units; scaled below.
const SHAPES: Record<Formation, [number, number][]> = {
  WEDGE: [
    [0, 1],
    [-0.7, 0.3],
    [0.7, 0.3],
    [-0.45, -0.65],
    [0.45, -0.65],
  ],
  "LINE-ABREAST": [
    [-1, 0],
    [-0.5, 0],
    [0, 0],
    [0.5, 0],
    [1, 0],
  ],
  CIRCULAR: [
    [0, 1],
    [0.95, 0.31],
    [0.59, -0.81],
    [-0.59, -0.81],
    [-0.95, 0.31],
  ],
  DIAMOND: [
    [0, 1],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 0],
  ],
};

const RADIUS_M = 300; // half-spread of formation

export function slots(formation: Formation, count: number, altM: number): Vec3[] {
  const shape = SHAPES[formation];
  // Use first `count` points; reformat smaller swarms tighter.
  const tighten = count <= 4 ? 0.85 : 1;
  return shape.slice(0, count).map(([x, y]) => ({
    x: x * RADIUS_M * tighten,
    y: y * RADIUS_M * tighten,
    z: altM,
  }));
}

// Hungarian-style minimum displacement assignment.
// Simple O(N!) brute force is fine for N=5.
export function assignSlots(currentPos: Vec3[], slotPos: Vec3[]): number[] {
  const n = Math.min(currentPos.length, slotPos.length);
  const indices = Array.from({ length: n }, (_, i) => i);
  let bestPerm = indices.slice();
  let bestCost = Infinity;

  const permute = (arr: number[], k: number) => {
    if (k === arr.length) {
      let cost = 0;
      for (let i = 0; i < arr.length; i++) {
        const cp = currentPos[i];
        const sp = slotPos[arr[i] ?? 0];
        if (!cp || !sp) continue;
        const dx = cp.x - sp.x;
        const dy = cp.y - sp.y;
        cost += dx * dx + dy * dy;
      }
      if (cost < bestCost) {
        bestCost = cost;
        bestPerm = arr.slice();
      }
      return;
    }
    for (let i = k; i < arr.length; i++) {
      [arr[k], arr[i]] = [arr[i]!, arr[k]!];
      permute(arr, k + 1);
      [arr[k], arr[i]] = [arr[i]!, arr[k]!];
    }
  };
  permute(indices, 0);
  return bestPerm;
}
