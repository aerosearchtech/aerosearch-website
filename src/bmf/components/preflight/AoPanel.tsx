'use client';

import { AOI_DEPTH_M, AOI_WIDTH_M, CORRIDOR_WIDTHS_M } from '@/bmf/lib/constants';
import { FONT_MONO } from '@/bmf/lib/theme';
import { useGcs } from '@/bmf/lib/store';
import type { Point } from '@/bmf/lib/types';
import type { PreflightView } from '@/bmf/lib/derive';
import { col, colHdr, kv, kvLabel } from './chrome';

const HANDLE = 7;

const clamp = (v: number, hi: number): number => Math.max(0, Math.min(hi, v));

/** Corner handle on the AO boundary. Boundary is committed, so it is inert. */
function Vertex({ at }: { at: React.CSSProperties }) {
  return (
    <span
      style={{
        position: 'absolute',
        width: HANDLE,
        height: HANDLE,
        background: 'var(--bg0)',
        border: '1px solid var(--am)',
        ...at,
      }}
    />
  );
}

/** Where the column enters or leaves the AO. Placed by clicking the plot. */
function Endpoint({ at, label, color }: { at: Point; label: string; color: string }) {
  return (
    <span
      style={{
        position: 'absolute',
        left: `${(at.x / AOI_WIDTH_M) * 100}%`,
        top: `${(at.y / AOI_DEPTH_M) * 100}%`,
        transform: 'translate(-50%,-50%)',
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          display: 'block',
          width: 9,
          height: 9,
          borderRadius: '50%',
          background: color,
          border: '2px solid var(--bg0)',
          boxShadow: `0 0 8px ${color}`,
        }}
      />
      {/* Label flips inboard past the midline so an endpoint on the far edge
          does not run its caption off the plot. */}
      <span
        style={{
          position: 'absolute',
          [at.x > AOI_WIDTH_M / 2 ? 'right' : 'left']: 11,
          top: -3,
          fontFamily: FONT_MONO,
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: 1,
          color,
          textShadow: '0 0 5px var(--bg0)',
        }}
      >
        {label}
      </span>
    </span>
  );
}

/**
 * The committed area of operations and the lane the column needs through it.
 *
 * Lane width and the two endpoints are live — all three drive the router, so
 * moving any of them re-plans. The axis is set here rather than only on the
 * tactical plot because it is a planning decision: where the column goes in and
 * where it comes out are given before anything flies.
 */
export default function AoPanel({ pf }: { pf: PreflightView }) {
  const setCorridorWidth = useGcs((s) => s.setCorridorWidth);
  const setStart = useGcs((s) => s.setStart);
  const setGoal = useGcs((s) => s.setGoal);
  const start = useGcs((s) => s.start);
  const goal = useGcs((s) => s.goal);

  const place = (e: React.MouseEvent<HTMLDivElement>): void => {
    const b = e.currentTarget.getBoundingClientRect();
    const at = {
      x: clamp(((e.clientX - b.left) / b.width) * AOI_WIDTH_M, AOI_WIDTH_M),
      y: clamp(((e.clientY - b.top) / b.height) * AOI_DEPTH_M, AOI_DEPTH_M),
    };
    if (e.shiftKey) setGoal(at);
    else setStart(at);
  };

  return (
    <div style={col}>
      <div style={colHdr}>AO &amp; LANE REQUIREMENT</div>

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {/* The ground itself, so the boundary is read against terrain rather
            than against an empty box. Same basemap the tactical plot uses. */}
        <div
          onClick={place}
          style={{
            position: 'relative',
            aspectRatio: `${pf.axisM} / 340`,
            maxHeight: 132,
            alignSelf: 'center',
            width: '100%',
            border: '1px dashed var(--am)',
            background: 'var(--bg2) url(/landscape.png) center / cover',
            cursor: 'crosshair',
          }}
        >
          {/* Sunk back so the boundary, axis and handles stay legible over it. */}
          <span style={{ position: 'absolute', inset: 0, background: 'var(--mapWash)' }} />

          <Vertex at={{ left: -HANDLE / 2, top: -HANDLE / 2 }} />
          <Vertex at={{ right: -HANDLE / 2, top: -HANDLE / 2 }} />
          <Vertex at={{ left: -HANDLE / 2, bottom: -HANDLE / 2 }} />
          <Vertex at={{ right: -HANDLE / 2, bottom: -HANDLE / 2 }} />

          {/* Axis of advance: straight entry to exit, the line the router is
              asked to approximate once the hazard field is in the way. */}
          <svg
            viewBox={`0 0 ${AOI_WIDTH_M} ${AOI_DEPTH_M}`}
            preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          >
            <line
              x1={start.x}
              y1={start.y}
              x2={goal.x}
              y2={goal.y}
              stroke="var(--tl)"
              strokeWidth={2}
              strokeDasharray="7 6"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <Endpoint at={start} label="ENTRY" color="var(--gn)" />
          <Endpoint at={goal} label="EXIT" color="var(--am)" />
        </div>

        <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 1, color: 'var(--tx3)' }}>
          CLICK = ENTRY · SHIFT+CLICK = EXIT
        </div>

        <div style={kv}>
          <span style={kvLabel}>AREA OF OPERATIONS</span>
          <span style={{ color: 'var(--tx)', fontWeight: 700 }}>{pf.areaHa} ha</span>
        </div>
        <div style={kv}>
          <span style={kvLabel}>BOUNDARY</span>
          <span style={{ color: 'var(--tx2)' }}>{pf.vertices} vertices · committed</span>
        </div>
        <div style={kv}>
          <span style={kvLabel}>FRONTAGE</span>
          <span style={{ color: 'var(--tx2)' }}>{pf.axisM} m</span>
        </div>
      </div>

      <div style={{ ...colHdr, borderTop: '1px solid var(--bd)' }}>COLUMN FOOTPRINT</div>

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {CORRIDOR_WIDTHS_M.map((w) => {
            const on = w === pf.widthM;
            return (
              <button
                key={w}
                onClick={() => setCorridorWidth(w)}
                style={{
                  flex: 1,
                  padding: '7px 0',
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: on ? 'var(--am)' : 'var(--tx2)',
                  background: on ? 'var(--amWash)' : 'transparent',
                  border: `1px solid ${on ? 'var(--am)' : 'var(--bd2)'}`,
                }}
              >
                {w}.0 m
              </button>
            );
          })}
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{pf.columnLabel}</div>
          <div style={{ fontSize: 10, color: 'var(--tx3)', fontFamily: FONT_MONO, marginTop: 3 }}>
            {pf.columnPlatform}
          </div>
        </div>

        {/* The reason lane width is a decision and not a cosmetic setting. */}
        <div style={{ border: '1px solid var(--bd2)', padding: '9px 11px', background: 'var(--bg2)' }}>
          <div style={kv}>
            <span style={kvLabel}>BLOCKING INTERVAL</span>
            <span style={{ color: 'var(--am)', fontWeight: 700 }}>{pf.blockingM} m</span>
          </div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--tx3)',
              marginTop: 6,
              lineHeight: 1.5,
              fontFamily: FONT_MONO,
            }}
          >
            A belt laid at or below this row pitch leaves no gap a {pf.widthM} m lane can thread.
            Doctrinal spacing is tighter still, so expect to neutralise on every axis.
          </div>
        </div>
      </div>
    </div>
  );
}
