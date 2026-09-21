"use client";

import { Suspense } from "react";
import DemoGate from "../DemoGate";
import { GCSApp } from "@/drishti/components/gcs/GCSApp";

export default function DrishtiPage() {
  return (
    <main className="fixed inset-0 bg-night">
      <DemoGate>
        <div className="drishti-root">
          <Suspense fallback={null}>
            <GCSApp />
          </Suspense>
        </div>
      </DemoGate>
    </main>
  );
}
