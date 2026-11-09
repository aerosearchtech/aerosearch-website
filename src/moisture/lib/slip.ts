import { COMMODITY_CODES, LOT } from './constants';
import { meterStamp } from './format';
import type { MeterReading } from './types';

export interface SlipRow {
  field: string;
  slip: string;
  record: string;
}

/** "M=12.6 T=31.4 … 10/11/26 02:25:36" → { M: '12.6', T: '31.4', …, stamp }. */
function parsePortLine(line: string): Record<string, string> {
  const tokens = line.split(' ');
  const pairs = tokens.filter((t) => t.includes('=')).map((t) => t.split('=') as [string, string]);
  const stamp = tokens.filter((t) => !t.includes('=')).join(' ');
  return { ...Object.fromEntries(pairs), stamp };
}

/**
 * The fields the meter prints on its slip (moisture, temperature, commodity,
 * date and time), read back from the signed port line and set against the record.
 */
export function slipRows(reading: MeterReading): SlipRow[] {
  const p = parsePortLine(reading.line);
  return [
    { field: 'MOISTURE', slip: `${p.M} %`, record: `${reading.moisture.toFixed(1)} %` },
    { field: 'TEMPERATURE', slip: `${p.T} °C`, record: `${reading.tempC.toFixed(1)} °C` },
    { field: 'COMMODITY', slip: COMMODITY_CODES[p.C] ?? p.C, record: LOT.commodity },
    { field: 'DATE · TIME', slip: p.stamp, record: meterStamp(reading.at) },
  ];
}
