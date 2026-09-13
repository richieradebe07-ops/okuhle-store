import { NextResponse } from "next/server";
import { currentUser, isEmail, normaliseEmail } from "@/lib/auth";
import { getProduct } from "@/lib/products";
import { findPaidPurchase, submitReview } from "@/lib/reviews";
import { sendOwnerReviewAlert } from "@/lib/emails";
import { clientIp, ipForAudit, rateLimit } from "@/lib/rateLimit";
import { siteUrl } from "@/lib/site";

const MIN_BODY = 10;
const MAX_BODY = 2000;

/**
 * Leave a review or a comment.
 *
 * THE VERIFIED BADGE IS NEVER TAKEN FROM THE REQUEST. It is worked out here,
 * by matching a paid order — either the signed-in customer's, or an order
 * number plus the email on that order. A client-supplied flag would make the
 * badge worthless.
 *
 * Failing verification does NOT refuse the review. Plenty of genuine customers
 * buy over WhatsApp, and telling them their review does not count would be
 * both rude and wrong. They simply do not get the badge.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);

  // Reviews are a once-in-a-while act for a real person and a firehose for a
  // spam script, so this is tight.
  const limit = rateLimit(`review:${ip}`, 3, 60 * 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "You've left a few already. Try again later, or message us on WhatsApp." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let payload: {
    productId?: unknown;
    rating?: unknown;
    body?: unknown;
    displayName?: unknown;
    email?: unknown;
    orderId?: unknown;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  /* ---- what it's about ---- */
  let productId: string | null = null;
  if (payload.productId !== undefined && payload.productId !== null && payload.productId !== "") {
    if (typeof payload.productId !== "string") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const product = getProduct(payload.productId);
    if (!product) {
      return NextResponse.json({ error: "We don't have that item." }, { status: 404 });
    }
    productId = product.id;
  }

  /* ---- the rating ---- */
  let rating: number | null = null;
  if (payload.rating !== undefined && payload.rating !== null && payload.rating !== "") {
    const value = Number(payload.rating);
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return NextResponse.json({ error: "Pick a rating between 1 and 5 stars." }, { status: 400 });
    }
    rating = value;
  }
  if (productId && rating === null) {
    return NextResponse.json({ error: "Give it a star rating too." }, { status: 400 });
  }

  /* ---- the words ---- */
  if (typeof payload.body !== "string") {
    return NextResponse.json({ error: "Write something first." }, { status: 400 });
  }
  const body = payload.body.trim();
  if (body.length < MIN_BODY) {
    return NextResponse.json(
      { error: `Tell us a bit more — at least ${MIN_BODY} characters.` },
      { status: 400 }
    );
  }
  if (body.length > MAX_BODY) {
    return NextResponse.json(
      { error: `That's longer than ${MAX_BODY} characters. Trim it down a little.` },
      { status: 400 }
    );
  }

  /* ---- who's speaking ---- */
  const user = await currentUser();

  const rawName = typeof payload.displayName === "string" ? payload.displayName.trim() : "";
  const displayName = rawName || user?.firstName || "";
  if (displayName.length < 2 || displayName.length > 60) {
    return NextResponse.json(
      { error: "Add the name you'd like shown with your review." },
      { status: 400 }
    );
  }

  // A signed-in session is better evidence of the address than a form field.
  const suppliedEmail =
    typeof payload.email === "string" && isEmail(payload.email)
      ? normaliseEmail(payload.email)
      : null;
  const email = user?.email ?? suppliedEmail;

  /* ---- the badge, derived and never trusted from the client ---- */
  const proof = await findPaidPurchase({
    productId,
    userId: user?.id ?? null,
    orderId: typeof payload.orderId === "string" ? payload.orderId : null,
    email,
  });

  const result = await submitReview({
    productId,
    rating,
    body,
    displayName,
    email,
    userId: user?.id ?? null,
    orderId: proof?.orderId ?? null,
    verifiedPurchase: Boolean(proof),
    ipAddress: ipForAudit(request),
  });

  if (!result.ok) {
    if (result.error === "already-reviewed") {
      return NextResponse.json(
        { error: "You've already reviewed this order. Message us on WhatsApp if you'd like to change it." },
        { status: 409 }
      );
    }
    if (result.error === "not-configured") {
      return NextResponse.json(
        { error: "Reviews aren't switched on yet. Tell us on WhatsApp and we'll pass it on." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Couldn't save that. Try again shortly." }, { status: 502 });
  }

  // The owner needs to know something is waiting, since nothing self-publishes.
  const alert = await sendOwnerReviewAlert({
    displayName,
    rating,
    body,
    productName: productId ? (getProduct(productId)?.name ?? productId) : null,
    verifiedPurchase: Boolean(proof),
    moderationUrl: `${siteUrl(request)}/account/reviews`,
  });
  if (!alert.ok) console.warn("[reviews] owner alert not sent:", alert.error);

  return NextResponse.json({
    message: proof
      ? "Thank you — that's with us. Verified buyers get a badge on their review once it's up."
      : "Thank you — that's with us.",
    verified: Boolean(proof),
  });
}
