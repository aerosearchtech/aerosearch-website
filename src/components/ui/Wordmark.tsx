import { brand } from "@/theme/content";
import Logo from "./Logo";

/** Shared Aerosearch lockup for the navbar, footer, and demo index. */
export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <a
      href="/#top"
      className={`inline-flex shrink-0 items-center gap-2 text-bone sm:gap-2.5 ${className}`}
      aria-label={`${brand.full} home`}
    >
      <Logo className="block h-auto w-7 shrink-0 sm:w-8" />
      <img
        src="/logos/aerosearch/aerosearch-inline-text.svg"
        alt=""
        aria-hidden="true"
        width={570}
        height={24}
        className="block h-[11px] w-auto max-w-[calc(100vw-7.5rem)] shrink-0 object-contain sm:max-w-none"
      />
    </a>
  );
}
