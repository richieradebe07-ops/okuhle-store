"use client";

import { useState } from "react";
import { Field, Notice } from "@/components/AuthShell";
import { formatRand, site, whatsappLink } from "@/lib/site";

type Found = {
  id: string;
  status: string;
  placedAt: string;
  paidAt: string | null;
  item: string;
  amount: number;
};

const STATUS_COPY: Record<string, string> = {
  pending: "We haven't seen a payment for this one yet. If you've paid, give it a few minutes.",
  paid: "Paid. Everything is made to order, so allow 2–3 working days before it ships — your tracking number comes through on WhatsApp.",
  failed: "The payment didn't go through, so nothing has been made. You can order again, or pay on WhatsApp.",
  cancelled: "This order was cancelled. Nothing was charged.",
};

export function TrackForm() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [found, setFound] = useState<Found | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setFound(null);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't find that order.");
      setFound(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't find that order.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}

      {found && (
        <div className="card" style={{ padding: "1.75rem", marginBottom: "2rem" }}>
          <p style={{ margin: 0, fontSize: "1.05rem" }}>{found.item}</p>
          <p style={{ color: "var(--fg-muted)", margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
            {found.id} · {formatRand(found.amount)} ·{" "}
            {new Date(found.placedAt).toLocaleDateString("en-ZA", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          <p
            style={{
              margin: "1.25rem 0 0",
              fontSize: "0.9rem",
              color: found.status === "paid" ? "var(--fg)" : "var(--fg-muted)",
            }}
          >
            {STATUS_COPY[found.status] ?? found.status}
          </p>
          <p style={{ margin: "1.25rem 0 0", fontSize: "0.85rem" }}>
            <a
              href={whatsappLink(`Hi ${site.name}, I'm asking about order ${found.id}.`)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent)" }}
            >
              Ask us about it on WhatsApp
            </a>
          </p>
        </div>
      )}

      <form onSubmit={submit}>
        <Field label="Order number" hint="Starts with OK- — it's on your confirmation email.">
          <input
            type="text"
            required
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="OK-XXXXXX-XXXXXX"
            autoCapitalize="characters"
          />
        </Field>
        <Field label="Email on the order">
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
          {busy ? "Looking…" : "Find my order"}
        </button>
      </form>
    </>
  );
}
