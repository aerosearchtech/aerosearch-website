'use client';

import { useState } from 'react';
import { PHOTO_LIST_MAX, SEVERITY_ERROR, SEVERITY_WARNING } from '@/bmf/lib/live/constants';
import type { BridgeState } from '@/bmf/lib/live/types';
import { FONT_MONO } from '@/bmf/lib/theme';
import { RailHeader, Row, Section, num, rail, railBody, smallBtn } from './chrome';

interface Props {
  state: BridgeState | null;
  refreshMission: () => Promise<string | null>;
}

export const severityColor = (s: number): string => (s <= SEVERITY_ERROR ? 'var(--rd)' : s <= SEVERITY_WARNING ? 'var(--am)' : 'var(--tx2)');

/** Mission rail over the live map: the loaded mission, the photos taken and the drone's messages. */
export default function MissionPanel({ state, refreshMission }: Props) {
  const [note, setNote] = useState<string | null>(null);
  const m = state?.mission;
  const canRefresh = !!state && !state.link.replay && !state.vehicle.armed;

  const refresh = async () => {
    setNote('downloading…');
    setNote((await refreshMission()) ?? 'requested');
  };

  return (
    <div style={rail}>
      <RailHeader
        title="MISSION"
        right={
          <button onClick={refresh} disabled={!canRefresh} style={{ ...smallBtn, opacity: canRefresh ? 1 : 0.4, cursor: canRefresh ? 'pointer' : 'default' }} title="Re-read the mission from the drone (only while disarmed)">
            ⟳ RE-READ
          </button>
        }
      />

      <div style={railBody}>
        {note && <div style={{ padding: '6px 13px 0', fontFamily: FONT_MONO, fontSize: 9, color: 'var(--tx3)' }}>{note}</div>}
        {m ? (
          <>
            <Section title="SURVEY" />
            <Row label="AREA" value={m.areaHa !== null ? `${m.areaHa.toFixed(2)} ha · ${m.polygonSource === 'file' ? 'POLYGON' : 'FROM LINES'}` : '—'} color="var(--tl)" />
            <Row label="SURVEY LINES" value={`${m.surveyM.toFixed(0)} m`} color="var(--am)" />
            <Row label="TRANSIT" value={`${m.transitM.toFixed(0)} m`} />
            <Row label="ALTITUDE" value={m.surveyAlt.length ? `${m.surveyAlt.join(' / ')} m` : '—'} />
            <Row label="PHOTO SPACING" value={m.triggerM.length ? `${m.triggerM.join(' / ')} m` : 'NO TRIGGER'} color={m.triggerM.length ? 'var(--tx)' : 'var(--rd)'} />
            <Row label="PHOTOS PLANNED" value={`~${m.estPhotos}`} />
            <Row label="MISSION ITEMS" value={String(m.items)} />
          </>
        ) : (
          <div style={{ padding: '12px 13px', fontFamily: FONT_MONO, fontSize: 10, color: 'var(--tx3)', lineHeight: 1.6 }}>
            No mission yet. It is read from the drone on connect (while disarmed) and whenever another app downloads or uploads it.
          </div>
        )}

        <Section title={`PHOTOS · ${state?.photos.length ?? 0}`} right={<span style={{ letterSpacing: 0.5 }}>{state?.photosFile ?? ''}</span>} />
        <div style={{ padding: '0 13px 10px', fontFamily: FONT_MONO, fontSize: 10 }}>
          {[...(state?.photos ?? [])].reverse().slice(0, PHOTO_LIST_MAX).map((p) => (
            <div key={p.n} style={{ display: 'flex', gap: 10, lineHeight: '18px', color: 'var(--tx2)' }}>
              <span style={{ width: 34, color: 'var(--tx)' }}>#{p.n}</span>
              <span>{p.utc.slice(11, 19)}</span>
              <span>{p.altRel.toFixed(1)} m</span>
              <span style={{ marginLeft: 'auto', color: p.acked ? 'var(--gn)' : 'var(--rd)' }}>{p.acked ? 'ACK' : 'NO ACK'}</span>
            </div>
          ))}
          {!state?.photos.length && <div style={{ color: 'var(--tx3)' }}>none — photos come from survey_capture.py</div>}
        </div>

        <Section title="FLIGHT MESSAGES" />
        <div style={{ padding: '0 13px 12px', fontFamily: FONT_MONO, fontSize: 10 }}>
          {[...(state?.status ?? [])].reverse().map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, lineHeight: '17px' }}>
              <span style={{ color: 'var(--tx3)', flex: 'none' }}>{s.utc.slice(11, 19)}</span>
              <span style={{ color: severityColor(s.severity) }}>{s.text}</span>
            </div>
          ))}
          {!state?.status.length && <div style={{ color: 'var(--tx3)' }}>none</div>}
        </div>
      </div>

      <div style={{ flex: 'none', borderTop: '1px solid var(--bd)', padding: '9px 13px', background: 'var(--bg2)', display: 'flex', justifyContent: 'space-between', fontFamily: FONT_MONO, fontSize: 9, color: 'var(--tx3)', letterSpacing: 1 }}>
        <span>TRAIL {state?.trail.length ?? 0} PTS</span>
        <span>FLIGHT {state?.flight ?? '—'}</span>
        <span>{num(state?.link.ageS, 1, ' s')}</span>
      </div>
    </div>
  );
}
