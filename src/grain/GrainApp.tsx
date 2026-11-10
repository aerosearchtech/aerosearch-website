import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchMeta, loadReference, loadTray, recordedDecision } from './api/client';
import { KernelInspector } from './components/common/KernelInspector';
import { AppHeader } from './components/shell/AppHeader';
import { SideNav } from './components/shell/SideNav';
import { StatusFooter } from './components/shell/StatusFooter';
import { DEFAULT_COMMODITY, DEFAULT_KERNELS, EMPTY_LOT, META_RETRY_MS, REPORT_DELAY_MS } from './config/constants';
import { useAnalysis } from './hooks/useAnalysis';
import { useTheme } from './hooks/useTheme';
import { AnalyseScreen } from './screens/AnalyseScreen';
import { IntakeScreen } from './screens/IntakeScreen';
import { OutboxScreen } from './screens/OutboxScreen';
import { ReportScreen } from './screens/ReportScreen';
import type { AnalysisMode, Commodity, Decision, KernelResult, LotDetails, LotProfile, Meta, OutboxEntry, RecordedSample, Screen, SignedRecord } from './types/analysis';

/** The grain analyzer console, replaying runs recorded from the real model. */
export default function GrainApp() {
  const [theme, setTheme] = useTheme();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [screen, setScreen] = useState<Screen>('intake');
  const [lot, setLot] = useState<LotDetails>(EMPTY_LOT);
  const [outbox, setOutbox] = useState<OutboxEntry[]>([]);
  const [mode, setMode] = useState<AnalysisMode>('reference');
  const [commodity, setCommodity] = useState<Commodity>(DEFAULT_COMMODITY);
  const [profile, setProfile] = useState<LotProfile>('good');
  const [kernels, setKernels] = useState<number>(DEFAULT_KERNELS);
  const [filter, setFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<KernelResult | null>(null);
  const [signed, setSigned] = useState<SignedRecord | null>(null);
  const analysis = useAnalysis();
  const { run, result, revealed, status } = analysis;

  useEffect(() => {
    let timer = 0;
    const load = (): void => {
      fetchMeta().then(setMeta).catch(() => {
        timer = window.setTimeout(load, META_RETRY_MS);
      });
    };
    load();
    return () => window.clearTimeout(timer);
  }, []);

  // Once the last kernel lands, open the report.
  useEffect(() => {
    if (status !== 'done') return undefined;
    const id = window.setTimeout(() => setScreen('report'), REPORT_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [status, result]);

  const resultMeta = meta?.commodities.find((c) => c.id === (result?.commodity ?? commodity)) ?? null;
  const visible = useMemo<KernelResult[]>(() => result?.kernels.slice(0, revealed) ?? [], [result, revealed]);
  const progress = result ? revealed / Math.max(1, result.kernels.length) : 0;

  const start = useCallback((job: () => Promise<RecordedSample>): void => {
    setFilter(null);
    setSigned(null);
    setScreen('analyse');
    void run(job);
  }, [run]);

  const runReference = useCallback((): void => start(() => loadReference({ commodity, kernels, profile })), [start, commodity, kernels, profile]);
  const runTray = useCallback((): void => start(loadTray), [start]);

  const sign = useCallback(async (decision: Decision): Promise<void> => {
    if (!result) return;
    const record = recordedDecision(result, decision);
    setSigned(record);
    setOutbox((list) => [...list, { sampleId: result.sample_id, verdict: result.verdict, lot, result: result.record, decision: record }]);
  }, [result, lot]);

  const pickClass = useCallback((code: string): void => {
    setFilter(code);
    setScreen('analyse');
  }, []);

  const goAnalyse = useCallback((): void => {
    setFilter(null);
    setScreen('analyse');
  }, []);

  return (
    <div className="grain-root" data-theme={theme}>
      <div className="app">
        <AppHeader meta={meta} signedCount={outbox.length} theme={theme} onTheme={setTheme} />
        <div className="app-body">
          <SideNav
            screen={screen}
            badges={{ report: status === 'done' && signed === null ? 1 : 0, outbox: outbox.length }}
            onScreen={setScreen}
          />
          <main className="app-main">
            {screen === 'intake' && <IntakeScreen lot={lot} deviceId={meta?.device_id ?? '—'} onChange={setLot} onContinue={goAnalyse} />}
            {screen === 'outbox' && <OutboxScreen entries={outbox} deviceId={meta?.device_id ?? '—'} />}
            {screen === 'analyse' && (
              <AnalyseScreen
                sample={{
                  commodities: meta?.commodities ?? [],
                  disclaimer: meta?.disclaimer ?? '',
                  status, progress, mode, commodity, profile, kernels,
                  onMode: setMode, onCommodity: setCommodity, onProfile: setProfile, onKernels: setKernels,
                  onRunReference: runReference, onRunTray: runTray, onSkip: analysis.skip,
                }}
                capture={{ status, mode, result, visible, progress, error: analysis.error, filter, onSelect: setSelected }}
              />
            )}
            {screen === 'report' && (
              <ReportScreen
                result={result}
                meta={resultMeta}
                lot={lot}
                disclaimer={meta?.disclaimer ?? ''}
                inProgress={status === 'running' || status === 'streaming'}
                signed={signed}
                deviceId={meta?.device_id ?? ''}
                onSign={sign}
                onNext={goAnalyse}
                onPickClass={pickClass}
                onSelect={setSelected}
              />
            )}
          </main>
        </div>
        <StatusFooter model={resultMeta?.model ?? null} />
        {selected && resultMeta && <KernelInspector kernel={selected} classes={resultMeta.classes} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );
}
