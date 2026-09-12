"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Field, Notice } from "@/components/AuthShell";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const justConfirmed = params.get("confirmed") === "1";
  const next = params.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not sign you in.");

      // Only ever an in-app path, so a crafted ?next= cannot bounce someone
      // off the site with their session freshly minted.
      const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
      router.replace(target);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign you in.");
      setBusy(false);
    }
  }

  return (
    <>
      {justConfirmed && (
        <Notice tone="success">
          Email confirmed. Sign in and your account is ready.
        </Notice>
      )}
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

        <Field label="Password">
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <button className="btn" type="submit" disabled={busy} style={{ width: "100%" }}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p style={{ marginTop: "1.1rem", fontSize: "0.85rem" }}>
        <Link href="/forgot-password" style={{ color: "var(--fg-muted)" }}>
          Forgotten your password?
        </Link>
      </p>
    </>
  );
}
