"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, Notice } from "@/components/AuthShell";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-rules";

/* ------------------------------------------------------------------ */
/* Marketing consent                                                  */
/* ------------------------------------------------------------------ */

/**
 * One switch, and it is as easy to turn off as on — POPIA s69(3)(b) requires
 * exactly that. No "are you sure you want to miss out" step, no re-tick a
 * week later, no confirmation email to click before it takes effect.
 */
export function MarketingToggle({ initial }: { initial: boolean }) {
  const [granted, setGranted] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function change(next: boolean) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/account/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ granted: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save that.");
      setGranted(next);
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error && <Notice tone="error">{error}</Notice>}
      {message && <Notice tone="success">{message}</Notice>}

      <label
        style={{
          display: "flex",
          gap: "0.7rem",
          alignItems: "flex-start",
          fontSize: "0.9rem",
          cursor: busy ? "wait" : "pointer",
          lineHeight: 1.5,
        }}
      >
        <input
          type="checkbox"
          checked={granted}
          disabled={busy}
          onChange={(e) => change(e.target.checked)}
          style={{ width: "auto", marginTop: "0.25rem", flexShrink: 0 }}
        />
        <span>
          Email me about new drops and member-only pieces.
          <span style={{ display: "block", color: "var(--fg-muted)", fontSize: "0.82rem", marginTop: "0.3rem" }}>
            Order confirmations and delivery updates are separate — you get those either way,
            because they&apos;re part of the order you placed, not marketing.
          </span>
        </span>
      </label>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Password                                                           */
/* ------------------------------------------------------------------ */

export function PasswordChange() {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not change it.");
      setMessage("Password changed. Anywhere else you were signed in has been signed out.");
      setCurrent("");
      setNew("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change it.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      {error && <Notice tone="error">{error}</Notice>}
      {message && <Notice tone="success">{message}</Notice>}

      <Field label="Current password">
        <input
          type="password"
          required
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </Field>
      <Field label="New password" hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}>
        <input
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNew(e.target.value)}
        />
      </Field>
      <button className="btn btn-ghost" type="submit" disabled={busy}>
        {busy ? "Changing…" : "Change password"}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Deletion                                                           */
/* ------------------------------------------------------------------ */

/**
 * Account deletion, with the consequences stated before the button, not
 * after. Two deliberate acts are required — the password and the typed word —
 * because this one cannot be undone.
 */
export function DeleteAccount({ paidOrders }: { paidOrders: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not delete the account.");
      setDone(true);
      setTimeout(() => {
        router.replace("/");
        router.refresh();
      }, 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the account.");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Notice tone="success">
        Your account is deleted. We&apos;ve emailed you a confirmation of what was removed and what
        tax law requires us to keep. Taking you back to the homepage…
      </Notice>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn btn-ghost"
        style={{ borderColor: "#c0392b", color: "#c0392b" }}
      >
        Delete my account
      </button>
    );
  }

  return (
    <form onSubmit={submit}>
      {error && <Notice tone="error">{error}</Notice>}

      <div
        className="card"
        style={{ padding: "1.5rem", marginBottom: "1.5rem", borderColor: "#c0392b" }}
      >
        <p style={{ margin: 0, fontSize: "0.9rem" }}>
          <strong>Deleted, permanently:</strong> your login, your name, your points balance and
          history, and your Okuhle+ membership record if you have one. None of it can be restored.
        </p>
        {paidOrders > 0 && (
          <p style={{ margin: "1rem 0 0", fontSize: "0.9rem", color: "var(--fg-muted)" }}>
            <strong style={{ color: "var(--fg)" }}>
              Kept: {paidOrders} paid order {paidOrders === 1 ? "record" : "records"}.
            </strong>{" "}
            South African tax law requires records of sales to be kept for five years, so we
            aren&apos;t allowed to delete those. They stop being linked to any account, and nobody
            can log in to see them.
          </p>
        )}
        <p style={{ margin: "1rem 0 0", fontSize: "0.9rem", color: "var(--fg-muted)" }}>
          <strong style={{ color: "var(--fg)" }}>Also kept:</strong> the record of what you agreed
          to and when, with your account link removed. If anyone ever asks whether you consented
          to marketing, the answer has to be a record rather than a guess.
        </p>
      </div>

      <Field label="Your password">
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Field label="Type DELETE to confirm">
        <input
          type="text"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="DELETE"
        />
      </Field>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button
          className="btn"
          type="submit"
          disabled={busy || confirm !== "DELETE"}
          style={{ background: "#c0392b", borderColor: "#c0392b", color: "#fff" }}
        >
          {busy ? "Deleting…" : "Delete my account permanently"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
          Keep my account
        </button>
      </div>
    </form>
  );
}
