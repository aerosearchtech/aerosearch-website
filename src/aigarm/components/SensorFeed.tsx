import { useState } from 'react';
import type { CandidateArea } from '../types';

type SensorMode = 'EO' | 'IR' | 'SAR' | 'LIDAR';

interface SensorFeedProps {
  candidate: CandidateArea;
}

const modes: SensorMode[] = ['EO', 'IR', 'SAR', 'LIDAR'];

export function SensorFeed({ candidate }: SensorFeedProps) {
  const [mode, setMode] = useState<SensorMode>('LIDAR');

  return (
    <section className="sensor-card" aria-label="UAS sensor feed">
      <header className="floating-header">
        <span>UAS-03 · {mode} · TERRAIN</span>
        <span className="live-state"><i /> DEMO FEED</span>
      </header>
      <div className="sensor-body">
        <div className="sensor-tabs" role="tablist" aria-label="Sensor mode">
          {modes.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={mode === item}
              className={mode === item ? 'active' : ''}
              onClick={() => setMode(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className={`sensor-screen sensor-screen--${mode.toLowerCase()}`}>
          <div className="sensor-raster" aria-hidden="true" />
          <svg
            className="terrain-mesh"
            viewBox="0 0 260 140"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="mesh-green" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#213a2e" />
                <stop offset=".42" stopColor="#7dd27a" />
                <stop offset=".72" stopColor="#ffb547" />
                <stop offset="1" stopColor="#ff5656" />
              </linearGradient>
            </defs>
            <path
              d="M24 111L55 88L86 97L117 54L151 70L184 36L236 73L213 112L174 124L131 103L88 126Z"
              fill="url(#mesh-green)"
              opacity=".88"
            />
            <g fill="none" stroke="rgba(7,9,10,.58)" strokeWidth=".8">
              <path d="M24 111L117 54L236 73" />
              <path d="M55 88L131 103L213 112" />
              <path d="M86 97L151 70L174 124" />
              <path d="M88 126L117 54L213 112" />
              <path d="M24 111L131 103L184 36" />
              <path d="M55 88L151 70L236 73" />
            </g>
          </svg>
          <div className="sensor-scanline" aria-hidden="true" />
          <div className="sensor-brackets" aria-hidden="true">
            <i /><i /><i /><i />
          </div>
          <div className="sensor-hud sensor-hud--tl">
            SLP MAX 4.8°<br />
            SLP MEAN {candidate.metrics[0]?.value}
          </div>
          <div className="sensor-hud sensor-hud--tr">
            ALT 212 M<br />
            HDG 072°
          </div>
          <div className="sensor-hud sensor-hud--bl">
            RES 0.25 M<br />
            LINK 96%
          </div>
          <div className="sensor-hud sensor-hud--br">
            PTS 128.4 M<br />
            DENS 182
          </div>
        </div>
      </div>
    </section>
  );
}
