import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Section, Container } from "@/components/Section";
import { Accordion } from "@/components/Accordion";
import { products } from "@/lib/products";
import { formatRand } from "@/lib/site";
import { loyalty, pointsFor, layByMonthly, layBy } from "@/lib/loyalty";

export const metadata: Metadata = {
  title: "Rewards",
  description:
    "Earn points on every order, get early access to drops and a birthday discount. Free with an account — no subscription.",
};

const faqs = [
  {
    q: "How much does it cost?",
    a: "Nothing. There is no fee and no subscription. Make an account and you're in.",
  },
  {
    q: "How do points work?",
    a: `Every ${formatRand(loyalty.randPerPoint)} you spend earns 1 point, rounded down. ${loyalty.redeemPoints} points takes ${formatRand(loyalty.redeemValueRand)} off a future order.`,
  },
  {
    q: "When are points added?",
    a: "Automatically, as soon as your payment is confirmed. There's nothing to claim and no code to enter.",
  },
  {
    q: "Do points expire?",
    a: `Yes — after ${loyalty.expiryMonths} months with no activity on your account. We'd rather tell you that upfront than bury it.`,
  },
  {
    q: "Why isn't there a paid membership?",
    a: "We looked at it honestly. A monthly fee only pays for itself if you buy several pieces every month, and almost nobody does. It would have cost most people more than it saved them, so we made the rewards free instead.",
  },
];

export default function LoyaltyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Rewards"
        title="Free rewards, no subscription"
        lead="Make an account and you earn on every order. No monthly fee, nothing to cancel."
      />

      <Section title="What you get">
        <div
          style={{
            display: "grid",
            gap: "1.25rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          {loyalty.perks.map((perk) => (
            <div key={perk} className="card" style={{ padding: "1.5rem" }}>
              <span style={{ color: "var(--accent)" }} aria-hidden>
                ◆
              </span>
              <p style={{ margin: "0.6rem 0 0" }}>{perk}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="The maths"
        title="What each piece earns you"
        lead={`${formatRand(loyalty.randPerPoint)} spent = 1 point. ${loyalty.redeemPoints} points = ${formatRand(loyalty.redeemValueRand)} off.`}
        background="var(--bg-sunken)"
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "30rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <Th>Piece</Th>
                <Th align="right">Price</Th>
                <Th align="right">Points earned</Th>
                <Th align="right">Or pay monthly</Th>
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
                    {pointsFor(p.price)}
                  </td>
                  <td style={{ padding: "0.9rem 0 0.9rem 0.5rem", textAlign: "right" }}>
                    {formatRand(layByMonthly(p.price))}/mo
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem", marginTop: "1.25rem" }}>
          Monthly figures are lay-by over {layBy.months} months. {layBy.note}
        </p>
      </Section>

      <Section eyebrow="Questions" title="How it works">
        <div style={{ maxWidth: "44rem" }}>
          {faqs.map((f) => (
            <Accordion key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
        <div style={{ marginTop: "2.5rem" }}>
          <Link className="btn" href="/shop">
            Start earning
          </Link>
        </div>
      </Section>

      <Container style={{ paddingBottom: "3rem" }}>
        <p
          style={{
            color: "var(--fg-muted)",
            fontSize: "0.82rem",
            border: "1px dashed var(--line)",
            padding: "1rem 1.25rem",
          }}
        >
          Accounts and automatic point tracking arrive with card checkout. Until then, order on
          WhatsApp as usual — we&apos;ll backdate points earned in the meantime.
        </p>
      </Container>
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
