import { useEffect, useState } from 'react';
import Logo from '@/components/ui/Logo';
import { PRODUCT_NAME, TIME_ZONE_LABEL } from '../../config/constants';
import type { ThemeMode } from '../../theme/colors';
import type { Meta } from '../../types/analysis';
import { clock, dateLabel } from '../../utils/format';

interface Props {
  meta: Meta | null;
  signedCount: number;
  theme: ThemeMode;
  onTheme: (mode: ThemeMode) => void;
}

const THEMES: ThemeMode[] = ['dark', 'light'];

export function AppHeader({ meta, signedCount, theme, onTheme }: Props) {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const model = meta?.commodities.find((c) => c.model)?.model;

  return (
    <header className="app-header">
      <div className="brand-mark">
        <Logo />
      </div>
      <div className="brand">
        <div className="brand-title">{PRODUCT_NAME}</div>
        <div className="brand-sub">UNIT {meta?.device_id ?? '—'}</div>
      </div>
      <div className="chips">
        <span className={`chip ${meta ? 'is-warn' : 'is-bad'}`}><i />{meta ? 'RECORDED REPLAY' : 'RECORDING NOT LOADED'}</span>
        {model && <span className="chip">MODEL <b>{model.arch.split(',')[0].toUpperCase()}</b></span>}
        <span className="chip">SIGNED <b>{signedCount}</b></span>
      </div>
      <div className="header-clock">
        <div className="clock">{clock(now)}</div>
        <div className="brand-sub">{dateLabel(now)} · {TIME_ZONE_LABEL}</div>
      </div>
      <div className="theme-toggle" role="radiogroup" aria-label="Theme">
        {THEMES.map((t) => (
          <button key={t} type="button" role="radio" aria-checked={t === theme} className={t === theme ? 'is-active' : ''} onClick={() => onTheme(t)}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>
    </header>
  );
}
