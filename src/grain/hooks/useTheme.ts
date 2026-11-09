import { useEffect, useState } from 'react';
import { THEME_STORAGE_KEY } from '../config/constants';
import type { ThemeMode } from '../theme/colors';

/** Saved theme, if browser storage is available; dark otherwise. */
function readStoredTheme(): ThemeMode {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function useTheme(): [ThemeMode, (mode: ThemeMode) => void] {
  const [mode, setMode] = useState<ThemeMode>(readStoredTheme);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Storage blocked (private window): the theme just isn't remembered.
    }
  }, [mode]);

  return [mode, setMode];
}
