import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader, Section } from "@/components/Section";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewList, RatingBreakdown } from "@/components/ReviewList";
import { Stars } from "@/components/Stars";
import { publishedReviews, ratingSummaries, summariseRatings } from "@/lib/reviews";
import { getProduct } from "@/lib/products";

export const metadata: Metadata = {
  title: "Reviews",
  description:
    "What OKUHLE customers say about the pieces they have worn — the good and the bad, published as they're written.",
};

/** Same reasoning as the product pages: published reviews appear on their own. */
export const revalidate = 300;

export default async function ReviewsPage() {
  const [reviews, summaries] = await Promise.all([publishedReviews(), ratingSummaries()]);

  const productReviews = reviews.filter((r) => r.productId);
  const comments = reviews.filter((r) => !r.productId);

  // One overall figure, across every rated review — reuses the same
  // averaging and star-distribution logic as the per-product summaries by
  // collapsing every rated review into a single bucket.
  const rated = productReviews.filter((r) => r.rating !== null);
  const overall = summariseRatings(
    rated.map((r) => ({ product_id: "all", rating: r.rating, verified_purchase: r.verifiedPurchase }))
  ).all ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Reviews"
        title="What people say"
        lead="Everything here was written by someone who wore the clothes. We publish the good and the bad, and it goes up as soon as it's written."
      />

      {overall && (
        <Container style={{ paddingTop: "clamp(1.5rem, 4vw, 2.5rem)" }}>
          <div className="card" style={{ padding: "1.75rem", display: "inline-block" }}>
            <RatingBreakdown summary={overall} />
          </div>
        </Container>
      )}

      <Section title={productReviews.length > 0 ? "On the pieces" : "No reviews yet"}>
        {productReviews.length > 0 ? (
          <>
            {/* Per-piece averages, so a good score on one item can't be mistaken
                for a good score on everything. */}
            {Object.keys(summaries).length > 0 && (
              <div
                style={{
                  display: "grid",
                  gap: "0.75rem",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  marginBottom: "2.5rem",
                }}
              >
                {Object.entries(summaries).map(([id, summary]) => {
                  const product = getProduct(id);
                  if (!product) return null;
                  return (
                    <Link
                      key={id}
                      href={`/shop/${id}#reviews`}
                      className="card"
                      style={{ padding: "1.1rem", textDecoration: "none", color: "inherit" }}
                    >
                      <p style={{ margin: 0, fontSize: "0.95rem" }}>{product.name}</p>
                      <p style={{ margin: "0.45rem 0 0" }}>
                        <Stars rating={summary.average} />
                        <span
                          style={{
                            color: "var(--fg-muted)",
                            fontSize: "0.8rem",
                            marginLeft: "0.5rem",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {summary.average} · {summary.count}
                        </span>
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}

            <ReviewList reviews={productReviews} />
          </>
        ) : (
          <p style={{ color: "var(--fg-muted)", maxWidth: "42rem" }}>
            Nobody has left one yet. We would rather show you an empty page than fill it with
            reviews nobody wrote —{" "}
            <Link href="/shop" style={{ color: "var(--accent)" }}>
              have a look at the collection
            </Link>{" "}
            and come back and tell us.
          </p>
        )}
      </Section>

      {comments.length > 0 && (
        <Section title="On the brand" background="var(--bg-sunken)">
          <ReviewList reviews={comments} />
        </Section>
      )}

      <Section
        eyebrow="Your turn"
        title="Leave a comment"
        lead="Not about one piece in particular? Tell us anything — how the service was, what you would like us to make next."
        background={comments.length > 0 ? undefined : "var(--bg-sunken)"}
      >
        <ReviewForm />
        <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem", marginTop: "2rem" }}>
          Reviewing a specific piece? Those live on the piece&apos;s own page — open it from{" "}
          <Link href="/shop" style={{ color: "var(--accent)" }}>
            the shop
          </Link>{" "}
          and scroll to the reviews.
        </p>
      </Section>
    </>
  );
}
