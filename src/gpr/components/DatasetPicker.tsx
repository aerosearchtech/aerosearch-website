'use client';

import Select from '@/gpr/components/ui/Select';
import { useViewer } from '@/gpr/lib/store';
import type { FlightIndexEntry } from '@/gpr/lib/types';

// Datasets grouped by their source (own trials, vendor sample surveys, ...).
function byGroup(index: FlightIndexEntry[]): [string, FlightIndexEntry[]][] {
  const groups = new Map<string, FlightIndexEntry[]>();
  for (const f of index) groups.set(f.group, [...(groups.get(f.group) ?? []), f]);
  return [...groups];
}

export default function DatasetPicker() {
  const index = useViewer((s) => s.index);
  const id = useViewer((s) => s.flight?.meta.id ?? '');
  const selectFlight = useViewer((s) => s.selectFlight);

  return (
    <Select ariaLabel="Dataset" value={id} onChange={(v) => void selectFlight(v)}>
      {byGroup(index).map(([group, flights]) => (
        <optgroup key={group} label={group}>
          {flights.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </optgroup>
      ))}
    </Select>
  );
}
