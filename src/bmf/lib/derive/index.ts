// deriveView(state) — the single place store state becomes render-ready view
// models. Components stay presentational and consume slices of ViewModel.

import {
  CONF_CONFIRMED,
  AOI_DEPTH_M,
  AOI_WIDTH_M,
  BREACH_FORCE,
  CLASSIFICATION,
  EOD_TEAMS,
  MANUAL_CLEAR_RATE_M2_PER_HR,
  MINE_SPECS,
  PHASES,
  PROFILE_TAG,
  PROOF_MAX_UNSWEPT_M,
  PROOF_MIN_SURVEY,
  ROUTE_PROFILES,
  TASK_STATE_LABEL,
} from '../constants';
import { chainage } from '../geom';
import { CLASS_BG, PALETTES, type Palette } from '../theme';
import type { Mine, TaskState } from '../types';
import { applyPlan, buildLanePlan, deriveClearance } from './clearance';
import { deriveDetect } from './detect';
import { deriveFusion } from './fusion';
import { derivePreflight } from './preflight';
import { deriveNeutralise, teamColor } from './neutralise';
import { deriveRun } from './survey';
import { hm, pad } from './types';
import type {
  CompareRow,
  DetectView,
  Kpi,
  OptionCard,
  PhaseTab,
  State,
  TaskRow,
  ViewModel,
} from './types';

export * from './types';

/** A lane through under-surveyed ground is not clean, it is only unmapped. */
const isUnswept = (surveyMean: number, unsweptM: number): boolean =>
  surveyMean < PROOF_MIN_SURVEY || unsweptM > PROOF_MAX_UNSWEPT_M;

function phaseTabs(
  s: State,
  p: Palette,
  d: DetectView,
  tasks: TaskRow[],
  certified: boolean,
): PhaseTab[] {
  const sel = s.routes.find((r) => r.id === s.selectedRouteId) ?? null;
  const proofed = tasks.filter((t) => t.state === 'proofed').length;
  const status: Record<string, { text: string; color: string }> = {
    detect: {
      text: `${d.sweptPct.toFixed(0)}% SWEPT · ${d.mapped} DEVICES`,
      color: d.sweptPct >= 80 ? p.gn : p.am,
    },
    breach: {
      text: sel
        ? `${sel.label} · ${sel.metrics.minesToClear} TO CLEAR · ${Math.round(sel.metrics.surveyMean * 100)}% CONF`
        : 'NO LANE SELECTED',
      color: !sel ? p.rd : isUnswept(sel.metrics.surveyMean, sel.metrics.unsweptM) ? p.am : p.gn,
    },
    neutralise: {
      text: sel ? `${proofed}/${tasks.length} PROOFED · ${certified ? 'LANE OPEN' : 'LANE CLOSED'}` : 'AWAITING LANE',
      color: certified ? p.gn : sel ? p.am : p.tx3,
    },
  };
  return PHASES.map((ph) => ({
    id: ph.id,
    label: ph.label,
    caption: ph.caption,
    active: ph.id === s.phase,
    status: status[ph.id].text,
    statusColor: status[ph.id].color,
  }));
}

