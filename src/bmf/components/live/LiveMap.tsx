'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_FIT_PADDING_PX,
  MAP_MAX_ZOOM,
  MINE_CLASS_COLOR,
  MINE_CLASS_LABEL,
  MINE_PANE,
  MINE_PANE_Z,
  MINE_PIN_RADIUS,
  MOSAIC_PANE,
  MOSAIC_PANE_Z,
  TILE_ATTRIBUTION,
  TILE_NATIVE_MAX_ZOOM,
  TILE_URL,
} from '@/bmf/lib/live/constants';
import type { FootprintKind, LatLon, LiveMine, Mission, Photo, TrailPoint, Vehicle } from '@/bmf/lib/live/types';
import type { MosaicImage } from '@/bmf/lib/live/useMosaic';
import { DEFAULT_THEME, PALETTES, type Palette, type ThemeName } from '@/bmf/lib/theme';

interface Props {
  vehicle: Vehicle | null;
  trail: TrailPoint[];
  mission: Mission | null;
  missionVersion: number;
  photos: Photo[];
  footprints: Record<FootprintKind, boolean>;
  /** Live survey mosaic drawn under the mission lines. */
  mosaic: MosaicImage | null;
  follow: boolean;
  /** Bumped by the FIT button. */
  fitRequest: number;
  onDroneClick: () => void;
  /** Live detections, pinned above everything but the drone. */
  mines: LiveMine[];
  selectedMine: string | null;
  onMineClick: (id: string) => void;
}

/** Leaflet paths take literal colours, so the palette is read once on mount. */
function palette(): Palette {
  const theme = document.documentElement.getAttribute('data-theme') as ThemeName | null;
  return PALETTES[theme ?? DEFAULT_THEME];
}

/** Built once; heading turns the inner svg so clicks are never lost to a re-render. */
const DRONE_ICON = L.divIcon({
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  html: `<svg width="30" height="30" viewBox="0 0 30 30" style="cursor:pointer;filter:drop-shadow(0 0 4px var(--bg0))">
    <path d="M15 2 L25 26 L15 20 L5 26 Z" fill="var(--am)" stroke="var(--bg0)" stroke-width="1.5"/></svg>`,
});

function missionBounds(m: Mission): L.LatLngBounds | null {
  const pts: LatLon[] = [...m.polygon, ...m.legs.flatMap((g) => [g.from, g.to])];
  return pts.length ? L.latLngBounds(pts) : null;
}

