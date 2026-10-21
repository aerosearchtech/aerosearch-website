import { useId } from 'react';
import { cssVar, FONT_MONO } from '@/gpr/lib/theme';

interface SliderProps {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint?: string;
}

export default function Slider({ label, value, display, min, max, step, onChange, hint }: SliderProps) {
  const id = useId();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <label htmlFor={id} style={{ color: cssVar('inkSecondary') }}>
          {label}
        </label>
        <span style={{ color: cssVar('ink'), fontFamily: FONT_MONO, fontSize: 11 }}>{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <span style={{ fontSize: 10.5, color: cssVar('inkMuted') }}>{hint}</span>}
    </div>
  );
}
