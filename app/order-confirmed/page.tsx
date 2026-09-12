import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Container } from "@/components/Section";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = { title: "Order received", robots: { index: false } };

/**
 * PayFast return URL. This page means "the customer came back from PayFast" —
 * NOT "payment succeeded". Only the ITN webhook confirms payment, so the
 * wording here deliberately avoids claiming the money has cleared.
 */
export default async function OrderConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <>
      <PageHeader
        eyebrow="Thank you"
        title="Order received"
        lead="We've got it. You'll hear from us shortly to confirm."
      />
      <Container style={{ padding: "clamp(2rem, 5vw, 3.5rem) clamp(1rem, 4vw, 3rem)" }}>
        <div className="card" style={{ padding: "2rem", maxWidth: "36rem" }}>
          {ref && (
            <p style={{ margin: "0 0 1.25rem" }}>
              Your reference:{" "}
              <strong style={{ color: "var(--accent)", letterSpacing: "0.05em" }}>{ref}</strong>
            </p>
          )}
          <h2 style={{ margin: 0, fontSize: "1.4rem" }}>What happens now</h2>
          <ol style={{ color: "var(--fg-muted)", paddingLeft: "1.2rem", lineHeight: 1.9 }}>
            <li>We confirm your payment has cleared — usually within minutes.</li>
            <li>We make your piece. That takes 2–3 working days.</li>
            <li>We ship it, and send you the tracking number on WhatsApp.</li>
          </ol>
          <p style={{ color: "var(--fg-muted)", fontSize: "0.9rem" }}>
            If anything looks wrong, message us with your reference and we&apos;ll sort it out.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
            <a
              className="btn"
              href={whatsappLink(
                `Hi ${site.name}! I've just placed an order${ref ? ` — reference ${ref}` : ""}.`
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              Message us
            </a>
            <Link className="btn btn-ghost" href="/shop">
              Keep browsing
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}
