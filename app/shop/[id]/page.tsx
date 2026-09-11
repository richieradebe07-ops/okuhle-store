import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Section";
import { ProductCard } from "@/components/ProductCard";
import { getProduct, products, memberPrice } from "@/lib/products";
import { formatRand } from "@/lib/site";

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) return { title: "Not found" };
  return { title: product.name, description: product.description };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();

  const related = products.filter((p) => p.id !== product.id).slice(0, 3);

  return (
    <Container style={{ padding: "clamp(2rem, 6vw, 4rem) clamp(1rem, 4vw, 3rem)" }}>
      <Link
        href="/shop"
        style={{
          color: "var(--fg-muted)",
          textDecoration: "none",
          fontSize: "0.78rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        ← Back to shop
      </Link>

      <div
        style={{
          display: "grid",
          gap: "clamp(2rem, 5vw, 3.5rem)",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          marginTop: "2rem",
        }}
      >
        <ProductCard product={product} />

        <div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", margin: 0 }}>{product.name}</h1>
          {product.tagline && (
            <p style={{ color: "var(--accent)", margin: "0.5rem 0 0" }}>{product.tagline}</p>
          )}
          <p style={{ color: "var(--fg-muted)", marginTop: "1.25rem" }}>{product.description}</p>

          <dl style={{ marginTop: "2rem", display: "grid", gap: "1.25rem" }}>
            <Detail term="Fit" value={product.fit} />
            <Detail term="Material" value={product.material} />
            <Detail term="Care" value={product.care} />
            {product.bulkOffer && <Detail term="Bulk pricing" value={product.bulkOffer} />}
            <Detail
              term="Okuhle+ price"
              value={`${formatRand(memberPrice(product))} for members — ${product.memberDiscountPercent}% off, applied automatically.`}
            />
          </dl>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "2rem" }}>
            <Link className="btn btn-ghost" href="/pricing">
              Join Okuhle+ and save
            </Link>
            <Link className="btn btn-ghost" href="/shipping">
              Shipping &amp; lay-by
            </Link>
          </div>
        </div>
      </div>

      <section style={{ marginTop: "clamp(3rem, 8vw, 5rem)" }}>
        <p className="eyebrow">You may also like</p>
        <div
          style={{
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            marginTop: "1.75rem",
          }}
        >
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </Container>
  );
}

function Detail({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt
        style={{
          fontSize: "0.68rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--accent)",
        }}
      >
        {term}
      </dt>
      <dd style={{ margin: "0.4rem 0 0", color: "var(--fg-muted)", fontSize: "0.92rem" }}>
        {value}
      </dd>
    </div>
  );
}
