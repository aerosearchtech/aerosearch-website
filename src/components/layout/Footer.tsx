import Wordmark from "@/components/ui/Wordmark";
import { brand, footer } from "@/theme/content";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-soil">
      <div className="shell grid gap-12 py-16 md:grid-cols-[1.5fr_1fr_1fr] md:py-20">
        <div>
          <Wordmark />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-bone-muted">{brand.tagline}</p>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-label text-bone-faint">
            {brand.location}
          </p>
        </div>

        {footer.columns.map((col) => (
          <div key={col.heading}>
            <h4 className="font-mono text-[10px] uppercase tracking-label text-bone-faint">
              {col.heading}
            </h4>
            <ul className="mt-5 space-y-3">
              {col.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-bone-muted transition-colors hover:text-bone"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col items-start justify-between gap-2 py-6 text-xs text-bone-faint md:flex-row md:items-center">
          <span>{footer.rights}</span>
          <a href={`mailto:${brand.email}`} className="transition-colors hover:text-bone">
            {brand.email}
          </a>
        </div>
      </div>
    </footer>
  );
}
