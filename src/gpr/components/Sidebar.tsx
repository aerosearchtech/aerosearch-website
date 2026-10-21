'use client';

import { PanelLeftClose, PanelLeftOpen, SlidersHorizontal } from 'lucide-react';
import ProcessingPanel from '@/gpr/components/ProcessingPanel';
import IconButton from '@/gpr/components/ui/IconButton';
import Panel from '@/gpr/components/ui/Panel';
import { useViewer } from '@/gpr/lib/store';
import { cssVar } from '@/gpr/lib/theme';
import type { FlightMeta } from '@/gpr/lib/types';

// Processing controls, collapsible to a thin rail to give the plots more room.
export default function Sidebar({ meta, busy }: { meta: FlightMeta; busy: boolean }) {
  const open = useViewer((s) => s.sidebarOpen);
  const toggle = useViewer((s) => s.toggleSidebar);

  return (
    <aside className="gpr-sidebar">
      {open ? (
        <Panel title="Processing" icon={SlidersHorizontal} actions={<IconButton icon={PanelLeftClose} label="Collapse panel" onClick={toggle} />}>
          <ProcessingPanel meta={meta} busy={busy} />
        </Panel>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 7,
            background: cssVar('surface'),
            border: `1px solid ${cssVar('border')}`,
            borderRadius: 10,
          }}
        >
          <IconButton icon={PanelLeftOpen} label="Show processing controls" onClick={toggle} />
        </div>
      )}
    </aside>
  );
}
