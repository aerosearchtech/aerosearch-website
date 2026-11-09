import { PIPELINE_SEGMENTS } from '../../config/constants';

interface Props {
  stages: string;
  progress: number;
  waiting: boolean;
}

const SEGMENTS: number[] = Array.from({ length: PIPELINE_SEGMENTS }, (_, i) => i);

/** Segmented progress bar; segments pulse while the server is still computing. */
export function PipelineBar({ stages, progress, waiting }: Props) {
  const filled = Math.round(progress * PIPELINE_SEGMENTS);
  return (
    <div className="pipeline">
      <div className="pipeline-head">
        <span className="ellipsis">PIPELINE · {stages}</span>
        <b>{waiting ? 'COMPUTING' : `${Math.round(progress * 100)}%`}</b>
      </div>
      <div className="pipeline-bar" style={{ gridTemplateColumns: `repeat(${PIPELINE_SEGMENTS}, 1fr)` }}>
        {SEGMENTS.map((i) => (
          <span
            key={i}
            className={waiting ? 'is-wait' : i < filled ? 'is-on' : ''}
            style={waiting ? { animationDelay: `${(i % 10) * 60}ms` } : undefined}
          />
        ))}
      </div>
    </div>
  );
}
