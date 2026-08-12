import Reveal from "@/components/ui/Reveal";
import { press } from "@/theme/content";

/**
 * The two posts that actually report the milestones above, shown in full.
 *
 * Both platforms render light, which is the opposite of everything else on this
 * page. Rather than fight that, each frame is treated as a clipping pinned to
 * the board: hairline border, mono caption bar, the same idiom as the featured
 * press card.
 */
export default function PressEmbeds() {
  return (
    <div className="mt-20">
      <h3 className="font-mono text-[10px] uppercase tracking-label text-bone-faint">
        {press.embeds.heading}
      </h3>

      <div className="mt-6 grid gap-px border border-line bg-line md:grid-cols-2">
        {press.embeds.items.map((item, i) => (
          <Reveal key={item.src} delay={i * 90} className="bg-night">
            <figure className="flex h-full flex-col">
              <figcaption className="border-b border-line">
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 px-5 py-3 font-mono text-[10px] uppercase tracking-label text-bone-faint transition-colors hover:text-bone"
                >
                  {item.caption}
                  <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                    ↗
                  </span>
                </a>
              </figcaption>
              <iframe
                src={item.src}
                title={item.title}
                loading="lazy"
                allowFullScreen
                className="h-[640px] w-full border-0 bg-soil"
              />
            </figure>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
