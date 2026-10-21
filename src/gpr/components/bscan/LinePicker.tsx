'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import IconButton from '@/gpr/components/ui/IconButton';
import Select from '@/gpr/components/ui/Select';
import { lineOf } from '@/gpr/lib/format';
import { useViewer } from '@/gpr/lib/store';
import type { FlightMeta, SurveyLine } from '@/gpr/lib/types';

const FULL = 'full';
const WINDOW = 'window';

// Jump the B-scan to a whole survey line (or the full flight), or step to the neighbouring line.
export default function LinePicker({ meta }: { meta: FlightMeta }) {
  const view = useViewer((s) => s.view);
  const setView = useViewer((s) => s.setView);
  const resetView = useViewer((s) => s.resetView);
  if (!view) return null;

  const show = (l: SurveyLine): void => setView({ ...view, x0: l.start, x1: l.end + 1 });
  const centre = lineOf(meta, Math.floor((view.x0 + view.x1) / 2));
  const exact = meta.lines.find((l) => view.x0 === l.start && view.x1 === l.end + 1);
  const value = view.x0 === 0 && view.x1 === meta.nTraces ? FULL : exact ? String(exact.id) : WINDOW;
  const from = centre?.start ?? view.x0;
  const prev = meta.lines.findLast((l) => l.start < from);
  const next = meta.lines.find((l) => l.start > from);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <IconButton icon={ChevronLeft} label="Previous line ( [ )" onClick={() => prev && show(prev)} />
      <Select
        ariaLabel="Survey line"
        value={value}
        onChange={(v) => (v === FULL ? resetView() : show(meta.lines.find((l) => String(l.id) === v) ?? meta.lines[0]))}
      >
        <option value={FULL}>Full flight</option>
        <option value={WINDOW} disabled hidden>
          {centre ? `Zoomed in L${centre.id}` : 'Zoomed in'}
        </option>
        {meta.lines.map((l) => (
          <option key={l.id} value={String(l.id)}>
            Line {l.id} · {l.lengthM.toFixed(0)} m
          </option>
        ))}
      </Select>
      <IconButton icon={ChevronRight} label="Next line ( ] )" onClick={() => next && show(next)} />
    </div>
  );
}
