"use client";

import DemoGate from "../DemoGate";
import Viewer from "@/gpr/components/Viewer";

export default function GprPage() {
  return (
    <main className="fixed inset-0 bg-night">
      <DemoGate>
        <Viewer />
      </DemoGate>
    </main>
  );
}
