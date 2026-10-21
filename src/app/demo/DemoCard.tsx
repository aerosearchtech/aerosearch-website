type DemoCardProps = {
  readonly index: number;
  readonly href: string;
  readonly label: string;
};

/** One demo row on the index: number, name, arrow. */
export default function DemoCard({ index, href, label }: DemoCardProps) {
  return (
    <a href={href} className="group flex items-center gap-6 py-5">
      <span className="font-mono text-[11px] uppercase tracking-label text-bone-faint">
        {String(index).padStart(2, "0")}
      </span>
      <span className="display flex-1 text-xl text-bone-muted transition-colors group-hover:text-bone">
        {label}
      </span>
      <span
        className="text-bone-faint transition-transform group-hover:translate-x-1 group-hover:text-signal"
        aria-hidden
      >
        →
      </span>
    </a>
  );
}
