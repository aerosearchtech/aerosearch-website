// Simplified MANET signal model. Signal degrades with link distance
// and total network latency grows with hop count.

import { COMMS } from "@/drishti/theme/constants";
import type { CommsState } from "@/drishti/types/comms";
import type { UAV } from "@/drishti/types/uav";
import { dist3D } from "./physics";

export function computeComms(uavs: UAV[]): { state: CommsState; perDroneSignal: number[] } {
  // Fully-connected mesh; quality from inter-drone distance to nearest neighbour.
  const links = [];
  const sigs: number[] = [];
  for (let i = 0; i < uavs.length; i++) {
    const a = uavs[i]!;
    let best = 0;
    for (let j = 0; j < uavs.length; j++) {
      if (i === j) continue;
      const b = uavs[j]!;
      if (b.status === "FAULT" || b.status === "RTH") continue;
      const d = dist3D(a.pos, b.pos);
      // 100% at 0 m, 20% at signalLossRangeM, never below 20.
      const q = Math.max(20, 100 - (d / COMMS.signalLossRangeM) * 80);
      if (q > best) best = q;
      links.push({ fromId: a.id, toId: b.id, quality: q, active: q > 30 });
    }
    sigs.push(best);
  }
  const latency = COMMS.baseLatencyMs + (Math.random() - 0.5) * COMMS.jitterMs;
  return {
    state: { protocol: "OLSR", latencyMs: Math.round(latency), jitterMs: COMMS.jitterMs, links },
    perDroneSignal: sigs,
  };
}
