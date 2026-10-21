'use client';

import { DroneIcon } from '@/bmf/components/icons/ForceIcons';
import { BATTERY_LOW_PCT, BATTERY_WARN_PCT, DRONE_CALLSIGN, GPS_FIX_LABEL, GPS_GOOD_FIX, LINK_STALE_S } from '@/bmf/lib/live/constants';
import type { BridgeState } from '@/bmf/lib/live/types';
import { FONT_MONO } from '@/bmf/lib/theme';
import { num } from './chrome';

interface Props {
  state: BridgeState | null;
  offline: boolean;
  feedOpen: boolean;
  onDroneClick: () => void;
}

export const clock = (s: number): string => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function linkBadge(state: BridgeState | null, offline: boolean): { text: string; color: string } {
  if (offline || !state) return { text: 'NO BRIDGE', color: 'var(--rd)' };
  const { link } = state;
  if (link.replay) return { text: link.ended ? 'REPLAY ENDED' : 'REPLAY', color: 'var(--bl)' };
  if (!link.connected || link.ageS === null) return { text: 'NO LINK', color: 'var(--rd)' };
  return link.ageS > LINK_STALE_S ? { text: `STALE ${link.ageS.toFixed(0)} s`, color: 'var(--am)' } : { text: 'LIVE', color: 'var(--gn)' };
}

export function batteryColor(pct: number | null | undefined): string {
  return pct == null ? 'var(--tx)' : pct < BATTERY_LOW_PCT ? 'var(--rd)' : pct < BATTERY_WARN_PCT ? 'var(--am)' : 'var(--gn)';
}

function Stat({ label, value, color = 'var(--tx)' }: { label: string; value: string; color?: string }) {
  return (
    <span style={{ whiteSpace: 'nowrap' }}>
      <span style={{ color: 'var(--tx3)', fontSize: 9, letterSpacing: 1 }}>{label} </span>
      <span style={{ color, fontWeight: 600 }}>{value}</span>
    </span>
  );
}

/** One-glance telemetry of the real drone across the top of the map. */
export default function TelemetryStrip({ state, offline, feedOpen, onDroneClick }: Props) {
  const v = state?.vehicle;
  const badge = linkBadge(state, offline);
  const batt = v?.batteryPct;
  const battColor = batteryColor(batt);
  const gps = v?.gpsFix !== undefined ? `${GPS_FIX_LABEL[v.gpsFix] ?? v.gpsFix} · ${num(v.sats, 0)} sat · ${num(v.hdop, 2)}` : '—';

  return (
    <div style={{ flex: 'none', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 16px', padding: '6px 13px', borderBottom: '1px solid var(--bd)', background: 'var(--bg1)', fontFamily: FONT_MONO, fontSize: 11 }}>
      <span style={{ color: badge.color, fontSize: 10, fontWeight: 700 }} title={state?.link.source}>● {badge.text}</span>
      <span
        onClick={onDroneClick}
        title="Show the live camera feed"
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '1px 6px', cursor: 'pointer', border: '1px solid var(--tl)', background: feedOpen ? 'var(--amWash)' : undefined }}
      >
        <DroneIcon size={14} color="var(--am)" />
        <span style={{ fontWeight: 700 }}>{DRONE_CALLSIGN} · C12</span>
        <span style={{ color: 'var(--tl)', fontSize: 9, fontWeight: 700 }}>▶ FEED</span>
      </span>
      <span style={{ fontWeight: 700 }}>{v?.mode ?? '—'}</span>
      <span style={{ color: v?.armed ? 'var(--rd)' : 'var(--tx3)', fontWeight: 700 }}>{v?.armed ? 'ARMED' : 'DISARMED'}</span>
      {v?.flightS != null && <Stat label="T+" value={clock(v.flightS)} />}
      <Stat label="ALT" value={num(v?.altRel, 1, ' m')} color="var(--am)" />
      <Stat label="GS" value={num(v?.groundSpeed, 1, ' m/s')} />
      <Stat label="VS" value={num(v?.climb, 1, ' m/s')} />
      <Stat label="HDG" value={num(v?.heading, 0, '°')} />
      <Stat label="BATT" value={`${num(v?.batteryV, 1, ' V')} ${num(batt, 0, '%')}`} color={battColor} />
      <Stat label="GPS" value={gps} color={v?.gpsFix !== undefined && v.gpsFix >= GPS_GOOD_FIX ? 'var(--gn)' : 'var(--am)'} />
      <Stat label="WP" value={v?.wpSeq !== undefined ? `${v.wpSeq}/${state?.mission ? state.mission.items - 1 : '—'}` : '—'} />
      <Stat label="HOME" value={num(v?.homeDistM, 0, ' m')} />
      <Stat label="POS" value={v?.lat !== undefined && v.lon !== undefined ? `${v.lat.toFixed(6)}, ${v.lon.toFixed(6)}` : '—'} />
    </div>
  );
}
