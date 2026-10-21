'use client';

import TargetCard from '@/gpr/components/targets/TargetCard';
import TargetList from '@/gpr/components/targets/TargetList';
import { useViewer } from '@/gpr/lib/store';
import type { FlightMeta, Target } from '@/gpr/lib/types';

export default function TargetsPanel({ meta, targets }: { meta: FlightMeta; targets: Target[] }) {
  const selected = useViewer((s) => s.selectedTarget);
  const target = selected === null ? undefined : targets[selected];
  return (
    <>
      {target && <TargetCard meta={meta} target={target} />}
      <TargetList targets={targets} />
    </>
  );
}
