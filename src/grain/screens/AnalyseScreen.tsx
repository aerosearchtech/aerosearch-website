import type { ComponentProps } from 'react';
import { CapturePanel } from '../components/analyse/CapturePanel';
import { SamplePanel } from '../components/analyse/SamplePanel';

interface Props {
  sample: ComponentProps<typeof SamplePanel>;
  capture: ComponentProps<typeof CapturePanel>;
}

export function AnalyseScreen({ sample, capture }: Props) {
  return (
    <div className="analyse-screen">
      <SamplePanel {...sample} />
      <CapturePanel {...capture} />
    </div>
  );
}
