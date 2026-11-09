import Logo from '@/components/ui/Logo';
import { NODE_ID, SYNC_TARGET } from '../lib/constants';
import { clockIst } from '../lib/format';
import { pendingRecords, queuedRecords, useMoisture } from '../lib/store';
import type { ThemeName } from '../lib/theme';
import type { Role } from '../lib/types';
import { useClock } from '../lib/useClock';

const ROLES: { id: Role; label: string; context: string }[] = [
  { id: 'operator', label: 'OPERATOR', context: `MOISTURE NODE · ${NODE_ID}` },
  { id: 'officer', label: 'OFFICER', context: 'OFFICER DECISION' },
  { id: 'hq', label: 'QC HQ', context: 'QC COMMAND · KMS / RMS' },
];

const THEMES: ThemeName[] = ['dark', 'light'];

export default function Header() {
  const { role, theme, records, linkUp, setRole, setTheme } = useMoisture();
  const queued = queuedRecords(records).length;
  const now = useClock();
  const context = ROLES.find((r) => r.id === role)?.context;

  return (
    <header className="m-head">
      <div className="m-brand">
        <Logo className="block h-auto w-7" />
        <span className="m-wordmark" role="img" aria-label="Aerosearch" />
        <span className="m-divider" />
        <span className="m-meta" style={{ color: 'var(--tx)' }}>{context}</span>
      </div>

      <nav className="m-tabs" aria-label="Role">
        {ROLES.map((r) => (
          <button key={r.id} className="m-tab" aria-pressed={role === r.id} onClick={() => setRole(r.id)}>
            {r.label}
          </button>
        ))}
      </nav>

      <div className="m-status m-meta">
        <span title="Demo: nothing leaves the browser">
          <span className="m-dot" style={{ background: linkUp ? 'var(--ok)' : 'var(--warn)' }} />
          {SYNC_TARGET} · {linkUp ? 'UP' : 'DOWN'}
        </span>
        <span style={{ color: queued ? 'var(--warn)' : undefined }}>QUEUE {queued}</span>
        <span>PENDING {pendingRecords(records).length}</span>
        <span style={{ color: 'var(--tx)' }}>{now ? clockIst(now) : ''}</span>
        <div className="m-tabs">
          {THEMES.map((t) => (
            <button key={t} className="m-tab" aria-pressed={theme === t} onClick={() => setTheme(t)}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
