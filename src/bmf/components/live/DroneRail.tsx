'use client';

import { DroneIcon } from '@/bmf/components/icons/ForceIcons';
import { DRONE_CALLSIGN, DRONE_CHANNELS, NO_DATA } from '@/bmf/lib/live/constants';
import type { Bridge } from '@/bmf/lib/live/useBridge';
import { useGcs } from '@/bmf/lib/store';
import { FONT_MONO } from '@/bmf/lib/theme';
import { num, railBody, RAIL_W } from './chrome';
import StandbyChannels from './StandbyChannels';
import { batteryColor, linkBadge } from './TelemetryStrip';

const chip: React.CSSProperties = { fontSize: 8, fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: 1, padding: '1px 5px', color: 'var(--tl)', border: '1px solid var(--tl)' };

function Field({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span style={{ color: 'var(--tx3)' }}>{label} </span>
      {value}
    </span>
  );
}

/** Left rail in DETECT: the real drone and its camera channels; a click opens the channel's feed on the map. */
export default function DroneRail({ title, bridge }: { title: string; bridge: Bridge }) {
  const { state, offline } = bridge;
  const { feedChannel, showFeed } = useGcs();
  const v = state?.vehicle;
  const badge = linkBadge(state, offline);
  const alt = v?.altRel;
  const photos = state ? `${state.photos.length}/${state.mission?.estPhotos ?? NO_DATA}` : NO_DATA;

  return (
    <div style={{ width: RAIL_W, flex: 'none', background: 'var(--bg1)', borderRight: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ height: 34, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 13px', borderBottom: '1px solid var(--bd)', background: 'var(--bg2)' }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, color: 'var(--tx)' }}>{title}</span>
        <span style={{ fontSize: 10, fontFamily: FONT_MONO, color: 'var(--tl)' }}>1 DRONE</span>
      </div>

      <div style={railBody}>
        <div
          onClick={() => showFeed(DRONE_CHANNELS[0].tag)}
          title="Show the live camera feed"
          style={{ padding: '11px 13px', borderBottom: '1px solid var(--bd)', borderLeft: '3px solid var(--am)', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DroneIcon size={14} color="var(--am)" />
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: FONT_MONO }}>{DRONE_CALLSIGN} · C12</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, fontFamily: FONT_MONO, color: badge.color }}>● {badge.text}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 7, fontFamily: FONT_MONO, fontSize: 10, color: 'var(--tx2)' }}>
            <span style={{ fontWeight: 700, color: 'var(--tx)' }}>{v?.mode ?? NO_DATA}</span>
            <span style={{ fontWeight: 700, color: v?.armed ? 'var(--rd)' : 'var(--tx3)' }}>{v?.armed ? 'ARMED' : 'DISARMED'}</span>
            <span style={{ color: batteryColor(v?.batteryPct) }}>{num(v?.batteryPct, 0, '%')}</span>
            <span style={{ color: 'var(--am)' }}>{num(alt, 1, ' m')}</span>
          </div>
        </div>

        {DRONE_CHANNELS.map((c) => (
          <div
            key={c.tag}
            onClick={() => showFeed(c.tag)}
            title={`Show the live ${c.label} feed`}
            style={{ padding: '10px 13px 10px 24px', borderBottom: '1px solid var(--bd)', borderLeft: `3px solid ${c.color}`, background: feedChannel === c.tag ? 'var(--amWash)' : undefined, cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 7, height: 7, background: c.color, boxShadow: `0 0 6px ${c.color}` }} />
              <span style={{ fontSize: 12, fontWeight: 600, fontFamily: FONT_MONO }}>{c.label}</span>
              <span style={{ ...chip, marginLeft: 'auto' }}>▶ FEED</span>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 7, fontFamily: FONT_MONO, fontSize: 10, color: 'var(--tx2)' }}>
              <Field label="SWATH" value={state && alt != null && alt > 0 ? `${(state.swathPerM[c.kind] * alt).toFixed(1)} m` : NO_DATA} />
              <Field label="PHOTOS" value={photos} />
            </div>
          </div>
        ))}

        <StandbyChannels />
      </div>
    </div>
  );
}
