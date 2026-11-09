const IST_PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

/** Parts of a date in IST, whatever the viewer's time zone. */
const ist = (at: Date): Record<string, string> =>
  Object.fromEntries(IST_PARTS.formatToParts(at).map((p) => [p.type, p.value]));

export const clockIst = (at: Date): string => {
  const p = ist(at);
  return `${p.hour}:${p.minute}:${p.second} IST`;
};

/** Meter-style stamp: "08/11/26 10:42:09". */
export const meterStamp = (at: Date): string => {
  const p = ist(at);
  return `${p.day}/${p.month}/${p.year.slice(-2)} ${p.hour}:${p.minute}:${p.second}`;
};

export const recordNo = (no: number): string => `NO. ${String(no).padStart(6, '0')}`;
