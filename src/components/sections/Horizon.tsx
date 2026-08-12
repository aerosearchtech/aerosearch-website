import Reveal from "@/components/ui/Reveal";
import Eyebrow from "@/components/ui/Eyebrow";
import { horizon } from "@/theme/content";

/**
 * The arc past the current product. Numbered because it is a real sequence —
 * you cannot clear autonomously what you cannot yet detect — and the marker on
 * stage one is the honest part: it says out loud where the company actually is.
 */
export default function Horizon() {
  return (
    <section id={horizon.id} className="relative border-t border-line py-24 md:py-36">
      <div className="shell">
        <Reveal>
          <Eyebrow>{horizon.kicker}</Eyebrow>
          <h2 className="display mt-8 max-w-3xl text-[clamp(1.9rem,4.4vw,3.4rem)] text-bone">
            {horizon.title}
          </h2>
        </Reveal>

        <ol className="mt-16 grid gap-px bg-line md:grid-cols-3">
          {horizon.stages.map((stage, i) => (
            <Reveal key={stage.title} delay={i * 90} className="bg-night">
              <li className="relative flex h-full flex-col px-6 pb-10 pt-8 md:px-8">
                <span className="absolute left-0 top-0 h-px w-full bg-line" aria-hidden />
                {/* The stake is lit only on the stage we have actually reached. */}
                <span
                  className={`absolute left-0 top-0 h-2 w-px ${stage.here ? "bg-signal" : "bg-line"}`}
                  aria-hidden
                />

                <div className="flex items-baseline gap-3">
                  <span
                    className={`font-mono text-[11px] tracking-label ${
                      stage.here ? "text-signal" : "text-bone-faint"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {stage.here && (
                    <span className="font-mono text-[10px] uppercase tracking-label text-signal">
                      We are here
                    </span>
                  )}
                </div>

                <h3 className="display mt-6 text-xl text-bone md:text-2xl">{stage.title}</h3>
                <p className="mt-4 text-sm leading-[1.75] text-bone-muted md:text-base">
                  {stage.body}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
