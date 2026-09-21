"use client";

import DemoGate from "../DemoGate";
import AigarmApp from "@/aigarm/App";

export default function AigarmPage() {
  return (
    <main className="fixed inset-0 bg-night">
      <DemoGate>
        <div className="aigarm-root">
          <AigarmApp />
        </div>
      </DemoGate>
    </main>
  );
}
