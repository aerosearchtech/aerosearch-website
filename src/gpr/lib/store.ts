import { create } from 'zustand';
import { DEFAULT_DISPLAY, DEFAULT_PARAMS, DEFAULT_SLICE, THEME_STORAGE_KEY } from './constants';
import { loadFlight, loadIndex } from './data';
import { FONT_SANS } from './theme';
import type { ThemeName } from './theme';
import type {
  Cursor,
  DepthSlice,
  DisplaySettings,
  Flight,
  FlightIndexEntry,
  ProcessingParams,
  View,
} from './types';
import { clampView, fullView } from './view';

interface ViewerState {
  theme: ThemeName;
  index: FlightIndexEntry[];
  flight: Flight | null;
  loading: boolean;
  error: string | null;
  params: ProcessingParams;
  display: DisplaySettings;
  slice: DepthSlice;
  view: View | null;
  cursor: Cursor | null;
  sidebarOpen: boolean;
  basemap: boolean;
  init: () => Promise<void>;
  selectFlight: (id: string) => Promise<void>;
  setTheme: (t: ThemeName) => void;
  setParams: (patch: Partial<ProcessingParams>) => void;
  resetParams: () => void;
  setDisplay: (patch: Partial<DisplaySettings>) => void;
  setSlice: (patch: Partial<DepthSlice>) => void;
  setView: (v: View) => void;
  resetView: () => void;
  setCursor: (c: Cursor | null) => void;
  toggleSidebar: () => void;
  toggleBasemap: () => void;
}

function storedTheme(): ThemeName {
  try {
    const t = localStorage.getItem(THEME_STORAGE_KEY);
    if (t === 'dark' || t === 'light') return t;
  } catch {
    // storage unavailable: fall back to the OS preference
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export const useViewer = create<ViewerState>((set, get) => ({
  theme: 'dark',
  index: [],
  flight: null,
  loading: true,
  error: null,
  params: DEFAULT_PARAMS,
  display: DEFAULT_DISPLAY,
  slice: DEFAULT_SLICE,
  view: null,
  cursor: null,
  sidebarOpen: true,
  basemap: true,

  init: async () => {
    get().setTheme(storedTheme());
    await document.fonts.load(`600 12px ${FONT_SANS}`); // canvases draw text once, so load the web font first
    try {
      const index = await loadIndex();
      set({ index });
      if (index.length) await get().selectFlight(index[0].id);
      else set({ loading: false, error: 'No flights in data/index.json' });
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
    }
  },

  selectFlight: async (id) => {
    set({ loading: true, error: null, cursor: null });
    try {
      const flight = await loadFlight(id);
      set({ flight, view: fullView(flight.meta), loading: false });
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
    }
  },

  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // non-persistent theme is fine
    }
    set({ theme });
  },

  setParams: (patch) => set((s) => ({ params: { ...s.params, ...patch } })),
  resetParams: () => set({ params: DEFAULT_PARAMS, display: DEFAULT_DISPLAY, slice: DEFAULT_SLICE }),
  setDisplay: (patch) => set((s) => ({ display: { ...s.display, ...patch } })),
  setSlice: (patch) => set((s) => ({ slice: { ...s.slice, ...patch } })),

  setView: (v) => {
    const meta = get().flight?.meta;
    if (meta) set({ view: clampView(v, meta) });
  },
  resetView: () => {
    const meta = get().flight?.meta;
    if (meta) set({ view: fullView(meta) });
  },
  setCursor: (cursor) => set({ cursor }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleBasemap: () => set((s) => ({ basemap: !s.basemap })),
}));
