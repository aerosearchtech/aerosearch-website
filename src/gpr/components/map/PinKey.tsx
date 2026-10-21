import { cssVar } from '@/gpr/lib/theme';
import type { Palette } from '@/gpr/lib/theme';
import type { MapLayer } from '@/gpr/lib/types';

const SENSOR_NAME: Record<MapLayer, string> = { gpr: 'GPR', mag: 'magnetometer' };

const ENTRIES: [keyof Palette, string][] = [
  ['detected', 'detected'],
  ['missed', 'missed'],
  ['inkMuted', 'not evaluated'],
];

// Key for the buried-object pins, which follow the sensor shown on the map.
export default function PinKey({ sensor }: { sensor: MapLayer }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 12px', fontSize: 11, color: cssVar('inkSecondary') }}>
      <span>Objects by {SENSOR_NAME[sensor]}:</span>
      {ENTRIES.map(([color, label]) => (
        <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: cssVar(color) }} aria-hidden />
          {label}
        </span>
      ))}
    </div>
  );
}
