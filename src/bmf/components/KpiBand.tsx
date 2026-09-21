import { FONT_MONO } from '@/bmf/lib/theme';
import type { ViewModel } from '@/bmf/lib/derive';

export default function KpiBand({ kpis }: { kpis: ViewModel['kpis'] }) {
  return (
    <div style={{ height: 62, flex: 'none', background: 'var(--bg1)', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'stretch' }}>
      {kpis.map((k) => (
        <div key={k.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 18px', borderRight: '1px solid var(--bd)', gap: 3 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--tx3)', fontFamily: FONT_MONO }}>{k.label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 700, fontFamily: FONT_MONO, color: k.color, lineHeight: 1 }}>{k.val}</span>
            <span style={{ fontSize: 10, color: 'var(--tx2)', fontFamily: FONT_MONO }}>{k.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
