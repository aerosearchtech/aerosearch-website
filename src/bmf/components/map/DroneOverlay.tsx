'use client';

import { DroneIcon } from '@/bmf/components/icons/ForceIcons';
import { toPx, type Projection } from '@/bmf/lib/canvas/map';
import { FONT_MONO } from '@/bmf/lib/theme';
import type { DroneRow } from '@/bmf/lib/derive';

/**
 * Neutralisation flight: each drone flies from the lane entry to its assigned
 * device and places a demolition charge on it.
 */
export default function DroneOverlay({ drones, pr }: { drones: DroneRow[]; pr: Projection }) {
  return (
    <>
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 5, pointerEvents: 'none' }}
      >
        {drones
          .filter((d) => d.state === 'transit' || d.state === 'placing')
          .map((d) => {
            const a = toPx(pr, d.from);
            const b = toPx(pr, d.at);
            return (
              <line
                key={d.id}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={d.color}
                strokeWidth={1}
                strokeDasharray="5 5"
                opacity={0.55}
              />
            );
          })}
      </svg>

      {drones.map((d, i) => {
        const px = toPx(pr, d.at);
        // staged and completed flights all sit on the staging point — stack them
        // so three drones do not draw on top of each other
        const stackY = d.state === 'transit' || d.state === 'placing' ? 0 : i * 26;
        return (
          <div
            key={d.id}
            style={{
              position: 'absolute',
              left: px.x,
              top: px.y + stackY,
              transform: 'translate(-50%,-140%)',
              zIndex: 7,
              pointerEvents: 'none',
            }}
          >
            {d.state === 'placing' && (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: 26,
                  height: 26,
                  marginLeft: -13,
                  marginTop: -13,
                  borderRadius: '50%',
                  background: d.color,
                  opacity: 0.35,
                  animation: 'clmPulse 2s ease-out infinite',
                }}
              />
            )}
            <div style={{ position: 'relative', filter: `drop-shadow(0 0 5px ${d.color})` }}>
              <DroneIcon size={20} color={d.color} />
            </div>
            <div
              style={{
                position: 'absolute',
                left: 24,
                top: 0,
                whiteSpace: 'nowrap',
                fontFamily: FONT_MONO,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 0.5,
                color: d.color,
                textShadow: '0 0 6px var(--bg0)',
              }}
            >
              {d.callsign}
              <div style={{ fontWeight: 500, color: 'var(--tx3)' }}>
                {d.stateLabel} · {d.charges} CHG
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
