import { ChevronLeft, ChevronRight, Maximize, Minimize } from "lucide-react";

interface Props {
  index: number;
  count: number;
  fullscreen: boolean;
  onStep: (delta: number) => void;
  onFullscreen: () => void;
}

const btn =
  "flex h-9 w-9 items-center justify-center text-bone-muted transition-colors hover:text-bone disabled:opacity-30 disabled:hover:text-bone-muted";

/** Previous / next, the slide counter and fullscreen, under the slide. */
export default function DeckControls({ index, count, fullscreen, onStep, onFullscreen }: Props) {
  return (
    <div className="relative flex h-12 flex-none items-center justify-center gap-4 border-t border-line bg-soil font-mono text-xs tracking-label text-bone-muted">
      <button className={btn} onClick={() => onStep(-1)} disabled={index === 0} aria-label="Previous slide">
        <ChevronLeft size={20} />
      </button>
      <span className="w-20 text-center tabular-nums">
        {index + 1} / {count}
      </span>
      <button className={btn} onClick={() => onStep(1)} disabled={index === count - 1} aria-label="Next slide">
        <ChevronRight size={20} />
      </button>
      <button className={`${btn} absolute right-4`} onClick={onFullscreen} aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
        {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
      </button>
    </div>
  );
}
