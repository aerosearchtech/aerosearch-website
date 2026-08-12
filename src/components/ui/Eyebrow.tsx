import type { ReactNode } from "react";

/** Uppercase technical micro-label with a leading survey tick. */
export default function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="eyebrow inline-flex items-center gap-3">
      <span className="h-px w-8 bg-survey" aria-hidden />
      {children}
    </span>
  );
}
