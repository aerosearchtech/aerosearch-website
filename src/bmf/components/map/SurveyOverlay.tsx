'use client';

import { DroneIcon } from '@/bmf/components/icons/ForceIcons';
import { toPx, type Projection } from '@/bmf/lib/canvas/map';
import { FONT_MONO } from '@/bmf/lib/theme';
import type { SurveyDroneRow } from '@/bmf/lib/derive';

/** Widest the callsign block gets, used to decide which side it sits on. */
const LABEL_W = 120;

/** Width of the pack-charge bar under the callsign. */
const CHARGE_W = 30;

/**
 * The survey swarm mid-run. One airframe per band per rastering channel, flying
 * the boustrophedon the operator programmed; GPR instead hops the anomaly list
 * the earlier waves handed it. The bar under each callsign is the usable pack:
 * when it runs out the airframe breaks track for the swap station on its own.
 */
export default function SurveyOverlay({
  drones,
  pr,
  mapW,
}: {
  drones: SurveyDroneRow[];
  pr: Projection;
  mapW: number;
}) {
  return (
    <>
      {drones.map((d) => {
        const px = toPx(pr, d.at);
        // On the eastward legs the callsign would run off the plot, so it flips
        // to the inboard side of the airframe.
        const flip = px.x > mapW - LABEL_W;
        return (
          <div
            key={d.id}
            style={{
              position: 'absolute',
              left: px.x,
              top: px.y,
              transform: 'translate(-50%,-50%)',
              zIndex: 7,
              pointerEvents: 'none',
            }}
          >
            <div style={{ filter: `drop-shadow(0 0 6px ${d.color})` }}>
              <DroneIcon size={18} color={d.color} />
            </div>
            <div
              style={{
                position: 'absolute',
                ...(flip ? { right: 22, textAlign: 'right' as const } : { left: 22 }),
                top: -2,
                whiteSpace: 'nowrap',
                fontFamily: FONT_MONO,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 0.5,
                color: d.color,
                textShadow: '0 0 6px var(--bg0)',
              }}
            >
              <div>
                {d.callsign} · {d.mode}
              </div>
              {/* Inline-block so it follows the label's alignment when flipped. */}
              <div
                style={{
                  display: 'inline-block',
                  width: CHARGE_W,
                  height: 2,
                  marginTop: 2,
                  background: 'var(--bd2)',
                }}
              >
                <div
                  style={{
                    width: `${Math.round(d.charge * 100)}%`,
                    height: '100%',
                    background: d.chargeColor,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
