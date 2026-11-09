import type { Metadata } from "next";
import { brand, demo } from "@/theme/content";
import { THEME_CSS } from "@/grain/theme/colors";
import "@fontsource/barlow-semi-condensed/400.css";
import "@fontsource/barlow-semi-condensed/500.css";
import "@fontsource/barlow-semi-condensed/600.css";
import "@fontsource/barlow-semi-condensed/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@/grain/grain.css";

const item = demo.items.find((entry) => entry.slug === "grain")!;

export const metadata: Metadata = {
  title: `${item.label} · ${brand.full}`,
  description: item.body,
  robots: { index: false, follow: false },
};

export default function GrainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: THEME_CSS }} />
      {children}
    </>
  );
}
