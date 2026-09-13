import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { isOwnerEmail, moderateReview } from "@/lib/reviews";

/**
 * Approve or reject a review. Owner only.
 *
 * Rejecting does NOT delete. The row stays with status 'rejected', so there is
 * a record of what was said and what was decided — which matters if someone
 * later claims their review was made to disappear.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || !isOwnerEmail(user.email)) {
    // Same answer for "not signed in" and "not the owner", so this endpoint
    // can't be used to work out who the owner is.
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let payload: { id?: unknown; decision?: unknown; note?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof payload.id !== "string" || !payload.id) {
    return NextResponse.json({ error: "Which review?" }, { status: 400 });
  }
  if (payload.decision !== "published" && payload.decision !== "rejected") {
    return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
  }

  const ok = await moderateReview(
    payload.id,
    payload.decision,
    typeof payload.note === "string" ? payload.note.slice(0, 500) : undefined
  );

  if (!ok) {
    return NextResponse.json({ error: "Couldn't save that decision." }, { status: 502 });
  }

  return NextResponse.json({
    message: payload.decision === "published" ? "Published." : "Rejected, and kept on record.",
  });
}
