import { classify } from '../../lib/bands';
import { BAND_FILE, METER_MODEL, READ_SPREAD, READS_PER_SAMPLE, SCENARIOS } from '../../lib/constants';
import { useMoisture } from '../../lib/store';
import { toneVar } from '../../lib/theme';
import type { ScenarioId } from '../../lib/types';
import { Stat, Unit } from '../ui';
import BandScale from './BandScale';

const SCENARIO_IDS = Object.keys(SCENARIOS) as ScenarioId[];

export default function ReadingPanel() {
  const { reading, scenario, linkUp, busy, takeReading, setLink, discard, seal } = useMoisture();
  const band = reading ? classify(reading.moisture) : null;

  return (
    <section className="m-pane" style={{ padding: '30px 36px 28px' }}>
      <div className="m-row">
        <span className="m-section">Moisture content</span>
        <span className="m-meta">{BAND_FILE.name} · READ {READS_PER_SAMPLE} OF {READS_PER_SAMPLE}</span>
      </div>

      <div className="m-row" style={{ marginTop: 14, justifyContent: 'flex-start' }}>
        <span className="m-label">Meter port · demo input</span>
        <div className="m-tabs">
          {SCENARIO_IDS.map((id) => (
            <button key={id} className="m-tab" aria-pressed={!!reading && scenario === id} onClick={() => takeReading(id)}>
              {SCENARIOS[id].label.toUpperCase()}
            </button>
          ))}
        </div>
        <span className="m-label" style={{ marginLeft: 12 }}>Link</span>
        <div className="m-tabs">
          <button className="m-tab" aria-pressed={linkUp} onClick={() => setLink(true)}>UP</button>
          <button className="m-tab" aria-pressed={!linkUp} onClick={() => setLink(false)}>DOWN</button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, marginTop: 18, minHeight: 210 }}>
        <span className="m-num" style={{ fontSize: 236, lineHeight: 0.82, color: reading ? undefined : 'var(--lineStrong)' }}>
          {reading ? reading.moisture.toFixed(1) : '--.-'}
        </span>
        <span className="m-num" style={{ fontSize: 60, color: 'var(--mute)', paddingBottom: 12 }}>%</span>
        <div style={{ marginLeft: 'auto', paddingBottom: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          {band ? (
            <>
              <span className="m-tag" style={{ color: toneVar(band.tone) }}>{band.label}</span>
              <span className="m-body" style={{ textAlign: 'right', maxWidth: 240 }}>{band.note}</span>
            </>
          ) : (
            <span className="m-body" style={{ textAlign: 'right', maxWidth: 240 }}>Waiting for the next line on the meter port.</span>
          )}
        </div>
      </div>

      <BandScale moisture={reading?.moisture ?? null} />

      <div className="m-stats m-push" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <Stat label="Grain temp">{reading ? reading.tempC.toFixed(1) : '--'} <Unit>°C</Unit></Stat>
        <Stat label="Ambient RH">{reading ? reading.rh : '--'} <Unit>%</Unit></Stat>
        <Stat label={`Spread · ${READS_PER_SAMPLE} reads`}>± {READ_SPREAD.toFixed(1)} <Unit>%</Unit></Stat>
        <Stat label="Meter"><span className="m-mono" style={{ fontSize: 20 }}>{METER_MODEL}</span></Stat>
      </div>

      <div className="m-row" style={{ marginTop: 20, alignItems: 'center' }}>
        <span className="m-body" style={{ color: 'var(--mute)' }}>
          {linkUp
            ? 'Compress the set volume, then read. The node takes the line from the port, with no keying.'
            : 'Link down. The node seals and holds records encrypted, and sends them when the link returns.'}
        </span>
        <div style={{ display: 'flex', gap: 10, flex: 'none' }}>
          <button className="m-btn" disabled={!reading || busy} onClick={discard}>DISCARD</button>
          <button className="m-btn-primary" disabled={!reading || busy} onClick={seal}>SEAL &amp; FILE RECORD</button>
        </div>
      </div>
    </section>
  );
}
