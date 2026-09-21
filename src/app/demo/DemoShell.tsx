"use client";

import { useEffect, useState } from "react";
import { isAuthed } from "@/bmf/auth";
import GcsApp from "@/bmf/GcsApp";
import LoginForm from "./LoginForm";

export default function DemoShell() {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setUnlocked(isAuthed());
    setReady(true);
  }, []);

  return (
    <div className="bmf-root">
      {!ready ? null : unlocked ? <GcsApp /> : <LoginForm onSuccess={() => setUnlocked(true)} />}
    </div>
  );
}
