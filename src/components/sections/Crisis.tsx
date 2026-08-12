import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import GlobeMount from "@/components/three/GlobeMount";
import { crisis } from "@/theme/content";

export default function Crisis() {
  return (
    <section className="relative border-t border-line py-24 md:py-36">
      <div className="shell">
        <Reveal>
          <SectionHeading eyebrow={crisis.kicker} title={crisis.title} body={crisis.body} />
        </Reveal>

        {/*
         * The globe carries the worldwide figures beside it: the numbers state
         * the scale, the globe says where. Stats stay 2x2 so they read as a
         * block against it rather than a strip under it.
         */}
        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
          <Reveal className="mx-auto w-full max-w-md lg:max-w-none">
            <GlobeMount />
          </Reveal>

          <div className="grid grid-cols-2 gap-px border border-line bg-line">
            {crisis.stats.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 70} className="bg-night">
                <div className="h-full px-6 py-8 md:px-7 md:py-10">
                  <div className="display text-[clamp(1.9rem,3.4vw,2.9rem)] text-bone">
                    {stat.value}
                  </div>
                  <div className="mt-4 flex items-start gap-2.5 text-sm leading-relaxed text-bone-muted">
                    <span className="mt-[7px] h-1 w-1 shrink-0 bg-signal" aria-hidden />
                    {stat.label}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <p className="mt-6 max-w-2xl font-mono text-[11px] leading-relaxed text-bone-faint">
          {crisis.source}
        </p>
      </div>
    </section>
  );
}
