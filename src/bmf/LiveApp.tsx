'use client';

import { useEffect } from 'react';
import DroneRail from '@/bmf/components/live/DroneRail';
import LiveChannels from '@/bmf/components/live/LiveChannels';
import LiveDetectBottom from '@/bmf/components/live/LiveDetectBottom';
import LiveInventory from '@/bmf/components/live/LiveInventory';
import LiveCommandHeader from '@/bmf/components/live/LiveCommandHeader';
import LiveMapArea from '@/bmf/components/live/LiveMapArea';
import NoData from '@/bmf/components/live/NoData';
import ClassificationBanner from '@/bmf/components/ClassificationBanner';
import KpiBand from '@/bmf/components/KpiBand';
import PhaseRail from '@/bmf/components/PhaseRail';
import PreFlight from '@/bmf/components/preflight/PreFlight';
import { CLEARANCE_SECONDS, SOLVE_DEBOUNCE_MS } from '@/bmf/lib/constants';
import { NO_DATA } from '@/bmf/lib/live/constants';
import { PANEL_TITLES, liveKpis, livePhases } from '@/bmf/lib/live/liveView';
import { usePlayback } from '@/bmf/lib/live/playback';
import { useBridge } from '@/bmf/lib/live/useBridge';
import { useDetections } from '@/bmf/lib/live/useDetections';
import { runTotalS } from '@/bmf/lib/surveyRun';
import { deriveView } from '@/bmf/lib/derive';
import { FONT_SANS } from '@/bmf/lib/theme';
import { useGcs } from '@/bmf/lib/store';

/** BMF Live on a recorded flight: the drone, its feeds, mosaic and detections, replayed in the browser. */
export default function LiveApp() {
  const state = useGcs();
  const view = deriveView(state);
  const detections = useDetections();
  const bridge = useBridge();
  const liveMine = detections.mines.find((m) => m.id === state.liveMineId);

  const { field, start, goal, corridorWidthM, weights, survey } = state;

  useEffect(() => {
    useGcs.getState().hydrateTheme();
    useGcs.getState().setPhase('detect');
    const playback = usePlayback.getState();
    void playback.load().then(() => usePlayback.getState().demo && playback.play(1));
    const id = window.setInterval(() => useGcs.getState().tickClock(), 1000);
    return () => {
      window.clearInterval(id);
      usePlayback.getState().stop();
    };
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

  // Only the drone and its detections are live data; every simulated panel reads NO DATA.
  const titles = PANEL_TITLES[view.phase];
  const detect = view.phase === 'detect';
  const left = detect ? <DroneRail title={titles.left} bridge={bridge} /> : <NoData title={titles.left} width={296} />;
  const right = detect ? <LiveInventory detections={detections} /> : <NoData title={titles.right} width={344} side="right" />;
  const bottom =
    detect && liveMine && detections.run ? (
      <LiveChannels run={detections.run} mine={liveMine} />
    ) : detect && (detections.mines.length || bridge.state?.status.length) ? (
      <LiveDetectBottom mines={detections.mines} status={bridge.state?.status ?? []} />
    ) : (
      <NoData title={titles.bottom} />
    );

  return (
    <div style={{ width: '100%', height: '100vh', minHeight: 700, display: 'flex', flexDirection: 'column', background: 'var(--bg0)', overflow: 'hidden', fontFamily: FONT_SANS }}>
      <ClassificationBanner classText={view.classText} classBg={view.classBg} />
      {state.preflightOpen && <PreFlight pf={view.preflight} />}
      <LiveCommandHeader
        clockStr={NO_DATA}
        statusText="NO PLAN"
        statusColor="var(--tx3)"
        solve={NO_DATA}
      />
      <PhaseRail phases={livePhases(view.phases, detections.mines)} />
      <KpiBand kpis={liveKpis(view.kpis, view.phase, detections.mines)} />

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {left}
        <LiveMapArea detections={detections} bridge={bridge} />
        {right}
      </div>

      {bottom}
    </div>
  );
}
