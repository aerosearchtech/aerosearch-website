import SlideVideo from "./SlideVideo";
import { DECK_URL } from "./constants";
import type { Deck, DeckSlide } from "./types";

interface Props {
  deck: Deck;
  slide: DeckSlide;
  alt: string;
}

/** One slide at the largest size its container fits (a CSS size container), with its videos over the image. */
export default function SlideView({ deck, slide, alt }: Props) {
  return (
    <div
      className="relative animate-slide-in"
      style={{ aspectRatio: `${deck.width} / ${deck.height}`, width: `min(100cqw, calc(100cqh * ${deck.width} / ${deck.height}))` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static export, pre-rendered slide */}
      <img src={`${DECK_URL}/${slide.image}`} alt={alt} draggable={false} className="absolute inset-0 h-full w-full select-none" />
      {slide.videos.map((v, i) => (
        <SlideVideo key={i} video={v} />
      ))}
    </div>
  );
}
