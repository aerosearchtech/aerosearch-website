import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import RasterMount from "@/components/three/RasterMount";
import { approach } from "@/theme/content";

export default function Approach() {
  return (
    <section id={approach.id} className="relative border-t border-line py-24 md:py-36">
      <div className="shell">
        <Reveal>
          <SectionHeading eyebrow={approach.kicker} title={approach.title} body={approach.body} />
        </Reveal>

        {/* The named system, stated once, immediately above its three stages. */}
        <Reveal delay={60}>
          <div className="mt-14 flex flex-col gap-5 border-y border-line py-7 md:flex-row md:items-baseline md:gap-10">
            <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-label text-bone-faint">
              {approach.system.label}
            </span>
            <span className="display whitespace-nowrap text-2xl text-bone md:text-3xl">
              {approach.system.name}
            </span>
            <p className="max-w-xl text-sm leading-relaxed text-bone-muted md:ml-auto">
              {approach.system.body}
            </p>
          </div>
        </Reveal>

        {/* The run itself, shown before it is explained. */}
        <Reveal delay={90}>
          <figure className="mt-12">
            <RasterMount />
            <figcaption className="mt-3 font-mono text-[10px] uppercase tracking-label text-bone-faint">
              {approach.scanCaption}
            </figcaption>
          </figure>
        </Reveal>

        {/*
         * Numbered because this genuinely is a sequence: nothing is detected
         * before the ground is searched, and nothing is mapped before it is detected.
         */}
        <ol className="mt-16 grid gap-px bg-line md:grid-cols-3">
          {approach.steps.map((step, i) => (
            <Reveal key={step.step} delay={i * 90} className="bg-night">
              <li className="relative flex h-full flex-col pt-8">
                {/* Transect rule with a stake at each step. */}
                <span className="absolute left-0 top-0 h-px w-full bg-line" aria-hidden />
                <span className="absolute left-0 top-0 h-2 w-px bg-survey" aria-hidden />

                <div className="flex items-baseline gap-3 px-6 md:px-8">
                  <span className="font-mono text-[11px] tracking-label text-survey">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-label text-bone-faint">
                    {step.step}
                  </span>
                </div>

                {/* flex-1 + mt-auto keeps the notes on a common baseline
                    even though the step bodies differ in length. */}
                <div className="flex flex-1 flex-col px-6 pb-10 md:px-8">
                  <h3 className="display mt-6 text-xl text-bone md:text-2xl">{step.title}</h3>
                  <p className="mt-auto pt-10 font-mono text-[10px] uppercase tracking-label text-bone-faint">
                    {step.note}
                  </p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>

      </div>
    </section>
  );
}
