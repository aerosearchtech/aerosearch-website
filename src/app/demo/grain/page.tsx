"use client";

import DemoGate from "../DemoGate";
import GrainApp from "@/grain/GrainApp";

export default function GrainPage() {
  return (
    <main className="fixed inset-0 bg-night">
      <DemoGate>
        <GrainApp />
      </DemoGate>
    </main>
  );
}
