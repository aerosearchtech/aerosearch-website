'use client';

import { DroneIcon } from '@/bmf/components/icons/ForceIcons';
import { FONT_MONO } from '@/bmf/lib/theme';
import { useGcs } from '@/bmf/lib/store';
import type { ViewModel } from '@/bmf/lib/derive';

const sectionHdr: React.CSSProperties = {
  padding: '10px 13px 7px',
  fontSize: 9,
  letterSpacing: 2,
  color: 'var(--tx3)',
  fontFamily: FONT_MONO,
};

const btn: React.CSSProperties = {
  flex: 1,
  padding: '8px 0',
  background: 'var(--bg3)',
  border: '1px solid var(--bd2)',
  color: 'var(--tx)',
  fontFamily: FONT_MONO,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 1,
  cursor: 'pointer',
};

/** Left rail in NEUTRALISE: EOD detachments and how the lane is split. */
export default function TeamsPanel({ view }: { view: ViewModel }) {
  const autoAssign = useGcs((s) => s.autoAssign);
  const resetTasking = useGcs((s) => s.resetTasking);
  const startClearance = useGcs((s) => s.startClearance);
  const n = view.neutralise;
  const drone = (id: string) => n.drones.find((d) => d.id === id) ?? null;

  // Nothing flies until every contact belongs to a sortie: an unassigned device
  // would be left emplaced in a lane the run then reports as cleared.
  const ready = view.tasks.length > 0 && n.unassigned === 0 && !view.clearance;

  return (
    <div style={{ width: 296, flex: 'none', background: 'var(--bg1)', borderRight: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ height: 34, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 13px', borderBottom: '1px solid var(--bd)', background: 'var(--bg2)' }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, color: 'var(--tx)' }}>EOD DETACHMENTS</span>
        <span style={{ fontSize: 10, fontFamily: FONT_MONO, color: 'var(--am)' }}>{n.committed} COMMITTED</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {n.teams.map((t) => (
          <div key={t.id} style={{ padding: '11px 13px', borderBottom: '1px solid var(--bd)', borderLeft: `3px solid ${t.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 7, height: 7, background: t.color, boxShadow: `0 0 6px ${t.color}` }} />
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.5, fontFamily: FONT_MONO }}>{t.name}</span>
              </div>
              <span style={{ fontSize: 9, letterSpacing: 1.5, fontWeight: 600, color: 'var(--tx3)', fontFamily: FONT_MONO }}>{t.callsign}</span>
            </div>

            <div style={{ marginTop: 8, height: 5, background: 'var(--bg3)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, width: t.loadW, background: t.color }} />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8, fontFamily: FONT_MONO, fontSize: 10, color: 'var(--tx2)' }}>
              <span><span style={{ color: 'var(--tx3)' }}>TASKS </span>{t.assigned}</span>
              <span><span style={{ color: 'var(--tx3)' }}>PROOFED </span>{t.done}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--tx3)' }}>{Math.round(t.minutes)} min left</span>
            </div>

            {drone(t.id) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, paddingTop: 7, borderTop: '1px solid var(--bd)' }}>
                <DroneIcon size={16} color={t.color} />
                <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: 'var(--tx2)' }}>
                  {drone(t.id)!.stateLabel}
                </span>
                <span style={{ marginLeft: 'auto', fontFamily: FONT_MONO, fontSize: 10, color: 'var(--tx3)' }}>
                  {drone(t.id)!.charges} CHARGES
                </span>
              </div>
            )}
          </div>
        ))}

        <div style={sectionHdr}>TASKING</div>
        <div style={{ padding: '0 13px 14px', display: 'flex', gap: 6 }}>
          <button onClick={() => autoAssign(view.tasks.map((t) => t.id))} style={btn}>
            AUTO-ASSIGN
          </button>
          <button onClick={resetTasking} style={btn}>
            RESET
          </button>
        </div>

        <div style={{ padding: '0 13px 14px', display: 'flex', flexDirection: 'column', gap: 6, fontFamily: FONT_MONO, fontSize: 10, color: 'var(--tx3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>OUTSTANDING EFFORT</span>
            <span style={{ color: 'var(--am)' }}>
              {n.committed ? `${Math.round(n.remainingMin)} min` : '—'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>UNASSIGNED TASKS</span>
            <span style={{ color: n.unassigned ? 'var(--rd)' : 'var(--gn)' }}>{n.unassigned}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>TIME TO OPEN</span>
            <span style={{ color: 'var(--tx)' }}>{n.timeToOpenStr}</span>
          </div>
          <div style={{ lineHeight: 1.6, marginTop: 4 }}>
            Each detachment flies one charge-carrying UAS over its stretch,
            placing a demolition charge on every device in turn. Figures are
            flown, not manual: they count the sorties, reloads and lane-wide
            standoffs the clearance plan actually schedules.
          </div>
        </div>
      </div>

      <div style={{ flex: 'none', borderTop: '1px solid var(--bd)', padding: 11 }}>
        <button
          onClick={startClearance}
          disabled={!ready}
          title={
            ready
              ? 'Fly the clearance: charge-carrying airframes work the lane end to end'
              : 'Assign every device to a sortie first'
          }
          style={{
            width: '100%',
            height: 34,
            background: ready ? 'var(--amWash)' : 'transparent',
            border: `1px solid ${ready ? 'var(--am)' : 'var(--bd2)'}`,
            color: ready ? 'var(--am)' : 'var(--tx3)',
            fontFamily: FONT_MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.5,
            cursor: ready ? 'pointer' : 'not-allowed',
          }}
        >
          ▶ START CLEARANCE
        </button>
      </div>

      <div style={{ flex: 'none', borderTop: '1px solid var(--bd)', padding: '9px 13px', background: 'var(--bg2)', display: 'flex', justifyContent: 'space-between', fontFamily: FONT_MONO, fontSize: 9, color: 'var(--tx3)', letterSpacing: 1 }}>
        <span>LANE CLEARANCE</span>
        <span style={{ color: n.certified ? 'var(--gn)' : 'var(--am)' }}>{n.progressPct.toFixed(0)}% CLEARED</span>
      </div>
    </div>
  );
}
