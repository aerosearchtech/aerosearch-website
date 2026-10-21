"use client";

import DemoGate from "../DemoGate";
import LiveApp from "@/bmf/LiveApp";

export default function LiveFusionPage() {
  return (
    <main className="fixed inset-0 bg-night">
      <DemoGate>
        <div className="bmf-root h-full">
          <LiveApp />
        </div>
      </DemoGate>
    </main>
  );
}
