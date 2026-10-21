import { cssVar } from '@/gpr/lib/theme';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}

export default function Segmented<T extends string>({ options, value, onChange, ariaLabel }: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        padding: 2,
        gap: 2,
        borderRadius: 7,
        background: cssVar('raised'),
        border: `1px solid ${cssVar('border')}`,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            style={{
              border: 'none',
              borderRadius: 5,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: active ? 600 : 400,
              cursor: 'pointer',
              background: active ? cssVar('accent') : 'transparent',
              color: active ? cssVar('onAccent') : cssVar('inkSecondary'),
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
