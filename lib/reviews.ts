/**
 * Reviews and comments.
 *
 * AUTO-PUBLISH MODEL (V12, 26 Oct 2026). A clean submission goes live the
 * instant someone hits submit — no human in the loop. The automated filter
 * in lib/reviewFilter.ts runs first; if it catches something the row is
 * written exactly like before (status 'pending', invisible) but flagged with
 * why, so the owner's queue is only ever the suspicious minority rather than
 * every review ever written.
 *
 * Two things stay load-bearing from the original design, unchanged:
 *
 *  1. `verifiedPurchase` is DERIVED, never submitted. It is set only after
 *     matching a paid order in our own database (see findPaidPurchase). This
 *     is a REAL check against the real `orders` table PayFast checkout
 *     writes to — not a placeholder. If it were accepted from the request
 *     body, the badge would mean nothing.
 *
 *  2. Reads are server-side with an explicit column list. See migration 0003
 *     for why there is no public RLS policy: RLS is row-level, so a policy
 *     letting anon read published reviews would also let anon read the email
 *     and IP columns off those rows.
 *
 * `flagged`/`hidden` and their reasons are additions from migration 0004.
 * Visible-to-the-public now means status = 'published' AND NOT flagged AND
 * NOT hidden — all three, every time; see PUBLIC_FILTER below so that never
 * has to be repeated correctly by hand at each call site.
 */
import { serviceQuery, supabaseConfigured } from "./supabase";
import { summariseRatings, isOwnerEmail, type RatingSummary } from "./reviews-shared";
import { runReviewFilter } from "./reviewFilter";

// Re-exported so callers have one import for everything reviews.
export { summariseRatings, isOwnerEmail };
export type { RatingSummary };

export type ReviewStatus = "pending" | "published" | "rejected";

/** What the public is allowed to see. Deliberately has no email, IP, or moderation field. */
export type PublicReview = {
  id: string;
  createdAt: string;
  productId: string | null;
  rating: number | null;
  body: string;
  displayName: string;
  verifiedPurchase: boolean;
};

/** Adds the moderation fields. Only ever rendered to the owner. */
export type ModerationReview = PublicReview & {
  status: ReviewStatus;
  email: string | null;
  orderId: string | null;
  flagged: boolean;
  flaggedReason: string | null;
  hidden: boolean;
};

const PUBLIC_COLUMNS = "id,created_at,product_id,rating,body,display_name,verified_purchase";
const MODERATION_COLUMNS = `${PUBLIC_COLUMNS},status,email,order_id,flagged,flagged_reason,hidden`;

/** Visible to the public: reached 'published', and never flagged or hidden since. */
const PUBLIC_FILTER = "status=eq.published&flagged=eq.false&hidden=eq.false";

type Row = {
  id: string;
  created_at: string;
  product_id: string | null;
  rating: number | null;
  body: string;
  display_name: string;
  verified_purchase: boolean;
  status?: ReviewStatus;
  email?: string | null;
  order_id?: string | null;
  flagged?: boolean;
  flagged_reason?: string | null;
  hidden?: boolean;
};

function toPublic(row: Row): PublicReview {
  return {
    id: row.id,
    createdAt: row.created_at,
    productId: row.product_id,
    rating: row.rating,
    body: row.body,
    displayName: row.display_name,
    verifiedPurchase: row.verified_purchase,
  };
}

function toModeration(row: Row): ModerationReview {
  return {
    ...toPublic(row),
    status: row.status ?? "pending",
    email: row.email ?? null,
    orderId: row.order_id ?? null,
    flagged: row.flagged ?? false,
    flaggedReason: row.flagged_reason ?? null,
    hidden: row.hidden ?? false,
  };
}

/* ------------------------------------------------------------------ */
/* Reading                                                            */
/* ------------------------------------------------------------------ */

/** Published reviews for one piece, newest first. */
export async function publishedForProduct(productId: string): Promise<PublicReview[]> {
  if (!supabaseConfigured()) return [];
  try {
    const rows = await serviceQuery<Row[]>(
      `reviews?${PUBLIC_FILTER}&product_id=eq.${encodeURIComponent(productId)}&select=${PUBLIC_COLUMNS}&order=created_at.desc`
    );
    return rows.map(toPublic);
  } catch (err) {
    console.error("[reviews] could not load reviews for", productId, err);
    return [];
  }
}

