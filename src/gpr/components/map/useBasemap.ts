import { useEffect, useMemo, useReducer } from 'react';
import { latLonToLocal, localToLatLon } from '@/gpr/lib/format';
import { tilesFor, zoomFor } from '@/gpr/lib/tiles';
import type { TileSpec } from '@/gpr/lib/tiles';
import type { FlightMeta, Size } from '@/gpr/lib/types';
import { mapMapping } from './drawMap';

// A loaded satellite tile placed in the flight's local metric frame.
export interface BasemapTile {
  img: HTMLImageElement;
  nw: [number, number];
  se: [number, number];
}

const cache = new Map<string, HTMLImageElement>();

const isReady = (img: HTMLImageElement | undefined): img is HTMLImageElement => !!img?.complete && img.naturalWidth > 0;

// Satellite tiles covering the map canvas; returns only the ones already loaded.
// Offline or blocked tiles are simply missing and retried on the next view change.
export function useBasemap(meta: FlightMeta, size: Size, enabled: boolean): BasemapTile[] {
  const [loaded, onLoad] = useReducer((n: number) => n + 1, 0);

  const specs = useMemo<TileSpec[]>(() => {
    if (!enabled || !size.width) return [];
    const m = mapMapping(size, meta);
    const [west, north] = m.toWorld(0, 0);
    const [east, south] = m.toWorld(size.width, size.height);
    const [latN, lonW] = localToLatLon(meta, west, north);
    const [latS, lonE] = localToLatLon(meta, east, south);
    return tilesFor(latN, lonW, latS, lonE, zoomFor(m.scale, meta.origin.lat));
  }, [meta, size, enabled]);

  useEffect(() => {
    for (const s of specs) {
      if (cache.has(s.url)) continue;
      const img = new Image();
      img.crossOrigin = 'anonymous'; // keeps the map canvas exportable
      img.onload = () => onLoad();
      img.onerror = () => cache.delete(s.url);
      img.src = s.url;
      cache.set(s.url, img);
    }
  }, [specs]);

  return useMemo(
    () =>
      specs.flatMap((s) => {
        const img = cache.get(s.url);
        return isReady(img) ? [{ img, nw: latLonToLocal(meta, s.north, s.west), se: latLonToLocal(meta, s.south, s.east) }] : [];
      }),
    // `loaded` re-reads the cache after each tile arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [specs, meta, loaded],
  );
}
