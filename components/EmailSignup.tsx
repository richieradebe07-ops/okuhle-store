"use client";

import { useState } from "react";
import { useVisitorState } from "./VisitorStateProvider";

/**
 * Newsletter capture. Posts to /api/subscribe, which forwards to ConvertKit
 * when CONVERTKIT_API_KEY / CONVERTKIT_FORM_ID are configured.
 */
export function EmailSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const { markSubscribed } = useVisitorState();
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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

  return (
    <div style={{ maxWidth: "30rem" }}>
      {state === "done" ? (
        <p style={{ color: "var(--accent)", margin: 0 }}>{message}</p>
      ) : (
        <form onSubmit={submit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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
        </form>
      )}
      {state === "error" && (
        <p style={{ color: "#c0392b", fontSize: "0.82rem", marginTop: "0.6rem" }}>{message}</p>
      )}
      <p style={{ color: "var(--fg-muted)", fontSize: "0.78rem", marginTop: "0.75rem" }}>
        We&apos;ll only ever email you about OKUHLE drops. Unsubscribe anytime.
      </p>
    </div>
  );
}
