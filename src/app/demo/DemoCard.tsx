type DemoCardProps = {
  readonly index: number;
  readonly href: string;
  readonly label: string;
};

/** One demo tile on the index: number and name. */
export default function DemoCard({ index, href, label }: DemoCardProps) {
  return (
    <a
      href={href}
      className="group flex h-full flex-col gap-4 rounded-lg border border-l-2 border-line border-l-survey/40 bg-soil p-6 transition-colors hover:border-survey/40 hover:border-l-survey hover:bg-ridge"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-label text-survey">
          {String(index).padStart(2, "0")}
        </span>
        <span
          className="text-bone-faint transition-transform group-hover:translate-x-1 group-hover:text-survey"
          aria-hidden
        >
          →
        </span>
      </div>
      <h2 className="display text-2xl text-bone">{label}</h2>
    </a>
  );
}
