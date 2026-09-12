"use client";

import Link from "next/link";
import { useState } from "react";
import { useVisitorState } from "./VisitorStateProvider";

/**
 * Newsletter capture.
 *
 * POPIA section 69: marketing consent is a separate, deliberate act. The box
 * below starts UNTICKED and is never bundled with anything else. Only people
 * who tick it are added to the marketing audience.
 */
export function EmailSignup() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const { markSubscribed } = useVisitorState();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setState("error");
      setMessage("Tick the box below so we know you want the emails.");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, marketingConsent: consent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setState("done");
      setMessage(data.message ?? "You're on the list.");
      markSubscribed();
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (state === "done") {
    return (
      <div style={{ maxWidth: "30rem" }}>
        <p style={{ color: "var(--accent)", margin: 0 }}>{message}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "30rem" }}>
      <form onSubmit={submit}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            aria-label="Email address"
            style={{ flex: "1 1 14rem" }}
          />
          <button className="btn" type="submit" disabled={state === "sending"}>
            {state === "sending" ? "Joining…" : "Join the list"}
          </button>
        </div>

        <label
          style={{
            display: "flex",
            gap: "0.6rem",
            alignItems: "flex-start",
            marginTop: "0.9rem",
            fontSize: "0.82rem",
            color: "var(--fg-muted)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            style={{ width: "auto", marginTop: "0.2rem", flexShrink: 0 }}
          />
          <span>
            Send me new drop announcements and offers by email. You can unsubscribe from any
            email, or just tell us on WhatsApp — we&apos;ll action it either way.
          </span>
        </label>
      </form>

      {state === "error" && (
        <p style={{ color: "#c0392b", fontSize: "0.82rem", marginTop: "0.6rem" }}>{message}</p>
      )}

      <p style={{ color: "var(--fg-muted)", fontSize: "0.74rem", marginTop: "0.75rem" }}>
        We&apos;ll only ever email you about OKUHLE. See our{" "}
        <Link href="/privacy" style={{ color: "var(--fg-muted)" }}>
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
