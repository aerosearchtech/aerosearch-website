"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { COLORS, DRONE_COLORS } from "@/drishti/theme/colors";
import { RADAR } from "@/drishti/theme/constants";
import { useStore } from "@/drishti/state/store";
import { MissionLibrary } from "./MissionLibrary";
import type { MissionPreset } from "@/drishti/data/missionPresets";

interface Waypoint {
  id: string;
  x: number; // metres East from origin
  y: number; // metres North from origin
  label: string;
  droneIds: number[];
}

interface MissionDoc {
  name: string;
  formation: string;
  waypoints: Waypoint[];
  sectorByDrone: Record<number, string>;
}

const SECTORS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "360°"] as const;
const GRID_KM = 5;
const SIZE_PX = 480;
const KM_TO_PX = SIZE_PX / (GRID_KM * 2);

const STORAGE_KEY = "drishti.mission.v1";

const DEFAULT_DOC: MissionDoc = {
  name: "OP MEHAR — Default",
  formation: "WEDGE",
  waypoints: [
    { id: "WP-1", x: 0, y: 0, label: "Launch", droneIds: [1, 2, 3, 4, 5] },
  ],
  sectorByDrone: { 1: "N", 2: "NW", 3: "NE", 4: "SW", 5: "SE" },
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function MissionPlanner() {
  const [doc, setDoc] = useState<MissionDoc>(DEFAULT_DOC);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const uavs = useStore((s) => s.uavs);

  const loadPreset = (p: MissionPreset) => {
    setDoc({
      name: p.name,
      formation: p.formation,
      waypoints: p.waypoints.map((w) => ({ ...w, droneIds: [] })),
      sectorByDrone: p.sectorByDrone,
    });
  };

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setDoc(JSON.parse(raw));
    } catch {
      /* malformed — keep default */
    }
  }, []);

  // Auto-save
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
  }, [doc]);

  const addWaypoint = (worldX: number, worldY: number) => {
    const nextN = doc.waypoints.length + 1;
    const id = `WP-${nextN}`;
    setDoc({
      ...doc,
      waypoints: [...doc.waypoints, { id, x: worldX, y: worldY, label: `Waypoint ${nextN}`, droneIds: [] }],
    });
  };

  const removeWaypoint = (id: string) => {
    setDoc({ ...doc, waypoints: doc.waypoints.filter((w) => w.id !== id) });
  };

  // Convert SVG (px) to world metres
  const pxToWorld = (px: number, py: number): { x: number; y: number } => {
    const x = (px - SIZE_PX / 2) / KM_TO_PX * 1000;
    const y = -(py - SIZE_PX / 2) / KM_TO_PX * 1000;
    return { x, y };
  };
  const worldToPx = (wx: number, wy: number): { px: number; py: number } => {
    return { px: SIZE_PX / 2 + (wx / 1000) * KM_TO_PX, py: SIZE_PX / 2 - (wy / 1000) * KM_TO_PX };
  };

  const onSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingId) return;
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const loc = pt.matrixTransform(ctm.inverse());
    const { x, y } = pxToWorld(loc.x, loc.y);
    if (Math.abs(x) > GRID_KM * 1000 || Math.abs(y) > GRID_KM * 1000) return;
    addWaypoint(x, y);
  };

  const onDrag = (id: string, e: React.MouseEvent<SVGGElement>) => {
    setDraggingId(id);
    const start = { x: e.clientX, y: e.clientY };
    const wpStart = doc.waypoints.find((w) => w.id === id);
    if (!wpStart) return;
    const wpInit = { x: wpStart.x, y: wpStart.y };
    const move = (ev: MouseEvent) => {
      const dx = (ev.clientX - start.x) / KM_TO_PX * 1000;
      const dy = -(ev.clientY - start.y) / KM_TO_PX * 1000;
      const nx = clamp(wpInit.x + dx, -GRID_KM * 1000, GRID_KM * 1000);
      const ny = clamp(wpInit.y + dy, -GRID_KM * 1000, GRID_KM * 1000);
      setDoc((d) => ({
        ...d,
        waypoints: d.waypoints.map((w) => (w.id === id ? { ...w, x: nx, y: ny } : w)),
      }));
    };
    const up = () => {
      setDraggingId(null);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.name.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uploadJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as MissionDoc;
        if (Array.isArray(parsed.waypoints)) setDoc(parsed);
      } catch {
        /* ignore */
      }
    };
    reader.readAsText(file);
  };

  const gridLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; emph: boolean }[] = [];
    for (let i = -GRID_KM; i <= GRID_KM; i++) {
      const t = SIZE_PX / 2 + i * KM_TO_PX;
      lines.push({ x1: t, y1: 0, x2: t, y2: SIZE_PX, emph: i === 0 });
      lines.push({ x1: 0, y1: t, x2: SIZE_PX, y2: t, emph: i === 0 });
    }
    return lines;
  }, []);

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        overflow: "auto",
        background: COLORS.bg,
        color: COLORS.txtHi,
        padding: "16px 20px",
        fontFamily: "var(--font-mono)",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: `${SIZE_PX}px 1fr`, gap: "20px", alignItems: "start" }}>
        {/* Map */}
        <div>
          <svg
            ref={svgRef}
            width={SIZE_PX}
            height={SIZE_PX}
            onClick={onSvgClick}
            style={{ background: COLORS.panel, border: `1px solid ${COLORS.bdMid}`, display: "block", cursor: "crosshair" }}
          >
            {gridLines.map((l, i) => (
              <line
                key={i}
                x1={l.x1}
                y1={l.y1}
                x2={l.x2}
                y2={l.y2}
                stroke={l.emph ? COLORS.bdHi : COLORS.bdDim}
                strokeWidth={l.emph ? 1 : 0.5}
              />
            ))}
            {/* Range rings */}
            {[1, 2, 3, 4, 5].map((km) => (
              <circle
                key={km}
                cx={SIZE_PX / 2}
                cy={SIZE_PX / 2}
                r={km * KM_TO_PX}
                fill="none"
                stroke={COLORS.greenDim}
                strokeWidth={km === 5 ? 1 : 0.5}
                opacity={0.5}
              />
            ))}
            {/* Centre marker */}
            <g transform={`translate(${SIZE_PX / 2}, ${SIZE_PX / 2})`}>
              <circle r={6} fill="none" stroke={COLORS.green} strokeWidth={1} />
              <circle r={2} fill={COLORS.green} />
              <text x={9} y={4} fill={COLORS.txtLo} fontSize={9}>
                BASE
              </text>
            </g>

            {/* Live drones + FoV sector wedges (locked to swarm-centre frame) */}
            {uavs.map((u, i) => {
              if (u.status === "FAULT" || u.status === "RECOVERING") return null;
              const { px, py } = worldToPx(u.pos.x, u.pos.y);
              const dc = DRONE_COLORS[i] ?? COLORS.green;
              const outAz = Math.atan2(u.pos.x, u.pos.y); // 0 = +North
              const halfFovRad = (RADAR.fovDeg * Math.PI) / 180 / 2;
              // FoV wedge from drone position out to radar max range
              const range = RADAR.maxRangeKm * 1000;
              const tip1x = u.pos.x + range * Math.sin(outAz - halfFovRad);
              const tip1y = u.pos.y + range * Math.cos(outAz - halfFovRad);
              const tip2x = u.pos.x + range * Math.sin(outAz + halfFovRad);
              const tip2y = u.pos.y + range * Math.cos(outAz + halfFovRad);
              const p0 = worldToPx(u.pos.x, u.pos.y);
              const p1 = worldToPx(tip1x, tip1y);
              const p2 = worldToPx(tip2x, tip2y);
              const fovOn = u.radarOn && u.status === "ACTIVE";
              return (
                <g key={u.id}>
                  {fovOn && (
                    <path
                      d={`M${p0.px.toFixed(1)} ${p0.py.toFixed(1)} L${p1.px.toFixed(1)} ${p1.py.toFixed(1)} A ${(range * KM_TO_PX) / 1000} ${(range * KM_TO_PX) / 1000} 0 0 1 ${p2.px.toFixed(1)} ${p2.py.toFixed(1)} Z`}
                      fill={`${dc}10`}
                      stroke={`${dc}40`}
                      strokeWidth={0.6}
                    />
                  )}
                  {/* Drone marker */}
                  <g transform={`translate(${px.toFixed(1)}, ${py.toFixed(1)}) rotate(${((outAz * 180) / Math.PI).toFixed(0)})`}>
                    <polygon
                      points="0,-5 -3.5,3 3.5,3"
                      fill={`${dc}55`}
                      stroke={dc}
                      strokeWidth={1}
                    />
                  </g>
                  <text x={px + 6} y={py - 4} fill={dc} fontSize={8} fontWeight={700}>
                    K{i + 1}
                  </text>
                </g>
              );
            })}

            {/* Waypoints */}
            {doc.waypoints.map((w) => {
              const { px, py } = worldToPx(w.x, w.y);
              const isDragging = draggingId === w.id;
              return (
                <g
                  key={w.id}
                  transform={`translate(${px}, ${py})`}
                  style={{ cursor: "grab" }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onDrag(w.id, e);
                  }}
                >
                  <circle r={isDragging ? 8 : 6} fill={COLORS.amber} fillOpacity={0.3} stroke={COLORS.amber} strokeWidth={1.5} />
                  <text x={10} y={4} fill={COLORS.amber} fontSize={10} fontWeight={700}>
                    {w.id}
                  </text>
                  <text x={10} y={16} fill={COLORS.txtLo} fontSize={8}>
                    ({Math.round(w.x)}, {Math.round(w.y)})
                  </text>
                </g>
              );
            })}

            {/* Compass */}
            {(["N", "E", "S", "W"] as const).map((c, i) => {
              const r = SIZE_PX / 2 - 12;
              const angle = (i * Math.PI) / 2 - Math.PI / 2;
              const x = SIZE_PX / 2 + r * Math.cos(angle);
              const y = SIZE_PX / 2 + r * Math.sin(angle);
              return (
                <text key={c} x={x} y={y + 3} fill={COLORS.green} fontSize={11} fontWeight={700} textAnchor="middle">
                  {c}
                </text>
              );
            })}
          </svg>
          <div style={{ marginTop: "8px", fontSize: "9px", color: COLORS.txtLo, letterSpacing: "0.1em" }}>
            ◇ Click to add waypoint · drag to move · 1 cell = 1 km
          </div>
        </div>

        {/* Right column: mission meta + waypoints + sectors + I/O */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Library */}
          <div>
            <MissionLibrary onLoad={loadPreset} />
          </div>
          {/* Meta */}
          <Section title="Mission">
            <Field
              label="NAME"
              value={doc.name}
              onChange={(v) => setDoc({ ...doc, name: v })}
            />
            <div style={{ marginTop: "4px", display: "flex", gap: "6px", alignItems: "center" }}>
              <span style={{ fontSize: "8px", color: COLORS.txtLo, letterSpacing: "0.12em", width: "70px" }}>
                FORMATION
              </span>
              <select
                value={doc.formation}
                onChange={(e) => setDoc({ ...doc, formation: e.target.value })}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  padding: "3px 6px",
                  background: COLORS.bg,
                  color: COLORS.txtHi,
                  border: `1px solid ${COLORS.bdMid}`,
                }}
              >
                {["WEDGE", "LINE-ABREAST", "CIRCULAR", "DIAMOND"].map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </Section>

          {/* Waypoints list */}
          <Section title={`Waypoints (${doc.waypoints.length})`}>
            {doc.waypoints.length === 0 ? (
              <div style={{ fontSize: "10px", color: COLORS.txtLo, padding: "8px 0" }}>None — click map to add.</div>
            ) : (
              doc.waypoints.map((w) => (
                <div
                  key={w.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "50px 1fr auto",
                    gap: "6px",
                    alignItems: "center",
                    padding: "3px 0",
                    borderBottom: `1px solid ${COLORS.bdDim}`,
                  }}
                >
                  <span style={{ fontSize: "10px", color: COLORS.amber, fontWeight: 600 }}>{w.id}</span>
                  <span style={{ fontSize: "9px", color: COLORS.txtMid }}>
                    ({Math.round(w.x)}, {Math.round(w.y)})m
                  </span>
                  <button
                    onClick={() => removeWaypoint(w.id)}
                    style={{
                      fontSize: "8px",
                      color: COLORS.red,
                      border: `1px solid ${COLORS.redBd}`,
                      background: COLORS.redBg,
                      padding: "2px 6px",
                    }}
                  >
                    DEL
                  </button>
                </div>
              ))
            )}
          </Section>

          {/* Sector assignment */}
          <Section title="Sector Assignment">
            {[1, 2, 3, 4, 5].map((id) => {
              const sector = doc.sectorByDrone[id] ?? "N";
              const dc = DRONE_COLORS[id - 1] ?? COLORS.green;
              return (
                <div
                  key={id}
                  style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: "6px", alignItems: "center", padding: "3px 0" }}
                >
                  <span style={{ fontSize: "10px", color: dc, fontWeight: 600 }}>KESTREL-{id}</span>
                  <select
                    value={sector}
                    onChange={(e) =>
                      setDoc({
                        ...doc,
                        sectorByDrone: { ...doc.sectorByDrone, [id]: e.target.value },
                      })
                    }
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      padding: "2px 6px",
                      background: COLORS.bg,
                      color: COLORS.txtHi,
                      border: `1px solid ${COLORS.bdMid}`,
                    }}
                  >
                    {SECTORS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </Section>

          {/* I/O */}
          <Section title="Persist">
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <button
                onClick={downloadJson}
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.1em",
                  padding: "5px 10px",
                  background: COLORS.greenBg,
                  color: COLORS.green,
                  border: `1px solid ${COLORS.bdHi}`,
                }}
              >
                ↓ DOWNLOAD JSON
              </button>
              <label
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.1em",
                  padding: "5px 10px",
                  background: COLORS.card,
                  color: COLORS.txtMid,
                  border: `1px solid ${COLORS.bdMid}`,
                  cursor: "pointer",
                }}
              >
                ↑ UPLOAD JSON
                <input
                  type="file"
                  accept="application/json"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadJson(f);
                  }}
                />
              </label>
              <button
                onClick={() => setDoc(DEFAULT_DOC)}
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.1em",
                  padding: "5px 10px",
                  background: COLORS.amberBg,
                  color: COLORS.amber,
                  border: `1px solid ${COLORS.amberBd}`,
                }}
              >
                ↺ RESET
              </button>
            </div>
            <div style={{ marginTop: "6px", fontSize: "8px", color: COLORS.txtLo, letterSpacing: "0.1em" }}>
              Auto-saved to localStorage key: <code>{STORAGE_KEY}</code>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${COLORS.bdDim}`, background: COLORS.panel }}>
      <div
        style={{
          padding: "5px 12px",
          background: "#040a07",
          borderBottom: `1px solid ${COLORS.bdDim}`,
          fontFamily: "var(--font-cond)",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.18em",
          color: COLORS.txtLo,
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      <div style={{ padding: "8px 12px" }}>{children}</div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      <span style={{ fontSize: "8px", color: COLORS.txtLo, letterSpacing: "0.12em", width: "70px" }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          padding: "3px 6px",
          background: COLORS.bg,
          color: COLORS.txtHi,
          border: `1px solid ${COLORS.bdMid}`,
        }}
      />
    </div>
  );
}
