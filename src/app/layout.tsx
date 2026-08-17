import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Outfit } from "next/font/google";
import { brand } from "@/theme/content";
import { colors } from "@/theme/colors";
import "./globals.css";

/**
 * Archivo carries both display and body. It is a neutral grotesque, which is the
 * convention in this category (Anduril, Helsing, and Apollyon all run one), but
 * with slightly more character than Helvetica — enough to not read as a default.
 * Weight and tracking do the work of separating display from body.
 */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

/** Field data: coordinates, labels, figures, captions. */
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

/**
 * The wordmark only — one weight, one string, never body copy. A geometric face
 * next to the geometric mark, where Archivo would have read as running text.
 */
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mark",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(`https://www.${brand.domain}`),
  // Kept under ~60 characters; the tagline is too long to survive a search result.
  title: `${brand.full} - Autonomous threat prediction`,
  description:
    "Aerosearch Technologies develops hardware-integrated autonomy for contested environments - fusing multi-dimensional signals into predictive threat intelligence.",
  keywords: [
    brand.product,
    "landmine detection drone",
    "defence drone India",
    "humanitarian demining",
    "aerial threat detection",
    "mine action technology",
    "explosive ordnance detection",
    brand.full,
  ],
  openGraph: {
    title: brand.full,
    description:
      "Every threat found is a life saved. Autonomous threat prediction for defence and humanitarian demining.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: colors.night,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
