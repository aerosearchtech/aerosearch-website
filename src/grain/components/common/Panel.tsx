import type { ReactNode } from 'react';

interface Props {
  num: string;
  title: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Numbered console panel: "02 / CAPTURE" header with an optional right-hand status. */
export function Panel({ num, title, aside, className = '', children }: Props) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel-head">
        <span className="ellipsis">{num} / {title}</span>
        {aside && <span className="panel-aside">{aside}</span>}
      </header>
      {children}
    </section>
  );
}
