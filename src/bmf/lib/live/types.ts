// Shapes of iotech/bmf_bridge.py /state and live_view.py, as recorded by iotech/export_demo.py.

export type LatLon = [number, number];
/** lat, lon, altitude above home (m). */
export type TrailPoint = [number, number, number];

export interface LinkInfo {
  source: string;
  replay: boolean;
  connected: boolean;
  /** A replay that has played to the end. */
  ended: boolean;
  /** Seconds since the last vehicle message; null before the first. */
  ageS: number | null;
}

/** Fields are absent until the drone has sent the message carrying them. */
export interface Vehicle {
  armed: boolean;
  mode: string | null;
  home: LatLon | null;
  lat?: number;
  lon?: number;
  altRel?: number;
  altAmsl?: number;
  heading?: number | null;
  groundSpeed?: number;
  climb?: number;
  roll?: number;
  pitch?: number;
  batteryV?: number | null;
  currentA?: number | null;
  batteryPct?: number | null;
  gpsFix?: number;
  sats?: number;
  hdop?: number | null;
  wpSeq?: number;
  flightS: number | null;
  homeDistM: number | null;
}

export interface MissionLeg {
  from: LatLon;
  to: LatLon;
  /** Camera trigger on along this leg. */
  survey: boolean;
  alt: number;
}

export interface Mission {
  items: number;
  home: LatLon | null;
  legs: MissionLeg[];
  polygon: LatLon[];
  /** 'file': a Mission Planner .poly; 'hull': outline of the survey lines. */
  polygonSource: 'file' | 'hull' | null;
  areaHa: number | null;
  surveyM: number;
  transitM: number;
  triggerM: number[];
  estPhotos: number;
  surveyAlt: number[];
}

export interface Photo {
  n: number;
  utc: string;
  lat: number;
  lon: number;
  altRel: number;
  heading: number;
  acked: boolean;
  footprint: { rgb: LatLon[]; thermal: LatLon[] };
}

export interface StatusText {
  utc: string;
  /** MAVLink severity, 0 emergency .. 7 debug. */
  severity: number;
  text: string;
}

export interface BridgeState {
  session: number;
  link: LinkInfo;
  vehicle: Vehicle;
  /** Bumped on every arming; the trail restarts with it. */
  flight: number;
  trailFrom: number;
  trail: TrailPoint[];
  mission: Mission | null;
  missionVersion: number;
  photosFile: string | null;
  photosFrom: number;
  photos: Photo[];
  status: StatusText[];
  /** Across-track ground width per metre of altitude of each camera. */
  swathPerM: Record<FootprintKind, number>;
}

export type FootprintKind = 'rgb' | 'thermal';

export type MosaicKind = 'rgb' | 'thermal';

/** The current flight's live mosaic (iotech/live_mosaic.py). */
export interface MosaicMeta {
  flight: number;
  frames: number;
  /** Bumped with every stitched frame. */
  version: number;
  /** [[south, west], [north, east]] */
  bounds: [LatLon, LatLon];
  cm_per_px: number;
  finished: boolean;
}

export type MineClass = 'at_mine' | 'pfm1_mine';

export type CropKind = 'rgb' | 'thermal' | 'overlay';

/** A mine iotech/live_detect.py found, merged over its sightings (live_inventory.py). */
export interface LiveMine {
  id: string;
  class: MineClass;
  conf: number;
  lat: number;
  lon: number;
  /** Stitched frame of the most confident sighting; the crops are from it. */
  frame: number;
  /** Frame it was first seen in. */
  first: number;
  sightings: number;
  /** Thermal and overlay only when the mine was inside the thermal view. */
  crops: CropKind[];
}

/** live_view.py /detections: the mines of the mosaic's run. */
export interface Detections {
  run: string | null;
  mines: LiveMine[];
}

/** A recorded flight, from iotech/replay_server.py /flights. */
export interface ReplayFlight {
  /** Its folder; what /play takes. */
  id: string;
  name: string;
  /** Recorder start, local ISO time. */
  start: string;
  /** Recorder start, unix seconds: the replay clock's zero. */
  startT: number;
  durationS: number;
  photos: number;
  videos: number;
  /** Telemetry recovered from Mission Planner logs; may have gaps. */
  partialTelemetry: boolean;
}

/** replay_server.py /status. */
export interface ReplayStatus {
  playing: boolean;
  flight: ReplayFlight | null;
  speed: number;
  error: string | null;
}

/** iotech/export_demo.py demo.json: a recorded flight; every t is seconds from the recorder start. */
export interface RecordedSample {
  t: number;
  v: Vehicle;
  flight: number;
  link: Pick<LinkInfo, 'connected' | 'ended' | 'ageS'>;
  /** [from, to) of RecordedDemo.trail and .photos. */
  trail: [number, number];
  photos: [number, number];
}

export interface RecordedDemo {
  flight: { name: string; start: string; durationS: number; photos: number };
  swathPerM: Record<FootprintKind, number>;
  trail: TrailPoint[];
  photos: Photo[];
  samples: RecordedSample[];
  missions: { t: number; mission: Mission | null }[];
  status: { t: number; list: StatusText[] }[];
  /** Image files mosaic/<index>_<kind>.webp. */
  mosaics: { t: number; bounds: [LatLon, LatLon] }[];
  /** Each mine from when the detector first listed it. */
  mines: { t: number; mine: LiveMine }[];
}
