"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import LogoSpinner from "@/components/ui/LogoSpinner";

// WebGL scene is client-only (no SSR) and code-split from the initial payload.
const FusionScene = dynamic(() => import("./FusionScene"), {
  ssr: false,
  loading: () => <LogoSpinner />,
});

export default function FusionMount() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // The merge only runs while it is on screen; scrolling past parks the loop.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: "150px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="relative aspect-[4/3] w-full border border-line bg-night sm:aspect-[16/10] lg:aspect-[2/1]"
    >
      <FusionScene frameloop={visible ? "always" : "never"} />
    </div>
  );
}
