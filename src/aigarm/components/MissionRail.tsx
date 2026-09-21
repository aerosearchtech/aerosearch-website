import { Check, Radio, X } from 'lucide-react';
import { mission } from '../data/mission';
import type { MissionResources } from '../types';

interface MissionRailProps {
  layerVisibility: Record<string, boolean>;
  resources: MissionResources;
  onToggleLayer: (layerId: string) => void;
}

const assetTone = {
  online: 'ok',
  degraded: 'warn',
  down: 'bad',
} as const;

export function MissionRail({
  layerVisibility,
  resources,
  onToggleLayer,
}: MissionRailProps) {
  const platform =
    resources.platforms.find((item) => item.id === resources.platformId) ??
    resources.platforms[0];
  const availableRounds = resources.ammunition.reduce(
    (sum, item) => sum + item.available,
    0,
  );
  const allocatedRounds = resources.ammunition.reduce(
    (sum, item) => sum + item.allocated,
    0,
  );

  return (
    <aside className="mission-rail">
      <section className="rail-panel mission-panel">
        <header className="panel-header">
          <span>MISSION</span>
          <span className="header-code">ACTIVE</span>
        </header>
        <div className="mission-block">
          <span className="eyebrow">OP SERIAL</span>
          <strong className="mission-id">OP / VAJRA-07</strong>
          <h1>{mission.name}<br />{mission.area}</h1>
          <dl className="mission-meta">
            <div><dt>REGT</dt><dd>{mission.regiment}</dd></div>
            <div><dt>2IC</dt><dd>{mission.commander}</dd></div>
            <div><dt>PLATFORM</dt><dd>{platform.shortLabel}</dd></div>
            <div><dt>GUNS</dt><dd>{resources.guns.assigned}/{resources.guns.available} ASGD</dd></div>
            <div><dt>H-HOUR</dt><dd>{mission.hHour}</dd></div>
            <div><dt>TOT</dt><dd>{mission.timeOnTarget}</dd></div>
          </dl>
        </div>
      </section>

      <section className="rail-panel resource-readiness">
        <header className="panel-header">
          <span>GUNS &amp; AMMUNITION</span>
          <span className="header-code">{resources.provenance}</span>
        </header>
        <div className="resource-readiness__summary">
          <div>
            <span>AVAILABLE GUNS</span>
            <strong>{resources.guns.available}</strong>
            <em>{resources.guns.unserviceable} UNSVC</em>
          </div>
          <div>
            <span>ASSIGNED</span>
            <strong>{resources.guns.assigned}</strong>
            <em>{resources.guns.reserve} RESERVE</em>
          </div>
          <div>
            <span>AMMUNITION</span>
            <strong>{allocatedRounds}</strong>
            <em>/ {availableRounds} RDS</em>
          </div>
        </div>
        <div className="resource-readiness__source">
          {resources.sourceLabel} · {resources.freshness}
        </div>
      </section>

      <section className="rail-panel">
        <header className="panel-header">
          <span>UAS ASSETS</span>
          <span className="header-code">
            {mission.assets.filter((asset) => asset.status !== 'down').length} / {mission.assets.length} UP
          </span>
        </header>
        <div className="asset-list">
          {mission.assets.map((asset) => (
            <div className="asset-row" key={asset.id} data-tone={assetTone[asset.status]}>
              <Radio size={14} aria-hidden="true" />
              <div>
                <strong>{asset.id} {asset.name}</strong>
                <span>{asset.payload} · {asset.task}</span>
              </div>
              <em>{asset.status === 'down' ? 'DOWN' : `${asset.link}%`}</em>
            </div>
          ))}
        </div>
      </section>

      <section className="rail-panel layer-panel">
        <header className="panel-header">
          <span>MAP LAYERS</span>
          <span className="header-code">
            {Object.values(layerVisibility).filter(Boolean).length} / {mission.layers.length}
          </span>
        </header>
        <div className="layer-list">
          {mission.layers.map((layer) => {
            const visible = Boolean(layerVisibility[layer.id]);
            return (
              <button
                type="button"
                className="layer-row"
                key={layer.id}
                aria-pressed={visible}
                onClick={() => onToggleLayer(layer.id)}
              >
                <span className="layer-check">
                  {visible ? <Check size={10} /> : <X size={9} />}
                </span>
                <i style={{ backgroundColor: layer.color }} />
                <span>{layer.label}</span>
                <em>{visible ? layer.opacity.toFixed(1) : '0.0'}</em>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rail-panel doctrine-panel">
        <header className="panel-header">
          <span>PLATFORM PROFILE</span>
          <span className="header-code">155 / 52</span>
        </header>
        <dl className="doctrine-list">
          <div><dt>Max slope</dt><dd>5.0°</dd></div>
          <div><dt>Min RCI</dt><dd>50</dd></div>
          <div><dt>Crest buffer</dt><dd>70 m</dd></div>
          <div><dt>Dispersion</dt><dd>≥ 75 m</dd></div>
        </dl>
      </section>
    </aside>
  );
}
