"use client";

import { useEffect, useState } from "react";
import { DECK_URL } from "./constants";
import type { Deck } from "./types";

/** The exported deck; error is set when deck.json cannot be loaded. */
export function useDeck(): { deck: Deck | null; error: string | null } {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${DECK_URL}/deck.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Deck>;
      })
      .then(setDeck)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  return { deck, error };
}
