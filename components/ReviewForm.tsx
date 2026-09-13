"use client";

import Link from "next/link";
import { useState } from "react";
import { Field, Notice } from "./AuthShell";
import { StarInput } from "./Stars";
import { useVisitorState } from "./VisitorStateProvider";

/**
 * Leave a review, or a comment about the brand.
 *
 * Two things are said plainly rather than discovered later:
 *  - nothing appears until a person reads it
 *  - the name you type is what the public sees, and the email never is
 *
 * The order-number field is optional and only offered to people who aren't
 * signed in — a session already proves the purchase without anyone typing
 * anything.
 */
export function ReviewForm({
  productId,
  productName,
  orderId,
}: {
  /** Null for a general comment about the brand. */
  productId?: string | null;
  productName?: string | null;
  /** Pre-filled when arriving from a specific order. */
  orderId?: string | null;
}) {
  const { profile, ready } = useVisitorState();
  const signedIn = ready && profile.signedIn;

  const [rating, setRating] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState(orderId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (productId && rating === null) {
      setError("Give it a star rating too.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: productId ?? null,
          rating,
          body,
          displayName: displayName.trim() || undefined,
          email: email.trim() || undefined,
          orderId: order.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save that.");
      setDone(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <Notice tone="success">{done}</Notice>;
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: "34rem" }}>
      {error && <Notice tone="error">{error}</Notice>}

      {productId && (
        <div style={{ marginBottom: "1.25rem" }}>
          <StarInput value={rating} onChange={setRating} />
        </div>
      )}

      <Field
        label={productId ? `Your review of the ${productName ?? "piece"}` : "Your comment"}
        hint={`${body.trim().length}/2000 characters`}
      >
        <textarea
          required
          rows={5}
          maxLength={2000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            productId
              ? "How does it fit? How has it washed? Anything you'd want to know before buying."
              : "Anything you'd like to tell us."
          }
        />
      </Field>

      <Field
        label="Name to show"
        hint="This appears publicly with your review. A first name is fine."
      >
        <input
          type="text"
          required={!signedIn}
          maxLength={60}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={signedIn && profile.firstName ? profile.firstName : "Thabo"}
        />
      </Field>

      {!signedIn && (
        <>
          <Field
            label="Email"
            hint="Never shown publicly. We use it to match your review to your order and to reply if we need to."
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </Field>

          {productId && (
            <Field
              label="Order number (optional)"
              hint="Starts with OK-. With the matching email, it earns your review a “verified buyer” badge."
            >
              <input
                type="text"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                placeholder="OK-XXXXXX-XXXXXX"
                autoCapitalize="characters"
              />
            </Field>
          )}
        </>
      )}

      <button className="btn" type="submit" disabled={busy} style={{ width: "100%" }}>
        {busy ? "Sending…" : productId ? "Leave my review" : "Leave my comment"}
      </button>

      <p style={{ color: "var(--fg-muted)", fontSize: "0.78rem", marginTop: "0.9rem" }}>
        A person reads every review before it goes up, so it won&apos;t appear straight away. We
        publish the good and the bad — what we don&apos;t publish is abuse, or anything naming
        someone else.{" "}
        {!signedIn && (
          <>
            <Link href="/login" style={{ color: "var(--fg-muted)" }}>
              Signing in
            </Link>{" "}
            saves typing and verifies your purchase automatically.
          </>
        )}
      </p>
    </form>
  );
}
