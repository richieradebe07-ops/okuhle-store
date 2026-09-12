/**
 * Marks a statutory disclosure that the business owner still has to supply.
 * Deliberately visible: a missing POPIA/ECTA disclosure should be obvious on
 * the page, not quietly absent.
 */
export function Outstanding({ children }: { children: React.ReactNode }) {
  return (
    <mark
      style={{
        background: "rgba(184, 135, 59, 0.18)",
        color: "var(--fg)",
        borderBottom: "1px dashed var(--accent)",
        padding: "0 0.25rem",
        fontStyle: "italic",
      }}
      title="Outstanding — the business owner needs to supply this"
    >
      [{children}]
    </mark>
  );
}
