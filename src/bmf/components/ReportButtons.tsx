'use client';

import { useEffect, useRef, useState } from 'react';
import { deminingReport, detectionReport, downloadReport } from '@/bmf/lib/report';
import { deriveView } from '@/bmf/lib/derive';
import { AO_NAME, REPORT_ISSUED_MS } from '@/bmf/lib/constants';
import { FONT_MONO } from '@/bmf/lib/theme';
import { useGcs } from '@/bmf/lib/store';

type Kind = 'detection' | 'demining';

const LABEL: Record<Kind, string> = { detection: '⤓ DETECTION', demining: '⤓ DEMINING' };

const btn = (done: boolean): React.CSSProperties => ({
  height: 34,
  padding: '0 10px',
  background: done ? 'var(--gnWash)' : 'var(--bg3)',
  border: `1px solid ${done ? 'var(--gn)' : 'var(--bd2)'}`,
  color: done ? 'var(--gn)' : 'var(--tx2)',
  fontFamily: FONT_MONO,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

const slug = (kind: string): string =>
  `${AO_NAME}-${kind}-${new Date().toISOString().slice(0, 10)}.html`.replace(/\s+/g, '-');

/**
 * Mission products. The view is derived at click time rather than passed in, so
 * a report is always the picture the operator is looking at — there is no prop
 * that can go stale between render and download.
 *
 * The button confirms after it fires: a download is the one action here whose
 * result lands outside the console, so without it the operator has nothing on
 * screen telling them the product was actually issued.
 */
export default function ReportButtons() {
  const [issued, setIssued] = useState<Kind | null>(null);
  const timer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const issue = (kind: Kind) => (): void => {
    const view = deriveView(useGcs.getState());
    downloadReport(
      slug(kind),
      kind === 'detection' ? detectionReport(view) : deminingReport(view),
    );
    setIssued(kind);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setIssued(null), REPORT_ISSUED_MS);
  };

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {(['detection', 'demining'] as Kind[]).map((kind) => (
        <button
          key={kind}
          onClick={issue(kind)}
          style={btn(issued === kind)}
          title={`Download the ${kind} report`}
        >
          {issued === kind ? '✓ ISSUED' : LABEL[kind]}
        </button>
      ))}
    </div>
  );
}
