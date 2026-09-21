"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { COLORS } from "@/drishti/theme/colors";
import { SCENARIOS } from "@/drishti/data/scenarios";
import type { Scenario, ScenarioAction } from "@/drishti/types/scenario";
import type { MainToWorker } from "@/drishti/sim/protocol";
import type { Formation } from "@/drishti/types/mission";

interface Props {
  send: (msg: MainToWorker) => void;
}

function dispatch(action: ScenarioAction, send: (msg: MainToWorker) => void): void {
  switch (action.kind) {
    case "FAULT_DRONE":
      send({ kind: "FAULT_DRONE", droneId: action.droneId });
      break;
    case "SET_BATTERY":
      send({ kind: "SET_BATTERY", droneId: action.droneId, pct: action.pct });
      break;
    case "GNSS_DENY":
      // Worker toggles, so only send if we want to enter the opposite state.
      send({ kind: "TOGGLE_GNSS_DENY" });
      break;
    case "SET_FORMATION":
      send({ kind: "SET_FORMATION", formation: action.formation as Formation });
      break;
    case "SET_SWARM_MOVING":
      send({ kind: "TOGGLE_MOVING" });
      break;
    case "SET_MODE":
    case "SPAWN_TARGETS":
    case "ANNOTATE":
      // No worker side-effect (narration only).
      break;
  }
}

export function ScenarioRunner({ send }: Props) {
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tSec, setTSec] = useState(0);
  const [paused, setPaused] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef = useRef<Set<number>>(new Set());
  const autoStartedRef = useRef(false);

  const active: Scenario | null = activeId ? (SCENARIOS.find((s) => s.id === activeId) ?? null) : null;

  // Tick the scenario clock when active & not paused.
  useEffect(() => {
    if (!active || paused) {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }
    tickRef.current = setInterval(() => setTSec((t) => t + 1), 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [active, paused]);

  // Dispatch step actions as their atSec is crossed.
  useEffect(() => {
    if (!active) return;
    active.steps.forEach((step, idx) => {
      if (tSec >= step.atSec && !firedRef.current.has(idx)) {
        firedRef.current.add(idx);
        dispatch(step.action, send);
      }
    });
    if (tSec >= active.durationSec) {
      // Auto-stop at end
      stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tSec, active]);

  const start = (id: string) => {
    send({ kind: "RESET" });
    firedRef.current.clear();
    setActiveId(id);
    setTSec(0);
    setPaused(false);
  };

  // Auto-start scenario when navigated to /demo?scenario=<id>
  useEffect(() => {
    if (autoStartedRef.current) return;
    const id = params.get("scenario");
    if (id && SCENARIOS.some((s) => s.id === id)) {
      autoStartedRef.current = true;
      // Defer until after first paint so worker is ready
      const t = setTimeout(() => start(id), 600);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);
  const stop = () => {
    setActiveId(null);
    setTSec(0);
    setPaused(false);
    firedRef.current.clear();
  };

  // Current narration: latest step whose atSec ≤ tSec.
  const currentStep = active
    ? [...active.steps].reverse().find((s) => s.atSec <= tSec) ?? null
    : null;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "5px 12px",
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          letterSpacing: "0.1em",
          fontWeight: 700,
          textTransform: "uppercase",
          color: active ? COLORS.green : COLORS.txtMid,
          background: active ? COLORS.greenBg : COLORS.card,
          border: `1px solid ${active ? COLORS.green : COLORS.bdMid}`,
          cursor: "pointer",
        }}
      >
        ▶ SCENARIOS{active ? ` · ${active.title}` : ""}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "50px",
            left: "8px",
            width: "320px",
            zIndex: 999,
            background: "#050e08",
            border: `1px solid ${COLORS.bdHi}`,
            boxShadow: "0 0 30px rgba(0,220,80,0.08)",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              background: "#040a07",
              borderBottom: `1px solid ${COLORS.bdDim}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-cond)",
                fontWeight: 700,
                fontSize: "11px",
                letterSpacing: "0.15em",
                color: COLORS.txtMid,
              }}
            >
              SCRIPTED SCENARIOS
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{ color: COLORS.txtLo, fontSize: "12px", fontFamily: "var(--font-mono)" }}
            >
              ✕
            </button>
          </div>
          <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  start(s.id);
                  setOpen(false);
                }}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  textAlign: "left",
                  padding: "6px 8px",
                  background: COLORS.card,
                  color: COLORS.txtMid,
                  border: `1px solid ${COLORS.bdDim}`,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 700, color: COLORS.green, letterSpacing: "0.1em" }}>
                  {s.title}
                </div>
                <div style={{ marginTop: "2px", color: COLORS.txtLo, lineHeight: 1.35 }}>{s.blurb}</div>
                <div style={{ marginTop: "3px", color: COLORS.amber, fontSize: "8px" }}>
                  PROVES: {s.proves.join(", ")} · {s.durationSec}s
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {active && currentStep && (
        <div
          style={{
            position: "fixed",
            top: "54px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 997,
            padding: "6px 14px",
            background: "rgba(4,10,7,0.92)",
            border: `1px solid ${COLORS.bdHi}`,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 0 30px rgba(0,220,80,0.12)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-cond)",
              fontWeight: 700,
              fontSize: "10px",
              letterSpacing: "0.15em",
              color: COLORS.green,
            }}
          >
            {active.title}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: COLORS.txtHi }}>
            {currentStep.narration}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              color: COLORS.txtLo,
              letterSpacing: "0.08em",
            }}
          >
            T+{tSec}s / {active.durationSec}s
          </span>
          <button
            onClick={() => setPaused((v) => !v)}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              padding: "2px 8px",
              border: `1px solid ${COLORS.bdMid}`,
              background: COLORS.card,
              color: COLORS.txtMid,
              cursor: "pointer",
            }}
          >
            {paused ? "▶" : "⏸"}
          </button>
          <button
            onClick={stop}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              padding: "2px 8px",
              border: `1px solid ${COLORS.redBd}`,
              background: COLORS.redBg,
              color: COLORS.red,
              cursor: "pointer",
            }}
          >
            ◼ STOP
          </button>
        </div>
      )}
    </>
  );
}
