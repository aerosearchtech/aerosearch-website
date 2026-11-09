import type { ReactElement } from 'react';
import { KERNEL_OPTIONS, MODE_LABELS, PROFILE_OPTIONS, TRAY_NOTE } from '../../config/constants';
import type { AnalysisStatus } from '../../hooks/useAnalysis';
import type { AnalysisMode, Commodity, CommodityMeta, LotProfile } from '../../types/analysis';
import { pct } from '../../utils/format';
import { Panel } from '../common/Panel';
import { Segmented } from '../common/Segmented';

interface Props {
  commodities: CommodityMeta[];
  disclaimer: string;
  status: AnalysisStatus;
  progress: number;
  mode: AnalysisMode;
  commodity: Commodity;
  profile: LotProfile;
  kernels: number;
  onMode: (m: AnalysisMode) => void;
  onCommodity: (c: Commodity) => void;
  onProfile: (p: LotProfile) => void;
  onKernels: (n: number) => void;
  onRunReference: () => void;
  onRunTray: () => void;
  onSkip: () => void;
}

const MODES: AnalysisMode[] = ['reference', 'image'];

export function SamplePanel(props: Props) {
  const { commodities, status, mode, commodity, profile, kernels } = props;
  const selected = commodities.find((c) => c.id === commodity);
  const model = selected?.model ?? null;
  const busy = status === 'running' || status === 'streaming';
  const locked = busy || !selected?.available;

  const actions = (): ReactElement => {
    if (status === 'running') return <button type="button" className="btn-start" disabled>LOADING…</button>;
    if (status === 'streaming') {
      return (
        <button type="button" className="btn-start is-outline" onClick={props.onSkip}>
          SKIP TO REPORT <span>{Math.round(props.progress * 100)}%</span>
        </button>
      );
    }
    const onStart = mode === 'reference' ? props.onRunReference : props.onRunTray;
    return <button type="button" className="btn-start" onClick={onStart} disabled={locked}>PLAY RECORDING <span>▸</span></button>;
  };

  return (
    <Panel num="01" title="SAMPLE" aside="RECORDED" className="sample-panel">
      <div className="panel-body sample-body">
        <span className="label">COMMODITY</span>
        <div className="commodity-grid">
          {commodities.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`commodity ${c.id === commodity ? 'is-active' : ''}`}
              onClick={() => props.onCommodity(c.id)}
              disabled={busy || !c.available}
            >
              <span>{c.label}</span>
              <small>{c.available ? 'MODEL READY' : 'NO MODEL YET'}</small>
            </button>
          ))}
        </div>

        <span className="label">INPUT</span>
        <Segmented options={MODES.map((m) => ({ id: m, label: MODE_LABELS[m] }))} value={mode} onChange={props.onMode} disabled={busy} />

        {mode === 'reference' ? (
          <>
            <span className="label">LOT QUALITY</span>
            <div className="profile-list">
              {PROFILE_OPTIONS.map((p) => (
                <button key={p.id} type="button" className={`profile ${p.id === profile ? 'is-active' : ''}`} onClick={() => props.onProfile(p.id)} disabled={busy}>
                  <span>{p.label}</span>
                  <small>{p.hint}</small>
                </button>
              ))}
            </div>
            <span className="label">KERNELS PER SAMPLE</span>
            <Segmented options={KERNEL_OPTIONS.map((n) => ({ id: n, label: String(n) }))} value={kernels} onChange={props.onKernels} disabled={busy} />
          </>
        ) : (
          <p className="note-text">{TRAY_NOTE}</p>
        )}

        {model && (
          <dl className="fields">
            <dt>MODEL</dt><dd>{model.arch.split(',')[0]}</dd>
            <dt>VIEWS / KERNEL</dt><dd>{model.views}</dd>
            <dt>HELD-OUT ACCURACY</dt><dd>{pct(model.test_accuracy * 100, 1)}</dd>
            <dt>MACRO F1</dt><dd>{pct(model.test_macro_f1 * 100, 1)}</dd>
            <dt>TEST KERNELS</dt><dd>{model.n_test.toLocaleString('en-IN')}</dd>
          </dl>
        )}

        <div className="note">
          <i />
          <p className="note-text">{props.disclaimer}</p>
        </div>
      </div>
      <div className="sample-actions">
        {actions()}
      </div>
    </Panel>
  );
}
