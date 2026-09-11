import Link from "next/link";
import Image from "next/image";
import { Container, Section } from "@/components/Section";
import { ProductCard } from "@/components/ProductCard";
import { EmailSignup } from "@/components/EmailSignup";
import { products, lookbook } from "@/lib/products";
import { site } from "@/lib/site";

export default function Home() {
  const featured = products.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section style={{ borderBottom: "1px solid var(--line)" }}>
        <Container style={{ padding: "clamp(3rem, 9vw, 7rem) clamp(1rem, 4vw, 3rem)" }}>
          <div
            style={{
              display: "grid",
              gap: "clamp(2rem, 6vw, 4rem)",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              alignItems: "center",
            }}
          >
            <div>
              <p className="eyebrow">Est. {site.established} · Pietermaritzburg, South Africa</p>
              <h1 style={{ fontSize: "clamp(2.8rem, 9vw, 5.5rem)", margin: "1.25rem 0 0" }}>
                {site.heroHeadline[0]}
                <br />
                <span style={{ color: "var(--accent)" }}>{site.heroHeadline[1]}</span>
              </h1>
              <p style={{ color: "var(--fg-muted)", maxWidth: "34rem", margin: "1.5rem 0 2rem" }}>
                {site.heroSub}
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Link className="btn" href="/shop">
                  Shop the drop
                </Link>
                <Link className="btn btn-ghost" href="/pricing">
                  Join Okuhle+
                </Link>
              </div>
            </div>

            <div
              style={{
                position: "relative",
                aspectRatio: "4 / 5",
                background: "#ffffff",
                border: "1px solid var(--line)",
                overflow: "hidden",
              }}
            >
              <Image
                src="/products/golf-tee/sand.jpg"
                alt="The Okuhle golf tee in sand"
                fill
                priority
                sizes="(max-width: 700px) 100vw, 45vw"
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Story */}
      <Section
        eyebrow="Our story"
        title="Born in Pietermaritzburg. Made to mean something."
        lead="OKUHLE started in 2026 out of Mvundlweni, Pietermaritzburg — built on one idea: clothing should carry meaning as well as style. Every hoodie, tee and sweater carries the OKUHLE emblem, a mark of quality and identity worn by a growing community across KwaZulu-Natal."
      >
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0 0 2rem",
            display: "grid",
            gap: "0.85rem",
            maxWidth: "40rem",
          }}
        >
          {[
            "High-quality golf tees, tees, baggy fits, sweaters and hoodies",
            "Black, white and gold — a palette built to last, not to trend",
            "Lay-by available over 2–3 months, and bulk pricing on every line",
            "Made to order, sold direct — no middleman, no markup",
          ].map((point) => (
            <li key={point} style={{ display: "flex", gap: "0.75rem", color: "var(--fg-muted)" }}>
              <span style={{ color: "var(--accent)" }} aria-hidden>
                ◆
              </span>
              {point}
            </li>
          ))}
        </ul>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link className="btn" href="/shop">
            Explore the range
          </Link>
          <Link className="btn btn-ghost" href="/about">
            Read our full story
          </Link>
        </div>
      </Section>

      {/* Featured products */}
      <Section
        eyebrow="The collection"
        title="Made to order, made for you"
        lead="Pick your colour and size — we confirm sizing and availability with you on WhatsApp before anything is made."
        background="var(--bg-sunken)"
      >
        <div
          style={{
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div style={{ marginTop: "2.5rem" }}>
          <Link className="btn btn-ghost" href="/shop">
            View all pieces
          </Link>
        </div>
      </Section>

      {/* Okuhle+ teaser */}
      <Section eyebrow="Okuhle+" title="Two ways to wear Okuhle">
        <div
          style={{
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          {[
            { t: "15–25% off", d: "Member pricing on every piece, applied automatically." },
            { t: "48 hours early", d: "Shop new drops before they go public." },
            { t: "Rewards points", d: "R100 spent earns a point. 10 points is R10 off." },
            { t: "Birthday bonus", d: "An extra 15% off during your birthday month." },
          ].map((b) => (
            <div key={b.t} className="card" style={{ padding: "1.5rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.4rem", color: "var(--accent)" }}>{b.t}</h3>
              <p style={{ color: "var(--fg-muted)", margin: "0.6rem 0 0", fontSize: "0.9rem" }}>
                {b.d}
              </p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "2.5rem" }}>
          <Link className="btn" href="/pricing">
            See membership
          </Link>
        </div>
      </Section>

      {/* Community */}
      <Section
        eyebrow="The community"
        title="Worn in the wild"
        lead="Follow along and see OKUHLE out in KwaZulu-Natal — tag us and get featured."
        background="var(--bg-sunken)"
      >
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          }}
        >
          {lookbook()
            .filter((_, i) => i % 3 === 0)
            .slice(0, 4)
            .map((shot) => (
              <Link
                key={shot.src}
                href={shot.href}
                style={{
                  position: "relative",
                  aspectRatio: "1 / 1",
                  background: "#ffffff",
                  border: "1px solid var(--line)",
                  overflow: "hidden",
                  display: "block",
                }}
              >
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  fill
                  sizes="(max-width: 700px) 50vw, 25vw"
                  style={{ objectFit: "cover" }}
                />
              </Link>
            ))}
        </div>
        <div style={{ marginTop: "2rem" }}>
          <Link className="btn btn-ghost" href="/gallery">
            See the gallery
          </Link>
        </div>
      </Section>

      {/* Email */}
      <Section eyebrow="Stay close" title="First access to every drop">
        <EmailSignup />
      </Section>
    </>
  );
}
