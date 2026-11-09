import { REPLAY_ROOT } from '../config/constants';
import type { Decision, Meta, RecordedSample, ReferenceRequest, SignedRecord } from '../types/analysis';

async function load<T>(file: string): Promise<T> {
  const res = await fetch(`${REPLAY_ROOT}/${file}`);
  if (!res.ok) throw new Error(`Recording not found (${res.status})`);
  return (await res.json()) as T;
}

export const fetchMeta = (): Promise<Meta> => load<Meta>('meta.json');

export const loadReference = ({ profile, kernels }: ReferenceRequest): Promise<RecordedSample> =>
  load<RecordedSample>(`samples/${profile}-${kernels}.json`);

export const loadTray = (): Promise<RecordedSample> => load<RecordedSample>('samples/tray.json');

/** The record the device signed for this decision when the sample was recorded. */
export const recordedDecision = (sample: RecordedSample, decision: Decision): SignedRecord => sample.decisions[decision];
