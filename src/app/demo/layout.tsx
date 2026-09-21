import type { Metadata } from "next";
import { brand, demo } from "@/theme/content";
import { paletteCss } from "@/bmf/lib/theme";
import "@/bmf/gcs.css";

export const metadata: Metadata = {
  title: `${demo.title} · ${brand.full}`,
  description: demo.body,
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: paletteCss() }} />
      {children}
    </>
  );
}
