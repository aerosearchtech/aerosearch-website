import { EARTH_M_PER_DEG, LIGHT_SPEED_M_PER_NS } from './constants';
import type { FlightMeta, Processed, SurveyLine } from './types';

export const fixed = (v: number, digits: number): string => (Number.isFinite(v) ? v.toFixed(digits) : '–');

export const lineOf = (meta: FlightMeta, trace: number): SurveyLine | undefined =>
  meta.lines.find((l) => trace >= l.start && trace <= l.end);

// Two-way travel time (ns) of a row relative to the processed zero row.
export const rowToNs = (p: Processed, meta: FlightMeta, row: number): number => (row - p.zeroRow) * meta.dtNs;

// Depth below the surface for a row of trace `trace`.
export const rowToDepth = (p: Processed, meta: FlightMeta, trace: number, row: number, velocity: number): number =>
  ((row - p.surfaceRow[trace]) * meta.dtNs * velocity) / 2;

// Antenna height implied by the surface echo, assuming propagation in air.
export const radarHeight = (meta: FlightMeta, trace: number): number =>
  ((meta.surface[trace] - meta.t0Sample) * meta.dtNs * LIGHT_SPEED_M_PER_NS) / 2;

export function formatClock(iso: string, offsetS: number): string {
  const d = new Date(new Date(iso).getTime() + offsetS * 1000);
  return d.toTimeString().slice(0, 8);
}

const metresPerDegLon = (lat: number): number => EARTH_M_PER_DEG * Math.cos((lat * Math.PI) / 180);

// Local metric offsets (as written by the exporter) to and from WGS84 degrees.
export function localToLatLon(meta: FlightMeta, x: number, y: number): [number, number] {
  const { lat, lon } = meta.origin;
  return [lat + y / EARTH_M_PER_DEG, lon + x / metresPerDegLon(lat)];
}

export function latLonToLocal(meta: FlightMeta, lat: number, lon: number): [number, number] {
  const o = meta.origin;
  return [(lon - o.lon) * metresPerDegLon(o.lat), (lat - o.lat) * EARTH_M_PER_DEG];
}

export const toLatLon = (meta: FlightMeta, trace: number): [number, number] =>
  localToLatLon(meta, meta.x[trace], meta.y[trace]);
