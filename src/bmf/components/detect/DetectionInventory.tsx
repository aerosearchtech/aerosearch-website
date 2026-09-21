'use client';

import { useState } from 'react';
import { MINE_SPECS, MINE_TYPES } from '@/bmf/lib/constants';
import { FONT_MONO } from '@/bmf/lib/theme';
import { useGcs } from '@/bmf/lib/store';
import type { ViewModel } from '@/bmf/lib/derive';
import type { MineType } from '@/bmf/lib/types';

type Filter = MineType | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'ALL' },
  ...MINE_TYPES.map((t) => ({ key: t as Filter, label: MINE_SPECS[t].short })),
];

/** Right rail in DETECT: every fused fix the survey produced. */
export default function DetectionInventory({ detect }: { detect: ViewModel['detect'] }) {
  const hoverMine = useGcs((s) => s.hoverMine);
  const selectMine = useGcs((s) => s.selectMine);
  const selectedId = useGcs((s) => s.selectedMineId);
  const [filter, setFilter] = useState<Filter>('all');

  const rows = detect.inventory.filter(
    (r) => filter === 'all' || MINE_SPECS[filter as MineType].short === r.short,
  );

  return (
    <div style={{ width: 344, flex: 'none', background: 'var(--bg1)', borderLeft: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ height: 34, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 13px', borderBottom: '1px solid var(--bd)', background: 'var(--bg2)' }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, color: 'var(--tx)' }}>DETECTION INVENTORY</span>
        {/* Filtered or capped, the tally says so — the panel never reads as
            the whole mapped picture when it is only part of it. */}
        <span style={{ fontSize: 10, fontFamily: FONT_MONO, color: 'var(--tl)' }}>
          {rows.length < detect.mapped ? `${rows.length} OF ${detect.mapped}` : rows.length} FIXES
        </span>
      </div>

      <div style={{ flex: 'none', display: 'flex', borderBottom: '1px solid var(--bd)' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{ flex: 1, padding: '7px 0', background: filter === f.key ? 'rgba(242,169,59,.12)' : 'transparent', border: 'none', borderRight: '1px solid var(--bd)', color: filter === f.key ? 'var(--am)' : 'var(--tx3)', fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, letterSpacing: 1, cursor: 'pointer' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {rows.map((r) => (
          <div
            key={r.id}
            onMouseEnter={() => hoverMine(r.id)}
            onMouseLeave={() => hoverMine(null)}
            onClick={() => selectMine(selectedId === r.id ? null : r.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px', borderBottom: '1px solid var(--bd)', background: selectedId === r.id ? 'var(--amWash)' : r.rowBg, borderLeft: `3px solid ${r.color}`, cursor: 'pointer' }}
          >
            <span style={{ width: 9, height: 9, background: r.color, transform: 'rotate(45deg)', flex: 'none' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.model}</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: r.statusColor, fontFamily: FONT_MONO, flex: 'none' }}>{r.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: FONT_MONO, fontSize: 9, color: 'var(--tx3)' }}>
                <span>{r.id} · 43R FN {r.grid}</span>
                <span>{r.depth}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                {r.sensors.map((tag) => (
                  <span key={tag} style={{ fontSize: 8, fontFamily: FONT_MONO, fontWeight: 600, padding: '1px 4px', color: r.color, border: `1px solid ${r.color}`, opacity: 0.85 }}>{tag}</span>
                ))}
                <div style={{ flex: 1, height: 4, background: 'var(--bg3)', position: 'relative', overflow: 'hidden', marginLeft: 4 }}>
                  <div style={{ position: 'absolute', inset: 0, width: r.confW, background: r.color }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: FONT_MONO, color: 'var(--tx)', minWidth: 30, textAlign: 'right' }}>{r.conf}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
