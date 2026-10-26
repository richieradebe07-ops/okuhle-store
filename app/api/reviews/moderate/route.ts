import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { isOwnerEmail, publishFlagged, hideReview } from "@/lib/reviews";

/**
 * The owner's two actions, now that reviews auto-publish (V12, 26 Oct 2026):
 *
 *   "publish" — clears a flag and publishes. For a review the automated
 *               filter held back that turns out to be fine.
 *   "remove"  — soft-deletes. Works on ANY review, flagged or already live —
 *               the actual safety net for auto-publish, since the filter in
 *               lib/reviewFilter.ts will miss things. The row stays, just
 *               hidden, so a disputed removal has a record.
 *
 * Owner only, same as before: a non-owner gets 404, not 403, so this
 * endpoint can't be used to work out who the owner is.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || !isOwnerEmail(user.email)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let payload: { id?: unknown; action?: unknown; reason?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof payload.id !== "string" || !payload.id) {
    return NextResponse.json({ error: "Which review?" }, { status: 400 });
  }
  if (payload.action !== "publish" && payload.action !== "remove") {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const reason = typeof payload.reason === "string" ? payload.reason.slice(0, 500) : undefined;

  const ok =
    payload.action === "publish"
      ? await publishFlagged(payload.id)
      : await hideReview(payload.id, user.email, reason);

  if (!ok) {
    return NextResponse.json({ error: "Couldn't save that decision." }, { status: 502 });
  }

  return NextResponse.json({
    message: payload.action === "publish" ? "Published." : "Removed, and kept on record.",
  });
}
