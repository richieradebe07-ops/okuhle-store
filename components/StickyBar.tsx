"use client";

import Link from "next/link";
import { rungFor } from "@/lib/ladder";
import { useVisitorState } from "./VisitorStateProvider";
import { site, whatsappLink } from "@/lib/site";

/**
 * One primary action, fixed to the bottom. The rung decides what it is.
 * WhatsApp stays reachable but visually subordinate — it is no longer the
 * dominant ask for someone who arrived thirty seconds ago.
 */
export function StickyBar() {
  const { state, ready } = useVisitorState();
  const rung = rungFor(state);

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.25rem",
        padding: "0.85rem 1rem",
        background: "var(--accent)",
        color: "var(--accent-fg)",
        visibility: ready ? "visible" : "hidden",
      }}
    >
      <Link
        href={rung.href}
        style={{
          color: "var(--accent-fg)",
          textDecoration: "none",
          fontSize: "0.8rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          fontWeight: 500,
        }}
      >
        {rung.label}
      </Link>

      <a
        href={whatsappLink(`Hi ${site.name}! I'd like to ask about an order.`)}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "var(--accent-fg)",
          opacity: 0.72,
          textDecoration: "underline",
          fontSize: "0.72rem",
        }}
      >
        or WhatsApp us
      </a>
    </div>
  );
}
