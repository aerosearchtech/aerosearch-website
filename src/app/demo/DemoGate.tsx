"use client";

import { useEffect, useState } from "react";
import { isAuthed } from "@/bmf/auth";
import LoginForm from "./LoginForm";

export default function DemoGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setUnlocked(isAuthed());
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!unlocked) {
    return (
      <div className="bmf-root h-full">
        <LoginForm onSuccess={() => setUnlocked(true)} />
      </div>
    );
  }

  return <>{children}</>;
}