function phaseKpis(s: State, p: Palette, v: Omit<ViewModel, 'kpis' | 'phases'>): Kpi[] {
  const total = s.field.mines.length;
  if (s.phase === 'detect') {
    const d = v.detect;
    return [
      { label: 'AREA SWEPT', val: d.sweptPct.toFixed(0), unit: '% OF AO', color: d.sweptPct >= 80 ? p.gn : p.am },
      { label: 'FUSED QUALITY', val: (d.meanQuality * 100).toFixed(0), unit: '% MEAN', color: p.tl },
      {
        label: 'DEVICES MAPPED',
        val: String(d.mapped),
        unit: 'FIXES',
        color: p.tx,
      },
      {
        label: 'MINE DENSITY',
        val: d.density.perKmFront.at.toFixed(0),
        unit: 'AT / km FRONT',
        color: d.density.perKmFront.at >= 750 ? p.rd : p.am,
      },
      { label: 'MEAN CONFIDENCE', val: d.meanConf.toFixed(0), unit: '% FUSED', color: p.am },
      { label: 'SURVEY AGE', val: d.ageStr, unit: d.ageUnit, color: p.tx2 },
    ];
  }
  if (s.phase === 'neutralise') {
    const n = v.neutralise;
    return [
      { label: 'LANE TASKS', val: String(v.tasks.length), unit: 'DEVICES', color: p.tx },
      { label: 'CLEARED', val: n.progressPct.toFixed(0), unit: '% OF LANE', color: p.tl },
      { label: 'PROOFED', val: n.proofedPct.toFixed(0), unit: '% OF LANE', color: p.gn },
      { label: 'TEAMS COMMITTED', val: `${n.committed}/${EOD_TEAMS.length}`, unit: 'EOD', color: p.am },
      { label: 'TIME TO OPEN', val: n.timeToOpenStr, unit: 'REMAINING', color: p.am },
      {
        label: 'LANE STATUS',
        val: n.certified ? 'OPEN' : 'CLOSED',
        unit: n.certified ? 'CERTIFIED' : 'NOT CERTIFIED',
        color: n.certified ? p.gn : p.rd,
      },
    ];
  }
  const sel = v.selected;
  return [
    { label: 'DEVICES MAPPED', val: String(total), unit: 'IN AO', color: p.tx },
    { label: 'LANE WIDTH', val: String(s.corridorWidthM), unit: 'm CORRIDOR', color: p.am },
    {
      label: 'LANE CONFIDENCE',
      val: `${Math.round((sel?.metrics.surveyMean ?? 0) * 100)}`,
      unit: '% SURVEYED',
      color: sel && !isUnswept(sel.metrics.surveyMean, sel.metrics.unsweptM) ? p.gn : p.am,
    },
    {
      label: 'DEVICES TO CLEAR',
      val: String(sel?.metrics.minesToClear ?? 0),
      unit: `of ${total}`,
      color: p.rd,
    },
    { label: 'BREACH EFFORT', val: hm(sel?.metrics.minutesToClear ?? 0), unit: 'EST', color: p.am },
    { label: 'CLEARANCE AVOIDED', val: `${v.savedPct.toFixed(1)}`, unit: '% OF FIELD', color: p.gn },
  ];
}

