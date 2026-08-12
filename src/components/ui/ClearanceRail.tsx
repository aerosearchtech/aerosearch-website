"use client";

import { useEffect, useState } from "react";

/**
 * Scroll progress, told in the language of the work: ground behind you is
 * cleared (bone), ground ahead is not (signal red), and the frontier between
 * them is where the survey has reached. It is a real progress indicator — the
 * reframing is the point, not decoration.
 */
export default function ClearanceRail() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const pct = Math.round(progress * 100);

  return (
    <div
      className="pointer-events-none fixed left-6 top-1/2 z-40 hidden h-[44vh] -translate-y-1/2 lg:block"
      aria-hidden
    >
      {/* Uncleared ground */}
      <div className="relative h-full w-px bg-signal/25">
        {/* Cleared ground */}
        <div
          className="absolute left-0 top-0 w-px bg-bone transition-[height] duration-150 ease-out"
          style={{ height: `${pct}%` }}
        />
        {/* The frontier */}
        <div
          className="absolute -left-[3px] h-[7px] w-[7px] -translate-y-1/2 bg-signal transition-[top] duration-150 ease-out"
          style={{ top: `${pct}%` }}
        />
        {/* Stake ticks every quarter */}
        {[0, 25, 50, 75, 100].map((t) => (
          <div
            key={t}
            className="absolute -left-1 h-px w-[9px] bg-bone-faint/50"
            style={{ top: `${t}%` }}
          />
        ))}
      </div>

      {/* Rotated about its left edge, so half the cap height falls either side
          of the origin — the offset clears the rail rather than centring on it. */}
      <div className="absolute -bottom-14 left-0 origin-left translate-x-[14px] -rotate-90 whitespace-nowrap font-mono text-[10px] uppercase tracking-label text-bone-faint">
        Cleared {String(pct).padStart(2, "0")}%
      </div>
    </div>
  );
}
