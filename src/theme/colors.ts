/**
 * Single source of truth for the Aerosearch color system.
 * Never hardcode hex values elsewhere — import from here (TS/Three.js)
 * or use the Tailwind tokens generated from this file (JSX classNames).
 *
 * The palette is taken from the field semiotics of mine action, where ground
 * is marked in three states:
 *   signal (red)  — contaminated, do not enter
 *   survey (ochre)— being worked
 *   bone  (white) — cleared, safe to cross
 * Colour therefore carries meaning on this site; it is not decoration.
 * Red is reserved for genuine hazard semantics and never used for chrome.
 */

export const colors = {
  // Ground — warm near-black. Soil at night, not a blue-cast "tech" black.
  night: "#0A0A09",
  soil: "#121110",
  ridge: "#1A1714",
  line: "#272320",

  // Bone — cleared ground, and the primary reading colour.
  bone: "#EDE7DD",
  boneMuted: "#9C9489",
  boneFaint: "#5E574E",

  // Signal — marker red. Contamination, detection, live hazard only.
  signal: "#E4462B",
  signalDim: "#7E2818",

  // Survey — ochre. Work in progress, scan sweep, in-flight state.
  survey: "#D9A441",

  // Mark blue. The logo's own colour, taken from the artwork. It is the one
  // hue with no field meaning, so it is used for the mark and nothing else.
  mark: "#0155CC",
} as const;

/**
 * Feed colours for the formation scene.
 *
 * These are channel identifiers, not field semantics — one hue per aircraft so
 * the reader can tell the reads apart. They are chosen to blend additively
 * toward white where they overlap, which is the whole argument of that scene:
 * separate feeds resolving into one picture. Used nowhere else on the site.
 */
export const feeds = ["#D9A441", "#4E9BFF", "#35C9A8", "#E8D9B0", "#9B7BFF"] as const;

export type ColorToken = keyof typeof colors;
