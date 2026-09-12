"use client";

import { useState } from "react";
import { formatRand } from "@/lib/site";

/**
 * Starts a PayFast checkout. The server builds and signs the field set; this
 * just posts it. Renders nothing until PayFast credentials exist, so the button
 * can never appear without a working checkout behind it.
 */
export function BuyNow({
  productId,
  colour,
  size,
  price,
  enabled,
}: {
  productId: string;
  colour: string;
  size: string | null;
  price: number;
  enabled: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!enabled) return null;

  async function buy() {
    if (!size) {
      setError("Pick a size first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, colour, size }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start checkout.");

      // Hand off to PayFast with the signed fields.
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.action;
      for (const [name, value] of Object.entries(data.fields as Record<string, string>)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button className="btn" onClick={buy} disabled={busy} style={{ width: "100%" }}>
        {busy ? "Taking you to PayFast…" : `Buy now — ${formatRand(price)}`}
      </button>
      {error && (
        <p style={{ color: "#c0392b", fontSize: "0.78rem", marginTop: "0.5rem" }}>{error}</p>
      )}
      <p
        style={{
          fontSize: "0.68rem",
          color: "var(--fg-muted)",
          textAlign: "center",
          margin: "0.6rem 0 0",
        }}
      >
        Secure payment via PayFast · Card, Instant EFT, SnapScan &amp; Zapper
      </p>
    </div>
  );
}
