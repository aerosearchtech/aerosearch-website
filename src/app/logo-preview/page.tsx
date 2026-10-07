import type { Metadata } from "next";
import Logo from "@/components/ui/Logo";
import Wordmark from "@/components/ui/Wordmark";
import { brand } from "@/theme/content";

export const metadata: Metadata = {
  title: "Logo comparison | Aerosearch Technologies",
  robots: { index: false, follow: false },
};

export default function LogoPreview() {
  const [name, ...rest] = brand.full.split(" ");

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12 sm:py-20">
      <a href="/" className="text-sm text-bone-muted hover:text-bone">
        Back to the site
      </a>
      <h1 className="mt-8 font-display text-3xl">Pick a lettering size</h1>
      <p className="mt-3 text-bone-muted">
        Four smaller options, using the same SVG lettering. Pick A, B, C, or D.
      </p>

      <section className="mt-10" aria-labelledby="approved-logo">
        <h2 id="approved-logo" className="mb-3 text-sm text-bone-muted">
          Approved version — SVG lettering
        </h2>
        <div className="flex min-h-24 items-center border border-line bg-night px-4 sm:px-8">
          <Wordmark />
        </div>
      </section>

      <div className="mt-8 space-y-6">
        {[
          { label: "A", height: 14, description: "A little smaller" },
          { label: "B", height: 13, description: "Smaller" },
          { label: "C", height: 12, description: "Compact" },
          { label: "D", height: 11, description: "Smallest" },
        ].map(({ label, height, description }) => (
          <section key={label} aria-labelledby={`size-${label}`}>
            <h2 id={`size-${label}`} className="mb-2 text-sm text-bone-muted">
              <span className="font-medium text-bone">{label}</span> — {description}
            </h2>
            <div className="overflow-x-auto border border-line bg-night">
              <div className="flex min-h-20 w-max min-w-full items-center px-4 sm:px-8">
                <div className="inline-flex shrink-0 items-center gap-2 text-bone sm:gap-2.5" role="img" aria-label={brand.full}>
                  <Logo className="block h-auto w-7 shrink-0 sm:w-8" />
                  <img
                    src="/logos/aerosearch/aerosearch-inline-text.svg"
                    alt=""
                    width={570}
                    height={24}
                    style={{ height, width: (height * 570) / 24, maxWidth: "none" }}
                    className="block shrink-0"
                  />
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="mt-8" aria-labelledby="original-text">
        <h2 id="original-text" className="mb-3 text-sm text-bone-muted">
          Alternative — original website text
        </h2>
        <div className="flex min-h-24 items-center border border-line bg-night px-4 sm:px-8">
          <a href="/#top" className="inline-flex items-center gap-2 text-bone sm:gap-2.5" aria-label={`${brand.full} home`}>
            <Logo className="block h-auto w-7 shrink-0 sm:w-8" />
            <span className="whitespace-nowrap font-mark text-[1.0625rem] font-normal tracking-[0.005em] sm:text-lg">
              <span className="text-bone">{name}</span>{" "}
              <span className="text-bone-muted">{rest.join(" ")}</span>
            </span>
          </a>
        </div>
      </section>
    </main>
  );
}
