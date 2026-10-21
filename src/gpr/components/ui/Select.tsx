import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cssVar } from '@/gpr/lib/theme';

interface SelectProps {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode; // <option>/<optgroup> elements
}

// Native select styled to match the toolbar controls.
export default function Select({ ariaLabel, value, onChange, children }: SelectProps) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: 'none',
          font: 'inherit',
          fontSize: 12,
          fontWeight: 500,
          padding: '5px 30px 5px 10px',
          borderRadius: 7,
          cursor: 'pointer',
          background: cssVar('raised'),
          color: cssVar('ink'),
          border: `1px solid ${cssVar('border')}`,
        }}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        aria-hidden
        style={{ position: 'absolute', right: 10, pointerEvents: 'none', color: cssVar('inkMuted') }}
      />
    </div>
  );
}
