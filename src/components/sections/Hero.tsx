import SurveyMount from "@/components/three/SurveyMount";
import Reveal from "@/components/ui/Reveal";
import { hero } from "@/theme/content";

export default function Hero() {
  return (
    <section id="top" className="relative min-h-[100svh] w-full overflow-hidden">
      <div className="absolute inset-0">
        <SurveyMount />
      </div>

      {/* Legibility gradients: dark at the edges, scene breathing through the middle. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-night/75 via-transparent to-night" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-night via-night/45 to-transparent" />

      <div className="relative z-10 flex min-h-[100svh] items-end pb-20 pt-28">
        <div className="shell">
          <Reveal>
            <span className="eyebrow inline-flex items-center gap-3">
              <span className="h-px w-8 bg-survey" aria-hidden />
              {hero.kicker}
            </span>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="display-hero mt-7 max-w-5xl text-[clamp(2.6rem,8.2vw,6.6rem)] text-bone">
              {hero.title[0]}
              <br />
              {hero.title[1]}
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mt-8 max-w-xl text-base leading-[1.7] text-bone-muted md:text-lg">
              {hero.body}
            </p>
          </Reveal>

          <Reveal delay={260}>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <a
                href={hero.primary.href}
                className="bg-bone px-7 py-3.5 text-sm font-medium text-night transition-opacity hover:opacity-85"
              >
                {hero.primary.label}
              </a>
              <a
                href={hero.secondary.href}
                className="group inline-flex items-center gap-2 border border-line px-7 py-3.5 text-sm font-medium text-bone transition-colors hover:border-bone-faint"
              >
                {hero.secondary.label}
                <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                  →
                </span>
              </a>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Live payload state */}
      <div className="absolute bottom-8 right-8 z-10 hidden items-center gap-2.5 font-mono text-[10px] uppercase tracking-label text-survey md:flex">
        <span className="h-1.5 w-1.5 animate-pulse-soft bg-survey" />
        {hero.status}
      </div>
    </section>
  );
}
