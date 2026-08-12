import Eyebrow from "./Eyebrow";

/** Reusable eyebrow + headline + optional lead paragraph. */
export default function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="max-w-3xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="display mt-6 text-[clamp(1.9rem,4.4vw,3.4rem)] text-bone">{title}</h2>
      {body && (
        <p className="mt-6 max-w-2xl text-base leading-[1.7] text-bone-muted md:text-lg">{body}</p>
      )}
    </div>
  );
}
