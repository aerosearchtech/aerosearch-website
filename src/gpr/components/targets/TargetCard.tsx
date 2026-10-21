'use client';

import { X } from 'lucide-react';
import StatusBadge from '@/gpr/components/targets/StatusBadge';
import IconButton from '@/gpr/components/ui/IconButton';
import { useViewer } from '@/gpr/lib/store';
import { depthText, SCORE_LABEL } from '@/gpr/lib/targets';
import { cssVar, FONT_MONO } from '@/gpr/lib/theme';
import type { FlightMeta, Target } from '@/gpr/lib/types';

// Selected object: what it is, what each sensor found, and every line that passed it.
export default function TargetCard({ meta, target }: { meta: FlightMeta; target: Target }) {
  const cursor = useViewer((s) => s.cursor);
  const focusPass = useViewer((s) => s.focusPass);
  const selectTarget = useViewer((s) => s.selectTarget);

  return (
    <div style={{ padding: '12px 14px', borderBottom: `1px solid ${cssVar('border')}`, background: cssVar('raised') }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: cssVar('inkMuted') }}>Object {target.no ?? '(not in evaluation)'}</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3, color: cssVar('ink') }}>{target.name}</div>
        </div>
        <IconButton icon={X} label="Clear selection" onClick={() => selectTarget(null)} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, margin: '8px 0', fontSize: 11.5, color: cssVar('inkSecondary') }}>
        <span>{depthText(target)}</span>
        {target.size && <span>{target.size} mm</span>}
        <StatusBadge sensor="GPR" detected={target.gpr} />
        <StatusBadge sensor="Mag" detected={target.mag} />
      </div>
      {target.passes.length === 0 ? (
        <div style={{ fontSize: 11.5, color: cssVar('inkMuted') }}>No survey line passed within 1 m.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: cssVar('inkMuted') }}>
            Passes · click to view
          </div>
          {target.passes.map((p) => {
            const active = cursor?.trace === p.trace;
            const line = meta.lines.find((l) => l.id === p.line);
            return (
              <button
                key={p.line}
                onClick={() => focusPass(p)}
                title={line?.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '34px 52px 1fr',
                  gap: 6,
                  textAlign: 'left',
                  padding: '4px 6px',
                  border: 'none',
                  borderRadius: 5,
                  cursor: 'pointer',
                  fontSize: 11.5,
                  background: active ? cssVar('accentSoft') : 'transparent',
                  color: cssVar('ink'),
                }}
              >
                <span style={{ fontWeight: 600 }}>L{p.line}</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: cssVar('inkSecondary') }}>{p.offsetM.toFixed(2)} m</span>
                <span style={{ color: p.score ? cssVar('detected') : cssVar('inkMuted') }}>
                  {p.score === null ? 'not scored' : SCORE_LABEL[p.score]}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