/**
 * Everything published, newest first. `kind` narrows to product reviews or
 * brand comments; omit it for both.
 */
export async function publishedReviews(
  kind?: "products" | "comments"
): Promise<PublicReview[]> {
  if (!supabaseConfigured()) return [];
  const filter =
    kind === "products" ? "&product_id=not.is.null" : kind === "comments" ? "&product_id=is.null" : "";
  try {
    const rows = await serviceQuery<Row[]>(
      `reviews?${PUBLIC_FILTER}${filter}&select=${PUBLIC_COLUMNS}&order=created_at.desc`
    );
    return rows.map(toPublic);
  } catch (err) {
    console.error("[reviews] could not load reviews", err);
    return [];
  }
}

/**
 * Star averages and distributions per product, from published reviews only.
 *
 * One query for the whole catalogue rather than one per card, since the shop
 * grid renders every product at once.
 */
export async function ratingSummaries(): Promise<Record<string, RatingSummary>> {
  if (!supabaseConfigured()) return {};
  try {
    const rows = await serviceQuery<
      { product_id: string | null; rating: number | null; verified_purchase: boolean }[]
    >(`reviews?${PUBLIC_FILTER}&product_id=not.is.null&select=product_id,rating,verified_purchase`);

    return summariseRatings(rows);
  } catch (err) {
    console.error("[reviews] could not load rating summaries", err);
    return {};
  }
}

export async function summaryForProduct(productId: string): Promise<RatingSummary | null> {
  const all = await ratingSummaries();
  return all[productId] ?? null;
}

/**
 * Recent review text, across every product, to check a new submission against
 * for copy-paste spam. Global rather than per-product: a spam bot posting the
 * same boilerplate rarely sticks to one item.
 *
 * Capped rather than unbounded — this is a speed bump against bot
 * boilerplate, not a full-text search index, and the cap keeps the query (and
 * the duplicate check that follows) cheap as the table grows.
 */
const DUPLICATE_CHECK_WINDOW = 300;

export async function recentReviewBodies(): Promise<string[]> {
  if (!supabaseConfigured()) return [];
  try {
    const rows = await serviceQuery<{ body: string }[]>(
      `reviews?select=body&order=created_at.desc&limit=${DUPLICATE_CHECK_WINDOW}`
    );
    return rows.map((r) => r.body);
  } catch (err) {
    console.error("[reviews] could not load recent bodies for duplicate check", err);
    return [];
  }
}

/** Flagged, not yet decided. Owner only — this is the whole moderation queue now. */
export async function flaggedQueue(): Promise<ModerationReview[]> {
  if (!supabaseConfigured()) return [];
  const rows = await serviceQuery<Row[]>(
    `reviews?flagged=eq.true&hidden=eq.false&select=${MODERATION_COLUMNS}&order=created_at.asc`
  );
  return rows.map(toModeration);
}

/** Every currently-live review, for the "remove this after the fact" admin list. Owner only. */
export async function liveReviews(): Promise<ModerationReview[]> {
  if (!supabaseConfigured()) return [];
  const rows = await serviceQuery<Row[]>(
    `reviews?${PUBLIC_FILTER}&select=${MODERATION_COLUMNS}&order=created_at.desc`
  );
  return rows.map(toModeration);
}

/* ------------------------------------------------------------------ */
/* Writing                                                            */
/* ------------------------------------------------------------------ */

export type SubmitInput = {
  productId: string | null;
  rating: number | null;
  body: string;
  displayName: string;
  email: string | null;
  userId: string | null;
  /** Server-derived. Callers must not pass anything a client supplied. */
  orderId: string | null;
  verifiedPurchase: boolean;
  ipAddress: string | null;
  /** The honeypot value and page-load timing, passed through to the filter. */
  honeypot: string;
  msSincePageLoad: number | null;
};

export type SubmitOutcome =
  | { ok: true; published: boolean; flaggedReason: string | null }
  | { ok: false; error: string };

