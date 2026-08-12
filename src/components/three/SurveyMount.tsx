"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// WebGL scene is client-only (no SSR) and code-split from the initial payload.
const SurveyScene = dynamic(() => import("./SurveyScene"), {
  ssr: false,
  loading: () => <div className="h-full w-full" />,
});

export default function SurveyMount() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  // Render every frame while the hero is on-screen; idle once scrolled well past it.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: "200px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="h-full w-full">
      <SurveyScene frameloop={visible ? "always" : "never"} />
    </div>
  );
}
