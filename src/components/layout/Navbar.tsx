"use client";

import { useEffect, useState } from "react";
import Wordmark from "@/components/ui/Wordmark";
import { nav } from "@/theme/content";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open
          ? "border-b border-line bg-night/85 backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <nav className="shell flex h-16 items-center justify-between">
        <Wordmark />

        <div className="hidden items-center gap-9 md:flex">
          {nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-bone-muted transition-colors hover:text-bone"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a
            href={nav.cta.href}
            className="hidden bg-bone px-4 py-2 text-sm font-medium text-night transition-opacity hover:opacity-85 sm:inline-block"
          >
            {nav.cta.label}
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center text-bone md:hidden"
          >
            <span className="relative block h-3 w-5">
              <span
                className={`absolute left-0 h-px w-full bg-bone transition-transform ${
                  open ? "top-1.5 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 h-px w-full bg-bone transition-transform ${
                  open ? "top-1.5 -rotate-45" : "top-3"
                }`}
              />
            </span>
          </button>
        </div>
      </nav>

      {open && (
        <div className="shell flex flex-col gap-1 border-t border-line pb-5 pt-3 md:hidden">
          {nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="py-2.5 text-base text-bone-muted transition-colors hover:text-bone"
            >
              {link.label}
            </a>
          ))}
          <a
            href={nav.cta.href}
            onClick={() => setOpen(false)}
            className="mt-2 bg-bone px-4 py-2.5 text-center text-sm font-medium text-night"
          >
            {nav.cta.label}
          </a>
        </div>
      )}
    </header>
  );
}
