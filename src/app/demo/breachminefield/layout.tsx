import type { Metadata } from "next";
import { brand, demo } from "@/theme/content";

const item = demo.items.find((entry) => entry.slug === "breachminefield")!;

export const metadata: Metadata = {
  title: `${item.label} · ${brand.full}`,
  description: item.body,
};

export default function BreachMineFieldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
