'use client';

import { Crosshair, PanelLeftClose, PanelLeftOpen, SlidersHorizontal } from 'lucide-react';
import FlightFacts from '@/gpr/components/FlightFacts';
import ProcessingPanel from '@/gpr/components/ProcessingPanel';
import TargetsPanel from '@/gpr/components/targets/TargetsPanel';
import IconButton from '@/gpr/components/ui/IconButton';
import Panel from '@/gpr/components/ui/Panel';
import { useViewer } from '@/gpr/lib/store';
import { cssVar } from '@/gpr/lib/theme';
import type { FlightMeta } from '@/gpr/lib/types';

// Buried objects first (when the site has ground truth), processing and flight
// details folded under "Advanced". The whole column collapses to a rail.
export default function Sidebar({ meta, busy }: { meta: FlightMeta; busy: boolean }) {
  const open = useViewer((s) => s.sidebarOpen);
  const toggle = useViewer((s) => s.toggleSidebar);
  const targets = meta.targets ?? [];
  const collapse = <IconButton icon={PanelLeftClose} label="Collapse panel" onClick={toggle} />;

  if (!open) {
    return (
      <aside className="gpr-sidebar">
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
          <IconButton icon={PanelLeftOpen} label="Show side panel" onClick={toggle} />
        </div>
      </aside>
    );
  }

  return (
    <aside className="gpr-sidebar">
      {targets.length > 0 && (
        <Panel title="Buried objects" icon={Crosshair} actions={collapse}>
          <TargetsPanel meta={meta} targets={targets} />
        </Panel>
      )}
      <Panel
        title={targets.length ? 'Advanced' : 'Processing'}
        icon={SlidersHorizontal}
        actions={targets.length === 0 && collapse}
        collapsible
        defaultOpen={targets.length === 0}
      >
        <div style={{ overflowY: 'auto', minHeight: 0, flex: 1 }}>
          {targets.length > 0 && <FlightFacts meta={meta} />}
          <ProcessingPanel meta={meta} busy={busy} />
        </div>
      </Panel>
    </aside>
  );
}
