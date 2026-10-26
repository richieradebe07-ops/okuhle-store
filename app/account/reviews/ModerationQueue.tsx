"use client";

import { useState } from "react";
import { Notice } from "@/components/AuthShell";
import { Stars } from "@/components/Stars";
import type { ModerationReview } from "@/lib/reviews";

/**
 * The owner's two small tools, replacing the old approval queue now that
 * reviews auto-publish (V12, 26 Oct 2026):
 *
 *   NEEDS A LOOK — only what the automated filter flagged. "Publish anyway"
 *   clears the flag; "Remove" soft-deletes it, same as it would from
 *   anywhere else.
 *
 *   ALL LIVE REVIEWS — the backstop. Anything currently on the site can be
 *   pulled here, flagged or not, caught by the filter or not — because the
 *   filter is a reasonable net, not a guarantee.
 *
 * Removing keeps the row — it just stops being shown. That matters if
 * someone later says their review was made to disappear: there is a record
 * of what was written and what was decided.
 */
export function ModerationQueue({
  initialFlagged,
  initialLive,
  productNames,
}: {
  initialFlagged: ModerationReview[];
  initialLive: ModerationReview[];
  productNames: Record<string, string>;
}) {
  const [flagged, setFlagged] = useState(initialFlagged);
  const [live, setLive] = useState(initialLive);
  const [busy, setBusy] = useState<string | null>(null);
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function act(id: string, action: "publish" | "remove", reason?: string) {
    setBusy(id);
    setError("");
    setDone("");
    try {
      const res = await fetch("/api/reviews/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save that.");
      setFlagged((q) => q.filter((r) => r.id !== id));
      setLive((q) => q.filter((r) => r.id !== id));
      setDone(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}
      {done && <Notice tone="success">{done}</Notice>}

      <section>
        <h2 style={{ fontSize: "1.3rem", margin: "0 0 1rem" }}>
          Needs a look {flagged.length > 0 && `(${flagged.length})`}
        </h2>

        {flagged.length === 0 ? (
          <div className="card" style={{ padding: "1.75rem", marginBottom: "3rem" }}>
            <p style={{ margin: 0, color: "var(--fg-muted)", fontSize: "0.92rem" }}>
              Nothing waiting. New flags land here, and you get an email the moment one does.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1.25rem", marginBottom: "3rem" }}>
            {flagged.map((review) => (
              <div key={review.id} className="card" style={{ padding: "1.75rem" }}>
                <ReviewHeader review={review} productNames={productNames} />

                <p
                  style={{
                    margin: "0.5rem 0 0",
                    fontSize: "0.72rem",
                    letterSpacing: "0.04em",
                    color: "#c0392b",
                  }}
                >
                  Flagged: {review.flaggedReason}
                </p>

                <ReviewBody review={review} />

                <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
                  <button
                    className="btn"
                    onClick={() => act(review.id, "publish")}
                    disabled={busy === review.id}
                  >
                    {busy === review.id ? "Saving…" : "Publish anyway"}
                  </button>
                  <RemoveControl
                    review={review}
                    busy={busy === review.id}
                    draft={reasonDrafts[review.id] ?? ""}
                    onDraftChange={(v) => setReasonDrafts((d) => ({ ...d, [review.id]: v }))}
                    onRemove={() => act(review.id, "remove", reasonDrafts[review.id]?.trim() || undefined)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: "1.3rem", margin: "0 0 1rem" }}>All live reviews {live.length > 0 && `(${live.length})`}</h2>
        <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem", margin: "0 0 1.25rem", maxWidth: "42rem" }}>
          Everything currently showing on the site. The filter is a reasonable net, not a
          guarantee — pull anything that got through it and shouldn&apos;t have.
        </p>

        {live.length === 0 ? (
          <div className="card" style={{ padding: "1.75rem" }}>
            <p style={{ margin: 0, color: "var(--fg-muted)", fontSize: "0.92rem" }}>Nothing published yet.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1.25rem" }}>
            {live.map((review) => (
              <div key={review.id} className="card" style={{ padding: "1.75rem" }}>
                <ReviewHeader review={review} productNames={productNames} />
                <ReviewBody review={review} />

                <div style={{ marginTop: "1.5rem" }}>
                  <RemoveControl
                    review={review}
                    busy={busy === review.id}
                    draft={reasonDrafts[review.id] ?? ""}
                    onDraftChange={(v) => setReasonDrafts((d) => ({ ...d, [review.id]: v }))}
                    onRemove={() => act(review.id, "remove", reasonDrafts[review.id]?.trim() || undefined)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function ReviewHeader({
  review,
  productNames,
}: {
  review: ModerationReview;
  productNames: Record<string, string>;
}) {
  return (
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
          <Badge tone="accent">Verified buyer</Badge>
        ) : (
          <Badge tone="muted">Unverified</Badge>
        )}
      </div>
      <span style={{ fontSize: "0.78rem", color: "var(--fg-muted)" }}>
        {review.productId ? (productNames[review.productId] ?? review.productId) : "About the brand"}
      </span>
    </div>
  );
}

function ReviewBody({ review }: { review: ModerationReview }) {
  return (
    <>
      <p style={{ margin: "1rem 0 0", fontSize: "0.95rem", whiteSpace: "pre-wrap" }}>{review.body}</p>
      <p style={{ margin: "1rem 0 0", fontSize: "0.75rem", color: "var(--fg-muted)" }}>
        {new Date(review.createdAt).toLocaleString("en-ZA")}
        {review.email && ` · ${review.email}`}
        {review.orderId && ` · ${review.orderId}`}
      </p>
    </>
  );
}

function Badge({ tone, children }: { tone: "accent" | "muted"; children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: "0.63rem",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: tone === "accent" ? "var(--accent)" : "var(--fg-muted)",
        border: `1px solid ${tone === "accent" ? "var(--accent)" : "var(--line)"}`,
        padding: "0.1rem 0.4rem",
      }}
    >
      {children}
    </span>
  );
}

/** A reason field plus the Remove button — the one action every review can take. */
function RemoveControl({
  review,
  busy,
  draft,
  onDraftChange,
  onRemove,
}: {
  review: ModerationReview;
  busy: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onRemove: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
      <input
        type="text"
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        placeholder="Reason (optional, never shown publicly)"
        style={{ minWidth: "16rem", fontSize: "0.85rem" }}
        aria-label={`Reason for removing ${review.displayName}'s review`}
      />
      <button
        className="btn btn-ghost"
        onClick={onRemove}
        disabled={busy}
        style={{ borderColor: "#c0392b", color: "#c0392b" }}
      >
        {busy ? "Saving…" : "Remove"}
      </button>
    </div>
  );
}
