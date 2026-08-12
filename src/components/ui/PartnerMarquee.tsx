import Image from "next/image";
import { partners } from "@/theme/content";

/**
 * A slow horizontal drift of the marks behind the company.
 *
 * The track holds two identical copies of the row, so translating it -50% lands
 * exactly on the seam and the loop is invisible. Hovering pauses it, and
 * prefers-reduced-motion stops it outright — the row is still readable static,
 * since nothing here is conveyed by the movement.
 */
export default function PartnerMarquee() {
  const row = partners.items.map((partner, i) => (
    <li key={`${partner.src}-${i}`} className="shrink-0 pr-14 md:pr-24">
      <Image
        src={partner.src}
        alt={partner.name}
        width={partner.width}
        height={partner.height}
        style={{ height: partner.displayHeight }}
        className="w-auto opacity-80 transition-opacity duration-300 hover:opacity-100"
      />
    </li>
  ));

  return (
    <section className="border-t border-line py-14 md:py-16">
      <div className="shell">
        <h2 className="font-mono text-[10px] uppercase tracking-label text-bone-faint">
          {partners.heading}
        </h2>
      </div>

      <div
        className="group mt-9 overflow-hidden"
        style={{
          maskImage: "linear-gradient(90deg, transparent, black 6%, black 94%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, black 6%, black 94%, transparent)",
        }}
      >
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          <ul className="flex items-center">{row}</ul>
          {/* Second copy only exists to close the loop; screen readers skip it. */}
          <ul className="flex items-center" aria-hidden>
            {row}
          </ul>
        </div>
      </div>
    </section>
  );
}