/** Satellite map with the mission, the flown trail, photo footprints and the drone. */
export default function LiveMap({ vehicle, trail, mission, missionVersion, photos, footprints, mosaic, follow, fitRequest, onDroneClick, mines, selectedMine, onMineClick }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layers = useRef<{ mission: L.LayerGroup; photos: L.LayerGroup; mines: L.LayerGroup; trail: L.Polyline; home: L.CircleMarker; drone: L.Marker; mosaic: L.ImageOverlay | null } | null>(null);
  const colors = useRef<Palette | null>(null);
  /** What the view was last fitted to; a mission fit beats a position fit. */
  const fitted = useRef<'none' | 'vehicle' | 'mission'>('none');
  const droneClick = useRef(onDroneClick);
  droneClick.current = onDroneClick;
  const mineClick = useRef(onMineClick);
  mineClick.current = onMineClick;

  useEffect(() => {
    if (!divRef.current) return;
    const p = (colors.current = palette());
    fitted.current = 'none';
    const m = L.map(divRef.current, { zoomControl: true, maxZoom: MAP_MAX_ZOOM }).setView(MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM);
    L.tileLayer(TILE_URL, { maxNativeZoom: TILE_NATIVE_MAX_ZOOM, maxZoom: MAP_MAX_ZOOM, attribution: TILE_ATTRIBUTION }).addTo(m);
    L.control.scale({ imperial: false }).addTo(m);
    const credit = m.attributionControl.getContainer();
    credit?.classList.add('collapsed');
    credit?.setAttribute('title', 'Map imagery credit');
    credit?.addEventListener('click', () => credit.classList.toggle('collapsed'));
    // Between the satellite tiles and the mission/photo vectors.
    m.createPane(MOSAIC_PANE).style.zIndex = String(MOSAIC_PANE_Z);
    m.createPane(MINE_PANE).style.zIndex = String(MINE_PANE_Z);
    const drone = L.marker(MAP_DEFAULT_CENTER, { icon: DRONE_ICON, zIndexOffset: 1000, title: 'Click for the live camera feed' }).on('click', () => droneClick.current());
    layers.current = {
      mission: L.layerGroup().addTo(m),
      photos: L.layerGroup().addTo(m),
      mines: L.layerGroup().addTo(m),
      trail: L.polyline([], { color: p.gn, weight: 2.5 }).addTo(m),
      home: L.circleMarker(MAP_DEFAULT_CENTER, { radius: 6, color: p.bg0, weight: 2, fillColor: p.gn, fillOpacity: 1 }),
      drone,
      mosaic: null,
    };
    map.current = m;
    // The map's box is sized by flex layout after mount.
    const resize = new ResizeObserver(() => m.invalidateSize());
    resize.observe(divRef.current);
    return () => {
      resize.disconnect();
      m.remove();
      map.current = layers.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    const l = layers.current;
    const p = colors.current;
    if (!m || !l || !p) return;
    l.mission.clearLayers();
    if (!mission) return;
    if (mission.polygon.length) {
      L.polygon(mission.polygon, { color: p.tl, weight: 2, fillOpacity: 0.06, dashArray: mission.polygonSource === 'hull' ? '6 4' : undefined }).addTo(l.mission);
    }
    for (const g of mission.legs) {
      L.polyline([g.from, g.to], g.survey ? { color: p.am, weight: 3 } : { color: p.tx2, weight: 2, dashArray: '4 6' }).addTo(l.mission);
    }
    const b = missionBounds(mission);
    if (b && fitted.current !== 'mission') {
      m.fitBounds(b, { padding: [MAP_FIT_PADDING_PX, MAP_FIT_PADDING_PX], maxZoom: TILE_NATIVE_MAX_ZOOM });
      fitted.current = 'mission';
    }
  }, [mission, missionVersion]);

  useEffect(() => {
    const l = layers.current;
    const p = colors.current;
    if (!l || !p) return;
    l.photos.clearLayers();
    for (const ph of photos) {
      if (footprints.rgb) L.polygon(ph.footprint.rgb, { color: p.bl, weight: 1, fillOpacity: 0.03 }).addTo(l.photos);
      if (footprints.thermal) L.polygon(ph.footprint.thermal, { color: p.or, weight: 1, fillOpacity: 0.12 }).addTo(l.photos);
      L.circleMarker([ph.lat, ph.lon], { radius: 2.5, color: ph.acked ? p.or : p.rd, weight: 0, fillOpacity: 1 })
        .bindTooltip(`#${ph.n} · ${ph.utc.slice(11, 19)} UTC · ${ph.altRel.toFixed(1)} m`)
        .addTo(l.photos);
    }
  }, [photos, photos.length, footprints]);

  useEffect(() => {
    const m = map.current;
    const l = layers.current;
    if (!m || !l) return;
    if (!mosaic) {
      l.mosaic?.remove();
      l.mosaic = null;
    } else if (!l.mosaic) {
      l.mosaic = L.imageOverlay(mosaic.url, mosaic.bounds, { pane: MOSAIC_PANE }).addTo(m);
    } else {
      l.mosaic.setUrl(mosaic.url).setBounds(L.latLngBounds(mosaic.bounds));
    }
  }, [mosaic]);

  useEffect(() => {
    const l = layers.current;
    const p = colors.current;
    if (!l || !p) return;
    l.mines.clearLayers();
    for (const mine of mines) {
      const sel = mine.id === selectedMine;
      L.circleMarker([mine.lat, mine.lon], {
        pane: MINE_PANE,
        radius: sel ? MINE_PIN_RADIUS * 1.5 : MINE_PIN_RADIUS,
        color: sel ? p.am : p.bg0,
        weight: 2,
        fillColor: p[MINE_CLASS_COLOR[mine.class]],
        fillOpacity: 1,
      })
        .bindTooltip(`${MINE_CLASS_LABEL[mine.class]} · ${Math.round(mine.conf * 100)}% · ${mine.sightings}× seen`)
        .on('click', () => mineClick.current(mine.id))
        .addTo(l.mines);
    }
  }, [mines, selectedMine]);

  useEffect(() => {
    const m = map.current;
    const mine = mines.find((x) => x.id === selectedMine);
    if (m && mine) m.setView([mine.lat, mine.lon], Math.max(m.getZoom(), TILE_NATIVE_MAX_ZOOM));
    // Only a new selection moves the view, not refreshed detections.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMine]);

  useEffect(() => {
    layers.current?.trail.setLatLngs(trail.map(([lat, lon]): LatLon => [lat, lon]));
  }, [trail, trail.length]);

  useEffect(() => {
    const m = map.current;
    const l = layers.current;
    if (!m || !l || !vehicle) return;
    const home = vehicle.home ?? mission?.home ?? null;
    if (home) l.home.setLatLng(home).addTo(m);
    if (vehicle.lat === undefined || vehicle.lon === undefined) return;
    const pos: LatLon = [vehicle.lat, vehicle.lon];
    l.drone.setLatLng(pos).addTo(m);
    const svg = l.drone.getElement()?.querySelector('svg');
    if (svg) svg.style.transform = `rotate(${vehicle.heading ?? 0}deg)`;
    if (follow) m.panTo(pos, { animate: false });
    else if (fitted.current === 'none') {
      m.setView(pos, MAP_DEFAULT_ZOOM + 2);
      fitted.current = 'vehicle';
    }
  }, [vehicle, mission, follow]);

  useEffect(() => {
    const m = map.current;
    if (!m || !fitRequest) return;
    const b = mission ? missionBounds(mission) : null;
    const pts: LatLon[] = [...trail.map(([lat, lon]): LatLon => [lat, lon]), ...mines.map((x): LatLon => [x.lat, x.lon])];
    const all = b ? b.extend(L.latLngBounds(pts.length ? pts : [b.getCenter()])) : pts.length ? L.latLngBounds(pts) : null;
    if (all) m.fitBounds(all, { padding: [MAP_FIT_PADDING_PX, MAP_FIT_PADDING_PX], maxZoom: TILE_NATIVE_MAX_ZOOM });
    // Only the button triggers a fit; later data must not re-fit the view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitRequest]);

  return <div ref={divRef} style={{ position: 'absolute', inset: 0, background: 'var(--mapInk)' }} />;
}
