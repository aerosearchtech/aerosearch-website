'use client';

import { BarList, LogList, panelHdr } from '../PanelChrome';
import { CONF_CONFIRMED } from '@/bmf/lib/constants';
import { CONF_BINS } from '@/bmf/lib/derive/detect';
import type { BarRow, LogLine } from '@/bmf/lib/derive/types';
import { MINE_CLASS_COLOR, MINE_CLASS_LABEL, MINE_CLASSES } from '@/bmf/lib/live/constants';
import type { LiveMine, StatusText } from '@/bmf/lib/live/types';
import { FONT_MONO } from '@/bmf/lib/theme';
import { severityColor } from './MissionPanel';

const bar = (key: string, label: string, n: number, total: number, color: string): BarRow => ({
  key,
  label,
  detail: `${n}`,
  color,
  value: n,
  width: `${(n / total) * 100}%`,
});

/** BMF's DETECT bottom strip from live data: flight messages and detections, by class and by detector confidence. */
export default function LiveDetectBottom({ mines, status }: { mines: LiveMine[]; status: StatusText[] }) {
  const total = mines.length || 1;
  const classTally = MINE_CLASSES.map((c) => bar(c, MINE_CLASS_LABEL[c], mines.filter((m) => m.class === c).length, total, `var(--${MINE_CLASS_COLOR[c]})`));
  const confBins = CONF_BINS.map((b) =>
    bar(b.key, b.label, mines.filter((m) => m.conf >= b.lo && m.conf < b.hi).length, total, b.lo * 100 >= CONF_CONFIRMED ? 'var(--gn)' : b.lo >= 0.7 ? 'var(--am)' : 'var(--rd)'),
  );
  // Newest first: detections by the frame they were first seen in, then the drone's messages.
  const log: LogLine[] = [
    ...[...mines]
      .sort((a, b) => b.first - a.first)
      .map((m) => ({
        time: `#${m.first}`.padEnd(8, ' '),
        text: `${MINE_CLASS_LABEL[m.class]} · ${Math.round(m.conf * 100)}% · ${m.lat.toFixed(6)}, ${m.lon.toFixed(6)}`,
        color: `var(--${MINE_CLASS_COLOR[m.class]})`,
      })),
    ...[...status].reverse().map((s) => ({ time: s.utc.slice(11, 19), text: s.text, color: severityColor(s.severity) })),
  ];

  return (
    <div style={{ flex: 'none', height: 196, background: 'var(--bg1)', borderTop: '1px solid var(--bd2)', display: 'flex', minHeight: 0 }}>
      <div style={{ flex: 1.4, borderRight: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={panelHdr}>SURVEY LOG</div>
        <LogList lines={log} />
      </div>

      <div style={{ flex: 1, borderRight: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ ...panelHdr, justifyContent: 'space-between' }}>
          <span>DEVICE CLASSES</span>
          <span style={{ fontFamily: FONT_MONO, color: 'var(--tx3)', letterSpacing: 1 }}>DETECTIONS</span>
        </div>
        <BarList rows={classTally} labelW={110} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ ...panelHdr, justifyContent: 'space-between' }}>
          <span>FIX CONFIDENCE</span>
          <span style={{ fontFamily: FONT_MONO, color: 'var(--tx3)', letterSpacing: 1 }}>DETECTOR %</span>
        </div>
        <BarList rows={confBins} labelW={62} />
      </div>
    </div>
  );
}