export function deriveView(s: State): ViewModel {
  const p = PALETTES[s.theme];
  const selected = s.routes.find((r) => r.id === s.selectedRouteId) ?? null;
  const total = s.field.mines.length;

  const bestId = s.routes.length
    ? s.routes.reduce((a, b) => (a.metrics.score <= b.metrics.score ? a : b)).id
    : null;

  const byId = new Map(s.field.mines.map((m) => [m.id, m]));
  const selectedMines = selected
    ? selected.mineIds
        .map((id) => byId.get(id))
        .filter((m): m is Mine => !!m)
        .sort((a, b) => chainage(a, selected.path) - chainage(b, selected.path))
    : [];

  // Full-field manual clearance, the baseline the corridor is measured against.
  const fieldMinutes = ((AOI_WIDTH_M * AOI_DEPTH_M) / MANUAL_CLEAR_RATE_M2_PER_HR) * 60;
  const laneMinutes = selected?.metrics.minutesToClear ?? 0;
  const savedPct = total ? (1 - (selected?.metrics.minesToClear ?? 0) / total) * 100 : 0;

  const options: OptionCard[] = s.routes.map((r) => {
    const conf = Math.round(r.metrics.surveyMean * 100);
    return {
      id: r.id,
      label: r.label,
      tag: PROFILE_TAG[r.profile],
      caption: ROUTE_PROFILES.find((x) => x.id === r.profile)?.caption ?? '',
      color: p.route[r.profile],
      rowBg: r.id === s.selectedRouteId ? 'rgba(127,127,127,0.10)' : 'transparent',
      best: r.id === bestId,
      selected: r.id === s.selectedRouteId,
      mines: r.metrics.minesToClear,
      lengthM: r.metrics.lengthM,
      turns: r.metrics.turns,
      effort: hm(r.metrics.minutesToClear),
      conf,
      confW: `${conf}%`,
      unswept: isUnswept(r.metrics.surveyMean, r.metrics.unsweptM),
      unsweptM: r.metrics.unsweptM,
    };
  });

  const rawTasks: TaskRow[] = selectedMines.map((m, i) => {
    const spec = MINE_SPECS[m.type];
    const conf = Math.round(m.confidence * 100);
    const state: TaskState = s.taskStates[m.id] ?? 'pending';
    const teamId = s.taskTeams[m.id] ?? null;
    return {
      id: m.id,
      seq: i + 1,
      model: m.model,
      typeLabel: spec.label,
      short: spec.short,
      sev: spec.sev,
      color: p.mine[m.type],
      rowBg: m.id === s.hoverMineId ? 'rgba(127,127,127,0.12)' : 'transparent',
      chainageM: selected ? chainage(m, selected.path) : 0,
      depth: m.depthM > 0 ? `${(m.depthM * 100).toFixed(0)} cm` : 'SURFACE',
      conf,
      confW: `${conf}%`,
      sensors: m.sensors,
      status: conf >= CONF_CONFIRMED ? 'CONFIRMED' : 'PROBABLE',
      statusColor: conf >= CONF_CONFIRMED ? p.gn : p.am,
      effort: `${spec.minutesToClear} min`,
      effortMin: spec.minutesToClear,
      state,
      stateLabel: TASK_STATE_LABEL[state],
      stateColor: p.state[state],
      markerColor: s.phase === 'neutralise' ? p.state[state] : p.mine[m.type],
      falseAlarm: false,
      teamId,
      teamName: EOD_TEAMS.find((t) => t.id === teamId)?.name ?? 'UNASSIGNED',
      teamColor: teamColor(p, teamId),
    };
  });

  const maxMines = Math.max(1, ...s.routes.map((r) => r.metrics.minesToClear));
  const compare: CompareRow[] = s.routes.map((r) => ({
    id: r.id,
    label: r.label,
    tag: PROFILE_TAG[r.profile],
    color: p.route[r.profile],
    mines: r.metrics.minesToClear,
    mineW: `${(r.metrics.minesToClear / maxMines) * 100}%`,
    lengthM: r.metrics.lengthM,
    turns: r.metrics.turns,
    conf: Math.round(r.metrics.surveyMean * 100),
    best: r.id === bestId,
  }));

  // One plan serves both the estimate and the playback: the board takes its
  // effort figures from it always, and its device states while a run is loaded.
  const plan = buildLanePlan(s, selectedMines, selected);
  const clearance = deriveClearance(s, p, plan, selectedMines);
  const tasks = plan ? applyPlan(rawTasks, plan, clearance, p) : rawTasks;

  const run = deriveRun(s, p);
  const detect = deriveDetect(s, p, run && !run.done ? run : null);
  const fusion = deriveFusion(s, p);
  const preflight = derivePreflight(s, p);
  const neutralise = deriveNeutralise(s, p, tasks, plan, clearance);

  const base: Omit<ViewModel, 'kpis' | 'phases'> = {
    phase: s.phase,
    classText: CLASSIFICATION,
    classBg: CLASS_BG[CLASSIFICATION],
    clockStr: `${pad(Math.floor(s.elapsedS / 60))}:${pad(s.elapsedS % 60)}`,
    statusText: s.planning ? 'SOLVING LANE' : selected ? 'LANE PLANNED' : 'NO LANE',
    statusColor: s.planning ? p.am : selected ? p.gn : p.rd,
    options,
    tasks,
    compare,
    selected,
    selectedMines,
    totalDevices: total,
    corridorWidthM: s.corridorWidthM,
    breachForce: BREACH_FORCE[s.corridorWidthM] ?? BREACH_FORCE[6],
    laneHours: hm(laneMinutes),
    fieldHours: hm(fieldMinutes),
    savedPct,
    solveMs: s.solveMs,
    planning: s.planning,
    detect,
    neutralise,
    fusion,
    preflight,
    run,
    clearance,
  };

  return {
    ...base,
    phases: phaseTabs(s, p, detect, tasks, neutralise.certified),
    kpis: phaseKpis(s, p, base),
  };
}
