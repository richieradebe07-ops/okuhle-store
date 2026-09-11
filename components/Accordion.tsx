"use client";

import { useState } from "react";

export function Accordion({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ borderBottom: "1px solid var(--line)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          padding: "1.15rem 0",
          background: "transparent",
          border: "none",
          color: "var(--fg)",
          font: "inherit",
          fontSize: "0.98rem",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <span>{q}</span>
        <span
          aria-hidden
          style={{
            color: "var(--accent)",
            fontSize: "1.2rem",
            transform: open ? "rotate(45deg)" : "none",
            transition: "transform 0.2s ease",
            flexShrink: 0,
          }}
        >
          +
        </span>
      </button>
      {open && (
        <p
          style={{
            margin: "0 0 1.25rem",
            paddingRight: "2rem",
            color: "var(--fg-muted)",
            fontSize: "0.92rem",
          }}
        >
          {a}
        </p>
      )}
    </div>
  );
}
