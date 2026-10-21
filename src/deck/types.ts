/** A video placed on a slide, as scripts/build-deck.ps1 exports it. Positions are fractions of the slide. */
export interface DeckVideo {
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** PowerPoint's crop as fractions of the source: left, top, right, bottom. */
  crop: [number, number, number, number];
  muted: boolean;
  loop: boolean;
}

export interface DeckSlide {
  image: string;
  videos: DeckVideo[];
}

export interface Deck {
  /** Pixel size of the slide images. */
  width: number;
  height: number;
  slides: DeckSlide[];
}
