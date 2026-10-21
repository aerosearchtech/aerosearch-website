import type { LucideIcon } from 'lucide-react';
import { cssVar } from '@/gpr/lib/theme';

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
}

// Square icon-only button; `label` is both the tooltip and the accessible name.
export default function IconButton({ icon: Icon, label, onClick, active = false }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        flex: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        border: `1px solid ${active ? 'transparent' : cssVar('border')}`,
        background: active ? cssVar('accentSoft') : 'transparent',
        color: active ? cssVar('accent') : cssVar('inkSecondary'),
      }}
    >
      <Icon size={15} strokeWidth={1.8} aria-hidden />
    </button>
  );
}
