"use client";

import DemoGate from "../DemoGate";
import { ConsoleClient } from "@/msas/ConsoleClient";

export default function MsasPage() {
  return (
    <main className="fixed inset-0 bg-night">
      <DemoGate>
        <div className="msas-root h-full">
          <ConsoleClient />
        </div>
      </DemoGate>
    </main>
  );
}
