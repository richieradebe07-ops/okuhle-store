/**
 * Reviews and comments.
 *
 * Two things here are load-bearing and easy to get wrong:
 *
 *  1. `verifiedPurchase` is DERIVED, never submitted. It is set only after
 *     matching a paid order in our own database. If it were accepted from the
 *     request body, the badge would mean nothing — anyone could claim it.
 *
 *  2. Nothing publishes itself. Every review is written as `pending` and a
 *     person approves it. The submit form says so, rather than letting someone
 *     post and then wonder why their words never appeared.
 *
 * Reads are server-side with an explicit column list. See migration 0003 for
 * why there is no public RLS policy: RLS is row-level, so a policy letting
 * anon read published reviews would also let anon read the email and IP
 * columns off those rows.
 */
import { serviceQuery, supabaseConfigured } from "./supabase";
import { summariseRatings, isOwnerEmail, type RatingSummary } from "./reviews-shared";

// Re-exported so callers have one import for everything reviews.
export { summariseRatings, isOwnerEmail };
export type { RatingSummary };

export type ReviewStatus = "pending" | "published" | "rejected";

/** What the public is allowed to see. Deliberately has no email or IP field. */
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
};

const PUBLIC_COLUMNS = "id,created_at,product_id,rating,body,display_name,verified_purchase";
const MODERATION_COLUMNS = `${PUBLIC_COLUMNS},status,email,order_id`;

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
      `reviews?status=eq.published&product_id=eq.${encodeURIComponent(productId)}&select=${PUBLIC_COLUMNS}&order=created_at.desc`
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
      `reviews?status=eq.published${filter}&select=${PUBLIC_COLUMNS}&order=created_at.desc`
    );
    return rows.map(toPublic);
  } catch (err) {
    console.error("[reviews] could not load reviews", err);
    return [];
  }
}

/**
 * Star averages per product, from published reviews only.
 *
 * One query for the whole catalogue rather than one per card, since the shop
 * grid renders every product at once.
 */
export async function ratingSummaries(): Promise<Record<string, RatingSummary>> {
  if (!supabaseConfigured()) return {};
  try {
    const rows = await serviceQuery<
      { product_id: string | null; rating: number | null; verified_purchase: boolean }[]
    >(`reviews?status=eq.published&product_id=not.is.null&select=product_id,rating,verified_purchase`);

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

/** Everything awaiting a decision. Owner only. */
export async function pendingReviews(): Promise<ModerationReview[]> {
  if (!supabaseConfigured()) return [];
  const rows = await serviceQuery<Row[]>(
    `reviews?status=eq.pending&select=${MODERATION_COLUMNS}&order=created_at.asc`
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
};

export async function submitReview(input: SubmitInput): Promise<{ ok: boolean; error?: string }> {
  if (!supabaseConfigured()) {
    return { ok: false, error: "not-configured" };
  }
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
        // status defaults to 'pending' in the database. Never set it here.
      },
    });
    return { ok: true };
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

export async function moderateReview(
  id: string,
  decision: "published" | "rejected",
  note?: string
): Promise<boolean> {
  if (!supabaseConfigured()) return false;
  try {
    await serviceQuery(`reviews?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: {
        status: decision,
        published_at: decision === "published" ? new Date().toISOString() : null,
        moderator_note: note ?? null,
      },
    });
    return true;
  } catch (err) {
    console.error("[reviews] moderation failed for", id, err);
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
