import { Stars } from "./Stars";
import type { PublicReview } from "@/lib/reviews";
import type { RatingSummary } from "@/lib/reviews-shared";

function when(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * The average, and how many it rests on.
 *
 * The count is always shown next to the score. "4.8 stars" from two people is
 * not the same claim as 4.8 from two hundred, and hiding the denominator is
 * the oldest trick in retail.
 */
export function RatingSummaryLine({
  summary,
  size = "1rem",
}: {
  summary: RatingSummary;
  size?: string;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
      <Stars rating={summary.average} size={size} />
      <span style={{ fontSize: "0.85rem", color: "var(--fg-muted)", fontVariantNumeric: "tabular-nums" }}>
        {summary.average} from {summary.count} {summary.count === 1 ? "review" : "reviews"}
        {summary.verified > 0 && ` · ${summary.verified} verified`}
      </span>
    </span>
  );
}

export function ReviewList({ reviews }: { reviews: PublicReview[] }) {
  if (reviews.length === 0) return null;

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "1.25rem" }}>
      {reviews.map((review) => (
        <li key={review.id} className="card" style={{ padding: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", flexWrap: "wrap" }}>
              {review.rating !== null && <Stars rating={review.rating} />}
              <strong style={{ fontWeight: 500 }}>{review.displayName}</strong>
              {review.verifiedPurchase && (
                <span
                  title="We matched this to a paid order"
                  style={{
                    fontSize: "0.63rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--accent)",
                    border: "1px solid var(--accent)",
                    padding: "0.1rem 0.4rem",
                  }}
                >
                  Verified buyer
                </span>
              )}
            </div>
            <time
              dateTime={review.createdAt}
              style={{ fontSize: "0.78rem", color: "var(--fg-muted)" }}
            >
              {when(review.createdAt)}
            </time>
          </div>

          {/* Customers write in paragraphs; preserving their line breaks costs
              nothing and reads far better than one run-on block. */}
          <p
            style={{
              margin: "0.9rem 0 0",
              color: "var(--fg-muted)",
              fontSize: "0.95rem",
              whiteSpace: "pre-wrap",
            }}
          >
            {review.body}
          </p>
        </li>
      ))}
    </ul>
  );
}
