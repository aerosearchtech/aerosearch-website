'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Download, Maximize2, Minimize2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import IconButton from '@/gpr/components/ui/IconButton';
import { exportPng } from '@/gpr/lib/exportPng';
import { useViewer } from '@/gpr/lib/store';
import { cssVar, PALETTES } from '@/gpr/lib/theme';

interface PanelProps {
  title: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  exportName?: string; // enables PNG export of the panel's plots
  maximizable?: boolean;
}

const divider = `1px solid ${cssVar('border')}`;

export default function Panel(props: PanelProps) {
  const { title, icon: Icon, actions, toolbar, footer, children, className, exportName, maximizable = false } = props;
  const bodyRef = useRef<HTMLDivElement>(null);
  const [max, setMax] = useState(false);
  const theme = useViewer((s) => s.theme);

  useEffect(() => {
    if (!max) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setMax(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [max]);

  return (
    <>
      {max && <div className="gpr-scrim" onClick={() => setMax(false)} />}
      <section
        className={[className, max && 'gpr-panel-max'].filter(Boolean).join(' ')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          minWidth: 0,
          background: cssVar('surface'),
          border: divider,
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: `0 1px 3px ${cssVar('shadow')}`,
        }}
      >
        <header style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px 7px 12px', borderBottom: divider, flexWrap: 'wrap' }}>
          {Icon && <Icon size={15} strokeWidth={1.8} color={cssVar('inkMuted')} aria-hidden />}
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: cssVar('ink'), marginRight: 'auto' }}>{title}</h2>
          {actions}
          {exportName && (
            <IconButton
              icon={Download}
              label="Export as PNG"
              onClick={() => bodyRef.current && exportPng(bodyRef.current, exportName, PALETTES[theme].surface)}
            />
          )}
          {maximizable && (
            <IconButton icon={max ? Minimize2 : Maximize2} label={max ? 'Restore (Esc)' : 'Maximize'} onClick={() => setMax(!max)} />
          )}
        </header>
        {toolbar && <div style={{ padding: '8px 12px', borderBottom: divider }}>{toolbar}</div>}
        <div ref={bodyRef} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {children}
        </div>
        {footer && <footer style={{ padding: '8px 12px', borderTop: divider }}>{footer}</footer>}
      </section>
    </>
  );
}
