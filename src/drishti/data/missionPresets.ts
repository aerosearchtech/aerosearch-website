// Mission Library — saved presets the operator can load with one click.

export interface MissionPreset {
  id: string;
  name: string;
  blurb: string;
  formation: "WEDGE" | "LINE-ABREAST" | "CIRCULAR" | "DIAMOND";
  waypoints: { id: string; x: number; y: number; label: string }[];
  sectorByDrone: Record<number, string>;
}

export const MISSION_PRESETS: MissionPreset[] = [
  {
    id: "op-mehar-phase-i",
    name: "OP MEHAR — Phase I (Default)",
    blurb: "Wedge formation hold over launch point. Patrol N sector. Battery-driven RTH.",
    formation: "WEDGE",
    waypoints: [{ id: "WP-1", x: 0, y: 0, label: "Launch / Patrol" }],
    sectorByDrone: { 1: "N", 2: "NW", 3: "NE", 4: "W", 5: "E" },
  },
  {
    id: "border-patrol",
    name: "Border Patrol — Linear Sweep",
    blurb: "Line-abreast east-west sweep at 2 km range. Wide-area coverage.",
    formation: "LINE-ABREAST",
    waypoints: [
      { id: "WP-1", x: -2000, y: 1000, label: "Start" },
      { id: "WP-2", x: 0, y: 1500, label: "Mid" },
      { id: "WP-3", x: 2000, y: 1000, label: "End" },
    ],
    sectorByDrone: { 1: "N", 2: "N", 3: "N", 4: "N", 5: "N" },
  },
  {
    id: "quick-recon",
    name: "Quick Recon — 360° Sweep",
    blurb: "Single waypoint with circular formation for 360° coverage. Short mission.",
    formation: "CIRCULAR",
    waypoints: [{ id: "WP-1", x: 0, y: 1200, label: "Recon Centre" }],
    sectorByDrone: { 1: "N", 2: "E", 3: "S", 4: "W", 5: "360°" },
  },
];
