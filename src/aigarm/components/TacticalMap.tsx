import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import * as maplibregl from 'maplibre-gl';
import type {
  ExpressionSpecification,
  Map as MapLibreMap,
  MapGeoJSONFeature,
  MapMouseEvent,
  Marker,
} from 'maplibre-gl';
import type { Feature, FeatureCollection, LineString, Polygon } from 'geojson';
import { mission } from '../data/mission';
import type { Coordinate, ViewId } from '../types';

export type MapMode = '2d' | 'terrain';
export type MapTool = 'select' | 'measure' | 'route' | 'viewshed' | 'ballistic' | 'threat';

interface TacticalMapProps {
  activeView: ViewId;
  selectedCandidateId: string;
  selectedRouteId: string;
  layerVisibility: Record<string, boolean>;
  mapMode: MapMode;
  displayMode: 'analysis' | 'imagery';
  activeTool: MapTool;
  children?: ReactNode;
  onSelectCandidate: (candidateId: string) => void;
  onSelectRoute: (routeId: string) => void;
  onCoordinateChange: (coordinate: Coordinate) => void;
  onMeasurementChange: (measurement: string | null) => void;
}

interface MarkerRecord {
  marker: Marker;
  element: HTMLButtonElement;
  id: string;
  kind: 'candidate' | 'threat' | 'uas';
}

const sourceIds = {
  zones: 'zones-source',
  soil: 'soil-source',
  viewshed: 'viewshed-source',
  routes: 'routes-source',
  grid: 'grid-source',
  measurement: 'measurement-source',
} as const;

const layerIds = {
  optimal: 'slope-optimal',
  marginal: 'slope-marginal',
  restricted: 'slope-restricted',
  soil: 'soil-overlay',
  viewshed: 'viewshed-overlay',
  routes: 'routes-line',
  routeGlow: 'routes-glow',
  grid: 'grid-lines',
  measurement: 'measurement-line',
  measurementPoints: 'measurement-points',
} as const;

const circlePolygon = (
  center: Coordinate,
  radiusKm: number,
  points = 64,
): Feature<Polygon> => {
  const coordinates: Coordinate[] = [];
  const latitudeScale = 110.574;
  const longitudeScale = 111.32 * Math.cos((center[1] * Math.PI) / 180);

  for (let index = 0; index <= points; index += 1) {
    const angle = (index / points) * Math.PI * 2;
    coordinates.push([
      center[0] + (Math.cos(angle) * radiusKm) / longitudeScale,
      center[1] + (Math.sin(angle) * radiusKm) / latitudeScale,
    ]);
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [coordinates] },
  };
};

const zoneFeature = (
  classification: 'optimal' | 'marginal' | 'restricted',
  coordinates: Coordinate[],
): Feature<Polygon> => ({
  type: 'Feature',
  properties: { classification },
  geometry: { type: 'Polygon', coordinates: [[...coordinates, coordinates[0]]] },
});

const zones: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: [
    zoneFeature('optimal', [
      [71.044, 26.912],
      [71.066, 26.91],
      [71.071, 26.928],
      [71.061, 26.939],
      [71.042, 26.932],
    ]),
    zoneFeature('optimal', [
      [71.023, 26.898],
      [71.044, 26.897],
      [71.049, 26.909],
      [71.038, 26.92],
      [71.021, 26.912],
    ]),
    zoneFeature('marginal', [
      [71.065, 26.888],
      [71.087, 26.893],
      [71.089, 26.912],
      [71.073, 26.919],
      [71.061, 26.904],
    ]),
    zoneFeature('marginal', [
      [71.013, 26.924],
      [71.034, 26.925],
      [71.039, 26.944],
      [71.023, 26.952],
      [71.009, 26.941],
    ]),
    zoneFeature('restricted', [
      [71.019, 26.938],
      [71.038, 26.936],
      [71.044, 26.958],
      [71.025, 26.966],
      [71.012, 26.953],
    ]),
    zoneFeature('restricted', [
      [71.079, 26.929],
      [71.097, 26.931],
      [71.1, 26.954],
      [71.086, 26.963],
      [71.074, 26.947],
    ]),
  ],
};

