// Blanks every simulated value the drone does not feed yet, keeping the layout.

import type { Kpi, PhaseTab } from '@/bmf/lib/derive';
import type { Phase } from '@/bmf/lib/types';
import { NO_DATA } from './constants';
import type { LiveMine } from './types';

const BLANK = 'var(--tx3)';

/** Rail and bottom-strip titles per phase. */
export const PANEL_TITLES: Record<Phase, { left: string; right: string; bottom: string }> = {
  detect: { left: 'SENSOR COVERAGE', right: 'DETECTION INVENTORY', bottom: 'CAMERA CHANNELS' },
  breach: { left: 'CORRIDOR OPTIONS', right: 'CLEARANCE TASKING', bottom: 'BREACH SUMMARY' },
  neutralise: { left: 'EOD TEAMS', right: 'TASK BOARD', bottom: 'CLEARANCE PROGRESS' },
};

/** In DETECT the device count and mean confidence come from the live detector. */
export function liveKpis(kpis: Kpi[], phase: Phase, mines: LiveMine[]): Kpi[] {
  const meanPct = mines.length ? Math.round((100 * mines.reduce((a, m) => a + m.conf, 0)) / mines.length) : 0;
  const live: Record<string, Pick<Kpi, 'val' | 'unit'>> =
    phase === 'detect' && mines.length
      ? { 'DEVICES MAPPED': { val: String(mines.length), unit: 'LIVE' }, 'MEAN CONFIDENCE': { val: String(meanPct), unit: '% DETECTOR' } }
      : {};
  return kpis.map((k) => (live[k.label] ? { ...k, ...live[k.label] } : { ...k, val: NO_DATA, unit: '', color: BLANK }));
}

export function livePhases(phases: PhaseTab[], mines: LiveMine[]): PhaseTab[] {
  return phases.map((ph) =>
    ph.id === 'detect' && mines.length
      ? { ...ph, status: `${mines.length} LIVE DETECTIONS`, statusColor: 'var(--gn)' }
      : { ...ph, status: 'NO DATA', statusColor: BLANK },
  );
}
