import type { Metadata } from "next";
import { IBM_Plex_Sans_Condensed, JetBrains_Mono, Noto_Sans } from "next/font/google";
import { brand, demo } from "@/theme/content";
import "maplibre-gl/dist/maplibre-gl.css";
import "@/msas/msas.css";

const item = demo.items.find((entry) => entry.slug === "msas")!;

const plex = IBM_Plex_Sans_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-msas-ui",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-msas-mono",
  display: "swap",
});

const noto = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-msas-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${item.label} · ${brand.full}`,
  description: item.body,
};

export default function MsasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${plex.variable} ${jetbrains.variable} ${noto.variable} h-full`}>
      {children}
    </div>
  );
}
