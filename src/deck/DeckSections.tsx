"use client";

import { useState } from "react";
import { Layers } from "lucide-react";

interface Props {
  sections: string[];
  shown: ReadonlySet<string>;
  onToggle: (section: string) => void;
}

/** The appendix sections, each switched in or out of the slide sequence. */
export default function DeckSections({ sections, shown, onToggle }: Props) {
  const [open, setOpen] = useState(false);
  if (!sections.length) return null;

  return (
    <div className="absolute left-4">
      <button
        className="flex h-9 items-center gap-2 px-2 text-bone-muted transition-colors hover:text-bone"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <Layers size={16} />
        Sections
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-64 border border-line bg-soil p-2">
          {sections.map((name) => (
            <label key={name} className="flex cursor-pointer items-center gap-3 px-2 py-2 text-bone-muted hover:text-bone">
              <input type="checkbox" checked={shown.has(name)} onChange={() => onToggle(name)} className="accent-signal" />
              {name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
