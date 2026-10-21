"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LogoSpinner from "@/components/ui/LogoSpinner";
import DeckControls from "./DeckControls";
import SlideView from "./SlideView";
import { DECK_URL, FULLSCREEN_KEY, NEXT_KEYS, PREV_KEYS, SWIPE_PX } from "./constants";
import { useDeck } from "./useDeck";

/** Click-through viewer for the exported deck: buttons, keys, swipe and fullscreen. */
export default function DeckViewer({ title }: { title: string }) {
  const { deck, error } = useDeck();
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const count = deck?.slides.length ?? 0;

  const step = useCallback((delta: number) => setIndex((i) => Math.min(Math.max(i + delta, 0), count - 1)), [count]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void root.current?.requestFullscreen();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (NEXT_KEYS.includes(e.key)) step(1);
      else if (PREV_KEYS.includes(e.key)) step(-1);
      else if (e.key === "Home") setIndex(0);
      else if (e.key === "End") setIndex(count - 1);
      else if (e.key.toLowerCase() === FULLSCREEN_KEY) toggleFullscreen();
      else return;
      e.preventDefault();
    };
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, [count, step, toggleFullscreen]);

  // The next slide's image is fetched ahead, so turning the slide shows it at once.
  useEffect(() => {
    const next = deck?.slides[index + 1];
    if (next) new Image().src = `${DECK_URL}/${next.image}`;
  }, [deck, index]);

  if (error) {
    return <p className="flex h-full items-center justify-center font-mono text-xs text-bone-muted">The presentation could not be loaded ({error}).</p>;
  }
  if (!deck) return <LogoSpinner />;

  return (
    <div
      ref={root}
      className="flex h-full flex-col bg-night"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touchX.current ?? e.changedTouches[0].clientX);
        if (Math.abs(dx) > SWIPE_PX) step(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="flex min-h-0 flex-1 items-center justify-center p-4 [container-type:size]">
        <SlideView key={index} deck={deck} slide={deck.slides[index]} alt={`${title}, slide ${index + 1}`} />
      </div>
      <DeckControls index={index} count={count} fullscreen={fullscreen} onStep={step} onFullscreen={toggleFullscreen} />
    </div>
  );
}
