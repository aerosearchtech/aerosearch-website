'use client';

import { Moon, Radar, Sun } from 'lucide-react';
import DatasetPicker from '@/gpr/components/DatasetPicker';
import IconButton from '@/gpr/components/ui/IconButton';
import { useViewer } from '@/gpr/lib/store';
import { cssVar } from '@/gpr/lib/theme';

export default function TopBar() {
  const hasData = useViewer((s) => s.index.length > 0);
  const theme = useViewer((s) => s.theme);
  const setTheme = useViewer((s) => s.setTheme);

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
        <h1 style={{ margin: 0, fontSize: 15, fontWeight: 650, letterSpacing: -0.2, color: cssVar('ink') }}>GPR Survey Viewer</h1>
      </div>
      {hasData && <DatasetPicker />}
      <IconButton
        icon={theme === 'dark' ? Sun : Moon}
        label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />
    </header>
  );
}
