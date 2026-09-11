"use client";

import Link from "next/link";
import { PageHeader, Container } from "@/components/Section";
import { ProductCard } from "@/components/ProductCard";
import { useWishlist } from "@/components/WishlistProvider";
import { products } from "@/lib/products";
import { site, whatsappLink } from "@/lib/site";

export default function WishlistPage() {
  const { items, ready } = useWishlist();
  const saved = products.filter((p) => items.includes(p.id));

  const orderAll = `Hi ${site.name}! I'd like to order everything on my wishlist:\n\n${saved
    .map((p) => `• ${p.name}`)
    .join("\n")}\n\nCan you help me with sizing and availability?`;

  return (
    <>
      <PageHeader
        eyebrow="Saved"
        title="Your wishlist"
        lead="Pieces you've saved on this device. Nothing is reserved until you order."
      />

      <Container style={{ padding: "clamp(2rem, 5vw, 3.5rem) clamp(1rem, 4vw, 3rem)" }}>
        {!ready ? null : saved.length === 0 ? (
          <div style={{ maxWidth: "32rem" }}>
            <p style={{ color: "var(--fg-muted)" }}>
              Nothing saved yet. Tap the heart on any piece to keep it here.
            </p>
            <Link className="btn" href="/shop" style={{ marginTop: "1.5rem" }}>
              Browse the collection
            </Link>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gap: "1.5rem",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              }}
            >
              {saved.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <a
              className="btn"
              href={whatsappLink(orderAll)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginTop: "2.5rem" }}
            >
              Order the whole list
            </a>
          </>
        )}
      </Container>
    </>
  );
}
