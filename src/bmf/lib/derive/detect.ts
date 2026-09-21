// DETECT phase: what the airborne survey actually produced — coverage per
// channel, the fused device inventory, and how much of the AO is still unknown.

import {
  AOI_DEPTH_M,
  CONF_CONFIRMED,
  MINE_SPECS,
  MINE_TYPES,
  SENSOR_CHANNELS,
} from '../constants';
import { computeDensity } from '../density';
import type { Palette } from '../theme';
import type {
  BarRow,
  ChannelRow,
  DensityRow,
  DetectView,
  InventoryRow,
  LogLine,
  RunView,
  State,
} from './types';

/** The inventory is a scrolling list, not a database — cap what we mount. */
const INVENTORY_LIMIT = 300;

const CONF_BINS = [
  { key: '80', label: '80–100', lo: 0.8, hi: 1.01 },
  { key: '70', label: '70–79', lo: 0.7, hi: 0.8 },
  { key: '60', label: '60–69', lo: 0.6, hi: 0.7 },
  { key: '00', label: '< 60', lo: 0, hi: 0.6 },
];

const ageStr = (min: number): string =>
  min < 60 ? `${min}` : `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}`;

/**
 * `run` gates the whole phase while a survey is flying: a fix the swarm has not
 * reached is not a fix, and a channel that has not launched has no coverage.
 * Reporting either early would front-run the sensors.
 */
