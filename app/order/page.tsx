import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Section } from "@/components/Section";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Order",
  description:
    "How to order from OKUHLE — WhatsApp, EFT or card, with lay-by over 2–3 months and bulk pricing.",
};

export default function OrderPage() {
  return (
    <>
      <PageHeader
        eyebrow="Order"
        title="How ordering works"
        lead="Everything is made to order, so we confirm the details with you before anything is cut."
      />

      <Section title="Three ways to pay">
        <div
          style={{
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          }}
        >
          {[
            {
              t: "Pay in full",
              d: "EFT, instant transfer or card. We start production as soon as payment reflects.",
            },
            {
              t: "Lay-by over 2–3 months",
              d: "A deposit starts production, then settle the balance in agreed instalments. No interest, no admin fee.",
            },
            {
              t: "Bulk order",
              d: "3+ tees or 2+ sweaters and hoodies drops the unit price. Team kit, church groups, matric crews — ask for a quote.",
            },
          ].map((o) => (
            <div key={o.t} className="card" style={{ padding: "1.75rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.35rem" }}>{o.t}</h3>
              <p style={{ color: "var(--fg-muted)", margin: "0.75rem 0 0", fontSize: "0.92rem" }}>
                {o.d}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Start an order" background="var(--bg-sunken)">
        <p style={{ color: "var(--fg-muted)", maxWidth: "36rem" }}>
          Pick your piece in the shop and tap Order — that opens WhatsApp with your colour and size
          already filled in. Or message us directly and we will help you choose.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.75rem" }}>
          <Link className="btn" href="/shop">
            Browse the collection
          </Link>
          <a
            className="btn btn-ghost"
            href={whatsappLink(`Hi ${site.name}! I'd like to place an order.`)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Message us on WhatsApp
          </a>
        </div>
        <p style={{ color: "var(--fg-muted)", marginTop: "2rem", fontSize: "0.9rem" }}>
          {site.contact.phoneDisplay} · {site.contact.email} · {site.contact.location}
        </p>
      </Section>
    </>
  );
}
