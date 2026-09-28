import type { Metadata } from "next";
import { brand, demo } from "@/theme/content";

const item = demo.items.find((entry) => entry.slug === "sensor-fusion")!;

export const metadata: Metadata = {
  title: `${item.label} · ${brand.full}`,
  description: item.body,
  robots: { index: false, follow: false },
};

export default function SensorFusionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
