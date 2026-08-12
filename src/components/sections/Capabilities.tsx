import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import SwarmMount from "@/components/three/SwarmMount";
import { capabilities } from "@/theme/content";

export default function Capabilities() {
  return (
    <section id={capabilities.id} className="relative border-t border-line py-24 md:py-36">
      <div className="shell">
        <Reveal>
          <SectionHeading eyebrow={capabilities.kicker} title={capabilities.title} />
        </Reveal>

        {/* The formation shows the first two cards before they are claimed in words. */}
        <Reveal delay={60}>
          <figure className="mt-14">
            <SwarmMount />
            <figcaption className="mt-3 font-mono text-[10px] uppercase tracking-label text-bone-faint">
              {capabilities.swarmCaption}
            </figcaption>
          </figure>
        </Reveal>

        {/* Deliberately unnumbered — these are four parallel capabilities, not steps. */}
        <div className="mt-16 grid gap-px bg-line sm:grid-cols-2">
          {capabilities.items.map((item, i) => (
            <Reveal key={item.title} delay={i * 80} className="bg-night">
              <article className="group h-full px-6 py-10 transition-colors hover:bg-soil md:px-9 md:py-12">
                <span
                  className="block h-1.5 w-1.5 bg-survey transition-colors group-hover:bg-signal"
                  aria-hidden
                />
                <h3 className="display mt-6 text-2xl text-bone md:text-[1.75rem]">{item.title}</h3>
                <p className="mt-4 max-w-md text-sm leading-[1.75] text-bone-muted md:text-base">
                  {item.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
