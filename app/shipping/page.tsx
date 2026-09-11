import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/Section";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shipping & Lay-By",
  description:
    "Delivery timelines across South Africa, courier costs, local collection in Pietermaritzburg, and how lay-by works.",
};

const rows = [
  ["Pietermaritzburg & Durban", "1–2 working days"],
  ["Gauteng & other metros", "2–4 working days"],
  ["Outlying areas & farms", "3–7 working days"],
];

export default function ShippingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Delivery"
        title="Shipping & lay-by"
        lead="Everything is made to order, so add production time to the delivery times below."
      />

      <Section title="Production time">
        <p style={{ color: "var(--fg-muted)", maxWidth: "38rem" }}>
          We make your piece after you order it. Allow <strong>2–3 working days</strong> for
          production before your parcel is handed to the courier. Bulk and custom orders may take a
          little longer — we will tell you upfront, not after.
        </p>
      </Section>

      <Section title="Delivery times" background="var(--bg-sunken)">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", maxWidth: "38rem", borderCollapse: "collapse" }}>
            <tbody>
              {rows.map(([area, time]) => (
                <tr key={area} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "0.9rem 0" }}>{area}</td>
                  <td style={{ padding: "0.9rem 0", color: "var(--accent)", textAlign: "right" }}>
                    {time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: "var(--fg-muted)", marginTop: "1.5rem", fontSize: "0.9rem" }}>
          Courier delivery is charged at a flat national rate, quoted when we confirm your order.
          Local collection in {site.contact.location} is free.
        </p>
      </Section>

      <Section title="Lay-by over 2–3 months">
        <div style={{ maxWidth: "38rem", color: "var(--fg-muted)", display: "grid", gap: "1rem" }}>
          <p style={{ margin: 0 }}>
            Lay-by lets you pay a piece off over two to three months. No interest, no admin fee.
          </p>
          <ol style={{ margin: 0, paddingLeft: "1.2rem", display: "grid", gap: "0.6rem" }}>
            <li>Message us with the piece, colour and size you want.</li>
            <li>Pay a deposit — this is what starts production.</li>
            <li>Settle the balance in the instalments we agree on.</li>
            <li>Your piece ships once the final payment clears.</li>
          </ol>
        </div>
      </Section>

      <Section title="If something goes wrong" background="var(--bg-sunken)">
        <p style={{ color: "var(--fg-muted)", maxWidth: "38rem" }}>
          Tell us within 48 hours of delivery if your parcel arrives damaged, and send photos. If a
          parcel is lost in transit, we lodge the claim with the courier and remake or refund your
          order. You should not be the one carrying a courier&apos;s mistake.
        </p>
      </Section>
    </>
  );
}
