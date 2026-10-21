import { DATA_DIR } from './constants';
import type { Flight, FlightIndexEntry, FlightMeta } from './types';

async function fetchOk(url: string): Promise<Response> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res;
}

export async function loadIndex(): Promise<FlightIndexEntry[]> {
  return (await fetchOk(`${DATA_DIR}/index.json`)).json();
}

export async function loadFlight(id: string): Promise<Flight> {
  const [metaRes, binRes] = await Promise.all([
    fetchOk(`${DATA_DIR}/${id}.json`),
    fetchOk(`${DATA_DIR}/${id}.bin`),
  ]);
  const meta: FlightMeta = await metaRes.json();
  const raw = new Int16Array(await binRes.arrayBuffer());
  if (raw.length !== meta.nTraces * meta.nSamples) throw new Error(`${id}: sample count mismatch`);
  return { meta, raw };
}
