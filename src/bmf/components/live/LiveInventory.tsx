'use client';

import { useState } from 'react';
import { MINE_CLASS_COLOR, MINE_CLASS_LABEL, MINE_CLASSES } from '@/bmf/lib/live/constants';
import type { Detections, MineClass } from '@/bmf/lib/live/types';
import { cropUrl } from '@/bmf/lib/live/useDetections';
import { useGcs } from '@/bmf/lib/store';
import { FONT_MONO } from '@/bmf/lib/theme';

type Filter = MineClass | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'ALL' },
  ...MINE_CLASSES.map((c) => ({ key: c as Filter, label: MINE_CLASS_LABEL[c] })),
];

const THUMB_PX = 54;

/** Right rail in DETECT: each mine the live detector found, newest first, with its RGB crop. */
export default function LiveInventory({ detections }: { detections: Detections }) {
  const selected = useGcs((s) => s.liveMineId);
  const select = useGcs((s) => s.selectLiveMine);
  const [filter, setFilter] = useState<Filter>('all');
  const { run, mines } = detections;
  const rows = mines.filter((m) => filter === 'all' || m.class === filter).reverse();

  return (
    <div style={{ width: 344, flex: 'none', background: 'var(--bg1)', borderLeft: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ height: 34, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 13px', borderBottom: '1px solid var(--bd)', background: 'var(--bg2)' }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, color: 'var(--tx)' }}>DETECTION INVENTORY</span>
        <span style={{ fontSize: 10, fontFamily: FONT_MONO, color: 'var(--tl)' }}>
          {rows.length < mines.length ? `${rows.length} OF ${mines.length}` : mines.length} LIVE
        </span>
      </div>

      <div style={{ flex: 'none', display: 'flex', borderBottom: '1px solid var(--bd)' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{ flex: 1, padding: '7px 0', background: filter === f.key ? 'var(--amWash)' : 'transparent', border: 'none', borderRight: '1px solid var(--bd)', color: filter === f.key ? 'var(--am)' : 'var(--tx3)', fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, letterSpacing: 1, cursor: 'pointer' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {!run || !rows.length ? (
          <div style={{ padding: 16, fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 1, color: 'var(--tx3)', textAlign: 'center' }}>
            NO DETECTIONS YET
          </div>
        ) : (
          rows.map((m) => {
            const color = `var(--${MINE_CLASS_COLOR[m.class]})`;
            return (
              <div
                key={m.id}
                onClick={() => select(selected === m.id ? null : m.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 13px 7px 10px', borderBottom: '1px solid var(--bd)', borderLeft: `3px solid ${color}`, background: selected === m.id ? 'var(--amWash)' : 'transparent', cursor: 'pointer' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- crop served by live_view.py */}
                <img src={cropUrl(run, m.id, 'rgb')} alt={`${MINE_CLASS_LABEL[m.class]} crop`} width={THUMB_PX} height={THUMB_PX} style={{ flex: 'none', objectFit: 'cover', border: '1px solid var(--bd2)', background: 'var(--bg0)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color }}>{MINE_CLASS_LABEL[m.class]}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, fontFamily: FONT_MONO, color: 'var(--tx)' }}>{Math.round(m.conf * 100)}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: FONT_MONO, fontSize: 9, color: 'var(--tx3)' }}>
                    <span>#{m.id} · {m.sightings}× SEEN</span>
                    <span>{m.crops.includes('thermal') ? 'RGB+TH' : 'RGB'}</span>
                  </div>
                  <div style={{ marginTop: 3, fontFamily: FONT_MONO, fontSize: 9, color: 'var(--tx3)' }}>
                    {m.lat.toFixed(7)}, {m.lon.toFixed(7)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
