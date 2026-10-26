import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { isOwnerEmail, flaggedQueue, liveReviews, type ModerationReview } from "@/lib/reviews";
import { products } from "@/lib/products";
import { LoadFailure } from "@/components/AccountBits";
import { ModerationQueue } from "./ModerationQueue";

export const metadata: Metadata = {
  title: "Reviews",
  robots: { index: false, follow: false },
};

/**
 * Owner-only moderation.
 *
 * Reviews auto-publish now (V12, 26 Oct 2026) — this page is no longer the
 * gate everything passes through. It is two much smaller things:
 *
 *   1. The flagged queue — only what the automated filter actually caught.
 *      Should usually be short.
 *   2. Every currently-live review, with a Remove button — the backstop for
 *      whatever the filter missed.
 *
 * "Owner" is whoever signs in with OWNER_EMAIL — the address already
 * configured for order alerts. A non-owner gets a 404 rather than a 403, so
 * the page cannot be used to work out who the owner is.
 */
export default async function ReviewModerationPage() {
  const session = await requireSession("/account/reviews");
  if (!isOwnerEmail(session.user.email)) notFound();

  let flagged: ModerationReview[] | null = null;
  let live: ModerationReview[] | null = null;
  try {
    [flagged, live] = await Promise.all([flaggedQueue(), liveReviews()]);
  } catch (err) {
    console.error("[account/reviews] load failed:", err);
  }

  const productNames = Object.fromEntries(products.map((p) => [p.id, p.name]));

  return (
    <>
      <h1 style={{ fontSize: "clamp(1.8rem, 5vw, 2.4rem)", margin: "0 0 0.75rem" }}>Reviews</h1>
      <p style={{ color: "var(--fg-muted)", margin: "0 0 2.5rem", maxWidth: "42rem" }}>
        Clean reviews publish themselves now. You only ever land here for the ones the automated
        filter caught, or to pull something already live.
      </p>

      {flagged && live ? (
        <ModerationQueue initialFlagged={flagged} initialLive={live} productNames={productNames} />
      ) : (
        <LoadFailure what="reviews" />
      )}
    </>
  );
}
