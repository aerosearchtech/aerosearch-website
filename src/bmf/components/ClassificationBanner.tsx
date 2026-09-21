import { FONT_MONO } from '@/bmf/lib/theme';

export default function ClassificationBanner({ classText, classBg }: { classText: string; classBg: string }) {
  return (
    <div style={{ height: 24, flex: 'none', background: classBg, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, letterSpacing: 3, fontSize: 11, fontWeight: 600, color: '#fff', fontFamily: FONT_MONO }}>
      <span style={{ width: 6, height: 6, background: '#fff', borderRadius: '50%', opacity: 0.85 }} />
      {`${classText} // FOR OFFICIAL USE ONLY // ABLE TO BE WITHHELD UNDER MOD-IN`}
      <span style={{ width: 6, height: 6, background: '#fff', borderRadius: '50%', opacity: 0.85 }} />
    </div>
  );
}
