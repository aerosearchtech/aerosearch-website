"use client";

import { useEffect, useRef } from "react";
import { useStore } from "./store";
import type { MainToWorker, WorkerToMain } from "@/drishti/sim/protocol";

// Wires the worker lifecycle to the store. Returns a `send` function the
// UI uses to dispatch commands (formation change, fault inject, etc.).
export function useSimWorker(): (msg: MainToWorker) => void {
  const workerRef = useRef<Worker | null>(null);
  const applySnapshot = useStore((s) => s.applySnapshot);
  const formation = useStore((s) => s.formation);
  const maxRangeKm = useStore((s) => s.tweaks.maxRangeKm);
  const simSpeed = useStore((s) => s.tweaks.simSpeed);

  useEffect(() => {
    const w = new Worker(new URL("../sim/worker.ts", import.meta.url), { type: "module" });
    workerRef.current = w;
    w.onmessage = (e: MessageEvent<WorkerToMain>) => {
      if (e.data.kind === "SNAPSHOT") applySnapshot(e.data.snapshot);
    };
    const init: MainToWorker = { kind: "INIT", maxRangeKm, formation };
    w.postMessage(init);
    return () => {
      w.terminate();
      workerRef.current = null;
    };
    // Only initialise once on mount. Subsequent setting changes go via send().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push setting changes through to the worker.
  useEffect(() => {
    workerRef.current?.postMessage({ kind: "SET_FORMATION", formation } satisfies MainToWorker);
  }, [formation]);
  useEffect(() => {
    workerRef.current?.postMessage({ kind: "SET_MAX_RANGE", maxRangeKm } satisfies MainToWorker);
  }, [maxRangeKm]);
  useEffect(() => {
    workerRef.current?.postMessage({ kind: "SET_SIM_SPEED", speed: simSpeed } satisfies MainToWorker);
  }, [simSpeed]);

  return (msg: MainToWorker) => workerRef.current?.postMessage(msg);
}
