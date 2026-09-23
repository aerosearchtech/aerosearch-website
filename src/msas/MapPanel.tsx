"use client";

import { useEffect, useRef, useMemo } from "react";
import maplibregl, { LngLatBoundsLike, Map } from "maplibre-gl";
import { VesselDetail, VesselTrack, riskBand } from "./contracts";

type MapPanelProps = {
  vessels: VesselTrack[];
  selectedId: string | null;
  detail: VesselDetail | null;
  onSelect: (trackId: string) => void;
};

// Tactical Colors from designer's msas.css
const COLORS = {
    PHOS: "#7ce0d3",
    RED: "#ff4a3d",
    AMBER: "#ffb546",
    GRN: "#7ce0a8",
    VIOLET: "#b899ff",
    INK_1: "#b9c9d2",
    INK_3: "#4a5c68",
    LABEL_LOW: "#6a7c88"
};

const STYLE_URL = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

function createVesselMarker(vessel: VesselTrack, isSelected: boolean, onSelect: (id: string) => void) {
  const el = document.createElement("div");
  el.style.position = "relative";
  el.style.width = "60px";
  el.style.height = "60px";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.cursor = "pointer";
  el.onclick = (e) => { e.stopPropagation(); onSelect(vessel.id); };

  const rb = riskBand(vessel.riskScore);
  
  const color = rb === "critical" ? COLORS.RED
              : rb === "high"  ? COLORS.AMBER
              : vessel.type.toUpperCase() === "FISHING" || vessel.type === "30" ? COLORS.VIOLET
              : COLORS.GRN;

  const size = isSelected ? 12 : 9;
  const rot = vessel.courseDegrees || 0;
  
  let shapeStr = "";
  const upperType = vessel.type.toUpperCase();
  if (upperType.startsWith("8") || upperType.includes("TANKER")) {
      shapeStr = `<rect x="${-size*0.7}" y="${-size*0.7}" width="${size*1.4}" height="${size*1.4}" transform="rotate(45, 0, 0)" fill="none" stroke="${color}" stroke-width="1.6" />`;
  } else if (upperType.startsWith("7") || upperType.includes("CARGO") || upperType.includes("CONTAINER")) {
      shapeStr = `<rect x="${-size*0.8}" y="${-size*0.8}" width="${size*1.6}" height="${size*1.6}" fill="none" stroke="${color}" stroke-width="1.6" />`;
  } else if (upperType === "30" || upperType.includes("FISHING")) {
      shapeStr = `<circle r="${size*0.8}" fill="none" stroke="${color}" stroke-width="1.4" />`;
  } else if (upperType === "60" || upperType.includes("PASSENGER")) {
      shapeStr = `<circle r="${size*0.9}" fill="none" stroke="${color}" stroke-width="1.4" stroke-dasharray="2 2" />`;
  } else {
      shapeStr = `<polygon points="0,${-size} ${size*0.9},${size*0.7} ${-size*0.9},${size*0.7}" fill="none" stroke="${color}" stroke-width="1.6" />`;
  }

  const selectedRing = isSelected ? `<circle r="${size*2.2}" fill="none" stroke="${color}" stroke-dasharray="2 3" stroke-width="1" opacity="0.7"/>` : "";
  const leaderLine = `<line x1="0" y1="0" x2="0" y2="-20" stroke="${color}" stroke-width="1.1" opacity="0.85" />`;

  const svgInner = `
    <svg width="60" height="60" viewBox="-30 -30 60 60" style="transform: rotate(${rot}deg); pointer-events: none; overflow: visible;">
      ${selectedRing}
      ${shapeStr}
      ${leaderLine}
    </svg>
  `;

  let labelHtml = "";
  if (isSelected || rb === "critical" || rb === "high") {
    const txtColor = rb==='critical'?'#ff7f76':rb==='high'?'#ffc97a':COLORS.INK_1;
    const shortName = vessel.name.length > 16 ? vessel.name.slice(0,16)+'…' : vessel.name;
    labelHtml = `
      <div style="position: absolute; left: 38px; top: 12px; pointer-events: none; white-space: nowrap; font-family: 'JetBrains Mono', monospace; font-size: 10px; line-height: 1.3; z-index: 10;">
        <div style="color: ${txtColor}; text-shadow: 0px 0px 4px #000, 1px 1px 2px #000; font-weight: bold;">${vessel.id} · ${shortName}</div>
        <div style="color: ${COLORS.INK_3}; text-shadow: 0px 0px 4px #000, 1px 1px 2px #000;">${vessel.speedKnots.toFixed(1)}kn · ${String(Math.round(rot)).padStart(3,'0')}°</div>
      </div>
    `;
  } else {
    labelHtml = `
      <div style="position: absolute; left: 38px; top: 22px; pointer-events: none; white-space: nowrap; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: ${COLORS.LABEL_LOW}; text-shadow: 0px 0px 4px #000, 1px 1px 2px #000;">
        ${vessel.id}
      </div>
    `;
  }

  el.innerHTML = svgInner + labelHtml;
  return el;
}

export function MapPanel({ vessels, selectedId, onSelect }: MapPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      attributionControl: false,
      center: [0, 0],
      zoom: 1
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    mapRef.current = map;

    const resize = () => map.resize();
    const observer = new ResizeObserver(resize);
    observer.observe(containerRef.current);
    map.on("load", resize);

    return () => {
      observer.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Effect to handle zooming to initial cluster or selected vessel
  useEffect(() => {
    const map = mapRef.current;
    if (!map || vessels.length === 0) return;

    if (selectedId) {
        const selected = vessels.find(v => v.id === selectedId);
        if (selected) {
            map.easeTo({
                center: [selected.lastPosition.lon, selected.lastPosition.lat],
                zoom: Math.max(map.getZoom(), 8),
                duration: 1000
            });
        }
    } else {
        // Fit to all vessels on first load
        const lons = vessels.map(v => v.lastPosition.lon);
        const lats = vessels.map(v => v.lastPosition.lat);
        const bounds: LngLatBoundsLike = [
            [Math.min(...lons) - 2, Math.min(...lats) - 2],
            [Math.max(...lons) + 2, Math.max(...lats) + 2]
        ];
        map.fitBounds(bounds, { padding: 50, animate: true });
    }
  }, [selectedId, vessels.length === 0]); // Run when vessels load or selection changes

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const syncMap = () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      vessels.forEach((vessel) => {
        const el = createVesselMarker(vessel, selectedId === vessel.id, onSelect);
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([vessel.lastPosition.lon, vessel.lastPosition.lat])
          .addTo(map);
        markersRef.current.push(marker);
      });
    };

    if (!map.isStyleLoaded()) {
      map.once("load", syncMap);
      return () => {
        map.off("load", syncMap);
      };
    }

    syncMap();
  }, [selectedId, vessels]);

  return (
    <div className="realMap" ref={containerRef} />
  );
}
