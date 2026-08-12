import Image from "next/image";
// import PressEmbeds from "@/components/sections/PressEmbeds";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { press, type PressItem } from "@/theme/content";

const ROW =
  "grid gap-3 border-t border-line px-6 py-7 md:grid-cols-[7rem_1fr_12rem] md:items-baseline md:gap-8 md:px-9";

/** A milestone reads the same whether or not it has a page to link out to. */
function Milestone({ item }: { item: PressItem }) {
  const body = (
    <>
      <time
        dateTime={item.date}
        className="font-mono text-[11px] uppercase tracking-label text-bone-faint"
      >
        {item.dateLabel}
      </time>
      <div>
        <h4 className="text-base font-medium text-bone">{item.title}</h4>
        {item.body && (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-bone-muted">{item.body}</p>
        )}
      </div>
      <span className="font-mono text-[10px] uppercase tracking-label text-bone-faint transition-colors group-hover:text-survey md:text-right">
        {item.source}
        {item.href ? " ↗" : ""}
      </span>
    </>
  );

  if (!item.href) return <div className={ROW}>{body}</div>;

  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group transition-colors hover:bg-soil ${ROW}`}
    >
      {body}
    </a>
  );
}

export default function Press() {
  const { featured } = press;

  return (
    <section id={press.id} className="relative border-t border-line py-24 md:py-36">
      <div className="shell">
        <Reveal>
          <SectionHeading eyebrow={press.kicker} title={press.title} />
        </Reveal>

        {/* Lead story */}
        <Reveal delay={100}>
          <article className="mt-16 grid border border-line lg:grid-cols-2">
            <figure className="relative border-b border-line lg:border-b-0 lg:border-r">
              <div className="relative aspect-[3/2] w-full">
                <Image
                  src={featured.image}
                  alt={featured.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="border-t border-line px-5 py-3 font-mono text-[10px] uppercase tracking-label text-bone-faint">
                {featured.caption}
              </figcaption>
            </figure>

            <div className="flex flex-col justify-center px-7 py-10 md:px-11 md:py-14">
              <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-label text-survey">
                <span className="h-1.5 w-1.5 bg-survey" aria-hidden />
                {featured.dateLabel}
              </div>
              <h3 className="display mt-6 text-[clamp(1.6rem,3vw,2.4rem)] text-bone">
                {featured.title}
              </h3>
              <p className="mt-5 text-sm leading-[1.75] text-bone-muted md:text-base">
                {featured.body}
              </p>
              <a
                href={featured.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-8 inline-flex w-fit items-center gap-2 border-b border-bone-faint pb-1 font-mono text-[11px] uppercase tracking-label text-bone transition-colors hover:border-bone"
              >
                {featured.source}
                <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                  ↗
                </span>
              </a>
            </div>
          </article>
        </Reveal>

        {/* Record */}
        <ul className="mt-px border-x border-b border-line">
          {press.items.map((item, i) => (
            <Reveal key={`${item.date}-${item.title}`} delay={i * 70}>
              <li>
                <Milestone item={item} />
              </li>
            </Reveal>
          ))}
        </ul>

        {/* "Seen elsewhere" — held back for now. */}
        {/* <PressEmbeds /> */}
      </div>
    </section>
  );
}
