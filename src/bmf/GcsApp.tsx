'use client';

import { useEffect } from 'react';
import BottomPanel from '@/bmf/components/BottomPanel';
import BreachMap from '@/bmf/components/BreachMap';
import ClassificationBanner from '@/bmf/components/ClassificationBanner';
import ClearanceTasking from '@/bmf/components/ClearanceTasking';
import CommandHeader from '@/bmf/components/CommandHeader';
import CorridorOptions from '@/bmf/components/CorridorOptions';
import KpiBand from '@/bmf/components/KpiBand';
import PhaseRail from '@/bmf/components/PhaseRail';
import SensorFusion from '@/bmf/components/SensorFusion';
import PreFlight from '@/bmf/components/preflight/PreFlight';
import DetectBottom from '@/bmf/components/detect/DetectBottom';
import DetectionInventory from '@/bmf/components/detect/DetectionInventory';
import SensorCoverage from '@/bmf/components/detect/SensorCoverage';
import NeutraliseBottom from '@/bmf/components/neutralise/NeutraliseBottom';
import TaskBoard from '@/bmf/components/neutralise/TaskBoard';
import TeamsPanel from '@/bmf/components/neutralise/TeamsPanel';
import { CLEARANCE_SECONDS, SOLVE_DEBOUNCE_MS } from '@/bmf/lib/constants';
import { runTotalS } from '@/bmf/lib/surveyRun';
import { deriveView } from '@/bmf/lib/derive';
import { FONT_SANS } from '@/bmf/lib/theme';
import { useGcs } from '@/bmf/lib/store';

export default function GcsApp() {
  const state = useGcs();
  const view = deriveView(state);

  const { field, start, goal, corridorWidthM, weights, survey } = state;

  useEffect(() => {
    useGcs.getState().hydrateTheme();
    const id = window.setInterval(() => useGcs.getState().tickClock(), 1000);
    return () => window.clearInterval(id);
  }, []);

  /* Survey playback runs off the frame clock rather than a timer so the sweep
     front and the airframes move smoothly and pause cleanly. */
  useEffect(() => {
    if (!state.runPlaying) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const st = useGcs.getState();
      if (st.runS === null) return;
      const total = runTotalS(st.payloadCounts);
      const next = st.runS + (now - last) / 1000;
      last = now;
      if (next >= total) {
        st.completeRun(total);
        return;
      }
      st.advanceRun(next);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [state.runPlaying]);

  /* The clearance runs off the same frame clock so the airframes move smoothly
     between contacts and the shot standoff reads as a pause, not a stall. */
  useEffect(() => {
    if (!state.clearancePlaying) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const st = useGcs.getState();
      if (st.clearanceS === null) return;
      const next = st.clearanceS + (now - last) / 1000;
      last = now;
      if (next >= CLEARANCE_SECONDS) {
        st.advanceClearance(CLEARANCE_SECONDS);
        st.setClearancePlaying(false);
        return;
      }
      st.advanceClearance(next);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [state.clearancePlaying]);

  /* Solving blocks the main thread for ~1s, so it is debounced: dragging a
     priority slider stays responsive and only the settled value is planned. */
  useEffect(() => {
    useGcs.setState({ planning: true });
    const id = window.setTimeout(() => useGcs.getState().recompute(), SOLVE_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [field, survey, start, goal, corridorWidthM, weights]);

  const left =
    view.phase === 'detect' ? (
      <SensorCoverage detect={view.detect} />
    ) : view.phase === 'neutralise' ? (
      <TeamsPanel view={view} />
    ) : (
      <CorridorOptions options={view.options} solveMs={view.solveMs} />
    );

  const right =
    view.phase === 'detect' ? (
      <DetectionInventory detect={view.detect} />
    ) : view.phase === 'neutralise' ? (
      <TaskBoard view={view} />
    ) : (
      <ClearanceTasking view={view} />
    );

  /* A selected device takes the bottom strip: while the operator is reading one
     fix, the survey log and tallies behind it are not what they need. */
  const bottom = view.fusion ? (
    <SensorFusion fusion={view.fusion} />
  ) : view.phase === 'detect' ? (
    <DetectBottom detect={view.detect} />
  ) : view.phase === 'neutralise' ? (
    <NeutraliseBottom view={view} />
  ) : (
    <BottomPanel view={view} />
  );

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg0)', overflow: 'hidden', fontFamily: FONT_SANS }}>
      <ClassificationBanner classText={view.classText} classBg={view.classBg} />
      {state.preflightOpen && <PreFlight pf={view.preflight} />}
      <CommandHeader
        clockStr={view.clockStr}
        statusText={view.statusText}
        statusColor={view.statusColor}
        solveMs={view.solveMs}
      />
      <PhaseRail phases={view.phases} />
      <KpiBand kpis={view.kpis} />

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {left}
        <BreachMap view={view} />
        {right}
      </div>

      {bottom}
    </div>
  );
}
