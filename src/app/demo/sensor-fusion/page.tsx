"use client";

import DemoGate from "../DemoGate";
import { demo } from "@/theme/content";

const item = demo.items.find((entry) => entry.slug === "sensor-fusion")!;

export default function SensorFusionPage() {
  return (
    <main className="fixed inset-0 bg-night">
      <DemoGate>
        <iframe
          src="/demos/sensor-fusion/viewer/index.html"
          title={item.label}
          className="block h-full w-full border-0"
          allow="fullscreen"
          allowFullScreen
        />
      </DemoGate>
    </main>
  );
}
