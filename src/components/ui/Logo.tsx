import { LOGO_PATH } from "./logoPath";

/**
 * The Aerosearch Technologies mark: four arms around a concave body, which
 * reads as a rotorcraft seen from above.
 *
 * The outline lives in `logoPath.ts` because it is generated from the supplied
 * artwork rather than authored — see the note there before changing it.
 *
 * `fill="currentColor"` by default so the mark inherits text colour in the
 * chrome; pass a colour where the artwork has to appear as published.
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path d={LOGO_PATH} fill="currentColor" />
    </svg>
  );
}
