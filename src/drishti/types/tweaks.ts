export type RadarTheme = "green" | "amber" | "blue";

export interface Tweaks {
  radarTheme: RadarTheme;
  maxRangeKm: 3 | 5 | 10;
  simSpeed: 0.5 | 1 | 2 | 4;
  showFovArcs: boolean;
  showCIEllipses: boolean;
  nightMode: boolean;
}
