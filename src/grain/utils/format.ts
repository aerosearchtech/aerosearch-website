import { TIME_ZONE } from '../config/constants';

export const pct = (value: number, digits = 2): string => `${value.toFixed(digits)}%`;

export const grams = (value: number): string => `${value.toFixed(2)} g`;

export const seconds = (ms: number): string => `${(ms / 1000).toFixed(2)} s`;

export const clock = (d: Date): string =>
  d.toLocaleTimeString('en-GB', { timeZone: TIME_ZONE, hour12: false });

export const dateLabel = (d: Date): string =>
  d.toLocaleDateString('en-GB', { timeZone: TIME_ZONE, day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

export const time = (iso: string): string => clock(new Date(iso));

export const kb = (text: string): string => `${(new Blob([text]).size / 1024).toFixed(1)} kB`;
