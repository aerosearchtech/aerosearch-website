import { useEffect, useState } from 'react';
import { PRINT_PAGE_CSS } from '../config/constants';
import type { PrintKind } from '../types/analysis';

/**
 * Prints one document through the browser dialog ("Save as PDF" gives the file).
 * While printing, the page size is set for the document and the tab title becomes
 * `${fileStem}-${kind}`, which browsers use as the PDF file name.
 */
export function usePrint(fileStem: string): [PrintKind | null, (kind: PrintKind) => void] {
  const [kind, setKind] = useState<PrintKind | null>(null);

  useEffect(() => {
    if (!kind) return undefined;
    const page = document.createElement('style');
    page.textContent = `@page { ${PRINT_PAGE_CSS[kind]} }`;
    document.head.appendChild(page);
    const title = document.title;
    document.title = `${fileStem}-${kind}`;
    const done = (): void => setKind(null);
    window.addEventListener('afterprint', done);
    const frame = window.requestAnimationFrame(() => window.print());
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('afterprint', done);
      page.remove();
      document.title = title;
    };
  }, [kind, fileStem]);

  return [kind, setKind];
}
