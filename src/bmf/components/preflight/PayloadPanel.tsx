'use client';

import { MAX_AIRFRAMES } from '@/bmf/lib/constants';
import { FONT_MONO } from '@/bmf/lib/theme';
import { useGcs } from '@/bmf/lib/store';
import type { PayloadRow, PreflightView } from '@/bmf/lib/derive';
import { col, colHdr } from './chrome';

const step: React.CSSProperties = {
  width: 19,
  height: 22,
  padding: 0,
  fontFamily: FONT_MONO,
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1,
  cursor: 'pointer',
  color: 'var(--tx2)',
  background: 'transparent',
  border: '1px solid var(--bd2)',
};

/**
 * How many airframes carry this payload. More airframes split the AO into that
 * many depth bands, so the channel closes proportionally sooner — this is the
 * only control on the screen that buys time rather than trading it.
 */
function Airframes({ c }: { c: PayloadRow }) {
  const setPayloadCount = useGcs((s) => s.setPayloadCount);

  // A riding sensor has no airframe of its own; it is carried by its host.
  if (c.rides) {
    return (
      <span
        style={{
          flex: 'none',
          minWidth: 74,
          textAlign: 'right',
          fontFamily: FONT_MONO,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 1,
          color: 'var(--tx3)',
        }}
      >
        {c.rides}
      </span>
    );
  }

  const nudge = (d: number) => () => setPayloadCount(c.id, c.count + d);
  return (
    <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 4, minWidth: 74, justifyContent: 'flex-end' }}>
      <button onClick={nudge(-1)} disabled={c.count <= 1} style={{ ...step, opacity: c.count <= 1 ? 0.35 : 1 }}>
        −
      </button>
      <span
        style={{
          width: 16,
          textAlign: 'center',
          fontFamily: FONT_MONO,
          fontSize: 13,
          fontWeight: 700,
          color: c.count > 1 ? 'var(--am)' : 'var(--tx)',
        }}
      >
        {c.count}
      </span>
      <button
        onClick={nudge(1)}
        disabled={c.count >= MAX_AIRFRAMES}
        style={{ ...step, opacity: c.count >= MAX_AIRFRAMES ? 0.35 : 1 }}
      >
        +
      </button>
    </div>
  );
}

/**
 * The payload stack carried into the AO. Height and speed differ by an order of
 * magnitude across the stack — that spread is what forces the tiered sortie,
 * and it is why the tempo column reads the way it does.
 */
export default function PayloadPanel({ pf }: { pf: PreflightView }) {
  return (
    <div style={col}>
      <div style={colHdr}>PAYLOAD STACK · {pf.airframes} AIRFRAMES</div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {pf.channels.map((c) => (
          <div
            key={c.id}
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--bd)',
              borderLeft: `3px solid ${c.color}`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                background: c.color,
                boxShadow: `0 0 6px ${c.color}`,
                flex: 'none',
              }}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700 }}>{c.id}</div>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--tx3)',
                  marginTop: 2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {c.name}
              </div>
            </div>

            <div style={{ textAlign: 'right', fontFamily: FONT_MONO, fontSize: 10, flex: 'none' }}>
              <div style={{ color: 'var(--tx2)' }}>{c.agl} AGL</div>
              <div style={{ color: 'var(--tx3)', marginTop: 2 }}>
                {c.speed} · {c.pack} PACK
              </div>
            </div>

            <Airframes c={c} />
          </div>
        ))}
      </div>

      <div
        style={{
          padding: '11px 14px',
          borderTop: '1px solid var(--bd)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: FONT_MONO,
          fontSize: 10,
          letterSpacing: 1,
        }}
      >
        <span style={{ color: 'var(--tx3)' }}>AIRFRAMES COMMITTED</span>
        <span style={{ color: 'var(--gn)', fontWeight: 700 }}>
          {pf.airframes} ON {pf.channels.filter((c) => !c.rides).length} CHANNELS
        </span>
      </div>
    </div>
  );
}
