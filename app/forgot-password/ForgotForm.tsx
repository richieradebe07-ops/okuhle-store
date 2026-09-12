"use client";

import { useState } from "react";
import { Field, Notice } from "@/components/AuthShell";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send the reset link.");
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the reset link.");
    } finally {
      setBusy(false);
    }
  }

  if (message) {
    return (
      <>
        <Notice tone="success">{message}</Notice>
        <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem" }}>
          We answer the same way whether or not that address has an account here — who shops with
          us isn&apos;t something a stranger gets to find out by guessing.
        </p>
      </>
    );
  }

  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}
      <form onSubmit={submit}>
        <Field label="Email">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </Field>
        <button className="btn" type="submit" disabled={busy} style={{ width: "100%" }}>
          {busy ? "Sending…" : "Send me a reset link"}
        </button>
      </form>
    </>
  );
}
