import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Container } from "@/components/Section";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = { title: "Payment cancelled", robots: { index: false } };

/** PayFast cancel URL. Nothing was charged. */
export default function OrderCancelledPage() {
  return (
    <>
      <PageHeader
        eyebrow="Cancelled"
        title="No payment was taken"
        lead="You cancelled at the payment step, so nothing has been charged and nothing has been made."
      />
      <Container style={{ padding: "clamp(2rem, 5vw, 3.5rem) clamp(1rem, 4vw, 3rem)" }}>
        <div className="card" style={{ padding: "2rem", maxWidth: "36rem" }}>
          <p style={{ margin: 0, color: "var(--fg-muted)" }}>
            If something went wrong at checkout, or you&apos;d rather pay by EFT or arrange lay-by,
            message us — a person will answer.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
            <Link className="btn" href="/shop">
              Back to the shop
            </Link>
            <a
              className="btn btn-ghost"
              href={whatsappLink(`Hi ${site.name}! I had trouble at checkout.`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Message us
            </a>
          </div>
        </div>
      </Container>
    </>
  );
}
