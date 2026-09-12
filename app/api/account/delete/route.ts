import { NextResponse } from "next/server";
import {
  clearSessionCookies,
  currentSession,
  deleteAuthUser,
  signInWithPassword,
} from "@/lib/auth";
import { loadAccount } from "@/lib/account";
import { recordConsent } from "@/lib/consent";
import { addToAudience } from "@/lib/email";
import { sendAccountDeleted } from "@/lib/emails";
import { clientIp, ipForAudit, rateLimit } from "@/lib/rateLimit";
import { legal } from "@/lib/legal";

/**
 * Delete the account. POPIA section 24 — the right to have personal
 * information deleted.
 *
 * WHAT GOES, AND WHAT STAYS, AND WHY
 *  Gone: the login itself, the first name, the points ledger, the membership
 *        record. Deleted by cascade from auth.users; not recoverable.
 *  Stays: paid order records, with user_id nulled by the foreign key. South
 *        African tax law requires records of sales to be kept for five years,
 *        so deleting them is not something we may lawfully do. Nobody can log
 *        in to reach them afterwards.
 *  Stays: the consent audit trail, with user_id nulled (migration 0002). If
 *        anyone later asks whether this address agreed to marketing, the
 *        answer has to be a record rather than a shrug.
 *
 * The customer is told all of this on the settings page BEFORE they confirm,
 * and again in the email afterwards. A deletion that quietly keeps things is
 * worse than one that explains itself.
 *
 * The password is required again: a live session on a shared phone must not
 * be enough to destroy somebody's account.
 */
export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const limit = rateLimit(`delete:${session.user.id}:${clientIp(request)}`, 5, 60 * 60);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let body: { password?: unknown; confirm?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof body.password !== "string" || !body.password) {
    return NextResponse.json({ error: "Enter your password to confirm." }, { status: 400 });
  }
  // A typed confirmation, so this cannot happen on a mis-tap.
  if (body.confirm !== "DELETE") {
    return NextResponse.json(
      { error: 'Type DELETE in the box to confirm.' },
      { status: 400 }
    );
  }

  const reauth = await signInWithPassword(session.user.email, body.password);
  if (!reauth.ok) {
    return NextResponse.json({ error: "That password isn't right." }, { status: 401 });
  }

  const email = session.user.email;

  // Count what tax law obliges us to keep, so the email can be specific about
  // it rather than vague.
  let ordersKept = 0;
  try {
    const snapshot = await loadAccount(session.user.id, session.accessToken);
    ordersKept = snapshot.paidOrders.length;
  } catch (err) {
    console.warn("[delete] could not count retained orders:", err);
  }

  // Withdraw marketing consent on the record BEFORE the account goes, so the
  // trail ends with an explicit "no" rather than trailing off.
  await recordConsent([
    {
      kind: "marketing",
      granted: false,
      email,
      userId: session.user.id,
      source: "account_deletion",
      documentVersion: legal.privacyVersion,
      ipAddress: ipForAudit(request),
    },
  ]);

  const unsubscribed = await addToAudience(email, { unsubscribed: true });
  if (!unsubscribed.ok) {
    // Do not proceed: deleting the account while still holding them on a
    // mailing list we can no longer tie to a consent record is the one
    // outcome that turns a deletion request into a POPIA problem.
    console.error("[delete] could not unsubscribe before deletion:", unsubscribed.error);
    return NextResponse.json(
      {
        error:
          "We couldn't take you off the mailing list, so we've stopped short of deleting your account. Message us on WhatsApp and a person will finish this today.",
      },
      { status: 502 }
    );
  }

  const deleted = await deleteAuthUser(session.user.id);
  if (!deleted.ok) {
    console.error("[delete] auth user deletion failed:", deleted.message);
    return NextResponse.json(
      { error: "Couldn't delete the account just now. Message us on WhatsApp and we'll do it manually." },
      { status: 502 }
    );
  }

  const notice = await sendAccountDeleted({ email, ordersKept });
  if (!notice.ok) console.warn("[delete] confirmation email not sent:", notice.error);

  const response = NextResponse.json({
    message: "Your account has been deleted.",
    ordersKept,
  });
  clearSessionCookies(response);
  return response;
}
