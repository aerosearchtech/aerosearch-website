// Live demo: a flight recorded by iotech/export_demo.py, played back in the browser.

import { SENSOR_CHANNELS } from '@/bmf/lib/constants';
import type { SensorTag } from '@/bmf/lib/types';
import type { CropKind, FootprintKind, MineClass } from './types';

/** The exported flight under public/. */
export const DEMO_URL = '/demo/live-fusion/flight4';
/** How often the playback clock re-renders the page. */
export const DEMO_TICK_MS = 250;
/** A feed further than this from the clock is re-seeked. */
export const VIDEO_SYNC_S = 0.4;
/** Older than this the link is shown as stale. */
export const LINK_STALE_S = 3;

export const TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
export const TILE_ATTRIBUTION = 'Imagery © Esri, Maxar, Earthstar Geographics';
/** The imagery's native maximum; deeper zooms upscale it. */
export const TILE_NATIVE_MAX_ZOOM = 18;
export const MAP_MAX_ZOOM = 22;
export const MAP_FIT_PADDING_PX = 40;
/** Before any mission or position arrives. */
export const MAP_DEFAULT_CENTER: [number, number] = [28.3904, 77.014];
export const MAP_DEFAULT_ZOOM = 17;

export const DRONE_CALLSIGN = 'HB10';
/** The C12's channels in the drone rail; colours match their photo footprints on the map. */
export const DRONE_CHANNELS: { tag: SensorTag; kind: FootprintKind; label: string; color: string }[] = [
  { tag: 'RGB', kind: 'rgb', label: 'RGB', color: 'var(--bl)' },
  { tag: 'LWIR', kind: 'thermal', label: 'THERMAL', color: 'var(--or)' },
];

/** BMF's other survey modalities, shown on standby: the HB10 carries only the two above. */
export const STANDBY_CHANNELS = SENSOR_CHANNELS.filter((c) => !DRONE_CHANNELS.some((d) => d.tag === c.id));

/** The operator shown in the header. */
export const OPERATOR_NAME = 'Commander A Tiwari';
export const OPERATOR_INITIALS = 'AT';

export const GPS_FIX_LABEL: Record<number, string> = {
  0: 'NO GPS',
  1: 'NO FIX',
  2: '2D',
  3: '3D',
  4: 'DGPS',
  5: 'RTK FLOAT',
  6: 'RTK FIXED',
};

/** Battery remaining (%) below which it shows red / amber. */
export const BATTERY_LOW_PCT = 25;
export const BATTERY_WARN_PCT = 45;
/** 3D fix or better shows green. */
export const GPS_GOOD_FIX = 3;

/** Flight messages: MAVLink severity at or below these levels. */
export const SEVERITY_ERROR = 3;
export const SEVERITY_WARNING = 4;

/** Photos listed in the side panel, newest first. */
export const PHOTO_LIST_MAX = 50;

export const MOSAIC_PANE = 'mosaic';
/** Leaflet: tiles 200, vectors 400. */
export const MOSAIC_PANE_Z = 300;

/** Mines found in the stitched frames. */
export const MINE_CLASS_LABEL: Record<MineClass, string> = { at_mine: 'AT MINE', pfm1_mine: 'PFM-1' };
/** Palette key per class: CSS var(--key) in panels, palette[key] on the map. */
export const MINE_CLASS_COLOR: Record<MineClass, 'rd' | 'or'> = { at_mine: 'rd', pfm1_mine: 'or' };
export const MINE_CLASSES = Object.keys(MINE_CLASS_LABEL) as MineClass[];
export const CROP_KINDS: CropKind[] = ['rgb', 'thermal', 'overlay'];
export const CROP_LABEL: Record<CropKind, string> = { rgb: 'RGB', thermal: 'THERMAL', overlay: 'OVERLAY' };
export const MINE_PIN_RADIUS = 7;
export const MINE_PANE = 'mines';
/** Above the mission and photo vectors (400). */
export const MINE_PANE_Z = 450;

/** Shown wherever a panel has no drone data behind it yet. */
export const NO_DATA = '—';

export const REPLAY_SPEEDS = [0.5, 1, 2];
export const REPLAY_DEFAULT_SPEED = 1;
