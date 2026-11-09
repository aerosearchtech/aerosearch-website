import { BAND_FILES_IN_FORCE, SAFEGUARD_LOG } from '../../lib/constants';
import { toneVar } from '../../lib/theme';

export default function SafeguardLog() {
  return (
    <aside className="m-pane" style={{ padding: '24px 28px' }}>
      <span className="m-section" style={{ color: 'var(--bad)', marginBottom: 14 }}>Safeguard log · last 24 h</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SAFEGUARD_LOG.map((e) => (
          <div key={e.node} className="m-event" style={{ borderColor: `var(--${e.tone}Soft)` }}>
            <div className="m-row m-meta">
              <span style={{ color: toneVar(e.tone) }}>{e.title}</span>
              <span>{e.when} · {e.node}</span>
            </div>
            <span className="m-body" style={{ fontSize: 14, color: 'var(--tx)' }}>{e.body}</span>
          </div>
        ))}
      </div>
      <div className="m-push">
        <span className="m-label" style={{ display: 'block', marginBottom: 8 }}>Band files in force</span>
        <div style={{ borderTop: '1px solid var(--lineSoft)' }}>
          {BAND_FILES_IN_FORCE.map((b) => (
            <div key={b.name} className="m-kv">
              <span style={{ color: 'var(--tx)' }}>{b.name}</span>
              <span>{b.rule}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
