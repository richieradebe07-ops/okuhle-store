import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Section, Container } from "@/components/Section";
import { Accordion } from "@/components/Accordion";
import { products, memberPrice } from "@/lib/products";
import { formatRand } from "@/lib/site";
import { membership } from "@/lib/membership";

export const metadata: Metadata = {
  title: "Okuhle+ Membership",
  description:
    "R150 a month for 15–25% off every piece, 48-hour early access to drops, rewards points and a birthday bonus.",
};

const memberFaqs = [
  {
    q: "When does my member pricing start?",
    a: "Immediately. As soon as your first payment goes through, member pricing shows on every product page and carries through to checkout.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — no lock-in, no cancellation fee. You keep your benefits until the end of the month you have already paid for.",
  },
  {
    q: "Do I need a discount code?",
    a: "No. Sign in and the member price is applied automatically.",
  },
  {
    q: "What happens to my rewards points if I cancel?",
    a: "They stay on your account. If you come back, they are still there — they just stop earning while the membership is inactive.",
  },
];

export default function PricingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Membership"
        title="Two ways to wear Okuhle"
        lead="Shop freely at full price, or join Okuhle+ and pay member pricing on everything we make."
      />

      <Container style={{ padding: "clamp(2.5rem, 6vw, 4rem) clamp(1rem, 4vw, 3rem)" }}>
        <div
          style={{
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
            alignItems: "start",
          }}
        >
          {/* Free */}
          <div className="card" style={{ padding: "2rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.8rem" }}>Free</h2>
            <p className="display" style={{ fontSize: "3rem", margin: "0.75rem 0 0" }}>
              R0
            </p>
            <p style={{ color: "var(--fg-muted)", margin: "0.25rem 0 1.75rem" }}>
              No account needed
            </p>
            <FeatureList
              items={[
                [true, "Full access to the collection"],
                [true, "Order via WhatsApp"],
                [true, "Lay-by over 2–3 months"],
                [true, "Bulk pricing on multiples"],
                [false, "Member pricing"],
                [false, "Early access to drops"],
                [false, "Rewards points"],
                [false, "Birthday bonus"],
              ]}
            />
            <Link className="btn btn-ghost" href="/shop" style={{ width: "100%", marginTop: "1.75rem" }}>
              Shop at full price
            </Link>
          </div>

          {/* Okuhle+ */}
          <div
            className="card"
            style={{ padding: "2rem", borderColor: "var(--accent)", position: "relative" }}
          >
            <span
              style={{
                position: "absolute",
                top: "-0.7rem",
                right: "1.5rem",
                background: "var(--accent)",
                color: "var(--accent-fg)",
                fontSize: "0.62rem",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                padding: "0.3rem 0.7rem",
              }}
            >
              Best value
            </span>
            <h2 style={{ margin: 0, fontSize: "1.8rem" }}>Okuhle+</h2>
            <p className="display" style={{ fontSize: "3rem", margin: "0.75rem 0 0" }}>
              {formatRand(membership.monthlyPrice)}
              <span style={{ fontSize: "1rem", color: "var(--fg-muted)" }}> / month</span>
            </p>
            <p style={{ color: "var(--accent)", margin: "0.25rem 0 1.75rem", fontSize: "0.9rem" }}>
              First month {formatRand(membership.firstMonthPrice)} — 50% off
            </p>
            <FeatureList
              items={[
                [true, "Everything in Free"],
                [true, "15–25% off every piece, applied automatically"],
                [true, "48-hour early access to new drops"],
                [true, "Rewards points — R100 spent = 1 point (R10 off)"],
                [true, "Extra 15% off in your birthday month"],
                [true, "Members' community access"],
                [true, "Cancel anytime, no lock-in"],
              ]}
            />
            <Link
              className="btn"
              href="/signup"
              style={{ width: "100%", marginTop: "1.75rem" }}
            >
              Join Okuhle+
            </Link>
          </div>
        </div>
      </Container>

      <Section
        eyebrow="The maths"
        title="What you actually pay as a member"
        lead="Member pricing on every current piece. One hoodie in a month already covers most of the membership."
        background="var(--bg-sunken)"
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "34rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <Th>Piece</Th>
                <Th align="right">Regular</Th>
                <Th align="right">Okuhle+</Th>
                <Th align="right">You save</Th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "0.9rem 0.5rem 0.9rem 0" }}>{p.name}</td>
                  <td style={{ padding: "0.9rem 0.5rem", textAlign: "right", color: "var(--fg-muted)" }}>
                    {formatRand(p.price)}
                  </td>
                  <td
                    style={{
                      padding: "0.9rem 0.5rem",
                      textAlign: "right",
                      color: "var(--accent)",
                      fontWeight: 500,
                    }}
                  >
                    {formatRand(memberPrice(p))}
                  </td>
                  <td style={{ padding: "0.9rem 0 0.9rem 0.5rem", textAlign: "right" }}>
                    {formatRand(p.price - memberPrice(p))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section eyebrow="Questions" title="Before you join">
        <div style={{ maxWidth: "44rem" }}>
          {memberFaqs.map((f) => (
            <Accordion key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </Section>
    </>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      style={{
        textAlign: align,
        padding: "0 0.5rem 0.75rem",
        fontSize: "0.68rem",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "var(--fg-muted)",
        fontWeight: 400,
      }}
    >
      {children}
    </th>
  );
}

function FeatureList({ items }: { items: [boolean, string][] }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.7rem" }}>
      {items.map(([included, label]) => (
        <li
          key={label}
          style={{
            display: "flex",
            gap: "0.7rem",
            fontSize: "0.9rem",
            color: included ? "var(--fg)" : "var(--fg-muted)",
          }}
        >
          <span style={{ color: included ? "var(--accent)" : "var(--fg-muted)" }} aria-hidden>
            {included ? "✓" : "—"}
          </span>
          {label}
        </li>
      ))}
    </ul>
  );
}
