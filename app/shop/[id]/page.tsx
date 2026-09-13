import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Section";
import { ProductCard } from "@/components/ProductCard";
import { getProduct, products } from "@/lib/products";
import { formatRand, site, whatsappLink } from "@/lib/site";
import { layBy, layByMonthly, loyalty, pointsFor } from "@/lib/loyalty";
import { payfastConfigured } from "@/lib/payfast";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewList, RatingSummaryLine } from "@/components/ReviewList";
import { publishedForProduct, summaryForProduct } from "@/lib/reviews";

/**
 * These pages are prerendered, so without this a review approved today would
 * not appear until the next deploy. Five minutes keeps them fast and
 * indexable while still picking up newly published reviews on their own.
 */
export const revalidate = 300;

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

  // Read alongside each other rather than in sequence; neither needs the other.
  const [reviews, summary] = await Promise.all([
    publishedForProduct(product.id),
    summaryForProduct(product.id),
  ]);

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
        <ProductCard product={product} checkoutEnabled={payfastConfigured()} />

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
              term="Lay-by"
              value={`${formatRand(layByMonthly(product.price))} a month over ${layBy.months} months. ${layBy.note}`}
            />
            <Detail
              term="Rewards"
              value={`Earns ${pointsFor(product.price)} points. ${loyalty.redeemPoints} points is ${formatRand(loyalty.redeemValueRand)} off a future order — free, no subscription.`}
            />
          </dl>

          {/* Sizing help sits next to the decision, not buried in the FAQ. */}
          <div className="card" style={{ padding: "1.25rem", marginTop: "2rem" }}>
            <p style={{ margin: 0, fontWeight: 500 }}>Not sure of your size?</p>
            <p style={{ margin: "0.4rem 0 1rem", color: "var(--fg-muted)", fontSize: "0.9rem" }}>
              {product.fit} Message us before you order and we&apos;ll talk it through.
            </p>
            <a
              className="btn btn-ghost"
              href={whatsappLink(
                `Hi ${site.name}! I need help with sizing for the ${product.name}.`
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ask about sizing
            </a>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
            <Link className="btn btn-ghost" href="/loyalty">
              Free rewards
            </Link>
            <Link className="btn btn-ghost" href="/shipping#lay-by">
              Shipping &amp; lay-by
            </Link>
          </div>
        </div>
      </div>

      {/* scrollMarginTop keeps the heading clear of the sticky header when
          arriving from a #reviews link — from an order, a shop card, or the
          reviews page. */}
      <section
        id="reviews"
        style={{ marginTop: "clamp(3rem, 8vw, 5rem)", scrollMarginTop: "5.5rem" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
            borderBottom: "1px solid var(--line)",
            paddingBottom: "1rem",
          }}
        >
          <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", margin: 0 }}>
            What people say
          </h2>
          {summary && <RatingSummaryLine summary={summary} size="1.1rem" />}
        </div>

        <div
          style={{
            display: "grid",
            gap: "clamp(2rem, 5vw, 3.5rem)",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            marginTop: "2rem",
          }}
        >
          <div>
            {reviews.length > 0 ? (
              <ReviewList reviews={reviews} />
            ) : (
              <div className="card" style={{ padding: "1.75rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>No reviews yet</h3>
                <p
                  style={{
                    color: "var(--fg-muted)",
                    margin: "0.75rem 0 0",
                    fontSize: "0.92rem",
                  }}
                >
                  Nothing here yet — and we would rather show you that than pad the page out.
                  If you have worn this one, yours would be the first.
                </p>
              </div>
            )}
          </div>

          <div>
            <h3 style={{ margin: "0 0 1.25rem", fontSize: "1.1rem" }}>
              Worn this? Tell the next person.
            </h3>
            <ReviewForm productId={product.id} productName={product.name} />
          </div>
        </div>
      </section>

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
            <ProductCard key={p.id} product={p} checkoutEnabled={payfastConfigured()} />
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
