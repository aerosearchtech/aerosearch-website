import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import SwarmMount from "@/components/three/SwarmMount";
// import FusionMount from "@/components/three/FusionMount";
import { technology } from "@/theme/content";

export default function Technology() {
  return (
    <section id={technology.id} className="relative border-t border-line py-24 md:py-36">
      <div className="shell">
        <Reveal>
          <SectionHeading eyebrow={technology.kicker} title={technology.title} />
        </Reveal>

        {/* The formation shows the first card before it is claimed in words. */}
        <Reveal delay={60}>
          <figure className="mt-14">
            <SwarmMount />
            <figcaption className="mt-3 font-mono text-[10px] uppercase tracking-label text-bone-faint">
              {technology.swarmCaption}
            </figcaption>
          </figure>
        </Reveal>

        {/* Deliberately unnumbered — these are four parallel capabilities, not steps. */}
        <div className="mt-16 grid gap-px bg-line sm:grid-cols-2">
          {technology.items.map((item, i) => (
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

        {/* Fusion scene — held back; the point cloud did not read. Restoring it
            also needs its import above uncommented. FusionScene.tsx and
            FusionMount.tsx are still in components/three. */}
        {/*
        <Reveal delay={60}>
          <figure className="mt-16">
            <FusionMount />
            <figcaption className="mt-3 font-mono text-[10px] uppercase tracking-label text-bone-faint">
              {technology.fusionCaption}
            </figcaption>
          </figure>
        </Reveal>
        */}

        <Reveal delay={90}>
          <p className="mt-10 font-mono text-[11px] leading-relaxed text-bone-faint">
            {technology.note}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
