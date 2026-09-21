import type { Metadata } from "next";
import { Barlow_Condensed, JetBrains_Mono } from "next/font/google";
import { brand, demo } from "@/theme/content";
import "maplibre-gl/dist/maplibre-gl.css";
import "@/aigarm/aigarm.css";

const item = demo.items.find((entry) => entry.slug === "aigarm")!;

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-aigarm-ui",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-aigarm-data",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${item.label} · ${brand.full}`,
  description: item.body,
};

export default function AigarmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${barlow.variable} ${jetbrains.variable} h-full`}>
      {children}
    </div>
  );
}
