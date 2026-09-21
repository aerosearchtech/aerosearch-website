'use client';

import { FONT_MONO } from '@/bmf/lib/theme';
import type { PreflightView } from '@/bmf/lib/derive';
import { col, colHdr } from './chrome';

const row: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 9,
  padding: '11px 14px',
  borderBottom: '1px solid var(--bd)',
  fontFamily: FONT_MONO,
  fontSize: 11,
};

/**
 * What surveying this AO costs with the payloads currently committed, channel
 * by channel, from the same flight-line model that flies the run.
 *
 * Channels overlap in the air, so the survey costs its slowest one rather than
 * their sum. That is the panel's whole argument: the critical channel is the
 * only place a further airframe buys time, and cueing GPR off the rastering
 * pass is what keeps it off the critical path at all.
 */
export default function TempoPanel({ pf }: { pf: PreflightView }) {
  return (
    <div style={col}>
      <div style={colHdr}>PROJECTED SURVEY TEMPO · {pf.areaHa} ha</div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {pf.tempo.map((t) => (
          <div key={t.id} style={row}>
            <span style={{ width: 7, height: 7, background: t.color, flex: 'none' }} />
            <span style={{ width: 46, fontWeight: 700, color: 'var(--tx)' }}>{t.id}</span>
            <span style={{ width: 52, color: 'var(--tx2)' }}>
              {t.count} UAS
            </span>
            <span
              style={{
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: 9,
                letterSpacing: 0.5,
                color: 'var(--tx3)',
              }}
            >
              {t.note}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: t.critical ? 'var(--am)' : 'var(--tx2)',
              }}
            >
              {t.hours}
            </span>
          </div>
        ))}
      </div>

      <div style={{ padding: '13px 14px', borderTop: '1px solid var(--bd)', background: 'var(--bg2)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Survey complete</span>
          <span
            style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 700, color: 'var(--gn)' }}
          >
            {pf.tempoTotal}
          </span>
        </div>
        <div
          style={{
            fontSize: 10,
            color: 'var(--tx3)',
            marginTop: 7,
            lineHeight: 1.5,
            fontFamily: FONT_MONO,
          }}
        >
          {pf.tempoDays} d · channels fly concurrently, so the survey costs its slowest.{' '}
          {pf.criticalId} is critical — another airframe on it is the only one that buys time.
        </div>
      </div>
    </div>
  );
}
