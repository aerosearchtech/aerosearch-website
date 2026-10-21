'use client';

import { useEffect, useRef, useState } from 'react';
import StatusBadge from '@/gpr/components/targets/StatusBadge';
import Segmented from '@/gpr/components/ui/Segmented';
import { useViewer } from '@/gpr/lib/store';
import { byNumber, depthText } from '@/gpr/lib/targets';
import { cssVar } from '@/gpr/lib/theme';
import type { Target } from '@/gpr/lib/types';

type Filter = 'all' | 'found' | 'missed';

const FILTERS: Record<Filter, (t: Target) => boolean> = {
  all: () => true,
  found: (t) => t.gpr === true,
  missed: (t) => t.gpr === false,
};

export default function TargetList({ targets }: { targets: Target[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const selected = useViewer((s) => s.selectedTarget);
  const selectTarget = useViewer((s) => s.selectTarget);
  const activeRef = useRef<HTMLLIElement>(null);
  const rows = targets
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => FILTERS[filter](t))
    .sort((a, b) => byNumber(a.t, b.t));

  // Keep the selected row visible when it is picked on the map.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <div style={{ padding: '10px 14px 6px' }}>
        <Segmented<Filter>
          ariaLabel="Filter objects"
          options={[
            { value: 'all', label: `All ${targets.length}` },
            { value: 'found', label: 'GPR found' },
            { value: 'missed', label: 'GPR missed' },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: '0 6px 8px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
        {rows.map(({ t, i }) => {
          const active = i === selected;
          return (
            <li key={i} ref={active ? activeRef : undefined}>
              <button
                onClick={() => selectTarget(active ? null : i)}
                aria-pressed={active}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '28px 1fr',
                  gap: 8,
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 8px',
                  border: 'none',
                  borderRadius: 7,
                  cursor: 'pointer',
                  background: active ? cssVar('accentSoft') : 'transparent',
                  color: cssVar('ink'),
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: active ? cssVar('accent') : cssVar('inkMuted'), paddingTop: 1 }}>
                  {t.no ?? '–'}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                  <span style={{ fontSize: 12, lineHeight: 1.3 }}>{t.name}</span>
                  <span style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 10.5, color: cssVar('inkMuted') }}>
                    {depthText(t)}
                    <StatusBadge sensor="GPR" detected={t.gpr} />
                    <StatusBadge sensor="Mag" detected={t.mag} />
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
