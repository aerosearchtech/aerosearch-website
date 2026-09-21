'use client';

import { TASK_STATE_ORDER } from '@/bmf/lib/constants';
import { FONT_MONO } from '@/bmf/lib/theme';
import { useGcs } from '@/bmf/lib/store';
import type { ViewModel } from '@/bmf/lib/derive';

/**
 * Right rail in NEUTRALISE: one card per device in the lane, ordered by
 * chainage. Clicking the state box walks it pending → working → neutralised →
 * proofed; clicking the team chip cycles the detachment.
 */
export default function TaskBoard({ view }: { view: ViewModel }) {
  const hoverMine = useGcs((s) => s.hoverMine);
  const advanceTask = useGcs((s) => s.advanceTask);
  const assignTeam = useGcs((s) => s.assignTeam);

  const rows = view.tasks.slice().sort((a, b) => a.chainageM - b.chainageM);
  const proofed = rows.filter((r) => r.state === 'proofed').length;

  // While the clearance is flying, the plan owns every state — hand-stepping a
  // device would put the board and the airframes into disagreement.
  const live = !!view.clearance;

  return (
    <div style={{ width: 344, flex: 'none', background: 'var(--bg1)', borderLeft: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ height: 34, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 13px', borderBottom: '1px solid var(--bd)', background: 'var(--bg2)' }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, color: 'var(--tx)' }}>CLEARANCE BOARD</span>
        <span style={{ fontSize: 10, fontFamily: FONT_MONO, color: proofed === rows.length && rows.length ? 'var(--gn)' : 'var(--am)' }}>
          {proofed}/{rows.length} PROOFED
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {rows.map((t) => (
          <div
            key={t.id}
            onMouseEnter={() => hoverMine(t.id)}
            onMouseLeave={() => hoverMine(null)}
            style={{ display: 'flex', gap: 10, padding: '11px 13px', borderBottom: '1px solid var(--bd)', background: t.rowBg, borderLeft: `3px solid ${t.stateColor}` }}
          >
            <button
              onClick={() => advanceTask(t.id)}
              disabled={live}
              title={live ? 'Flown by the clearance' : `Advance ${t.id} to the next state`}
              style={{ flex: 'none', width: 52, height: 52, border: `1px solid ${t.stateColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, background: 'var(--bg3)', cursor: 'pointer', padding: 0 }}
            >
              <span style={{ fontFamily: FONT_MONO, fontSize: 17, fontWeight: 700, color: t.stateColor, lineHeight: 1 }}>{t.seq}</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 8, fontWeight: 700, letterSpacing: 1, color: 'var(--tx3)' }}>{t.short}</span>
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ width: 9, height: 9, background: t.color, transform: 'rotate(45deg)', flex: 'none' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.model}</span>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: t.stateColor, fontFamily: FONT_MONO, flex: 'none' }}>{t.stateLabel}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, fontFamily: FONT_MONO, fontSize: 10, color: 'var(--tx2)' }}>
                <span>{t.id} · {Math.round(t.chainageM)} m ALONG LANE</span>
                <span style={{ color: 'var(--tx3)' }}>{t.effort}</span>
              </div>

              <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
                {TASK_STATE_ORDER.map((st) => {
                  const at = TASK_STATE_ORDER.indexOf(t.state);
                  const done = TASK_STATE_ORDER.indexOf(st) <= at;
                  return (
                    <div key={st} style={{ flex: 1, height: 4, background: done ? t.stateColor : 'var(--bg3)' }} />
                  );
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <button
                  onClick={() => assignTeam(t.id)}
                  disabled={live}
                  title={live ? 'Committed to a sortie' : 'Cycle the assigned EOD detachment'}
                  style={{ fontSize: 8, fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: 1, padding: '2px 6px', color: t.teamColor, border: `1px solid ${t.teamColor}`, background: 'transparent', cursor: 'pointer' }}
                >
                  {t.teamName}
                </button>
                <span style={{ fontSize: 8, letterSpacing: 1, color: 'var(--tx3)', fontFamily: FONT_MONO }}>FUSION</span>
                {t.sensors.map((tag) => (
                  <span key={tag} style={{ fontSize: 8, fontFamily: FONT_MONO, fontWeight: 600, padding: '1px 4px', color: t.color, border: `1px solid ${t.color}`, opacity: 0.85 }}>{tag}</span>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: 8, letterSpacing: 1, color: t.statusColor, fontFamily: FONT_MONO, fontWeight: 600 }}>{t.status}</span>
              </div>

              {/* What the airframe brought back. The console holds the record
                  that footage exists, not the footage — this is a plan product. */}
              {t.state === 'proofed' && (
                <div style={{ marginTop: 7, fontFamily: FONT_MONO, fontSize: 8, letterSpacing: 1, color: t.stateColor }}>
                  ▣ EO RECORDED · {t.falseAlarm ? 'NO DEVICE PRESENT · NO CHARGE EXPENDED' : 'CHARGE FIRED · DEVICE DESTROYED'}
                </div>
              )}
            </div>
          </div>
        ))}

        {!rows.length && (
          <div style={{ padding: '30px 16px', textAlign: 'center', fontFamily: FONT_MONO, fontSize: 11, color: 'var(--tx3)', lineHeight: 1.7 }}>
            {view.selected ? (
              <>
                NO DEVICES IN LANE<br />
                <span style={{ color: 'var(--gn)' }}>NOTHING TO NEUTRALISE</span>
              </>
            ) : (
              <>
                NO LANE SELECTED<br />
                <span style={{ color: 'var(--tl)' }}>PLAN A CORRIDOR FIRST</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
