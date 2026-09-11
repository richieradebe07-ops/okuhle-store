import React from "react";

/** Shared typography wrapper for the legal pages. */
export function LegalBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="legal">
      {children}
      <style>{`
        .legal {
          max-width: 44rem;
          color: var(--fg-muted);
        }
        .legal h2 {
          color: var(--fg);
          font-size: 1.35rem;
          margin: 2.25rem 0 0.6rem;
        }
        .legal h2:first-child {
          margin-top: 0;
        }
        .legal p, .legal li {
          font-size: 0.95rem;
          line-height: 1.7;
        }
        .legal ul {
          padding-left: 1.2rem;
        }
      `}</style>
    </div>
  );
}
