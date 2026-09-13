"use client";

import { useState } from "react";
import { Notice } from "@/components/AuthShell";
import { Stars } from "@/components/Stars";
import type { ModerationReview } from "@/lib/reviews";

/**
 * The owner's queue.
 *
 * Rejecting keeps the row — it just never becomes public. That matters if
 * someone later says their review was made to disappear: there is a record of
 * what was written and what was decided.
 */
export function ModerationQueue({
  initial,
  productNames,
}: {
  initial: ModerationReview[];
  productNames: Record<string, string>;
}) {
  const [queue, setQueue] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function decide(id: string, decision: "published" | "rejected") {
    setBusy(id);
    setError("");
    setDone("");
    try {
      const res = await fetch("/api/reviews/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save that.");
      setQueue((q) => q.filter((r) => r.id !== id));
      setDone(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that.");
    } finally {
      setBusy(null);
    }
  }

  if (queue.length === 0) {
    return (
      <>
        {done && <Notice tone="success">{done}</Notice>}
        <div className="card" style={{ padding: "2rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Nothing waiting</h2>
          <p style={{ color: "var(--fg-muted)", margin: "0.75rem 0 0", fontSize: "0.92rem" }}>
            Every review has been dealt with. New ones land here and you get an email the moment
            one arrives.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}
      {done && <Notice tone="success">{done}</Notice>}

      <div style={{ display: "grid", gap: "1.25rem" }}>
        {queue.map((review) => (
          <div key={review.id} className="card" style={{ padding: "1.75rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
                alignItems: "baseline",
              }}
            >
              <div style={{ display: "flex", gap: "0.7rem", alignItems: "center", flexWrap: "wrap" }}>
                {review.rating !== null && <Stars rating={review.rating} />}
                <strong style={{ fontWeight: 500 }}>{review.displayName}</strong>
                {review.verifiedPurchase ? (
                  <span
                    style={{
                      fontSize: "0.63rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--accent)",
                      border: "1px solid var(--accent)",
                      padding: "0.1rem 0.4rem",
                    }}
                  >
                    Verified buyer
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: "0.63rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--fg-muted)",
                      border: "1px solid var(--line)",
                      padding: "0.1rem 0.4rem",
                    }}
                  >
                    Unverified
                  </span>
                )}
              </div>
              <span style={{ fontSize: "0.78rem", color: "var(--fg-muted)" }}>
                {review.productId ? (productNames[review.productId] ?? review.productId) : "About the brand"}
              </span>
            </div>

            <p
              style={{
                margin: "1rem 0 0",
                fontSize: "0.95rem",
                whiteSpace: "pre-wrap",
              }}
            >
              {review.body}
            </p>

            <p style={{ margin: "1rem 0 0", fontSize: "0.75rem", color: "var(--fg-muted)" }}>
              {new Date(review.createdAt).toLocaleString("en-ZA")}
              {review.email && ` · ${review.email}`}
              {review.orderId && ` · ${review.orderId}`}
            </p>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
              <button
                className="btn"
                onClick={() => decide(review.id, "published")}
                disabled={busy === review.id}
              >
                {busy === review.id ? "Saving…" : "Publish"}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => decide(review.id, "rejected")}
                disabled={busy === review.id}
                style={{ borderColor: "#c0392b", color: "#c0392b" }}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      <p style={{ color: "var(--fg-muted)", fontSize: "0.8rem", marginTop: "2rem" }}>
        Rejecting keeps the review on record rather than deleting it — so if anyone ever asks,
        there is proof of what was written and what you decided. Publish the critical ones too:
        a page of nothing but five stars is the least believable thing on a shop.
      </p>
    </>
  );
}
