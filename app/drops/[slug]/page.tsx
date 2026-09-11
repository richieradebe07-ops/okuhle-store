import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Section";
import { ProductCard } from "@/components/ProductCard";
import { EmailSignup } from "@/components/EmailSignup";
import { DropCountdown } from "@/components/DropCountdown";
import { drops, getDrop, dropStatus, unitsRemaining, waitlistLabel } from "@/lib/drops";
import { getProduct } from "@/lib/products";

export function generateStaticParams() {
  return drops.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const drop = getDrop(slug);
  if (!drop) return { title: "Not found" };
  return { title: drop.name, description: drop.description };
}

export default async function DropPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const drop = getDrop(slug);
  if (!drop) notFound();

  const status = dropStatus(drop);
  const remaining = unitsRemaining(drop);
  // Waitlist size needs a backend to count signups; until then nothing is shown
  // rather than a made-up number.
  const waitlist = waitlistLabel(null);
  const items = drop.productIds.map(getProduct).filter(Boolean);

  return (
    <Container style={{ padding: "clamp(2rem, 6vw, 4rem) clamp(1rem, 4vw, 3rem)" }}>
      <Link
        href="/drops"
        style={{
          color: "var(--fg-muted)",
          textDecoration: "none",
          fontSize: "0.78rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        ← All drops
      </Link>

      <header style={{ marginTop: "2rem" }}>
        <p className="eyebrow">{statusLabel(status)}</p>
        <h1 style={{ fontSize: "clamp(2.2rem, 6vw, 3.6rem)", margin: "0.75rem 0 0" }}>
          {drop.name}
        </h1>
        <p style={{ color: "var(--fg-muted)", maxWidth: "42rem", marginTop: "1rem" }}>
          {drop.description}
        </p>

        {status === "upcoming" && <DropCountdown target={drop.opensAt} label="Opens in" />}
        {status === "live" && <DropCountdown target={drop.closesAt} label="Closes in" />}

        {status === "live" && remaining !== null && (
          <p style={{ marginTop: "1rem", color: "var(--accent)", fontWeight: 500 }}>
            {remaining} of {drop.limitedQuantity} remaining
          </p>
        )}
      </header>

      {status === "live" && items.length > 0 && (
        <div
          style={{
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            marginTop: "2.5rem",
          }}
        >
          {items.map((p) => p && <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {(status === "upcoming" || status === "closed" || status === "sold_out") && (
        <div className="card" style={{ padding: "2rem", marginTop: "2.5rem", maxWidth: "36rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.5rem" }}>
            {status === "upcoming" ? "Get notified when this opens" : "Be first for the next one"}
          </h2>
          <p style={{ color: "var(--fg-muted)", margin: "0.75rem 0 1.5rem" }}>
            {status === "upcoming"
              ? "The list gets a head start before this goes public."
              : "This one is finished and won't return. The list hears about the next drop first."}
          </p>
          {waitlist && (
            <p style={{ color: "var(--accent)", marginBottom: "1rem" }}>{waitlist}</p>
          )}
          <EmailSignup />
        </div>
      )}
    </Container>
  );
}

function statusLabel(status: ReturnType<typeof dropStatus>) {
  return {
    upcoming: "Upcoming",
    live: "Open now",
    closed: "Closed",
    sold_out: "Sold out",
  }[status];
}