export function deriveDetect(s: State, p: Palette, run: RunView | null): DetectView {
  const mines = run ? s.field.mines.filter((m) => run.visibleIds.has(m.id)) : s.field.mines;
  const total = mines.length || 1;
  const sweptPct = s.survey.sweptPct * (run ? run.sweptK : 1);

  const channels: ChannelRow[] = s.survey.channels.map((c) => {
    const spec = SENSOR_CHANNELS.find((x) => x.id === c.id)!;
    const flown = run ? run.progress[c.id] : 1;
    const coveragePct = c.coveragePct * flown;
    return {
      id: c.id,
      name: c.name,
      color: p[spec.colorKey],
      coveragePct,
      coverageW: `${coveragePct.toFixed(0)}%`,
      quality: c.meanQuality,
      fixShare: c.fixShare,
      fixW: `${c.fixShare.toFixed(0)}%`,
      passes: c.passes,
      swathM: c.swathM,
      lineSpacingM: c.lineSpacingM,
      holiday: c.swathM < c.lineSpacingM,
    };
  });

  const inventory: InventoryRow[] = mines
    .slice()
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, INVENTORY_LIMIT)
    .map((m) => {
      const spec = MINE_SPECS[m.type];
      const conf = Math.round(m.confidence * 100);
      return {
        id: m.id,
        model: m.model,
        short: spec.short,
        typeLabel: spec.label,
        sev: spec.sev,
        color: p.mine[m.type],
        rowBg: m.id === s.hoverMineId ? 'rgba(127,127,127,0.12)' : 'transparent',
        conf,
        confW: `${conf}%`,
        depth: m.depthM > 0 ? `${(m.depthM * 100).toFixed(0)} cm` : 'SURFACE',
        sensors: m.sensors,
        grid: `${4200 + Math.round(m.x)} ${6450 + Math.round(AOI_DEPTH_M - m.y)}`,
        status: conf >= CONF_CONFIRMED ? 'CONFIRMED' : 'PROBABLE',
        statusColor: conf >= CONF_CONFIRMED ? p.gn : p.am,
      };
    });

  const classTally: BarRow[] = MINE_TYPES.map((t) => {
    const n = mines.filter((m) => m.type === t).length;
    return {
      key: t,
      label: MINE_SPECS[t].label,
      detail: `${n}`,
      color: p.mine[t],
      value: n,
      width: `${(n / total) * 100}%`,
    };
  });

  const confBins: BarRow[] = CONF_BINS.map((b) => {
    const n = mines.filter((m) => m.confidence >= b.lo && m.confidence < b.hi).length;
    return {
      key: b.key,
      label: b.label,
      detail: `${n}`,
      color: b.lo * 100 >= CONF_CONFIRMED ? p.gn : b.lo >= 0.7 ? p.am : p.rd,
      value: n,
      width: `${(n / total) * 100}%`,
    };
  });

  // Mid-run the belt picture is re-read off what has actually been found, so
  // the AT/km figure climbs towards the truth as the sweep works into depth
  // rather than quoting the closed survey's answer from the first pass.
  const d = run ? computeDensity({ ...s.field, mines }) : s.density;

  // Mid-run the log is a running commentary; only channels that have actually
  // flown get a line, and nothing is called closed until everything has landed.
  const flownChannels = run ? channels.filter((c) => run.progress[c.id] > 0) : channels;
  const surveyLog: LogLine[] = [
    {
      time: 'T-00',
      text: run
        ? `survey in progress · ${sweptPct.toFixed(0)}% of AO swept`
        : `fused survey closed · ${sweptPct.toFixed(0)}% of AO to usable standard`,
      color: sweptPct >= 80 ? p.gn : p.am,
    },
    ...flownChannels.map((c) => ({
      time: c.id.padEnd(4, ' '),
      text: `${c.passes} passes · ${c.lineSpacingM} m spacing · ${c.swathM} m swath · ${c.coveragePct.toFixed(0)}% usable${c.holiday ? ' · HOLIDAYS' : ''}`,
      color: c.holiday ? p.am : c.color,
    })),
    {
      time: 'T-00',
      text: `${mines.length} devices fused from ${flownChannels.length} channels`,
      color: p.tl,
    },
    {
      time: 'T-00',
      text: `obstacle ${d.beltCount} belts · ${d.obstacleDepthM.toFixed(0)} m deep · ${d.perKmFront.at.toFixed(0)} AT/km of front`,
      color: p.am,
    },
  ];

  const meanConf = (mines.reduce((a, m) => a + m.confidence, 0) / total) * 100;
  const densityRows: DensityRow[] = [
    {
      key: 'at',
      label: 'ANTI-TANK',
      value: d.perKmFront.at.toFixed(0),
      unit: 'per km front',
      color: p.mine.at,
      note: d.perKmFront.at >= 750 ? 'AT OR ABOVE DOCTRINAL BELT' : 'BELOW DOCTRINAL BELT',
    },
    {
      key: 'ap',
      label: 'ANTI-PERSONNEL',
      value: d.perKmFront.ap.toFixed(0),
      unit: 'per km front',
      color: p.mine.ap,
    },
    {
      key: 'all',
      label: 'ALL DEVICES',
      value: d.perKmFrontAll.toFixed(0),
      unit: 'per km front',
      color: p.tx,
    },
    {
      key: 'areal',
      label: 'AREAL DENSITY',
      value: d.per100m2.toFixed(2),
      unit: 'per 100 m²',
      color: p.tl,
    },
    {
      key: 'peak',
      label: 'PEAK CELL',
      value: String(d.peakPer100m2),
      unit: 'per 100 m²',
      color: p.am,
    },
    {
      key: 'spacing',
      label: 'MEAN SPACING',
      value: d.meanSpacingM.toFixed(1),
      unit: 'm nearest',
      color: p.tx2,
    },
    {
      key: 'layout',
      label: 'LAID PATTERN',
      value: `${d.beltCount}×${Math.round(d.rowCount / Math.max(1, d.beltCount))}`,
      unit: 'belts × rows',
      color: p.vt,
    },
    {
      key: 'depth',
      label: 'OBSTACLE DEPTH',
      value: d.obstacleDepthM.toFixed(0),
      unit: 'm along axis',
      color: p.tx2,
    },
  ];

  return {
    density: d,
    densityRows,
    channels,
    inventory,
    classTally,
    confBins,
    surveyLog,
    meanConf,
    sweptPct,
    mapped: mines.length,
    meanQuality: s.survey.meanQuality,
    // A survey being flown right now has no age; one just closed starts at 0
    // and ages with the plan clock from the second it closed.
    ageStr: run ? 'LIVE' : ageStr(s.survey.ageMin + Math.floor((s.elapsedS - s.surveyAtS) / 60)),
    ageUnit: run ? 'SURVEYING' : 'MIN AGO',
    channelsUp: channels.filter((c) => c.coveragePct >= 50).length,
  };
}
