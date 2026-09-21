"use client";

import { useEffect } from "react";
import { COLORS } from "@/drishti/theme/colors";
import { MISSION_PHASES, TOTAL_MISSION_SEC } from "@/drishti/data/missionPhases";
import { useStore } from "@/drishti/state/store";

function fmt(s: number): string {
  const mm = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function MissionTimeline({ canStart }: { canStart: boolean }) {
  const run = useStore((s) => s.missionRun);
  const start = useStore((s) => s.missionStart);
  const pause = useStore((s) => s.missionPause);
  const resume = useStore((s) => s.missionResume);
  const abort = useStore((s) => s.missionAbort);
  const reset = useStore((s) => s.missionReset);
  const tick = useStore((s) => s.missionTick);

  // 1Hz mission clock
  useEffect(() => {
    if (run.status !== "RUNNING") return;
    const id = setInterval(() => tick(1), 1000);
    return () => clearInterval(id);
  }, [run.status, tick]);

  const phaseIdx = MISSION_PHASES.findIndex((p) => p.id === run.phaseId);
  const currentPhase = MISSION_PHASES[phaseIdx];
  const phaseProgress = currentPhase ? run.phaseElapsedSec / currentPhase.durationSec : 0;
  const remainingSec = TOTAL_MISSION_SEC - run.totalElapsedSec;

  return (
    <div>
      {/* Phase row */}
      <div style={{ display: "flex", gap: "3px", marginBottom: "8px" }}>
        {MISSION_PHASES.map((p, i) => {
          const done = i < phaseIdx || run.status === "COMPLETE";
          const active = i === phaseIdx && (run.status === "RUNNING" || run.status === "PAUSED");
          const upcoming = i > phaseIdx;
          const col = done ? COLORS.green : active ? COLORS.green : upcoming ? COLORS.txtLo : COLORS.bdMid;
          const bg = done ? COLORS.greenBg : active ? COLORS.greenBg : COLORS.bg;
          return (
            <div
              key={p.id}
              style={{
                flex: 1,
                padding: "5px 6px",
                background: bg,
                border: `1px solid ${active ? COLORS.green : done ? COLORS.bdHi : COLORS.bdDim}`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {active && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: COLORS.green,
                    opacity: 0.08,
                    width: `${phaseProgress * 100}%`,
                    transition: "width 1s linear",
                  }}
                />
              )}
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    fontFamily: "var(--font-cond)",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: col,
                  }}
                >
                  {i + 1}. {p.label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "8px",
                    color: COLORS.txtLo,
                    marginTop: "1px",
                  }}
                >
                  {p.durationSec}s · {p.swarmMode}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status row */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          padding: "6px 10px",
          background: COLORS.card,
          border: `1px solid ${COLORS.bdMid}`,
        }}
      >
        <div>
          <div style={{ fontSize: "8px", color: COLORS.txtLo, letterSpacing: "0.12em" }}>STATUS</div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              fontWeight: 700,
              color:
                run.status === "RUNNING"
                  ? COLORS.green
                  : run.status === "PAUSED"
                    ? COLORS.amber
                    : run.status === "ABORTED"
                      ? COLORS.red
                      : run.status === "COMPLETE"
                        ? COLORS.blue
                        : COLORS.txtLo,
            }}
          >
            {run.status}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "8px", color: COLORS.txtLo, letterSpacing: "0.12em" }}>PHASE</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: COLORS.txtHi }}>
            {currentPhase?.label ?? "—"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "8px", color: COLORS.txtLo, letterSpacing: "0.12em" }}>PHASE T+</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: COLORS.txtHi }}>
            {fmt(run.phaseElapsedSec)} / {fmt(currentPhase?.durationSec ?? 0)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "8px", color: COLORS.txtLo, letterSpacing: "0.12em" }}>MISSION T+</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: COLORS.txtHi }}>
            {fmt(run.totalElapsedSec)} / {fmt(TOTAL_MISSION_SEC)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "8px", color: COLORS.txtLo, letterSpacing: "0.12em" }}>REMAINING</div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: remainingSec > 0 ? COLORS.amber : COLORS.txtLo,
            }}
          >
            {fmt(Math.max(0, remainingSec))}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {/* Controls */}
        {(run.status === "IDLE" || run.status === "ABORTED" || run.status === "COMPLETE") && (
          <button
            onClick={start}
            disabled={!canStart}
            title={canStart ? "Start mission" : "Pre-flight checklist incomplete"}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              padding: "6px 14px",
              letterSpacing: "0.12em",
              fontWeight: 700,
              background: canStart ? COLORS.greenBg : COLORS.card,
              color: canStart ? COLORS.green : COLORS.txtLo,
              border: `1px solid ${canStart ? COLORS.green : COLORS.bdMid}`,
              cursor: canStart ? "pointer" : "not-allowed",
              opacity: canStart ? 1 : 0.5,
            }}
          >
            ▶ START MISSION
          </button>
        )}
        {run.status === "RUNNING" && (
          <button onClick={pause} style={ctrlBtn(COLORS.amber, COLORS.amberBd, COLORS.amberBg)}>
            ⏸ PAUSE
          </button>
        )}
        {run.status === "PAUSED" && (
          <button onClick={resume} style={ctrlBtn(COLORS.green, COLORS.bdHi, COLORS.greenBg)}>
            ▶ RESUME
          </button>
        )}
        {(run.status === "RUNNING" || run.status === "PAUSED") && (
          <button onClick={abort} style={ctrlBtn(COLORS.red, COLORS.redBd, COLORS.redBg)}>
            ◼ ABORT
          </button>
        )}
        {(run.status === "ABORTED" || run.status === "COMPLETE") && (
          <button onClick={reset} style={ctrlBtn(COLORS.txtMid, COLORS.bdMid, COLORS.card)}>
            ↺ RESET
          </button>
        )}
      </div>
    </div>
  );
}

function ctrlBtn(fg: string, bd: string, bg: string): React.CSSProperties {
  return {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    padding: "6px 14px",
    letterSpacing: "0.12em",
    fontWeight: 700,
    background: bg,
    color: fg,
    border: `1px solid ${bd}`,
    cursor: "pointer",
  };
}
