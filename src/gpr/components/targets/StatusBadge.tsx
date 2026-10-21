import { CircleCheck, CircleDashed, CircleX } from 'lucide-react';
import { resultText } from '@/gpr/lib/targets';
import { cssVar } from '@/gpr/lib/theme';

interface StatusBadgeProps {
  sensor: string;
  detected: boolean | null;
}

// Sensor result as icon + text, never colour alone.
export default function StatusBadge({ sensor, detected }: StatusBadgeProps) {
  const [Icon, color] =
    detected === null
      ? [CircleDashed, cssVar('inkMuted')]
      : detected
        ? [CircleCheck, cssVar('detected')]
        : [CircleX, cssVar('missed')];
  const text = resultText(detected);
  return (
    <span
      title={`${sensor}: ${text}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 600, color, whiteSpace: 'nowrap' }}
    >
      <Icon size={12} strokeWidth={2.2} aria-hidden />
      {sensor}
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{text}</span>
    </span>
  );
}
