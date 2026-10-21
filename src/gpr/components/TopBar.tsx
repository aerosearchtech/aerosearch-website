'use client';

import { Moon, Radar, Sun } from 'lucide-react';
import IconButton from '@/gpr/components/ui/IconButton';
import Segmented from '@/gpr/components/ui/Segmented';
import { useViewer } from '@/gpr/lib/store';
import { cssVar } from '@/gpr/lib/theme';

export default function TopBar() {
  const index = useViewer((s) => s.index);
  const meta = useViewer((s) => s.flight?.meta ?? null);
  const selectFlight = useViewer((s) => s.selectFlight);
  const theme = useViewer((s) => s.theme);
  const setTheme = useViewer((s) => s.setTheme);
  const date = meta ? new Date(meta.start).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '10px 16px',
        flexWrap: 'wrap',
        background: cssVar('surface'),
        borderBottom: `1px solid ${cssVar('border')}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginRight: 'auto' }}>
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 34,
            height: 34,
            borderRadius: 9,
            background: cssVar('accent'),
            color: cssVar('onAccent'),
          }}
        >
          <Radar size={19} strokeWidth={2} aria-hidden />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 15, fontWeight: 650, letterSpacing: -0.2, color: cssVar('ink') }}>GPR Survey Viewer</h1>
          <div style={{ fontSize: 11.5, color: cssVar('inkMuted') }}>
            Drone-borne ground-penetrating radar{meta && ` · ${meta.radar} · ${date}`}
          </div>
        </div>
      </div>
      {index.length > 0 && (
        <Segmented
          ariaLabel="Flight"
          options={index.map((f, k) => ({ value: f.id, label: `Flight ${k + 1} · ${f.label.slice(-8)}` }))}
          value={meta?.id ?? ''}
          onChange={(id) => void selectFlight(id)}
        />
      )}
      <IconButton
        icon={theme === 'dark' ? Sun : Moon}
        label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />
    </header>
  );
}
