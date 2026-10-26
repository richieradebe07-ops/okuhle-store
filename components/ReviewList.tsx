"use client";

import { useState } from "react";
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
 * The average, and how many it rests on. Compact — for a shop-grid card or a
 * product-list row, anywhere the full breakdown would be too much.
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

/**
 * The large average plus the star-distribution bars — the single most
 * recognisable "Shein-style" element of a review section, and the thing
 * worth getting right. Sits above the review list itself.
 */
export function RatingBreakdown({ summary }: { summary: RatingSummary }) {
  return (
    <div style={{ display: "flex", gap: "clamp(1.5rem, 5vw, 3rem)", flexWrap: "wrap", alignItems: "center" }}>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
          <span style={{ fontSize: "2.4rem", fontWeight: 600, lineHeight: 1 }}>{summary.average}</span>
          <Stars rating={summary.average} size="1.1rem" />
        </div>
        <p style={{ margin: "0.4rem 0 0", fontSize: "0.85rem", color: "var(--fg-muted)" }}>
          {summary.count} {summary.count === 1 ? "review" : "reviews"}
          {summary.verified > 0 && ` · ${summary.verified} verified`}
        </p>
      </div>

      <div style={{ display: "grid", gap: "0.35rem", minWidth: "12rem", flex: "1 1 16rem", maxWidth: "24rem" }}>
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const count = summary.byStar[star];
          const pct = summary.count > 0 ? Math.round((count / summary.count) * 100) : 0;
          return (
            <div key={star} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ fontSize: "0.75rem", width: "2.4rem", color: "var(--fg-muted)", flexShrink: 0 }}>
                {star} ★
              </span>
              <span
                aria-hidden="true"
                style={{
                  flex: 1,
                  height: "0.45rem",
                  borderRadius: "999px",
                  background: "var(--line)",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    display: "block",
                    height: "100%",
                    width: `${pct}%`,
                    background: "var(--accent)",
                    borderRadius: "999px",
                  }}
                />
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--fg-muted)",
                  width: "2rem",
                  textAlign: "right",
                  flexShrink: 0,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type SortOrder = "recent" | "highest" | "lowest";

const PAGE_SIZE = 6;

/**
 * The review list itself, with sort and simple "load more" pagination.
 *
 * Client-side on purpose: this brand's review volume is nowhere near the
 * point where shipping the full list to the browser and sorting/paginating
 * it there costs anything noticeable, and it avoids a round trip per sort
 * click or "load more" press. Revisit if a product ever has hundreds.
 */
export function ReviewList({ reviews }: { reviews: PublicReview[] }) {
  const [sort, setSort] = useState<SortOrder>("recent");
  const [visible, setVisible] = useState(PAGE_SIZE);

  if (reviews.length === 0) return null;

  const sorted = [...reviews].sort((a, b) => {
    if (sort === "highest") return (b.rating ?? 0) - (a.rating ?? 0);
    if (sort === "lowest") return (a.rating ?? 0) - (b.rating ?? 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const shown = sorted.slice(0, visible);

  return (
    <div>
      {reviews.length > 1 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--fg-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            Sort by
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortOrder);
                setVisible(PAGE_SIZE);
              }}
              style={{ fontSize: "0.85rem" }}
            >
              <option value="recent">Most recent</option>
              <option value="highest">Highest rated</option>
              <option value="lowest">Lowest rated</option>
            </select>
          </label>
        </div>
      )}

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "1.25rem" }}>
        {shown.map((review) => (
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

      {visible < sorted.length && (
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button className="btn btn-ghost" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            Load more ({sorted.length - visible} more)
          </button>
        </div>
      )}
    </div>
  );
}