const soilAreas: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: [
    circlePolygon([71.039, 26.914], 0.8),
    circlePolygon([71.074, 26.901], 0.65),
  ],
};

const viewshed: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: [circlePolygon([71.056, 26.925], 2.7)],
};

const routeFeatures: FeatureCollection<LineString> = {
  type: 'FeatureCollection',
  features: mission.routes.map((route) => ({
    type: 'Feature',
    id: route.id,
    properties: { id: route.id, state: route.state },
    geometry: { type: 'LineString', coordinates: route.path },
  })),
};

const gridFeatures: FeatureCollection<LineString> = {
  type: 'FeatureCollection',
  features: [
    ...[71.02, 71.04, 71.06, 71.08].map((longitude) => ({
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [longitude, mission.bounds.south],
          [longitude, mission.bounds.north],
        ],
      },
    })),
    ...[26.89, 26.91, 26.93, 26.95].map((latitude) => ({
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [mission.bounds.west, latitude],
          [mission.bounds.east, latitude],
        ],
      },
    })),
  ],
};

const emptyMeasurement: FeatureCollection<LineString> = {
  type: 'FeatureCollection',
  features: [],
};

const haversineKm = (start: Coordinate, end: Coordinate) => {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(end[1] - start[1]);
  const longitudeDelta = toRadians(end[0] - start[0]);
  const startLatitude = toRadians(start[1]);
  const endLatitude = toRadians(end[1]);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const createMarkerButton = (
  kind: MarkerRecord['kind'],
  id: string,
  title: string,
  code: string,
) => {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = `tactical-marker tactical-marker--${kind}`;
  element.dataset.markerId = id;
  element.setAttribute('aria-label', title);

  const glyph = document.createElement('span');
  glyph.className = 'tactical-marker__glyph';
  glyph.textContent = code;
  const label = document.createElement('span');
  label.className = 'tactical-marker__label';
  label.textContent = title;

  element.append(glyph, label);
  return element;
};

export function TacticalMap({
  activeView,
  selectedCandidateId,
  selectedRouteId,
  layerVisibility,
  mapMode,
  displayMode,
  activeTool,
  children,
  onSelectCandidate,
  onSelectRoute,
  onCoordinateChange,
  onMeasurementChange,
}: TacticalMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRecordsRef = useRef<MarkerRecord[]>([]);
  const waypointMarkersRef = useRef<Marker[]>([]);
  const activeToolRef = useRef<MapTool>(activeTool);
  const selectCandidateRef = useRef(onSelectCandidate);
  const selectRouteRef = useRef(onSelectRoute);
  const coordinateRef = useRef(onCoordinateChange);
  const measurementChangeRef = useRef(onMeasurementChange);
  const measurementPointsRef = useRef<Coordinate[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailure, setMapFailure] = useState<string | null>(null);
  const [fallbackMeasurementPoints, setFallbackMeasurementPoints] = useState<
    Coordinate[]
  >([]);

  useEffect(() => {
    activeToolRef.current = activeTool;
    if (activeTool !== 'measure') {
      measurementPointsRef.current = [];
      setFallbackMeasurementPoints([]);
      measurementChangeRef.current(null);
      const source = mapRef.current?.getSource(sourceIds.measurement);
      if (source) {
        (source as maplibregl.GeoJSONSource).setData(emptyMeasurement);
      }
    }
  }, [activeTool]);

  useEffect(() => {
    selectCandidateRef.current = onSelectCandidate;
    selectRouteRef.current = onSelectRoute;
    coordinateRef.current = onCoordinateChange;
    measurementChangeRef.current = onMeasurementChange;
  }, [onCoordinateChange, onMeasurementChange, onSelectCandidate, onSelectRoute]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const probe = document.createElement('canvas');
    const hasWebGl2 = Boolean(
      window.WebGL2RenderingContext && probe.getContext('webgl2'),
    );
    if (!hasWebGl2) {
      setMapFailure('WEBGL2 UNAVAILABLE · STATIC MAP ACTIVE');
      return;
    }

    let map: MapLibreMap;
    try {
      map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          'mission-raster': {
            type: 'image',
            url: '/aigarm/mission_base.jpg',
            coordinates: [
              [mission.bounds.west, mission.bounds.north],
              [mission.bounds.east, mission.bounds.north],
              [mission.bounds.east, mission.bounds.south],
              [mission.bounds.west, mission.bounds.south],
            ],
          },
        },
        layers: [
          {
            id: 'mission-raster-layer',
            type: 'raster',
            source: 'mission-raster',
            paint: {
              'raster-saturation': -0.18,
              'raster-contrast': 0.12,
              'raster-brightness-max': 0.82,
            },
          },
        ],
      },
      center: mission.center,
      zoom: 12.65,
      minZoom: 11.4,
      maxZoom: 17.5,
      attributionControl: false,
      dragRotate: true,
      pitchWithRotate: true,
      maxBounds: [
        [mission.bounds.west - 0.02, mission.bounds.south - 0.02],
        [mission.bounds.east + 0.02, mission.bounds.north + 0.02],
      ],
      fadeDuration: 0,
      });
    } catch {
      setMapFailure('GPU MAP INITIALIZATION FAILED · STATIC MAP ACTIVE');
      return;
    }

    mapRef.current = map;
    map.on('error', (event) => {
      const message = event.error?.message ?? '';
      if (/webgl|shader|gpu/i.test(message)) {
        setMapFailure('GPU MAP RENDER FAILED · STATIC MAP ACTIVE');
      }
    });

    map.on('load', () => {
      map.addSource(sourceIds.zones, { type: 'geojson', data: zones });
      map.addSource(sourceIds.soil, { type: 'geojson', data: soilAreas });
      map.addSource(sourceIds.viewshed, { type: 'geojson', data: viewshed });
      map.addSource(sourceIds.routes, { type: 'geojson', data: routeFeatures });
      map.addSource(sourceIds.grid, { type: 'geojson', data: gridFeatures });
      map.addSource(sourceIds.measurement, {
        type: 'geojson',
        data: emptyMeasurement,
      });

      map.addLayer({
        id: layerIds.viewshed,
        type: 'fill',
        source: sourceIds.viewshed,
        paint: {
          'fill-color': '#5ab0ff',
          'fill-opacity': 0.1,
          'fill-outline-color': 'rgba(90,176,255,.48)',
        },
      });
      map.addLayer({
        id: layerIds.optimal,
        type: 'fill',
        source: sourceIds.zones,
        filter: ['==', ['get', 'classification'], 'optimal'],
        paint: {
          'fill-color': '#7dd27a',
          'fill-opacity': 0.2,
          'fill-outline-color': '#7dd27a',
        },
      });
      map.addLayer({
        id: layerIds.marginal,
        type: 'fill',
        source: sourceIds.zones,
        filter: ['==', ['get', 'classification'], 'marginal'],
        paint: {
          'fill-color': '#ffb547',
          'fill-opacity': 0.15,
          'fill-outline-color': '#ffb547',
        },
      });
      map.addLayer({
        id: layerIds.restricted,
        type: 'fill',
        source: sourceIds.zones,
        filter: ['==', ['get', 'classification'], 'restricted'],
        paint: {
          'fill-color': '#ff5656',
          'fill-opacity': 0.13,
          'fill-outline-color': '#ff5656',
        },
      });
      map.addLayer({
        id: layerIds.soil,
        type: 'fill',
        source: sourceIds.soil,
        paint: {
          'fill-color': '#ffb547',
          'fill-opacity': 0.09,
          'fill-outline-color': 'rgba(255,181,71,.62)',
        },
      });
      map.addLayer({
        id: layerIds.grid,
        type: 'line',
        source: sourceIds.grid,
        paint: {
          'line-color': 'rgba(125,210,122,.26)',
          'line-width': 0.8,
          'line-dasharray': [2, 3],
        },
      });
      map.addLayer({
        id: layerIds.routeGlow,
        type: 'line',
        source: sourceIds.routes,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#020403',
          'line-width': 8,
          'line-opacity': 0.72,
        },
      });
      map.addLayer({
        id: layerIds.routes,
        type: 'line',
        source: sourceIds.routes,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': [
            'match',
            ['get', 'state'],
            'recommended',
            '#7dd27a',
            'viable',
            '#ffb547',
            '#5ab0ff',
          ],
          'line-width': 2,
          'line-opacity': 0.9,
          'line-dasharray': [2, 1.4],
        },
      });
      map.addLayer({
        id: layerIds.measurement,
        type: 'line',
        source: sourceIds.measurement,
        paint: {
          'line-color': '#f4f8f5',
          'line-width': 1.5,
          'line-dasharray': [2, 2],
        },
      });
      map.addLayer({
        id: layerIds.measurementPoints,
        type: 'circle',
        source: sourceIds.measurement,
        paint: {
          'circle-color': '#07090a',
          'circle-radius': 4,
          'circle-stroke-color': '#7dd27a',
          'circle-stroke-width': 2,
        },
      });

      map.on(
        'click',
        layerIds.routes,
        (event: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
        const routeId = event.features?.[0]?.properties?.id as string | undefined;
        if (routeId) selectRouteRef.current(routeId);
        },
      );

      setMapReady(true);
    });

    map.on('mousemove', (event: MapMouseEvent) => {
      coordinateRef.current([
        Number(event.lngLat.lng.toFixed(5)),
        Number(event.lngLat.lat.toFixed(5)),
      ]);
    });

    map.on('click', (event: MapMouseEvent) => {
      if (activeToolRef.current !== 'measure') return;

      const nextPoint: Coordinate = [event.lngLat.lng, event.lngLat.lat];
      const current = measurementPointsRef.current;
      const points = current.length >= 2 ? [nextPoint] : [...current, nextPoint];
      measurementPointsRef.current = points;

      const source = map.getSource(sourceIds.measurement) as
        | maplibregl.GeoJSONSource
        | undefined;
      if (!source) return;

      const feature: Feature<LineString> = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: points },
      };
      source.setData({ type: 'FeatureCollection', features: [feature] });

      if (points.length === 2) {
        const distance = haversineKm(points[0], points[1]);
        measurementChangeRef.current(
          distance < 1
            ? `${Math.round(distance * 1000)} M`
            : `${distance.toFixed(2)} KM`,
        );
      } else {
        measurementChangeRef.current('SELECT END POINT');
      }
    });

    return () => {
      try {
        map.remove();
      } catch {
        // A partially initialized WebGL renderer may not have a painter to destroy.
      }
      if (mapRef.current === map) mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const markers: MarkerRecord[] = [];

    mission.candidates.forEach((candidate) => {
      const code = candidate.rank ? String(candidate.rank).padStart(2, '0') : '×';
      const element = createMarkerButton(
        'candidate',
        candidate.id,
        candidate.name,
        code,
      );
      element.dataset.state = candidate.state;
      element.addEventListener('click', (event) => {
        event.stopPropagation();
        selectCandidateRef.current(candidate.id);
      });
      const marker = new maplibregl.Marker({
        element,
        anchor: 'center',
      })
        .setLngLat(candidate.coordinate)
        .addTo(map);
      markers.push({ marker, element, id: candidate.id, kind: 'candidate' });
    });

    mission.threats.forEach((threat) => {
      const element = createMarkerButton(
        'threat',
        threat.id,
        threat.type,
        threat.id,
      );
      element.dataset.severity = threat.severity;
      const marker = new maplibregl.Marker({ element, anchor: 'center' })
        .setLngLat(threat.coordinate)
        .addTo(map);
      markers.push({ marker, element, id: threat.id, kind: 'threat' });
    });

    const uasCoordinates: Coordinate[] = [
      [71.033, 26.934],
      [71.071, 26.939],
      [71.052, 26.946],
    ];
    mission.assets.slice(0, 3).forEach((asset, index) => {
      const element = createMarkerButton(
        'uas',
        asset.id,
        `${asset.id} · ${asset.payload}`,
        '◇',
      );
      const marker = new maplibregl.Marker({ element, anchor: 'center' })
        .setLngLat(uasCoordinates[index])
        .addTo(map);
      markers.push({ marker, element, id: asset.id, kind: 'uas' });
    });

    markerRecordsRef.current = markers;
    return () => {
      markers.forEach(({ marker }) => marker.remove());
      markerRecordsRef.current = [];
    };
  }, [mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    markerRecordsRef.current.forEach((record) => {
      if (record.kind === 'candidate') {
        record.element.dataset.selected = String(record.id === selectedCandidateId);
      }
    });

    const candidate = mission.candidates.find(
      (item) => item.id === selectedCandidateId,
    );
    if (candidate && activeView === 'recce') {
      map.easeTo({
        center: candidate.coordinate,
        duration: 700,
        zoom: Math.max(map.getZoom(), 12.8),
      });
    }
  }, [activeView, mapReady, selectedCandidateId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    map.setPaintProperty(
      'mission-raster-layer',
      'raster-saturation',
      displayMode === 'imagery' ? -0.08 : -0.32,
    );
    map.setPaintProperty(
      'mission-raster-layer',
      'raster-contrast',
      displayMode === 'imagery' ? 0.08 : 0.18,
    );
    map.setPaintProperty(
      'mission-raster-layer',
      'raster-brightness-max',
      displayMode === 'imagery' ? 0.94 : 0.78,
    );
    map.setPaintProperty(
      layerIds.optimal,
      'fill-opacity',
      displayMode === 'imagery' ? 0.04 : 0.2,
    );
    map.setPaintProperty(
      layerIds.marginal,
      'fill-opacity',
      displayMode === 'imagery' ? 0.03 : 0.15,
    );
    map.setPaintProperty(
      layerIds.restricted,
      'fill-opacity',
      displayMode === 'imagery' ? 0.025 : 0.13,
    );
    map.setPaintProperty(
      layerIds.soil,
      'fill-opacity',
      displayMode === 'imagery' ? 0.015 : 0.09,
    );
  }, [displayMode, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    waypointMarkersRef.current.forEach((marker) => marker.remove());
    waypointMarkersRef.current = [];

    if (activeView !== 'routes' || !layerVisibility.routes) return;
    const route = mission.routes.find((item) => item.id === selectedRouteId);
    if (!route) return;

    waypointMarkersRef.current = route.waypoints.map((waypoint, index) => {
      const element = createMarkerButton(
        'candidate',
        waypoint.id,
        waypoint.id,
        String(index + 1),
      );
      element.classList.add('tactical-marker--waypoint');
      return new maplibregl.Marker({ element, anchor: 'center' })
        .setLngLat(waypoint.coordinate)
        .addTo(map);
    });

    map.fitBounds(
      route.path.reduce(
        (bounds, coordinate) => bounds.extend(coordinate),
        new maplibregl.LngLatBounds(route.path[0], route.path[0]),
      ),
      { padding: 90, duration: 700, pitch: mapMode === 'terrain' ? 52 : 0 },
    );
  }, [activeView, layerVisibility.routes, mapMode, mapReady, selectedRouteId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const rasterSource = map.getSource('mission-raster') as
      | maplibregl.ImageSource
      | undefined;
    rasterSource?.updateImage({
      url: mapMode === 'terrain' ? '/aigarm/topographic_map.jpg' : '/aigarm/mission_base.jpg',
      coordinates: [
        [mission.bounds.west, mission.bounds.north],
        [mission.bounds.east, mission.bounds.north],
        [mission.bounds.east, mission.bounds.south],
        [mission.bounds.west, mission.bounds.south],
      ],
    });
    map.easeTo({
      pitch: mapMode === 'terrain' ? 38 : 0,
      bearing: mapMode === 'terrain' ? -12 : 0,
      zoom:
        mapMode === 'terrain'
          ? Math.max(map.getZoom(), 13.25)
          : map.getZoom(),
      duration: 650,
    });
  }, [mapMode, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const setVisibility = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    };

    setVisibility(layerIds.optimal, Boolean(layerVisibility.slope));
    setVisibility(layerIds.marginal, Boolean(layerVisibility.slope));
    setVisibility(layerIds.restricted, Boolean(layerVisibility.slope));
    setVisibility(layerIds.soil, Boolean(layerVisibility.soil));
    setVisibility(layerIds.viewshed, Boolean(layerVisibility.viewshed));
    setVisibility(layerIds.routes, Boolean(layerVisibility.routes));
    setVisibility(layerIds.routeGlow, Boolean(layerVisibility.routes));
    setVisibility(layerIds.grid, Boolean(layerVisibility.grid));

    markerRecordsRef.current.forEach((record) => {
      if (record.kind === 'threat') {
        record.element.hidden = !layerVisibility.threats;
      }
    });
  }, [layerVisibility, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const colorExpression: ExpressionSpecification = [
      'case',
      ['==', ['get', 'id'], selectedRouteId],
      '#63ff76',
      ['match', ['get', 'state'], 'viable', '#ffb547', '#5ab0ff'],
    ];
    const widthExpression: ExpressionSpecification = [
      'case',
      ['==', ['get', 'id'], selectedRouteId],
      4.2,
      1.8,
    ];
    map.setPaintProperty(layerIds.routes, 'line-color', colorExpression);
    map.setPaintProperty(layerIds.routes, 'line-width', widthExpression);
    const glowExpression: ExpressionSpecification = [
      'case',
      ['==', ['get', 'id'], selectedRouteId],
      0.72,
      0,
    ];
    map.setPaintProperty(
      layerIds.routeGlow,
      'line-opacity',
      glowExpression,
    );
  }, [mapReady, selectedRouteId]);

  const coordinateFromFallbackEvent = (
    event: ReactMouseEvent<HTMLElement>,
  ): Coordinate => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const horizontal = (event.clientX - bounds.left) / bounds.width;
    const vertical = (event.clientY - bounds.top) / bounds.height;
    return [
      mission.bounds.west +
        Math.min(1, Math.max(0, horizontal)) *
          (mission.bounds.east - mission.bounds.west),
      mission.bounds.north -
        Math.min(1, Math.max(0, vertical)) *
          (mission.bounds.north - mission.bounds.south),
    ];
  };

  const handleFallbackMouseMove = (event: ReactMouseEvent<HTMLElement>) => {
    if (!mapFailure) return;
    const coordinate = coordinateFromFallbackEvent(event);
    coordinateRef.current([
      Number(coordinate[0].toFixed(5)),
      Number(coordinate[1].toFixed(5)),
    ]);
  };

  const handleFallbackClick = (event: ReactMouseEvent<HTMLElement>) => {
    if (!mapFailure || activeToolRef.current !== 'measure') return;
    if ((event.target as HTMLElement).closest('button, .sensor-card, .map-legend')) {
      return;
    }

    const nextPoint = coordinateFromFallbackEvent(event);
    const current = measurementPointsRef.current;
    const points = current.length >= 2 ? [nextPoint] : [...current, nextPoint];
    measurementPointsRef.current = points;
    setFallbackMeasurementPoints(points);

    if (points.length === 2) {
      const distance = haversineKm(points[0], points[1]);
      measurementChangeRef.current(
        distance < 1
          ? `${Math.round(distance * 1000)} M`
          : `${distance.toFixed(2)} KM`,
      );
    } else {
      measurementChangeRef.current('SELECT END POINT');
    }
  };

  const fallbackPosition = (coordinate: Coordinate) => ({
    left: `${((coordinate[0] - mission.bounds.west) / (mission.bounds.east - mission.bounds.west)) * 100}%`,
    top: `${((mission.bounds.north - coordinate[1]) / (mission.bounds.north - mission.bounds.south)) * 100}%`,
  });

  const fallbackSvgPoint = (coordinate: Coordinate) =>
    `${((coordinate[0] - mission.bounds.west) / (mission.bounds.east - mission.bounds.west)) * 100},${((mission.bounds.north - coordinate[1]) / (mission.bounds.north - mission.bounds.south)) * 100}`;
  const fallbackRoute =
    mission.routes.find((route) => route.id === selectedRouteId) ??
    mission.routes[0];

  return (
    <section
      className={`map-stage map-stage--${mapMode}`}
      data-tool={activeTool}
      aria-label="Interactive tactical mission map"
      onMouseMove={handleFallbackMouseMove}
      onClick={handleFallbackClick}
    >
      <div ref={containerRef} className="map-canvas" />
      {mapFailure && (
        <>
          <div
            className="map-fallback-world"
            key={`${mapMode}-${displayMode}`}
          >
            <img
              className={`map-fallback-raster map-fallback-raster--${displayMode}`}
              src={mapMode === 'terrain' ? '/aigarm/topographic_map.jpg' : '/aigarm/mission_base.jpg'}
              alt="Local static mission-area map"
              draggable={false}
            />
            <svg
              className="map-fallback-vectors"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {layerVisibility.routes &&
                mission.routes.map((route) => (
                  <polyline
                    key={route.id}
                    data-selected={route.id === selectedRouteId}
                    points={route.path.map(fallbackSvgPoint).join(' ')}
                  />
                ))}
              {fallbackMeasurementPoints.length > 0 && (
                <polyline
                  className="fallback-measurement-line"
                  points={fallbackMeasurementPoints.map(fallbackSvgPoint).join(' ')}
                />
              )}
            </svg>
            <div className="map-fallback-markers">
              {mission.candidates.map((candidate) => (
                <button
                  type="button"
                  key={candidate.id}
                  className="tactical-marker tactical-marker--candidate fallback-marker"
                  data-selected={candidate.id === selectedCandidateId}
                  data-state={candidate.state}
                  style={fallbackPosition(candidate.coordinate)}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectCandidate(candidate.id);
                  }}
                >
                  <span className="tactical-marker__glyph">
                    {candidate.rank
                      ? String(candidate.rank).padStart(2, '0')
                      : '×'}
                  </span>
                  <span className="tactical-marker__label">{candidate.name}</span>
                </button>
              ))}
              {activeView === 'routes' &&
                layerVisibility.routes &&
                fallbackRoute.waypoints.map((waypoint, index) => (
                  <span
                    key={waypoint.id}
                    className="tactical-marker tactical-marker--candidate tactical-marker--waypoint fallback-marker fallback-waypoint"
                    style={fallbackPosition(waypoint.coordinate)}
                  >
                    <span className="tactical-marker__glyph">{index + 1}</span>
                    <span className="tactical-marker__label">{waypoint.id}</span>
                  </span>
                ))}
              {layerVisibility.threats &&
                mission.threats.map((threat) => (
                  <span
                    key={threat.id}
                    className="tactical-marker tactical-marker--threat fallback-marker fallback-threat"
                    style={fallbackPosition(threat.coordinate)}
                  >
                    <span className="tactical-marker__glyph">{threat.id}</span>
                    <span className="tactical-marker__label">{threat.type}</span>
                  </span>
                ))}
            </div>
          </div>
          <div className="map-fallback-alert">{mapFailure}</div>
        </>
      )}
      <div className="map-tone" aria-hidden="true" />
      <div className="map-scan-grid" aria-hidden="true" />
      <div className="north-indicator" aria-label="North">
        <span>N</span>
        <i />
      </div>
      <div className="map-data-stamp">
        LOCAL MISSION RASTER · OFFLINE
        <span>
          {mapFailure ? 'STATIC FALLBACK' : mapReady ? 'RENDER READY' : 'INITIALIZING'}
        </span>
      </div>
      {children}
    </section>
  );
}
