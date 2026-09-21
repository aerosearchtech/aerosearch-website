// MANET / OLSR link state between two drones (or drone↔GCS).

export interface CommsLink {
  fromId: number;
  toId: number; // 0 = GCS
  quality: number; // 0–100
  active: boolean;
}

export interface CommsState {
  protocol: "OLSR";
  latencyMs: number;
  jitterMs: number;
  links: CommsLink[];
}
