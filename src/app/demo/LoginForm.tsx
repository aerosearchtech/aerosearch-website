"use client";

import { useState, type FormEvent } from "react";
import { passwordMatches, setAuthed } from "@/bmf/auth";
import { FONT_SANS } from "@/bmf/lib/theme";
import { demo } from "@/theme/content";

export default function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setChecking(true);
    setError("");
    try {
      if (!(await passwordMatches(password))) {
        setError(demo.gate.error);
        setChecking(false);
        return;
      }
      setAuthed();
      onSuccess();
    } catch {
      setError(demo.gate.fail);
      setChecking(false);
    }
  }

  const disabled = checking || !password;

  return (
    <div
      style={{
        minHeight: "100%",
        display: "grid",
        placeItems: "center",
        padding: 24,
        fontFamily: FONT_SANS,
        background: "var(--bg0)",
        color: "var(--tx)",
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: "100%",
          maxWidth: 360,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ marginBottom: 4 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--tx3)",
              marginBottom: 6,
            }}
          >
            {demo.gate.kicker}
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>{demo.title}</h1>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--tx2)" }}>{demo.gate.body}</p>
        </div>
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontSize: 12,
            color: "var(--tx2)",
          }}
        >
          {demo.gate.passwordLabel}
          <input
            type="password"
            name="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: "10px 12px",
              border: "1px solid var(--bd2)",
              background: "var(--bg2)",
              color: "var(--tx)",
              fontFamily: FONT_SANS,
              fontSize: 14,
              outline: "none",
            }}
          />
        </label>
        {error ? <div style={{ fontSize: 12, color: "var(--rd)" }}>{error}</div> : null}
        <button
          type="submit"
          disabled={disabled}
          style={{
            marginTop: 4,
            padding: "10px 14px",
            border: "1px solid var(--am)",
            background: "var(--amWash)",
            color: "var(--am)",
            fontFamily: FONT_SANS,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: disabled ? "default" : "pointer",
            opacity: disabled ? 0.55 : 1,
          }}
        >
          {checking ? demo.gate.checking : demo.gate.submit}
        </button>
      </form>
    </div>
  );
}
