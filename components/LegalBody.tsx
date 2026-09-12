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
        .legal li {
          margin-bottom: 0.4rem;
        }
        .legal table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0 1.5rem;
          font-size: 0.92rem;
        }
        .legal th {
          text-align: left;
          font-weight: 500;
          color: var(--fg);
          border-bottom: 1px solid var(--line);
          padding: 0.6rem 1rem 0.6rem 0;
        }
        .legal td {
          border-bottom: 1px solid var(--line);
          padding: 0.7rem 1rem 0.7rem 0;
          vertical-align: top;
        }
        .legal td:first-child {
          color: var(--fg);
          width: 40%;
        }
        .legal a {
          color: var(--accent);
        }
      `}</style>
    </div>
  );
}
