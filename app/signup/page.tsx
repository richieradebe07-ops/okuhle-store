import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Container } from "@/components/Section";
import { formatRand, site, whatsappLink } from "@/lib/site";
import { membership } from "@/lib/membership";

export const metadata: Metadata = { title: "Join Okuhle+" };

/**
 * Placeholder join page. Accounts and PayFast recurring billing are the next
 * build phase; until then this routes people to WhatsApp so interest is not lost.
 */
export default function SignupPage() {
  return (
    <>
      <PageHeader
        eyebrow="Okuhle+"
        title="Join Okuhle+"
        lead={`${formatRand(membership.monthlyPrice)} a month — first month ${formatRand(
          membership.firstMonthPrice
        )}.`}
      />

      <Container style={{ padding: "clamp(2rem, 5vw, 3.5rem) clamp(1rem, 4vw, 3rem)" }}>
        <div className="card" style={{ padding: "2rem", maxWidth: "36rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.6rem" }}>Memberships open soon</h2>
          <p style={{ color: "var(--fg-muted)", margin: "0.85rem 0 0" }}>
            We&apos;re finishing the member accounts and billing. Message us on WhatsApp to be added
            to the founding member list — you&apos;ll get your first month at{" "}
            {formatRand(membership.firstMonthPrice)} and member pricing from day one.
          </p>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "1.75rem 0",
              display: "grid",
              gap: "0.7rem",
            }}
          >
            {membership.benefits.map((b) => (
              <li key={b} style={{ display: "flex", gap: "0.7rem", fontSize: "0.9rem" }}>
                <span style={{ color: "var(--accent)" }} aria-hidden>
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <a
              className="btn"
              href={whatsappLink(
                `Hi ${site.name}! I'd like to join ${membership.name} as a founding member.`
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join via WhatsApp
            </a>
            <Link className="btn btn-ghost" href="/pricing">
              See what you get
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}