export async function submitReview(input: SubmitInput): Promise<SubmitOutcome> {
  if (!supabaseConfigured()) {
    return { ok: false, error: "not-configured" };
  }

  const existingBodies = await recentReviewBodies();
  const filter = runReviewFilter({
    body: input.body,
    rating: input.rating,
    existingBodies,
    honeypot: input.honeypot,
    msSincePageLoad: input.msSincePageLoad,
  });

  try {
    await serviceQuery("reviews", {
      method: "POST",
      body: {
        product_id: input.productId,
        rating: input.rating,
        body: input.body,
        display_name: input.displayName,
        email: input.email,
        user_id: input.userId,
        order_id: input.orderId,
        verified_purchase: input.verifiedPurchase,
        ip_address: input.ipAddress,
        flagged: filter.flagged,
        flagged_reason: filter.reason,
        // Clean submissions publish immediately. A flagged one is written
        // exactly like the old model — status stays 'pending', invisible —
        // until an owner clears it in the flagged queue.
        ...(filter.flagged
          ? {}
          : { status: "published", published_at: new Date().toISOString() }),
      },
    });
    return { ok: true, published: !filter.flagged, flaggedReason: filter.reason };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // The unique index on (order_id, product_id) catches a second review for
    // the same purchase.
    if (message.includes("23505") || message.includes("duplicate key")) {
      return { ok: false, error: "already-reviewed" };
    }
    console.error("[reviews] submit failed", err);
    return { ok: false, error: "failed" };
  }
}

/** Clears a flag and publishes. Owner only. */
export async function publishFlagged(id: string): Promise<boolean> {
  if (!supabaseConfigured()) return false;
  try {
    await serviceQuery(`reviews?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: {
        status: "published",
        published_at: new Date().toISOString(),
        flagged: false,
      },
    });
    return true;
  } catch (err) {
    console.error("[reviews] publish-flagged failed for", id, err);
    return false;
  }
}

/**
 * Soft-removes a review — flagged or already live, it doesn't matter. The row
 * stays, `hidden` goes true, and it stops being shown anywhere public on the
 * next read. `flagged_reason` is left as-is: it is the record of why the
 * filter first caught it, which is worth keeping even after the review is
 * gone.
 */
export async function hideReview(
  id: string,
  ownerEmail: string,
  reason?: string
): Promise<boolean> {
  if (!supabaseConfigured()) return false;
  try {
    await serviceQuery(`reviews?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: {
        hidden: true,
        hidden_reason: reason ?? null,
        hidden_by: ownerEmail,
        hidden_at: new Date().toISOString(),
        flagged: false,
        // A row rejected straight from the flagged queue never reached
        // 'published' — recorded as such for anyone reading status later.
        status: "rejected",
      },
    });
    return true;
  } catch (err) {
    console.error("[reviews] hide failed for", id, err);
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Verification                                                       */
/* ------------------------------------------------------------------ */

export type PurchaseProof = { orderId: string; productId: string } | null;

/**
 * Confirms someone actually bought the thing they are reviewing.
 *
 * Accepts either a signed-in user id or an order number plus the email on the
 * order — the same pair /track requires, and for the same reason: an order
 * number alone is printed on packaging and pasted into WhatsApp, so it is not
 * a secret on its own.
 *
 * Returns null when nothing matches, and the caller simply records an
 * unverified review rather than refusing it.
 */
export async function findPaidPurchase(input: {
  productId: string | null;
  userId?: string | null;
  orderId?: string | null;
  email?: string | null;
}): Promise<PurchaseProof> {
  if (!supabaseConfigured() || !input.productId) return null;

  const base = `orders?status=eq.paid&product_id=eq.${encodeURIComponent(input.productId)}&select=id,buyer_email,user_id&limit=1`;

  try {
    if (input.userId) {
      const rows = await serviceQuery<{ id: string }[]>(
        `${base}&user_id=eq.${encodeURIComponent(input.userId)}`
      );
      if (rows.length) return { orderId: rows[0].id, productId: input.productId };
    }

    if (input.orderId && input.email) {
      const rows = await serviceQuery<{ id: string; buyer_email: string | null }[]>(
        `${base}&id=eq.${encodeURIComponent(input.orderId.trim().toUpperCase())}`
      );
      const order = rows[0];
      if (
        order &&
        order.buyer_email &&
        order.buyer_email.trim().toLowerCase() === input.email.trim().toLowerCase()
      ) {
        return { orderId: order.id, productId: input.productId };
      }
    }
  } catch (err) {
    // A verification failure must not lose the review — it just means the
    // badge is not awarded.
    console.error("[reviews] purchase verification failed", err);
  }

  return null;
}
