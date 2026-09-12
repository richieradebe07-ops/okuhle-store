import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Section, Container } from "@/components/Section";
import { Accordion } from "@/components/Accordion";
import { formatRand, site, whatsappLink } from "@/lib/site";
import {
  membership,
  memberBenefits,
  memberPrice,
  monthlyEquivalent,
  discountBreakEvenRand,
} from "@/lib/membership";
import { products } from "@/lib/products";

export const metadata: Metadata = {
  title: "Okuhle+",
  description: `${formatRand(membership.priceRand)} for the year. Member-only pieces, guaranteed allocation on drops, ${membership.earlyAccessHours}-hour early access.`,
};

const faqs = [
  {
    q: "Is this a subscription?",
    a: `No. It's one payment of ${formatRand(membership.priceRand)} for twelve months. Nothing recurs and nothing charges you automatically — we remind you ${membership.renewalReminderDaysBefore} days before it ends and you decide.`,
  },
  {
    q: `Is it worth it if I only buy a couple of things a year?`,
    a: `Honestly — on the discount alone, no. You'd need to spend about ${formatRand(discountBreakEvenRand())} in a year for ${membership.discountPercent}% to cover the fee. The reason to join is the access: the member-only pieces, never missing a drop, and the ${membership.earlyAccessHours}-hour head start. If you just want money off, don't join.`,
  },
  {
    q: "What are the member-only pieces?",
    a: `One colourway per quarter — ${membership.memberColourwaysPerYear} a year — made for members and not sold to the public. Not a different discount on the same shirt; a different shirt.`,
  },
  {
    q: "What does guaranteed allocation mean?",
    a: "On a limited drop, your size is held for you during the member window. You don't have to be fast, and you don't have to be lucky.",
  },
  {
    q: "When does free delivery apply?",
    a: `On orders of ${formatRand(membership.freeDeliveryThresholdRand)} and up. Below that you pay the normal flat rate — we'd rather be straight about the limit than promise free delivery on everything and quietly claw it back elsewhere.`,
  },
  {
    q: "What happens when I renew?",
    a: "You keep your member number, and you keep the price you joined at even when it goes up for new members.",
  },
  {
    q: "When do I get my member card?",
    a: "Your welcome pack — card, patch and stickers — ships with your next order rather than on its own. One parcel instead of two gets it to you sooner.",
  },
];

export default function OkuhlePlusPage() {
  return (
    <>
      <PageHeader
        eyebrow="Okuhle+"
        title={`${formatRand(membership.priceRand)} for the year`}
        lead={`Less than ${formatRand(monthlyEquivalent())} a month. One payment, twelve months, no subscription.`}
      />

      <Container style={{ padding: "clamp(2.5rem, 6vw, 4rem) clamp(1rem, 4vw, 3rem)" }}>
        <div
          className="card"
          style={{ padding: "clamp(1.75rem, 4vw, 2.5rem)", borderColor: "var(--accent)", maxWidth: "40rem" }}
        >
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.85rem" }}>
            {memberBenefits.map((benefit) => (
              <li key={benefit} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <span style={{ color: "var(--accent)", flexShrink: 0 }} aria-hidden>
                  ▸
                </span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <p
            className="display"
            style={{ fontSize: "1.6rem", margin: "2rem 0 0.25rem", color: "var(--accent)" }}
          >
            {formatRand(membership.priceRand)} for the year
          </p>
          <p style={{ color: "var(--fg-muted)", margin: "0 0 1.75rem", fontSize: "0.9rem" }}>
            Less than {formatRand(monthlyEquivalent())} a month.
          </p>

          <a
            className="btn"
            href={whatsappLink(
              `Hi ${site.name}! I'd like to join Okuhle+ — ${formatRand(membership.priceRand)} for the year.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            style={{ width: "100%" }}
          >
            Join Okuhle+
          </a>
          <p
            style={{
              fontSize: "0.72rem",
              color: "var(--fg-muted)",
              textAlign: "center",
              margin: "0.75rem 0 0",
            }}
          >
            Card checkout is coming. For now we set you up on WhatsApp and you&apos;re a member
            the same day.
          </p>
        </div>
      </Container>

      <Section
        eyebrow="The numbers"
        title="What members pay"
        lead={`${membership.discountPercent}% off the whole range. Free delivery from ${formatRand(membership.freeDeliveryThresholdRand)}.`}
        background="var(--bg-sunken)"
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "28rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <Th>Piece</Th>
                <Th align="right">Standard</Th>
                <Th align="right">Member</Th>
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
                    {formatRand(memberPrice(p.price))}
                  </td>
                  <td style={{ padding: "0.9rem 0 0.9rem 0.5rem", textAlign: "right" }}>
                    {formatRand(p.price - memberPrice(p.price))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem", marginTop: "1.25rem" }}>
          The discount is the smallest reason to join — you&apos;d need roughly{" "}
          {formatRand(discountBreakEvenRand())} of orders in a year for it to pay for itself on its
          own. The pieces nobody else can buy are the point.
        </p>
      </Section>

      <Section eyebrow="Questions" title="Before you join">
        <div style={{ maxWidth: "44rem" }}>
          {faqs.map((f) => (
            <Accordion key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "2.5rem" }}>
          <Link className="btn btn-ghost" href="/loyalty">
            Free rewards (no membership needed)
          </Link>
          <Link className="btn btn-ghost" href="/drops">
            See the drops
          </Link>
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
