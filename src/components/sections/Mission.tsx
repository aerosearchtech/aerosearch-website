import Reveal from "@/components/ui/Reveal";
import { mission } from "@/theme/content";

/**
 * The one inverted section on the page. Bone is "cleared ground" in this
 * palette, so the mission statement literally sits on the outcome the company
 * is working toward — and it breaks eight screens of dark with one bright beat.
 */
export default function Mission() {
  return (
    <section
      id={mission.id}
      className="relative overflow-hidden border-t border-line bg-bone py-28 md:py-44"
    >
      <div
        className="transect pointer-events-none absolute inset-0 opacity-[0.09]"
        style={{
          maskImage: "radial-gradient(ellipse at 50% 120%, black 10%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 120%, black 10%, transparent 72%)",
        }}
        aria-hidden
      />

      <div className="shell relative">
        <div className="max-w-4xl">
          <Reveal>
            <span className="inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-label text-night/55">
              <span className="h-px w-8 bg-signal" aria-hidden />
              {mission.kicker}
            </span>
            <p className="display mt-9 text-[clamp(1.8rem,4.2vw,3.2rem)] text-night">
              {mission.title}
            </p>
            <p className="mt-9 max-w-2xl text-base leading-[1.8] text-night/70 md:text-lg">
              {mission.body}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
