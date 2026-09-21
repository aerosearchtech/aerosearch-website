'use client';

import { useState } from 'react';
import { FONT_MONO } from '@/bmf/lib/theme';
import { useGcs } from '@/bmf/lib/store';
import type { ViewModel } from '@/bmf/lib/derive';

type SortKey = 'lane' | 'sev';

const SEV_RANK: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export default function ClearanceTasking({ view }: { view: ViewModel }) {
  const hoverMine = useGcs((s) => s.hoverMine);
  const [sortBy, setSortBy] = useState<SortKey>('lane');

  const sorted = view.tasks
    .slice()
    .sort((a, b) =>
      sortBy === 'lane'
        ? a.chainageM - b.chainageM
        : SEV_RANK[a.sev] - SEV_RANK[b.sev] || a.chainageM - b.chainageM,
    );

  const sortBtn = (key: SortKey, label: string) => (
    <button
      onClick={() => setSortBy(key)}
      style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', fontFamily: FONT_MONO, fontSize: 8, fontWeight: 700, letterSpacing: 1, color: sortBy === key ? 'var(--am)' : 'var(--tx3)' }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ width: 344, flex: 'none', background: 'var(--bg1)', borderLeft: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ height: 34, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 13px', borderBottom: '1px solid var(--bd)', background: 'var(--bg2)' }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, color: 'var(--tx)' }}>CLEARANCE TASKING</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontFamily: FONT_MONO, color: 'var(--rd)' }}>
          {sortBtn('lane', 'LANE')}
          <span style={{ color: 'var(--bd2)', fontSize: 8 }}>|</span>
          {sortBtn('sev', 'SEV')}
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--rd)', animation: 'clmBlink 1.3s infinite', marginLeft: 5 }} />
          {view.tasks.length} TASK{view.tasks.length === 1 ? '' : 'S'}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {sorted.map((t) => (
          <div
            key={t.id}
            onMouseEnter={() => hoverMine(t.id)}
            onMouseLeave={() => hoverMine(null)}
            style={{ display: 'flex', gap: 10, padding: '11px 13px', borderBottom: '1px solid var(--bd)', background: t.rowBg, borderLeft: `3px solid ${t.color}` }}
          >
            <div style={{ flex: 'none', width: 52, height: 52, border: `1px solid ${t.color}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, background: 'var(--bg3)' }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 17, fontWeight: 700, color: t.color, lineHeight: 1 }}>{t.seq}</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 8, fontWeight: 700, letterSpacing: 1, color: 'var(--tx3)' }}>{t.short}</span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ width: 9, height: 9, background: t.color, transform: 'rotate(45deg)', flex: 'none' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.model}</span>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: t.color, fontFamily: FONT_MONO, flex: 'none' }}>{t.sev}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, fontFamily: FONT_MONO, fontSize: 10, color: 'var(--tx2)' }}>
                <span>{t.id} · {Math.round(t.chainageM)} m ALONG LANE</span>
                <span style={{ color: 'var(--tx3)' }}>{t.depth}</span>
              </div>

              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 5, background: 'var(--bg3)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, width: t.confW, background: t.color }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT_MONO, color: 'var(--tx)', minWidth: 34, textAlign: 'right' }}>{t.conf}%</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
                <span style={{ fontSize: 8, letterSpacing: 1, color: 'var(--tx3)', fontFamily: FONT_MONO }}>FUSION</span>
                {t.sensors.map((tag) => (
                  <span key={tag} style={{ fontSize: 8, fontFamily: FONT_MONO, fontWeight: 600, padding: '1px 4px', color: t.color, border: `1px solid ${t.color}`, opacity: 0.85 }}>{tag}</span>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: 8, letterSpacing: 1, color: t.statusColor, fontFamily: FONT_MONO, fontWeight: 600 }}>{t.status}</span>
              </div>
            </div>
          </div>
        ))}

        {!view.tasks.length && (
          <div style={{ padding: '30px 16px', textAlign: 'center', fontFamily: FONT_MONO, fontSize: 11, color: 'var(--tx3)', lineHeight: 1.7 }}>
            {view.selected ? (
              <>
                LANE IS CLEAR<br />NO DEVICES IN CORRIDOR<br />
                <span style={{ color: 'var(--gn)' }}>PASSAGE OPEN</span>
              </>
            ) : (
              <>
                NO LANE SELECTED<br />
                <span style={{ color: 'var(--tl)' }}>PICK A CORRIDOR OPTION</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
