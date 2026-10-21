"use client";

import DemoGate from "../DemoGate";
import DeckViewer from "@/deck/DeckViewer";
import { demo } from "@/theme/content";

const item = demo.items.find((entry) => entry.slug === "presentation")!;

export default function PresentationPage() {
  return (
    <main className="fixed inset-0 bg-night">
      <DemoGate>
        <DeckViewer title={item.label} />
      </DemoGate>
    </main>
  );
}
