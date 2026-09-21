import type { Metadata } from "next";
import { Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
import { brand, demo } from "@/theme/content";
import "@/drishti/drishti.css";

const item = demo.items.find((entry) => entry.slug === "drishti")!;

const drishtiMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-drishti-mono",
  display: "swap",
});

const drishtiCond = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-drishti-cond",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${item.label} · ${brand.full}`,
  description: item.body,
};

export default function DrishtiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${drishtiMono.variable} ${drishtiCond.variable} h-full`}>
      {children}
    </div>
  );
}
