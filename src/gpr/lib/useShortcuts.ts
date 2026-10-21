import { useEffect } from 'react';
import { KEY_PAN_FRACTION, ZOOM_STEP } from './constants';
import { useViewer } from './store';
import type { View } from './types';
import { zoomAxis } from './view';

// Help text shown in the B-scan footer; keep in sync with the handler below.
export const SHORTCUTS_HELP = '← → pan · ↑ ↓ pan time · + − zoom · [ ] prev/next line · 0 reset';

function nextView(key: string, v: View): View | null {
  const meta = useViewer.getState().flight?.meta;
  if (!meta) return null;
  const w = v.x1 - v.x0;
  const h = v.y1 - v.y0;
  const mid = (v.x0 + v.x1) / 2;
  switch (key) {
    case 'ArrowLeft':
    case 'ArrowRight': {
      const d = (key === 'ArrowLeft' ? -1 : 1) * w * KEY_PAN_FRACTION;
      return { ...v, x0: v.x0 + d, x1: v.x1 + d };
    }
    case 'ArrowUp':
    case 'ArrowDown': {
      const d = (key === 'ArrowUp' ? -1 : 1) * h * KEY_PAN_FRACTION;
      return { ...v, y0: v.y0 + d, y1: v.y1 + d };
    }
    case '+':
    case '=':
    case '-':
    case '_': {
      const [x0, x1] = zoomAxis(v.x0, v.x1, mid, key === '-' || key === '_' ? ZOOM_STEP : 1 / ZOOM_STEP);
      return { ...v, x0, x1 };
    }
    case '[':
    case ']': {
      // Next/previous line by start trace relative to the window start.
      const line = key === ']' ? meta.lines.find((l) => l.start > v.x0) : meta.lines.findLast((l) => l.start < v.x0);
      return line ? { ...v, x0: line.start, x1: line.end + 1 } : null;
    }
    default:
      return null;
  }
}

// Global B-scan navigation keys; ignored while typing in or adjusting a form control.
export function useShortcuts(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.target instanceof HTMLInputElement) return;
      const { view, setView, resetView } = useViewer.getState();
      if (!view) return;
      if (e.key === '0' || e.key === 'Home') {
        resetView();
        e.preventDefault();
        return;
      }
      const next = nextView(e.key, view);
      if (next) {
        setView(next);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
