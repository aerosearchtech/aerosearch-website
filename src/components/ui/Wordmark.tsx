import Logo from "@/components/ui/Logo";
import { brand } from "@/theme/content";

/**
 * Mark plus name, as one lockup. Used in the navbar and the footer, so it is
 * defined once here rather than assembled twice.
 *
 * "Technologies" sits back in the muted tone: the eye lands on the name, but
 * the full legal name is what is actually written. No weight change does that
 * work — only colour — which keeps the lockup quiet next to the blue mark.
 */
export default function Wordmark({ className = "" }: { className?: string }) {
  const [name, ...rest] = brand.full.split(" ");

  return (
    <a href="#top" className={`flex items-center gap-2.5 ${className}`} aria-label={`${brand.full} home`}>
      <Logo className="h-[1.3rem] w-[1.3rem] shrink-0 text-mark" />
      <span className="font-mark text-[1.0625rem] font-normal tracking-[0.005em] sm:text-lg">
        <span className="text-bone">{name}</span>{" "}
        <span className="text-bone-muted">{rest.join(" ")}</span>
      </span>
    </a>
  );
}
