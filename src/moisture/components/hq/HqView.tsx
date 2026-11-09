import dynamic from 'next/dynamic';
import { FLEET, REGION, SAFEGUARD_LOG } from '../../lib/constants';
import { useMoisture } from '../../lib/store';
import type { Tone } from '../../lib/theme';
import { Stat, Unit } from '../ui';
import SafeguardLog from './SafeguardLog';

const RegionMap = dynamic(() => import('./RegionMap'), { ssr: false });

const LEGEND: { label: string; tone: Tone }[] = [
  { label: 'REPORTING', tone: 'ok' },
  { label: 'HOLDING QUEUE', tone: 'warn' },
  { label: 'SAFEGUARD', tone: 'bad' },
];

export default function HqView() {
  const { theme, records } = useMoisture();
  const [lat, lon] = REGION.center;

  return (
    <main className="m-view" style={{ gridTemplateRows: 'auto minmax(0, 1fr)' }}>
      <div className="m-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', borderTop: 0, padding: '0 28px' }}>
        <Stat label="Nodes reporting">{FLEET.reporting} <Unit>/ {FLEET.total}</Unit></Stat>
        <Stat label="Signed records today">{(FLEET.signedToday + records.filter((r) => r.synced).length).toLocaleString('en-IN')}</Stat>
        <Stat label="Held offline · encrypted">{FLEET.heldOffline}</Stat>
        <Stat label="Safeguard events" tone="bad">{SAFEGUARD_LOG.length}</Stat>
      </div>

      <div className="m-view" style={{ gridTemplateColumns: 'minmax(0, 1fr) 520px' }}>
        <section className="m-pane" style={{ padding: '24px 28px', gap: 14 }}>
          <div className="m-row">
            <span className="m-section">Theatre · {REGION.name}</span>
            <span className="m-meta">{lat.toFixed(2)}°N {lon.toFixed(2)}°E</span>
          </div>
          <div className="m-map">
            <RegionMap theme={theme} />
          </div>
          <div className="m-meta" style={{ display: 'flex', gap: 24 }}>
            {LEGEND.map((l) => (
              <span key={l.label}>
                <span className="m-diamond" style={{ background: `var(--${l.tone})` }} />
                {l.label}
              </span>
            ))}
          </div>
        </section>
        <SafeguardLog />
      </div>
    </main>
  );
}
