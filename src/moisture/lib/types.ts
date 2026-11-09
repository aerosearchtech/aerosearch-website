import type { Tone } from './theme';

export type Role = 'operator' | 'officer' | 'hq';

export type Decision = 'accept' | 'cut' | 'reject';

export type ScenarioId = 'faq' | 'cut' | 'beyond';

/** One line as the meter sends it over RS-232, already parsed. */
export interface MeterReading {
  moisture: number;
  tempC: number;
  rh: number;
  curve: string;
  cup: string;
  at: Date;
  /** The raw line, exactly as hashed and signed. */
  line: string;
}

export interface BandResult {
  label: string;
  tone: Tone;
  /** Percent of MSP cut; null when the lot is outside the band file. */
  cutPct: number | null;
  note: string;
}

export interface Signature {
  hash: string;
  sig: string;
}

export interface SealedRecord {
  no: number;
  reading: MeterReading;
  band: BandResult;
  node: Signature;
  software: string;
  /** False while the node holds it in the encrypted queue. */
  synced: boolean;
  decision?: Decision;
  officer?: Signature;
}

export interface Lot {
  id: string;
  commodity: string;
  bags: number;
  bagKg: number;
  quintals: number;
  mspPerQuintal: number;
}

export interface Centre {
  id: string;
  name: string;
  node: string;
  lat: number;
  lon: number;
  tone: Tone;
}

export interface SafeguardEvent {
  title: string;
  node: string;
  when: string;
  body: string;
  tone: Tone;
}
