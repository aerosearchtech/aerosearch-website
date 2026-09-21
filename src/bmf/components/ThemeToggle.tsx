'use client';

import { FONT_SANS } from '@/bmf/lib/theme';
import { useGcs } from '@/bmf/lib/store';

const SUN = 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m11.32 0 1.41 1.41M4.93 4.93l1.41 1.41M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z';
const MOON = 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z';

export default function ThemeToggle() {
  const theme = useGcs((s) => s.theme);
  const toggleTheme = useGcs((s) => s.toggleTheme);
  const dark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle colour theme"
      style={{ height: 34, width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg3)', border: '1px solid var(--bd2)', color: 'var(--am)', fontFamily: FONT_SANS, cursor: 'pointer' }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={dark ? SUN : MOON} />
      </svg>
    </button>
  );
}
