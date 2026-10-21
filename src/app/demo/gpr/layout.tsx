import type { Metadata } from "next";
import { brand, demo } from "@/theme/content";
import { THEME_CSS } from "@/gpr/lib/theme";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "@/gpr/gpr.css";

const item = demo.items.find((entry) => entry.slug === "gpr")!;

export const metadata: Metadata = {
  title: `${item.label} · ${brand.full}`,
  description: item.body,
  robots: { index: false, follow: false },
};

export default function GprLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: THEME_CSS }} />
      {children}
    </>
  );
}
