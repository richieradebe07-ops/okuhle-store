"use client";

import Link from "next/link";
import { rungFor } from "@/lib/ladder";
import { useVisitorState } from "./VisitorStateProvider";

/**
 * The single dominant action for wherever this visitor is on the ladder.
 * The optional secondary link is suppressed when it would point at the same
 * place as the primary — one screen, one ask.
 */
export function PrimaryCta({
  showSupport = false,
  secondary,
}: {
  showSupport?: boolean;
  secondary?: { label: string; href: string };
}) {
  const { state, ready } = useVisitorState();
  const rung = rungFor(state);
  const showSecondary = secondary && secondary.href !== rung.href;

  return (
    <div
      style={{
        display: "flex",
        gap: "1.25rem",
        alignItems: "center",
        flexWrap: "wrap",
        visibility: ready ? "visible" : "hidden",
      }}
    >
      <span style={{ display: "inline-flex", flexDirection: "column", gap: "0.45rem" }}>
        <Link className="btn" href={rung.href}>
          {rung.label}
        </Link>
        {showSupport && rung.support && (
          <span style={{ fontSize: "0.78rem", color: "var(--fg-muted)" }}>{rung.support}</span>
        )}
      </span>

      {showSecondary && (
        <Link href={secondary.href} style={{ color: "var(--fg-muted)", fontSize: "0.85rem" }}>
          {secondary.label}
        </Link>
      )}
    </div>
  );
}
