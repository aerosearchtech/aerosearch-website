import type { Metadata } from "next";
import { brand, demo } from "@/theme/content";
import { THEME_CSS } from "@/moisture/lib/theme";
import "@/moisture/moisture.css";

const item = demo.items.find((entry) => entry.slug === "moisture")!;

export const metadata: Metadata = {
  title: `${item.label} · ${brand.full}`,
  description: item.body,
  robots: { index: false, follow: false },
};

export default function MoistureLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: THEME_CSS }} />
      {children}
    </>
  );
}
