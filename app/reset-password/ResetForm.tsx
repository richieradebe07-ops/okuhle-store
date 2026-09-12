"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Field, Notice } from "@/components/AuthShell";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-rules";

type Tokens = { accessToken: string; refreshToken: string };

/**
 * Sets a new password from an emailed recovery link.
 *
 * Supabase returns the recovery session in the URL FRAGMENT (after the #),
 * which browsers never send to a server — so this has to be read here, in the
 * browser, and posted to our own endpoint. The endpoint puts the session into
 * httpOnly cookies, so the tokens do not stay in JavaScript's reach any
 * longer than the moment it takes to hand them over.
 *
 * The fragment is stripped from the address bar as soon as it is read, so the
 * link sitting in someone's history is useless.
 */
export function ResetForm() {
  const router = useRouter();
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [linkError, setLinkError] = useState("");
  const [checked, setChecked] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);

    const description = params.get("error_description");
    if (description) {
      setLinkError(description.replace(/\+/g, " "));
    } else {
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (accessToken && refreshToken) {
        setTokens({ accessToken, refreshToken });
        // Don't leave a working recovery session in the browser history.
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
    setChecked(true);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Those two passwords don't match.");
      return;
    }
    if (!tokens) return;

    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tokens, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not change your password.");
      router.replace("/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change your password.");
      setBusy(false);
    }
  }

  if (!checked) return null;

  if (!tokens) {
    return (
      <>
        <Notice tone="error">
          {linkError ||
            "This page needs to be opened from the link in the reset email — that link carries the one-time token that proves it's you."}
        </Notice>
        <Link className="btn" href="/forgot-password">
          Send a new link
        </Link>
      </>
    );
  }

  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}
      <form onSubmit={submit}>
        <Field label="New password" hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}>
          <input
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Again, to be sure">
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
        <button className="btn" type="submit" disabled={busy} style={{ width: "100%" }}>
          {busy ? "Saving…" : "Set my new password"}
        </button>
      </form>
    </>
  );
}
