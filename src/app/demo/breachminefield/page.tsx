"use client";

import DemoGate from "../DemoGate";
import GcsApp from "@/bmf/GcsApp";

export default function BreachMineFieldPage() {
  return (
    <main className="fixed inset-0 bg-night">
      <DemoGate>
        <div className="bmf-root h-full">
          <GcsApp />
        </div>
      </DemoGate>
    </main>
  );
}
