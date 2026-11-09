"use client";

import DemoGate from "../DemoGate";
import MoistureApp from "@/moisture/MoistureApp";

export default function MoisturePage() {
  return (
    <main className="fixed inset-0 bg-night">
      <DemoGate>
        <MoistureApp />
      </DemoGate>
    </main>
  );
}
