"use client";

import { useEffect, useRef } from "react";
import { DECK_URL } from "./constants";
import type { DeckVideo } from "./types";

const pct = (f: number): string => `${f * 100}%`;

/** A slide video where PowerPoint placed it, cropped the same way, playing from the start as its slide opens. */
export default function SlideVideo({ video }: { video: DeckVideo }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [l, t, r, b] = video.crop;
  const sx = 1 - l - r;
  const sy = 1 - t - b;

  useEffect(() => {
    const v = ref.current;
    // Browsers refuse sound until the viewer has interacted with the page; then it plays muted.
    v?.play().catch(() => {
      v.muted = true;
      void v.play().catch(() => undefined);
    });
  }, []);

  return (
    <div className="absolute overflow-hidden" style={{ left: pct(video.x), top: pct(video.y), width: pct(video.w), height: pct(video.h) }}>
      <video
        ref={ref}
        src={`${DECK_URL}/${video.src}`}
        muted={video.muted}
        loop={video.loop}
        playsInline
        preload="auto"
        className="absolute max-w-none object-fill"
        style={{ left: pct(-l / sx), top: pct(-t / sy), width: pct(1 / sx), height: pct(1 / sy) }}
      />
    </div>
  );
}
