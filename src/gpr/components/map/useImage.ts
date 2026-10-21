import { useEffect, useState } from 'react';

interface Loaded {
  src: string;
  img: HTMLImageElement;
}

// Image at `src` once it has loaded; null while loading, on error, or without a src.
export function useImage(src: string | null): HTMLImageElement | null {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.onload = () => setLoaded({ src, img });
    img.src = src;
    return () => {
      img.onload = null;
    };
  }, [src]);

  return loaded && loaded.src === src ? loaded.img : null;
}
