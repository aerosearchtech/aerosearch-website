"use client";

import { COLORS } from "@/drishti/theme/colors";

interface Props {
  mode: string;
  modes: string[];
  onModeChange: (m: string) => void;
  radarOn: boolean;
  onToggleRadar: () => void;
  recording: boolean;
  recordTimeSec: number;
  onToggleRecording: () => void;
  hasReplayBuffer: boolean;
  onOpenReplay: () => void;
  gnssDenied: boolean;
  onToggleGnssDeny: () => void;
  swarmMoving: boolean;
  swarmSpd: number;
  onToggleMoving: () => void;
  nightMode: boolean;
  onToggleNight: () => void;
  on360: () => void;
  onRTHAll: () => void;
  // Extra buttons rendered at the leading edge (e.g. SCENARIOS, TWEAKS).
  leading?: React.ReactNode;
}

function Btn({
  active,
  variant,
  onClick,
  children,
}: {
  active?: boolean;
  variant?: "default" | "danger" | "warn";
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const base = {
    padding: "5px 12px",
    fontSize: "9px",
    letterSpacing: "0.1em",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    fontFamily: "var(--font-mono)",
    background: active ? COLORS.greenBg : COLORS.card,
    border: `1px solid ${
      variant === "danger" ? COLORS.redBd : variant === "warn" ? COLORS.amberBd : active ? COLORS.green : COLORS.bdMid
    }`,
    color:
      variant === "danger"
        ? COLORS.red
        : variant === "warn"
          ? COLORS.amber
          : active
            ? COLORS.green
            : COLORS.txtMid,
    cursor: "pointer",
    transition: "all 0.12s",
  };
  return (
    <button onClick={onClick} style={base}>
      {children}
    </button>
  );
}

export function CommandBar({
  mode,
  modes,
  onModeChange,
  radarOn,
  onToggleRadar,
  recording,
  recordTimeSec,
  onToggleRecording,
  hasReplayBuffer,
  onOpenReplay,
  gnssDenied,
  onToggleGnssDeny,
  swarmMoving,
  swarmSpd,
  onToggleMoving,
  nightMode,
  onToggleNight,
  on360,
  onRTHAll,
  leading,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 10px",
        borderTop: `1px solid ${COLORS.bdDim}`,
        background: "#040a07",
        flexShrink: 0,
        flexWrap: "wrap",
      }}
    >
      {leading}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          color: COLORS.txtLo,
          letterSpacing: "0.12em",
          marginRight: "4px",
          marginLeft: leading ? "8px" : 0,
        }}
      >
        MODE:
      </span>
      {modes.map((m) => (
        <Btn key={m} active={mode === m} onClick={() => onModeChange(m)}>
          {m}
        </Btn>
      ))}
      <div style={{ flex: 1 }} />

      <button
        onClick={onToggleRecording}
        style={{
          padding: "5px 12px",
          fontSize: "9px",
          letterSpacing: "0.1em",
          fontWeight: 700,
          textTransform: "uppercase",
          fontFamily: "var(--font-mono)",
          background: recording ? COLORS.redBg : COLORS.card,
          border: `1px solid ${recording ? COLORS.red : COLORS.bdMid}`,
          color: recording ? COLORS.red : COLORS.txtMid,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "5px",
        }}
      >
        {recording && (
          <span
            className="animate-rec-blink"
            style={{
              display: "inline-block",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: COLORS.red,
            }}
          />
        )}
        {recording
          ? `REC ${String(Math.floor(recordTimeSec / 60)).padStart(2, "0")}:${String(recordTimeSec % 60).padStart(2, "0")}`
          : "● RECORD"}
      </button>

      {hasReplayBuffer && !recording && (
        <Btn variant="default" onClick={onOpenReplay}>
          ▶ REPLAY
        </Btn>
      )}

      <Btn variant={gnssDenied ? "danger" : "default"} active={gnssDenied} onClick={onToggleGnssDeny}>
        {gnssDenied ? "⚠ GNSS DENIED" : "GNSS DENY"}
      </Btn>

      <Btn active={swarmMoving} onClick={onToggleMoving}>
        {swarmMoving ? `▶ MOVING ${swarmSpd}m/s` : "◼ STATIC"}
      </Btn>

      <Btn active={nightMode} variant={nightMode ? "warn" : "default"} onClick={onToggleNight}>
        {nightMode ? "☾ NIGHT" : "☀ DAY"}
      </Btn>

      <Btn active={radarOn} variant={radarOn ? "default" : "warn"} onClick={onToggleRadar}>
        {radarOn ? "● RADAR ON" : "○ RADAR OFF"}
      </Btn>

      <Btn variant="warn" onClick={on360}>
        360° COV
      </Btn>

      <Btn variant="danger" onClick={onRTHAll}>
        ⚠ RTH ALL
      </Btn>
    </div>
  );
}
