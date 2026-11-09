import { classColors } from '../../theme/colors';
import type { KernelResult } from '../../types/analysis';
import { confidenceTag } from '../../utils/refractions';

interface Props {
  imageUrl: string;
  size: [number, number];
  kernels: KernelResult[];
  filter: string | null;
  onSelect: (k: KernelResult) => void;
}

/** Tray photo with one box per detected kernel, coloured by class. */
export function TrayOverlay({ imageUrl, size, kernels, filter, onSelect }: Props) {
  const [w, h] = size;
  const stroke = Math.max(2, w / 600);
  const font = stroke * 6;
  return (
    <div className="tray">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        <image href={imageUrl} width={w} height={h} />
        {kernels.map((k) => {
          if (!k.bbox) return null;
          const [x, y, bw, bh] = k.bbox;
          const color = classColors[k.pred] ?? classColors.UNK;
          const label = `${k.pred} ${confidenceTag(k.confidence)}`;
          return (
            <g key={k.idx} className="tray-box" opacity={filter && k.pred !== filter ? 0.15 : 1} onClick={() => onSelect(k)}>
              <rect x={x} y={y} width={bw} height={bh} fill="none" stroke={color} strokeWidth={stroke} />
              {k.pred !== 'NOR' && (
                <>
                  <rect x={x} y={y - font * 1.3} width={label.length * font * 0.62 + stroke * 2} height={font * 1.3} fill={color} />
                  <text className="tray-tag" x={x + stroke} y={y - font * 0.3} fontSize={font}>{label}</text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
