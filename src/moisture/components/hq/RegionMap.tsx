'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CENTRES, PIN_RADIUS, REGION, TILE_ATTRIBUTION, TILE_MAX_ZOOM, TILE_URL } from '../../lib/constants';
import { PALETTES, type ThemeName } from '../../lib/theme';

/** Centres on a basemap, one pin per node, coloured by status. */
export default function RegionMap({ theme }: { theme: ThemeName }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!el.current) return;
    const p = PALETTES[theme];
    const map = L.map(el.current, { zoomControl: false, attributionControl: true }).setView(REGION.center, REGION.zoom);
    L.tileLayer(TILE_URL[theme], { attribution: TILE_ATTRIBUTION, maxZoom: TILE_MAX_ZOOM }).addTo(map);
    for (const c of CENTRES) {
      L.circleMarker([c.lat, c.lon], {
        radius: PIN_RADIUS,
        color: p.bg,
        weight: 2,
        fillColor: p[c.tone],
        fillOpacity: 1,
      })
        .bindTooltip(`${c.name} · ${c.node}`, { direction: 'top' })
        .addTo(map);
    }
    return () => {
      map.remove();
    };
  }, [theme]);

  return <div ref={el} style={{ position: 'absolute', inset: 0 }} />;
}
