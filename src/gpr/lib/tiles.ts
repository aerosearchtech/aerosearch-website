// Web Mercator XYZ tile maths for the satellite basemap.
import { BASEMAP } from './constants';

export interface TileSpec {
  url: string;
  north: number;
  west: number;
  south: number;
  east: number;
}

const EQUATOR_M_PER_PX_Z0 = 156_543.03; // ground resolution of a 256 px tile at zoom 0

const tileX = (lon: number, z: number): number => Math.floor(((lon + 180) / 360) * 2 ** z);
const tileY = (lat: number, z: number): number => {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
};
const tileLon = (x: number, z: number): number => (x / 2 ** z) * 360 - 180;
const tileLat = (y: number, z: number): number => (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / 2 ** z))) * 180) / Math.PI;

// Smallest zoom whose tiles are at least as sharp as the screen (px per metre).
export function zoomFor(pxPerM: number, lat: number): number {
  const z = Math.ceil(Math.log2(EQUATOR_M_PER_PX_Z0 * Math.cos((lat * Math.PI) / 180) * pxPerM));
  return Math.max(0, Math.min(BASEMAP.maxZoom, z));
}

// Tiles covering a lat/lon box, or none if the box would need too many.
export function tilesFor(north: number, west: number, south: number, east: number, z: number): TileSpec[] {
  const [x0, x1, y0, y1] = [tileX(west, z), tileX(east, z), tileY(north, z), tileY(south, z)];
  if ((x1 - x0 + 1) * (y1 - y0 + 1) > BASEMAP.maxTiles) return [];
  const tiles: TileSpec[] = [];
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      tiles.push({
        url: BASEMAP.url(z, x, y),
        north: tileLat(y, z),
        west: tileLon(x, z),
        south: tileLat(y + 1, z),
        east: tileLon(x + 1, z),
      });
    }
  }
  return tiles;
}
