import Link from "next/link";

/** A single headline number with its label underneath. */
export function Stat({
  value,
  label,
  detail,
  href,
}: {
  value: string;
  label: string;
  detail?: string;
  href?: string;
}) {
  const inner = (
    <div className="card" style={{ padding: "1.5rem", height: "100%" }}>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-display, inherit)",
          fontSize: "clamp(1.8rem, 5vw, 2.4rem)",
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      <p
        style={{
          margin: "0.5rem 0 0",
          fontSize: "0.72rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--fg-muted)",
        }}
      >
        {label}
      </p>
      {detail && (
        <p style={{ margin: "0.6rem 0 0", fontSize: "0.85rem", color: "var(--fg-muted)" }}>
          {detail}
        </p>
      )}
    </div>
  );

  if (!href) return inner;
  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      {inner}
    </Link>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gap: "1rem",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      }}
    >
      {children}
    </div>
  );
}

/**
 * Shown when the database can't be reached.
 *
 * Deliberately says so rather than rendering zeroes — "0 points" is a lie
 * that a customer would reasonably act on.
 */
export function LoadFailure({ what }: { what: string }) {
  return (
    <div
      className="card"
      style={{ padding: "1.75rem", borderColor: "#c0392b" }}
      role="alert"
    >
      <h2 style={{ margin: 0, fontSize: "1.2rem" }}>We couldn&apos;t load your {what}</h2>
      <p style={{ color: "var(--fg-muted)", margin: "0.75rem 0 0", fontSize: "0.92rem" }}>
        This is our problem, not yours, and nothing about your account has changed. Refresh in a
        minute — if it keeps happening, message us on WhatsApp and we&apos;ll tell you exactly
        what you need to know.
      </p>
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: "1rem",
        marginBottom: "1.25rem",
      }}
    >
      <h2 style={{ margin: 0, fontSize: "1.4rem" }}>{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  cta,
}: {
  title: string;
  children: React.ReactNode;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="card" style={{ padding: "2rem" }}>
      <h3 style={{ margin: 0, fontSize: "1.15rem" }}>{title}</h3>
      <p style={{ color: "var(--fg-muted)", margin: "0.75rem 0 0", fontSize: "0.92rem" }}>
        {children}
      </p>
      {cta && (
        <Link className="btn" href={cta.href} style={{ marginTop: "1.5rem" }}>
          {cta.label}
        </Link>
      )}
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Paid — in production",
  failed: "Payment failed",
  cancelled: "Cancelled",
};

export function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

export function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
