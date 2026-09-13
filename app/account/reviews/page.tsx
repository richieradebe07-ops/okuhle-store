import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { isOwnerEmail, pendingReviews, type ModerationReview } from "@/lib/reviews";
import { products } from "@/lib/products";
import { LoadFailure } from "@/components/AccountBits";
import { ModerationQueue } from "./ModerationQueue";

export const metadata: Metadata = {
  title: "Reviews to approve",
  robots: { index: false, follow: false },
};

/**
 * Owner-only moderation.
 *
 * "Owner" is whoever signs in with OWNER_EMAIL — the address already
 * configured for order alerts. There is one person running this shop, so a
 * role column in the database would be ceremony without benefit.
 *
 * A non-owner gets a 404 rather than a 403, so the page cannot be used to
 * work out who the owner is.
 */
export default async function ReviewModerationPage() {
  const session = await requireSession("/account/reviews");
  if (!isOwnerEmail(session.user.email)) notFound();

  let queue: ModerationReview[] | null = null;
  try {
    queue = await pendingReviews();
  } catch (err) {
    console.error("[account/reviews] load failed:", err);
  }

  const productNames = Object.fromEntries(products.map((p) => [p.id, p.name]));

  return (
    <>
      <h1 style={{ fontSize: "clamp(1.8rem, 5vw, 2.4rem)", margin: "0 0 0.75rem" }}>
        Reviews to approve
      </h1>
      <p style={{ color: "var(--fg-muted)", margin: "0 0 2.5rem", maxWidth: "42rem" }}>
        Nothing reaches the site until you say so. You get an email whenever one arrives.
      </p>

      {queue ? (
        <ModerationQueue initial={queue} productNames={productNames} />
      ) : (
        <LoadFailure what="review queue" />
      )}
    </>
  );
}
