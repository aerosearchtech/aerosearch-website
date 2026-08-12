import Reveal from "@/components/ui/Reveal";
import Eyebrow from "@/components/ui/Eyebrow";
import { contact } from "@/theme/content";

export default function Contact() {
  return (
    <section id={contact.id} className="relative border-t border-line py-24 md:py-36">
      <div className="shell">
        <Reveal>
          <div className="border border-line bg-soil px-7 py-14 md:px-16 md:py-20">
            <Eyebrow>{contact.kicker}</Eyebrow>
            <h2 className="display mt-8 max-w-3xl text-[clamp(1.9rem,4.4vw,3.4rem)] text-bone">
              {contact.title}
            </h2>
            <p className="mt-6 max-w-xl text-base leading-[1.75] text-bone-muted md:text-lg">
              {contact.body}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <a
                href={contact.cta.href}
                className="bg-bone px-7 py-3.5 text-sm font-medium text-night transition-opacity hover:opacity-85"
              >
                {contact.cta.label}
              </a>
              <span className="font-mono text-[11px] uppercase tracking-label text-bone-faint">
                {contact.alt}
              </span>
            </div>

            <dl className="mt-12 grid gap-px border-t border-line bg-line sm:grid-cols-3">
              {contact.details.map((detail) => (
                <div key={detail.href} className="bg-soil pt-6">
                  <dt className="font-mono text-[10px] uppercase tracking-label text-bone-faint">
                    {detail.label}
                  </dt>
                  <dd className="mt-2">
                    <a
                      href={detail.href}
                      className="text-sm text-bone transition-colors hover:text-survey md:text-base"
                    >
                      {detail.value}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
